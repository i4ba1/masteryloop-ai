import type { ActorContext, ClassSummary, PersonSummary } from "@masteryloop/domain";

export interface PageRequest {
  readonly after?: string;
}
export interface Page<T> {
  readonly items: T[];
  readonly nextCursor: string | null;
}
export const pageSize = 20;
export function pageOf<T extends { id: string }>(rows: T[]): Page<T> {
  const items = rows.slice(0, pageSize);
  return { items, nextCursor: rows.length > pageSize ? items.at(-1)!.id : null };
}
export interface Directory {
  readonly people: Page<PersonSummary>;
  readonly enrollmentCounts: Record<string, number>;
}
export interface CreateClassInput {
  readonly name: string;
  readonly subject: string;
  readonly gradeLevel: string;
  readonly teacherId: string;
}
export interface RosterRepository {
  getActor(): Promise<ActorContext | null>;
  listClasses(page?: PageRequest): Promise<Page<ClassSummary>>;
  getClass(id: string): Promise<ClassSummary | null>;
  getDirectory(page: PageRequest, classIds: string[], includeInactive: boolean): Promise<Directory>;
  createClass(input: CreateClassInput): Promise<void>;
  setMembership(classId: string, studentId: string, active: boolean): Promise<void>;
  setGuardianLink(parentId: string, studentId: string, active: boolean): Promise<void>;
}
