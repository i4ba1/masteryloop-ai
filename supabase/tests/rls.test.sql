begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();

create function pg_temp.login(email_address text) returns void language plpgsql security definer as $$
declare user_id uuid;
begin
  select id into user_id from auth.users where email = email_address;
  if user_id is null then raise exception 'Run pnpm seed:local before RLS tests'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
end;
$$;

select pg_temp.login('emma@masteryloop.local');
set local role authenticated;
select is((select count(*)::integer from profiles), 1, 'Student sees only their own profile');
select is((select count(*)::integer from classes), 1, 'Student sees enrolled class only');
select is((select count(*)::integer from class_memberships), 1, 'Student cannot enumerate classmates');
select is((select count(*)::integer from audit_events), 0, 'Student cannot read audit');
select throws_ok($$update profiles set role = 'ADMIN' where id = auth.uid()$$, '42501', null, 'Student cannot escalate their role');
select throws_ok($$select create_class('Forbidden class','Science','P5',auth.uid())$$, '42501', null, 'Student cannot create classes through RPC');
reset role;

select pg_temp.login('parent@masteryloop.local');
set local role authenticated;
select is((select count(*)::integer from profiles), 2, 'Parent sees self and linked child only');
select is((select count(*)::integer from students), 1, 'Parent sees only linked student');
select is((select count(*)::integer from profiles where display_name = 'Daniel'), 0, 'Known unrelated child is denied');
select is((select count(*)::integer from classes), 0, 'Parent cannot enumerate classes');
select is((select count(*)::integer from student_guardians), 1, 'Parent sees only own active guardian links');
select throws_ok($$select set_guardian_link(auth.uid(),auth.uid(),true)$$, '42501', null, 'Parent cannot grant themselves guardian access');
reset role;

select pg_temp.login('teacher@masteryloop.local');
set local role authenticated;
select is((select count(*)::integer from students), 2, 'Teacher sees only assigned students');
select is((select count(*)::integer from classes), 1, 'Teacher sees only owned class');
select is((select count(*)::integer from profiles where display_name = 'Alex'), 0, 'Teacher cannot enumerate unassigned students');
select throws_ok($$select set_membership('20000000-0000-4000-8000-000000000002',auth.uid(),true)$$, '42501', null, 'Teacher cannot modify another class');
select throws_ok($$select set_guardian_link(auth.uid(),auth.uid(),true)$$, '42501', null, 'Teacher cannot administer guardian access');
select lives_ok($$select create_class('RLS test class','Science','P5',auth.uid())$$, 'Teacher can create their own class');
reset role;

select pg_temp.login('admin@masteryloop.local');
set local role authenticated;
select is((select count(*)::integer from profiles), 8, 'Admin is limited to their own organization');
select is((select count(*)::integer from profiles where display_name = 'Outside Student'), 0, 'Admin cannot access another organization');
select is((select count(*)::integer from audit_events a join classes c on c.id = a.object_id where a.action = 'CLASS_CREATED' and c.name = 'RLS test class'), 1, 'Class creation records audit in the same transaction');
select throws_ok($$delete from audit_events$$, '42501', null, 'Admin cannot delete immutable audit evidence');
select throws_ok($$insert into classes(organization_id,teacher_id,name,grade_level) values ('10000000-0000-4000-8000-000000000001',auth.uid(),'Direct insert','P5')$$, '42501', null, 'Direct table writes cannot bypass authorized RPCs');
reset role;

update student_guardians set active = false where parent_id = (select id from auth.users where email = 'parent@masteryloop.local');
select pg_temp.login('parent@masteryloop.local');
set local role authenticated;
select is((select count(*)::integer from students), 0, 'Revoking guardian link immediately removes student access');
reset role;
update profiles set active = false where id = (select id from auth.users where email = 'teacher@masteryloop.local');
select pg_temp.login('teacher@masteryloop.local');
set local role authenticated;
select is((select count(*)::integer from classes), 0, 'Disabled staff cannot read classes with an old JWT');
select throws_ok($$select create_class('Disabled','Science','P5',auth.uid())$$, '42501', null, 'Disabled staff cannot mutate with an old JWT');
reset role;

select * from finish();
rollback;
