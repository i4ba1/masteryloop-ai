export const roles = ["STUDENT", "PARENT", "TEACHER", "ADMIN"] as const;
export type Role = (typeof roles)[number];

export interface ActorContext {
  readonly id: string;
  readonly organizationId: string;
  readonly role: Role;
  readonly displayName: string;
}

export interface ClassSummary {
  readonly id: string;
  readonly name: string;
  readonly subject: string;
  readonly gradeLevel: string;
  readonly teacherId: string;
}

export interface PersonSummary {
  readonly active: boolean;
  readonly version: number;
  readonly id: string;
  readonly displayName: string;
  readonly role: Role;
}

export interface Membership {
  readonly classId: string;
  readonly studentId: string;
}

export interface GuardianLink {
  readonly parentId: string;
  readonly studentId: string;
}

export function canManageClass(actor: ActorContext, teacherId: string): boolean {
  return actor.role === "ADMIN" || (actor.role === "TEACHER" && actor.id === teacherId);
}

export function canCreateClass(actor: ActorContext): boolean {
  return actor.role === "TEACHER" || actor.role === "ADMIN";
}
