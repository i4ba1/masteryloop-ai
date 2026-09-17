create function public.complete_account_provisioning(request_id uuid, target_user_id uuid, target_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare r private.account_requests;
begin
  select * into r from private.account_requests where id = request_id for update;
  if r.id is null or r.user_id is not null or r.email <> lower(target_email) or r.created_at < now() - interval '15 minutes' then raise exception 'Invalid provisioning reservation' using errcode = '42501'; end if;
  perform 1 from public.organizations where id = r.organization_id for update;
  perform 1 from public.profiles where id = r.actor_id and active and role = 'ADMIN' and organization_id = r.organization_id for update;
  if not found then raise exception 'Administrator access revoked' using errcode = '42501'; end if;
  insert into public.profiles(id, organization_id, role, display_name) values(target_user_id, r.organization_id, r.role, r.display_name) on conflict (id) do nothing;
  if r.role = 'STUDENT' then insert into public.students(id, organization_id, grade_level, school_year) values(target_user_id, r.organization_id, r.grade_level, r.school_year) on conflict (id) do nothing; end if;
  update private.account_requests set user_id = target_user_id where id = r.id;
  insert into public.audit_events(organization_id, actor_id, action, object_id, details) values(r.organization_id, r.actor_id, 'ACCOUNT_CREATED', target_user_id, jsonb_build_object('requestId', r.id, 'role', r.role));
end;
$$;
revoke all on function public.complete_account_provisioning(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.complete_account_provisioning(uuid, uuid, text) to service_role;
