import { describe, expect, it, vi } from "vitest";
import { createAccount, updateAccount } from "./accounts.ts";
import type { AccountRepository } from "./accounts.ts";
const actor = {
  id: "admin",
  organizationId: "school",
  displayName: "Admin",
  role: "ADMIN",
} as const;
const input = {
  requestId: "request",
  email: "student@example.com",
  password: "not-persisted",
  displayName: "Student",
  role: "STUDENT",
  gradeLevel: "P5",
  schoolYear: 2026,
} as const;
const edit = {
  accountId: "other",
  expectedVersion: 1,
  displayName: "Name",
  role: "PARENT",
  active: true,
  gradeLevel: "P5",
  schoolYear: 2026,
  reason: "Correct access",
} as const;
function repository(): AccountRepository {
  return { reserve: vi.fn(async () => null), update: vi.fn(async () => {}) };
}
describe("account administration", () => {
  it.each(["STUDENT", "PARENT", "TEACHER"] as const)(
    "denies %s before invoking any effects",
    async (role) => {
      const repo = repository();
      const identities = { create: vi.fn(async () => "new") };
      await expect(
        createAccount({ ...actor, role }, input, repo, identities),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(updateAccount({ ...actor, role }, edit, repo)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      expect(repo.reserve).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
      expect(identities.create).not.toHaveBeenCalled();
    },
  );
  it("never sends passwords to the reservation store", async () => {
    const repo = repository();
    await createAccount(actor, input, repo, { create: async () => "new" });
    expect(repo.reserve).toHaveBeenCalledWith(
      expect.not.objectContaining({ password: expect.anything() }),
    );
  });
  it("does not call Auth again after a completed request", async () => {
    const repo = repository();
    repo.reserve = vi.fn(async () => "existing");
    const create = vi.fn();
    expect(await createAccount(actor, input, repo, { create })).toBe("existing");
    expect(create).not.toHaveBeenCalled();
  });
  it("recovers a committed identity after a lost provider response", async () => {
    const repo = repository();
    repo.reserve = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce("committed");
    expect(
      await createAccount(actor, input, repo, {
        create: async () => {
          throw new Error("timeout");
        },
      }),
    ).toBe("committed");
  });
  it("preserves failure when nothing committed", async () => {
    await expect(
      createAccount(actor, input, repository(), {
        create: async () => {
          throw new Error("failed");
        },
      }),
    ).rejects.toThrow("failed");
  });
  it("rejects self lockout", async () => {
    const repo = repository();
    await expect(
      updateAccount(actor, { ...edit, accountId: actor.id }, repo),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repo.update).not.toHaveBeenCalled();
  });
  it("allows an authorized account change", async () => {
    const repo = repository();
    await updateAccount(actor, edit, repo);
    expect(repo.update).toHaveBeenCalledWith(edit);
  });
});
