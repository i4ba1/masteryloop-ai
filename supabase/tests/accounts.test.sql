begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select no_plan();
create function pg_temp.user_id(email_address text) returns uuid language sql security definer as $$ select id from auth.users where email=email_address $$;
create function pg_temp.admin_login(email_address text, age interval default interval '0 minutes') returns void language plpgsql security definer as $$
declare session_uuid uuid := gen_random_uuid(); user_uuid uuid;
begin
  user_uuid := pg_temp.user_id(email_address);
  update auth.users set last_sign_in_at = now()-age where id = user_uuid;
  perform set_config('request.jwt.claims', json_build_object('sub',user_uuid,'role','authenticated','session_id',session_uuid,'auth_time',extract(epoch from now()-age))::text,true);
end;
$$;
select pg_temp.admin_login('teacher@masteryloop.local');
set local role authenticated;
select throws_ok($$select reserve_account(gen_random_uuid(),'denied@example.com','Denied','PARENT','P5',2026)$$,'42501',null,'Teacher cannot provision accounts');
reset role;
select pg_temp.admin_login('admin@masteryloop.local',interval '16 minutes');
set local role authenticated;
select throws_ok($$select reserve_account(gen_random_uuid(),'denied@example.com','Denied','PARENT','P5',2026)$$,'42501',null,'Old session cannot provision even with a refreshed JWT');
reset role;
select pg_temp.admin_login('admin@masteryloop.local');
set local role authenticated;
select throws_ok($$select update_account(pg_temp.user_id('outsider@masteryloop.local'),1,'Outside','STUDENT',false,'P5',2026,'Disable outsider')$$,'42501',null,'Admin cannot modify another school');
select throws_ok($$select update_account(auth.uid(),1,'Admin','ADMIN',false,'P5',2026,'Disable myself')$$,'42501',null,'Self disabling is forbidden');
select throws_ok($$select update_account(auth.uid(),1,'Admin','PARENT',true,'P5',2026,'Demote myself')$$,'42501',null,'Self demotion is forbidden');
select throws_ok($$select update_account(pg_temp.user_id('teacher@masteryloop.local'),1,'Ms. Tan','PARENT',true,'P5',2026,'Change teacher role')$$,'23514',null,'Role change with assigned class is rejected');
select lives_ok($$select reserve_account('30000000-0000-4000-8000-000000000001','provisioned@masteryloop.local','Provisioned','STUDENT','P4',2026)$$,'Reserve account');
select lives_ok($$select reserve_account('30000000-0000-4000-8000-000000000001','provisioned@masteryloop.local','Provisioned','STUDENT','P4',2026)$$,'Same reservation is retry safe');
select throws_ok($$select reserve_account('30000000-0000-4000-8000-000000000001','different@masteryloop.local','Provisioned','STUDENT','P4',2026)$$,'40001',null,'Conflicting reuse is rejected');
select throws_ok($$select * from private.account_requests$$,'42501',null,'Reservation data is private');
reset role;
insert into auth.users(id,email,raw_app_meta_data) values('40000000-0000-4000-8000-000000000001','provisioned@masteryloop.local','{"masteryloop_account_request":"30000000-0000-4000-8000-000000000001"}');
set local role authenticated;
select is((select role::text from profiles where id='40000000-0000-4000-8000-000000000001'),'STUDENT','Auth insert atomically provisions reserved role');
select is((select grade_level from students where id='40000000-0000-4000-8000-000000000001'),'P4','Student details provisioned');
select is(reserve_account('30000000-0000-4000-8000-000000000001','provisioned@masteryloop.local','Provisioned','STUDENT','P4',2026),'40000000-0000-4000-8000-000000000001'::uuid,'Completed retry returns same identity');
select is((select count(*)::integer from audit_events where object_id='40000000-0000-4000-8000-000000000001' and action='ACCOUNT_CREATED'),1,'Exactly one creation audit');
select lives_ok($$select update_account('40000000-0000-4000-8000-000000000001',1,'Renamed','PARENT',true,'P5',2026,'Correct account role')$$,'Unlinked role can be changed');
select throws_ok($$select update_account('40000000-0000-4000-8000-000000000001',1,'Stale','PARENT',true,'P5',2026,'Concurrent old change')$$,'40001',null,'Stale version rejected');
select is((select version from profiles where id='40000000-0000-4000-8000-000000000001'),2,'Version increments once');
select lives_ok($$select update_account(pg_temp.user_id('parent@masteryloop.local'),1,'Emma Parent','PARENT',false,'P5',2026,'Guardian access suspended')$$,'Disable parent');
select is((select count(*)::integer from student_guardians where parent_id=pg_temp.user_id('parent@masteryloop.local') and active),0,'Disable revokes guardian links');
select lives_ok($$select update_account(pg_temp.user_id('parent@masteryloop.local'),2,'Emma Parent','PARENT',true,'P5',2026,'Guardian account restored')$$,'Reactivate parent');
select is((select count(*)::integer from student_guardians where parent_id=pg_temp.user_id('parent@masteryloop.local') and active),0,'Reactivation does not silently grant child access');
reset role;
select throws_ok($$insert into auth.users(id,email,raw_app_meta_data) values(gen_random_uuid(),'bad@masteryloop.local','{"masteryloop_account_request":"missing"}')$$,'42501',null,'Bad reservation rejects Auth insert');
select is((select count(*)::integer from auth.users where email='bad@masteryloop.local'),0,'Failed provisioning leaves no orphan Auth user');
-- Untrusted user metadata cannot grant access.
insert into auth.users(id,email,raw_user_meta_data) values('40000000-0000-4000-8000-000000000002','metadata@masteryloop.local','{"role":"ADMIN","masteryloop_account_request":"30000000-0000-4000-8000-000000000001"}');
select is((select count(*)::integer from profiles where id='40000000-0000-4000-8000-000000000002'),0,'User metadata never grants school access');
select * from finish();
rollback;


