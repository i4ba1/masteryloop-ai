alter table public.profiles add column version integer not null default 1 check (version > 0);
alter table public.audit_events add column details jsonb not null default '{}'::jsonb;

create function public.class_enrollment_counts(class_ids uuid[])
returns table(class_id uuid, enrollment_count bigint)
language sql stable security invoker set search_path = '' as $$
  select m.class_id, count(*) from public.class_memberships m
  where m.active and m.class_id = any(class_ids[1:20]) group by m.class_id;
$$;
revoke all on function public.class_enrollment_counts(uuid[]) from public;
grant execute on function public.class_enrollment_counts(uuid[]) to authenticated;

create function private.require_recent_admin() returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare a public.profiles;
begin
  a := private.require_staff();
  if a.role <> 'ADMIN' or not exists (
    select 1 from auth.sessions s where s.id::text = auth.jwt()->>'session_id'
    and s.user_id = a.id and s.created_at >= now() - interval '15 minutes'
  ) then raise exception 'Recent administrator session required' using errcode = '42501'; end if;
  return a;
end;
$$;
revoke all on function private.require_recent_admin() from public;

create table private.account_requests (
  id uuid primary key,
  actor_id uuid not null references public.profiles(id),
  organization_id uuid not null references public.organizations(id),
  email text not null,
  display_name text not null,
  role public.app_role not null,
  grade_level text not null,
  school_year integer not null,
  user_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
revoke all on private.account_requests from public, anon, authenticated;

create function public.reserve_account(request_id uuid, account_email text, account_name text, account_role public.app_role, grade_level text, school_year integer)
returns uuid language plpgsql security definer set search_path = '' as $$
declare a public.profiles; r private.account_requests;
begin
  a := private.require_recent_admin();
  if request_id is null or account_email is null or length(account_email) not between 3 and 254
    or account_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    or account_name is null or length(trim(account_name)) not between 1 and 100
    or account_role is null or grade_level is null or grade_level not in ('P3','P4','P5','P6')
    or school_year is null or school_year not between 2020 and 2100 then
    raise exception 'Invalid account details' using errcode = '23514';
  end if;
  insert into private.account_requests(id, actor_id, organization_id, email, display_name, role, grade_level, school_year)
    values(request_id, a.id, a.organization_id, lower(trim(account_email)), trim(account_name), account_role, grade_level, school_year)
    on conflict (id) do nothing;
  select * into r from private.account_requests where id = request_id for update;
  if r.actor_id <> a.id or r.organization_id <> a.organization_id then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if (r.email, r.display_name, r.role, r.grade_level, r.school_year) is distinct from
    (lower(trim(account_email)), trim(account_name), account_role, grade_level, school_year) then
    raise exception 'Conflicting request' using errcode = '40001';
  end if;
  if r.user_id is null then
    -- Refresh only the same authorized reservation, so a retry after reauthentication works.
    update private.account_requests set created_at = now() where id = request_id;
  end if;
  return r.user_id;
end;
$$;

-- Auth admin metadata is supplied exclusively by the server admin adapter. All
-- authorization/role/school data comes from the previously authorized reservation.
create function private.provision_reserved_account() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r private.account_requests; request_text text;
begin
  request_text := new.raw_app_meta_data->>'masteryloop_account_request';
  if request_text is null then return new; end if;
  select * into r from private.account_requests where id::text = request_text for update;
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
revoke all on function private.provision_reserved_account() from public;
create trigger masteryloop_account_provisioned after insert on auth.users
for each row execute function private.provision_reserved_account();

create function public.update_account(target_id uuid, expected_version integer, account_name text, account_role public.app_role,
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
      on conflict (id) do update set grade_level = excluded.grade_level, school_year = excluded.school_year;
  end if;
  insert into public.audit_events(organization_id, actor_id, action, object_id, details)
    values(a.organization_id, a.id, 'ACCOUNT_UPDATED', target.id, jsonb_build_object(
      'reason', trim(change_reason), 'before', jsonb_build_object('name', target.display_name, 'role', target.role, 'active', target.active, 'version', target.version),
      'after', jsonb_build_object('name', trim(account_name), 'role', account_role, 'active', is_active, 'version', target.version + 1)));
end;
$$;
revoke all on function public.reserve_account(uuid,text,text,public.app_role,text,integer), public.update_account(uuid,integer,text,public.app_role,boolean,text,integer,text) from public;
grant execute on function public.reserve_account(uuid,text,text,public.app_role,text,integer), public.update_account(uuid,integer,text,public.app_role,boolean,text,integer,text) to authenticated;

-- Roster mutations already call require_staff. Use the same school lock as
-- account writes to prevent a concurrent enrollment from restoring a revoked link.
create or replace function private.require_staff() returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare a public.profiles; attempts integer;
begin
  a := private.actor();
  if a.id is null or a.role not in ('TEACHER','ADMIN') then raise exception 'Not authorized' using errcode = '42501'; end if;
  perform 1 from public.organizations where id = a.organization_id for update;
  a := private.actor();
  if a.id is null or a.role not in ('TEACHER','ADMIN') then raise exception 'Not authorized' using errcode = '42501'; end if;
  insert into private.mutation_limits(actor_id, window_start) values(a.id, date_trunc('minute',now()))
    on conflict(actor_id, window_start) do update set count = private.mutation_limits.count + 1 returning count into attempts;
  if attempts > 30 then raise exception 'Please wait before trying again' using errcode = 'P0001'; end if;
  delete from private.mutation_limits where actor_id = a.id and window_start < now() - interval '1 hour';
  return a;
end;
$$;


