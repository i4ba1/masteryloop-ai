create or replace function private.provision_reserved_account() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r private.account_requests; request_text text;
begin
  request_text := new.raw_app_meta_data->>'masteryloop_account_request';
  if request_text is null then return new; end if;
  select * into r from private.account_requests where id::text = request_text;
  if r.id is not null then
    perform 1 from public.organizations where id = r.organization_id for update;
    select * into r from private.account_requests where id::text = request_text for update;
  end if;
  if r.id is null or r.user_id is not null or r.email <> lower(new.email)
    or r.created_at < now() - interval '15 minutes' then
    raise exception 'Invalid provisioning reservation' using errcode = '42501';
  end if;
  -- Serialize against changes to the creating administrator's role/active state.
  perform 1 from public.profiles p where p.id = r.actor_id and p.active and p.role = 'ADMIN'
    and p.organization_id = r.organization_id for update;
  if not found then raise exception 'Administrator access revoked' using errcode = '42501'; end if;
  insert into public.profiles(id, organization_id, role, display_name)
    values(new.id, r.organization_id, r.role, r.display_name);
  if r.role = 'STUDENT' then
    insert into public.students(id, organization_id, grade_level, school_year)
      values(new.id, r.organization_id, r.grade_level, r.school_year);
  end if;
  update private.account_requests set user_id = new.id where id = r.id;
  insert into public.audit_events(organization_id, actor_id, action, object_id, details)
    values(r.organization_id, r.actor_id, 'ACCOUNT_CREATED', new.id,
      jsonb_build_object('requestId', r.id, 'role', r.role));
  return new;
end;
$$;

create or replace function public.update_account(target_id uuid, expected_version integer, account_name text, account_role public.app_role,
  is_active boolean, grade_level text, school_year integer, change_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.profiles; target public.profiles;
begin
  a := private.require_recent_admin();
  -- Lock school rows in a stable order so simultaneous account/relationship writes serialize.
  perform 1 from public.organizations where id = a.organization_id for update;
  select * into target from public.profiles where id = target_id and organization_id = a.organization_id for update;
  if target.id is null then raise exception 'Not authorized' using errcode = '42501'; end if;
  if expected_version is distinct from target.version then raise exception 'Stale account' using errcode = '40001'; end if;
  if account_name is null or length(trim(account_name)) not between 1 and 100 or account_role is null or is_active is null
    or change_reason is null or length(trim(change_reason)) not between 5 and 500
    or grade_level is null or grade_level not in ('P3','P4','P5','P6')
    or school_year is null or school_year not between 2020 and 2100 then
    raise exception 'Invalid account details' using errcode = '23514';
  end if;
  if target.id = a.id and (account_role <> 'ADMIN' or not is_active) then
    raise exception 'Cannot revoke own administrator access' using errcode = '42501';
  end if;
  if target.role <> account_role and (
    exists (select 1 from public.classes where teacher_id = target.id and active)
    or exists (select 1 from public.class_memberships where student_id = target.id and active)
    or exists (select 1 from public.student_guardians where (student_id = target.id or parent_id = target.id) and active)
  ) then raise exception 'Remove active relationships before changing role' using errcode = '23514'; end if;
  if not is_active then
    update public.class_memberships set active = false where student_id = target.id and active;
    update public.student_guardians set active = false where (student_id = target.id or parent_id = target.id) and active;
  end if;
  update public.profiles set display_name = trim(account_name), role = account_role, active = is_active, version = version + 1 where id = target.id;
  if account_role = 'STUDENT' then
    insert into public.students(id, organization_id, grade_level, school_year)
      values(target.id, a.organization_id, grade_level, school_year)
      on conflict (id) do nothing;
  end if;
  insert into public.audit_events(organization_id, actor_id, action, object_id, details)
    values(a.organization_id, a.id, 'ACCOUNT_UPDATED', target.id, jsonb_build_object(
      'reason', trim(change_reason), 'before', jsonb_build_object('name', target.display_name, 'role', target.role, 'active', target.active, 'version', target.version),
      'after', jsonb_build_object('name', trim(account_name), 'role', account_role, 'active', is_active, 'version', target.version + 1)));
end;
$$;


