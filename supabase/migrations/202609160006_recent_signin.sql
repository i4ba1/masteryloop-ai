create or replace function private.require_recent_admin() returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare a public.profiles; last_sign_in timestamptz;
begin
  a := private.require_staff();
  select u.last_sign_in_at into last_sign_in from auth.users u where u.id = a.id;
  if a.role <> 'ADMIN' or last_sign_in is null or last_sign_in < now() - interval '15 minutes' then
    raise exception 'Recent administrator session required' using errcode = '42501';
  end if;
  return a;
end;
$$;
