import { describe, expect, it, vi } from "vitest";
import type { ActorContext } from "@masteryloop/domain";
import type { RosterRepository } from "./ports.ts";
import { createClass, requireActor, setGuardianLink, setMembership } from "./use-cases.ts";
const actor: ActorContext = {
  id: "teacher",
  organizationId: "school",
  role: "TEACHER",
  displayName: "Ms. Tan",
};
function repository(): RosterRepository {
  return {
    getActor: vi.fn(async () => actor),
    listClasses: vi.fn(async () => ({ items: [], nextCursor: null })),
    getClass: vi.fn(async (id: string) =>
      id === "class"
        ? {
            id: "class",
            name: "Science",
            subject: "Science",
            gradeLevel: "P5",
            teacherId: "teacher",
          }
        : null,
    ),
    getDirectory: vi.fn(async () => ({
      people: { items: [], nextCursor: null },
      enrollmentCounts: {},
    })),
    createClass: vi.fn(async () => {}),
    setMembership: vi.fn(async () => {}),
    setGuardianLink: vi.fn(async () => {}),
  };
}
describe("roster authorization", () => {
  it("rejects missing identity", async () => {
    const repo = repository();
    repo.getActor = vi.fn(async () => null);
    await expect(requireActor(repo)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
  it("rejects class creation for another teacher", async () => {
    const repo = repository();
    await expect(
      createClass(
        actor,
        { name: "Science", subject: "Science", gradeLevel: "P5", teacherId: "other" },
        repo,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repo.createClass).not.toHaveBeenCalled();
  });
  it("allows own-class creation", async () => {
    const repo = repository();
    const input = { name: "Science", subject: "Science", gradeLevel: "P5", teacherId: actor.id };
    await createClass(actor, input, repo);
    expect(repo.createClass).toHaveBeenCalledWith(input);
  });
  it("rejects out-of-class roster writes", async () => {
    const repo = repository();
    await expect(
      setMembership(actor, { classId: "other", studentId: "student", active: true }, repo),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repo.setMembership).not.toHaveBeenCalled();
  });
  it.each(["PARENT", "STUDENT", "TEACHER"] as const)(
    "denies guardian-link management to %s",
    async (role) => {
      const repo = repository();
      await expect(
        setGuardianLink(
          { ...actor, role },
          { parentId: "parent", studentId: "student", active: true },
          repo,
        ),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(repo.setGuardianLink).not.toHaveBeenCalled();
    },
  );
  it("allows admin guardian-link management", async () => {
    const repo = repository();
    await setGuardianLink(
      { ...actor, role: "ADMIN" },
      { parentId: "parent", studentId: "student", active: false },
      repo,
    );
    expect(repo.setGuardianLink).toHaveBeenCalledWith("parent", "student", false);
  });
});
