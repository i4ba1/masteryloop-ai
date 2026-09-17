import { ApplicationError, canCreateClass, canManageClass } from "@masteryloop/domain";
import type { ActorContext } from "@masteryloop/domain";
import type { CreateClassInput, RosterRepository, PageRequest } from "./ports.ts";

export async function requireActor(repository: RosterRepository): Promise<ActorContext> {
  const actor = await repository.getActor();
  if (!actor) throw new ApplicationError("UNAUTHENTICATED", "Please sign in to continue.");
  return actor;
}

export async function getDashboard(
  actor: ActorContext,
  repository: RosterRepository,
  pages: { classes: PageRequest; people: PageRequest } = { classes: {}, people: {} },
) {
  const classes = await repository.listClasses(pages.classes);
  const directory = await repository.getDirectory(
    pages.people,
    classes.items.map((item) => item.id),
    actor.role === "ADMIN",
  );
  return { actor, classes, ...directory };
}
export async function createClass(
  actor: ActorContext,
  input: CreateClassInput,
  repository: RosterRepository,
): Promise<void> {
  if (!canCreateClass(actor) || !canManageClass(actor, input.teacherId)) {
    throw new ApplicationError("FORBIDDEN", "You cannot create a class for this teacher.");
  }
  await repository.createClass(input);
}

export async function setMembership(
  actor: ActorContext,
  input: { classId: string; studentId: string; active: boolean },
  repository: RosterRepository,
): Promise<void> {
  if (!canCreateClass(actor))
    throw new ApplicationError("FORBIDDEN", "Only staff can manage enrollment.");
  const classroom = await repository.getClass(input.classId);
  if (!classroom || !canManageClass(actor, classroom.teacherId)) {
    throw new ApplicationError("FORBIDDEN", "You cannot manage this class.");
  }
  await repository.setMembership(input.classId, input.studentId, input.active);
}

export async function setGuardianLink(
  actor: ActorContext,
  input: { parentId: string; studentId: string; active: boolean },
  repository: RosterRepository,
): Promise<void> {
  if (actor.role !== "ADMIN")
    throw new ApplicationError("FORBIDDEN", "Only an administrator can manage guardian links.");
  await repository.setGuardianLink(input.parentId, input.studentId, input.active);
}
