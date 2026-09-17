create or replace function private.require_recent_admin() returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare a public.profiles; authenticated_at timestamptz;
begin
  a := private.require_staff();
  authenticated_at := to_timestamp(nullif(auth.jwt()->>'auth_time','')::double precision);
  if a.role <> 'ADMIN' or authenticated_at is null or authenticated_at < now() - interval '15 minutes' then
    raise exception 'Recent administrator session required' using errcode = '42501';
  end if;
  return a;
end;
$$;
