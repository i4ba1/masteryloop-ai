import { createClient } from "@supabase/supabase-js";
import { localStatus } from "./local-supabase.mjs";

const status = localStatus();
const client = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const org = "10000000-0000-4000-8000-000000000001";
const otherOrg = "10000000-0000-4000-8000-000000000002";
export const demoPassword = "MasteryLoop-local-2026!";
const fixtures = [
  ["emma", "Emma", "STUDENT", org],
  ["daniel", "Daniel", "STUDENT", org],
  ["teacher", "Ms. Tan", "TEACHER", org],
  ["parent", "Emma Parent", "PARENT", org],
  ["admin", "Platform Admin", "ADMIN", org],
  ["other-student", "Alex", "STUDENT", org],
  ["other-teacher", "Mr. Lim", "TEACHER", org],
  ["other-parent", "Alex Parent", "PARENT", org],
  ["outsider", "Outside Student", "STUDENT", otherOrg],
];
function check(error) {
  if (error) throw new Error(error.message);
}
const existing = await client.auth.admin.listUsers({ perPage: 1000 });
check(existing.error);
const ids = {};
for (const [slug, name, role, organizationId] of fixtures) {
  const email = `${slug}@masteryloop.local`;
  let user = existing.data.users.find((u) => u.email === email);
  if (!user) {
    const result = await client.auth.admin.createUser({
      email,
      password: demoPassword,
      email_confirm: true,
    });
    check(result.error);
    user = result.data.user;
  }
  if (!user) throw new Error("Unable to provision demo user.");
  ids[slug] = user.id;
  check(
    (
      await client.from("profiles").upsert({
        id: user.id,
        organization_id: organizationId,
        role,
        display_name: name,
        active: true,
      })
    ).error,
  );
  if (role === "STUDENT")
    check(
      (
        await client.from("students").upsert({
          id: user.id,
          organization_id: organizationId,
          grade_level: "P5",
          school_year: 2026,
        })
      ).error,
    );
}
const classId = "20000000-0000-4000-8000-000000000001";
const otherClassId = "20000000-0000-4000-8000-000000000002";
check(
  (
    await client.from("classes").upsert([
      {
        id: classId,
        organization_id: org,
        teacher_id: ids.teacher,
        name: "P5 Science - Maple",
        subject: "Science",
        grade_level: "P5",
      },
      {
        id: otherClassId,
        organization_id: org,
        teacher_id: ids["other-teacher"],
        name: "P5 Science - Cedar",
        subject: "Science",
        grade_level: "P5",
      },
    ])
  ).error,
);
check(
  (
    await client.from("class_memberships").upsert([
      { class_id: classId, student_id: ids.emma, organization_id: org, active: true },
      { class_id: classId, student_id: ids.daniel, organization_id: org, active: true },
      {
        class_id: otherClassId,
        student_id: ids["other-student"],
        organization_id: org,
        active: true,
      },
    ])
  ).error,
);
check(
  (
    await client.from("student_guardians").upsert([
      { parent_id: ids.parent, student_id: ids.emma, organization_id: org, active: true },
      {
        parent_id: ids["other-parent"],
        student_id: ids["other-student"],
        organization_id: org,
        active: true,
      },
    ])
  ).error,
);
console.log("Local synthetic accounts and roster ready. See README for demo login details.");
