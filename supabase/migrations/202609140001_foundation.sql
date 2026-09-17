create schema if not exists private;
revoke all on schema private from public;

create type public.app_role as enum ('STUDENT', 'PARENT', 'TEACHER', 'ADMIN');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 100)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  organization_id uuid not null references public.organizations(id),
  role public.app_role not null,
  display_name text not null check (length(display_name) between 1 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.students (
  id uuid primary key references public.profiles(id),
  organization_id uuid not null references public.organizations(id),
  grade_level text not null check (grade_level in ('P3', 'P4', 'P5', 'P6')),
  school_year integer not null check (school_year between 2020 and 2100),
  foreign key (id, organization_id) references public.profiles(id, organization_id),
  unique (id, organization_id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  teacher_id uuid not null,
  name text not null check (length(name) between 2 and 80),
  subject text not null default 'Science' check (subject = 'Science'),
  grade_level text not null check (grade_level in ('P3', 'P4', 'P5', 'P6')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (teacher_id, organization_id) references public.profiles(id, organization_id),
  unique (id, organization_id)
);

create table public.class_memberships (
  class_id uuid not null,
  student_id uuid not null,
  organization_id uuid not null references public.organizations(id),
  active boolean not null default true,
  primary key (class_id, student_id),
  foreign key (class_id, organization_id) references public.classes(id, organization_id),
  foreign key (student_id, organization_id) references public.students(id, organization_id)
);

create table public.student_guardians (
  parent_id uuid not null,
  student_id uuid not null,
  organization_id uuid not null references public.organizations(id),
  active boolean not null default true,
  primary key (parent_id, student_id),
  foreign key (parent_id, organization_id) references public.profiles(id, organization_id),
  foreign key (student_id, organization_id) references public.students(id, organization_id)
);

create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  code text not null,
  name text not null,
  subject text not null default 'Science',
  grade_level text not null,
  unique (organization_id, code)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  object_id uuid not null,
  created_at timestamptz not null default now()
);

create table private.mutation_limits (
  actor_id uuid not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (actor_id, window_start)
);

create index profiles_org_idx on public.profiles (organization_id);
create index classes_teacher_idx on public.classes (teacher_id) where active;
create index memberships_student_idx on public.class_memberships (student_id) where active;
create index guardians_student_idx on public.student_guardians (student_id) where active;
create index audit_org_created_idx on public.audit_events (organization_id, created_at desc);

-- Security-definer helpers avoid recursive RLS evaluation while checking the current JWT identity.
create function private.actor() returns public.profiles
language sql stable security definer set search_path = '' as $$
  select p from public.profiles p where p.id = auth.uid() and p.active;
$$;

create function private.can_read_student(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles a, public.profiles s
    where a.id = auth.uid() and a.active and s.id = target
      and s.organization_id = a.organization_id
      and (
        a.role = 'ADMIN' or a.id = s.id
        or (a.role = 'PARENT' and exists (
          select 1 from public.student_guardians g
          where g.parent_id = a.id and g.student_id = s.id and g.active
        ))
        or (a.role = 'TEACHER' and exists (
          select 1 from public.classes c join public.class_memberships m on m.class_id = c.id
          where c.teacher_id = a.id and c.active and m.student_id = s.id and m.active
        ))
      )
  );
$$;

create function private.can_read_class(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles a join public.classes c on c.organization_id = a.organization_id
    where a.id = auth.uid() and a.active and c.id = target and c.active
      and (a.role = 'ADMIN' or (a.role = 'TEACHER' and c.teacher_id = a.id)
        or (a.role = 'STUDENT' and exists (
          select 1 from public.class_memberships m
          where m.class_id = c.id and m.student_id = a.id and m.active
        )))
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;
alter table public.student_guardians enable row level security;
alter table public.concepts enable row level security;
alter table public.audit_events enable row level security;

create policy organization_read on public.organizations for select to authenticated
using (id = (private.actor()).organization_id);
create policy profile_read on public.profiles for select to authenticated
using (private.can_read_student(id));
create policy student_read on public.students for select to authenticated
using (private.can_read_student(id));
create policy class_read on public.classes for select to authenticated
using (private.can_read_class(id));
create policy membership_read on public.class_memberships for select to authenticated
using (private.can_read_class(class_id) and (
  (private.actor()).role in ('ADMIN', 'TEACHER') or student_id = auth.uid()
));
create policy guardian_read on public.student_guardians for select to authenticated
using (organization_id = (private.actor()).organization_id and (
  (private.actor()).role = 'ADMIN' or (parent_id = auth.uid() and active)
));
create policy concept_read on public.concepts for select to authenticated
using (organization_id = (private.actor()).organization_id);
create policy audit_read on public.audit_events for select to authenticated
using (organization_id = (private.actor()).organization_id and (private.actor()).role = 'ADMIN');

revoke all on all tables in schema public from anon, authenticated;
grant select on public.organizations, public.profiles, public.students, public.classes,
  public.class_memberships, public.student_guardians, public.concepts, public.audit_events to authenticated;
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public;
grant execute on function private.actor(), private.can_read_student(uuid), private.can_read_class(uuid) to authenticated;

create function private.require_staff() returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare
  a public.profiles;
  attempts integer;
begin
  a := private.actor();
  if a.id is null or a.role not in ('TEACHER', 'ADMIN') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  insert into private.mutation_limits(actor_id, window_start)
    values (a.id, date_trunc('minute', now()))
    on conflict (actor_id, window_start) do update set count = private.mutation_limits.count + 1
    returning count into attempts;
  if attempts > 30 then raise exception 'Please wait before trying again' using errcode = 'P0001'; end if;
  delete from private.mutation_limits where actor_id = a.id and window_start < now() - interval '1 hour';
  return a;
end;
$$;

create function public.create_class(class_name text, class_subject text, class_grade_level text, class_teacher_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  a public.profiles;
  new_id uuid;
begin
  a := private.require_staff();
  if a.role = 'TEACHER' and class_teacher_id <> a.id then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles p where p.id = class_teacher_id
    and p.organization_id = a.organization_id and p.role = 'TEACHER' and p.active) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  insert into public.classes(organization_id, teacher_id, name, subject, grade_level)
    values(a.organization_id, class_teacher_id, trim(class_name), class_subject, class_grade_level)
    returning id into new_id;
  insert into public.audit_events(organization_id, actor_id, action, object_id)
    values(a.organization_id, a.id, 'CLASS_CREATED', new_id);
  return new_id;
end;
$$;

create function public.set_membership(target_class_id uuid, target_student_id uuid, is_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.profiles;
begin
  a := private.require_staff();
  if not exists (select 1 from public.classes c where c.id = target_class_id
    and c.organization_id = a.organization_id and c.active
    and (a.role = 'ADMIN' or c.teacher_id = a.id))
    or not exists (select 1 from public.students s join public.profiles p on p.id = s.id
      where s.id = target_student_id and s.organization_id = a.organization_id and p.active and p.role = 'STUDENT') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  insert into public.class_memberships(class_id, student_id, organization_id, active)
    values(target_class_id, target_student_id, a.organization_id, is_active)
    on conflict(class_id, student_id) do update set active = excluded.active;
  insert into public.audit_events(organization_id, actor_id, action, object_id)
    values(a.organization_id, a.id, case when is_active then 'ENROLLMENT_ACTIVATED' else 'ENROLLMENT_DEACTIVATED' end, target_student_id);
end;
$$;

create function public.set_guardian_link(target_parent_id uuid, target_student_id uuid, is_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare a public.profiles;
begin
  a := private.require_staff();
  if a.role <> 'ADMIN' or not exists (select 1 from public.profiles p
      where p.id = target_parent_id and p.organization_id = a.organization_id and p.role = 'PARENT' and p.active)
    or not exists (select 1 from public.students s join public.profiles p on p.id = s.id
      where s.id = target_student_id and s.organization_id = a.organization_id and p.active and p.role = 'STUDENT') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  insert into public.student_guardians(parent_id, student_id, organization_id, active)
    values(target_parent_id, target_student_id, a.organization_id, is_active)
    on conflict(parent_id, student_id) do update set active = excluded.active;
  insert into public.audit_events(organization_id, actor_id, action, object_id)
    values(a.organization_id, a.id, case when is_active then 'GUARDIAN_LINK_ACTIVATED' else 'GUARDIAN_LINK_DEACTIVATED' end, target_student_id);
end;
$$;

revoke all on function private.require_staff() from public;
revoke all on function public.create_class(text, text, text, uuid), public.set_membership(uuid, uuid, boolean), public.set_guardian_link(uuid, uuid, boolean) from public;
grant execute on function public.create_class(text, text, text, uuid), public.set_membership(uuid, uuid, boolean), public.set_guardian_link(uuid, uuid, boolean) to authenticated;

