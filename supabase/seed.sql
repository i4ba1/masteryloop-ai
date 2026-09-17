insert into public.organizations(id, name) values
  ('10000000-0000-4000-8000-000000000001', 'Northstar Primary'),
  ('10000000-0000-4000-8000-000000000002', 'Isolation Test School');

insert into public.concepts(organization_id, code, name, grade_level) values
  ('10000000-0000-4000-8000-000000000001', 'SCI-P5-ELECTRICITY-CIRCUITS', 'Closed electrical circuits', 'P5'),
  ('10000000-0000-4000-8000-000000000001', 'SCI-P5-RESPIRATION', 'Respiration and oxygen demand', 'P5');

-- Auth users and related roster rows are provisioned through the local Auth admin API.
-- Run pnpm seed:local after resetting migrations; never write Supabase Auth internals here.

