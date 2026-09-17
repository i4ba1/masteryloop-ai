import type { SupabaseClient } from "@supabase/supabase-js";
import { pageOf, pageSize } from "@masteryloop/application";
import type { CreateClassInput, PageRequest, RosterRepository } from "@masteryloop/application";
import type { Database } from "./database.types.ts";
import { check } from "./errors.ts";

const classColumns = "id, name, subject, grade_level, teacher_id";
function classroom(item: {
  id: string;
  name: string;
  subject: string;
  grade_level: string;
  teacher_id: string;
}) {
  return {
    id: item.id,
    name: item.name,
    subject: item.subject,
    gradeLevel: item.grade_level,
    teacherId: item.teacher_id,
  };
}
export class SupabaseRosterRepository implements RosterRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async getActor() {
    const {
      data: { user },
      error: authError,
    } = await this.client.auth.getUser();
    if (authError || !user) return null;
    const { data, error } = await this.client
      .from("profiles")
      .select("id, organization_id, role, display_name")
      .eq("id", user.id)
      .eq("active", true)
      .maybeSingle();
    check(error);
    return data
      ? {
          id: data.id,
          organizationId: data.organization_id,
          role: data.role,
          displayName: data.display_name,
        }
      : null;
  }
  async listClasses(page: PageRequest = {}) {
    let query = this.client
      .from("classes")
      .select(classColumns)
      .eq("active", true)
      .order("id")
      .limit(pageSize + 1);
    if (page.after) query = query.gt("id", page.after);
    const { data, error } = await query;
    check(error);
    return pageOf((data ?? []).map(classroom));
  }
  async getClass(id: string) {
    const { data, error } = await this.client
      .from("classes")
      .select(classColumns)
      .eq("id", id)
      .eq("active", true)
      .maybeSingle();
    check(error);
    return data ? classroom(data) : null;
  }
  async getDirectory(page: PageRequest, classIds: string[], includeInactive: boolean) {
    let query = this.client
      .from("profiles")
      .select("id, display_name, role, active, version")
      .order("id")
      .limit(pageSize + 1);
    if (!includeInactive) query = query.eq("active", true);
    if (page.after) query = query.gt("id", page.after);
    const [people, counts] = await Promise.all([
      query,
      this.client.rpc("class_enrollment_counts", { class_ids: classIds }),
    ]);
    check(people.error);
    check(counts.error);
    return {
      people: pageOf(
        (people.data ?? []).map((p) => ({
          id: p.id,
          displayName: p.display_name,
          role: p.role,
          active: p.active,
          version: p.version,
        })),
      ),
      enrollmentCounts: Object.fromEntries(
        (counts.data ?? []).map((item) => [item.class_id, item.enrollment_count]),
      ),
    };
  }
  async createClass(input: CreateClassInput) {
    const { error } = await this.client.rpc("create_class", {
      class_name: input.name,
      class_subject: input.subject,
      class_grade_level: input.gradeLevel,
      class_teacher_id: input.teacherId,
    });
    check(error);
  }
  async setMembership(classId: string, studentId: string, active: boolean) {
    const { error } = await this.client.rpc("set_membership", {
      target_class_id: classId,
      target_student_id: studentId,
      is_active: active,
    });
    check(error);
  }
  async setGuardianLink(parentId: string, studentId: string, active: boolean) {
    const { error } = await this.client.rpc("set_guardian_link", {
      target_parent_id: parentId,
      target_student_id: studentId,
      is_active: active,
    });
    check(error);
  }
}
