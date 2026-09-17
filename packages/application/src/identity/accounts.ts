import { ApplicationError } from "@masteryloop/domain";
import type { ActorContext, Role } from "@masteryloop/domain";
export interface AccountDetails {
  displayName: string;
  role: Role;
  gradeLevel: string;
  schoolYear: number;
}
export interface CreateAccountInput extends AccountDetails {
  requestId: string;
  email: string;
  password: string;
}
export interface UpdateAccountInput extends AccountDetails {
  accountId: string;
  expectedVersion: number;
  active: boolean;
  reason: string;
}
export interface AccountRepository {
  reserve(input: Omit<CreateAccountInput, "password">): Promise<string | null>;
  update(input: UpdateAccountInput): Promise<void>;
}
export interface AccountIdentityPort {
  create(input: { email: string; password: string; requestId: string }): Promise<string>;
}
function requireAdmin(actor: ActorContext) {
  if (actor.role !== "ADMIN")
    throw new ApplicationError("FORBIDDEN", "Only administrators can manage accounts.");
}
export async function createAccount(
  actor: ActorContext,
  input: CreateAccountInput,
  repository: AccountRepository,
  identities: AccountIdentityPort,
) {
  requireAdmin(actor);
  const { password, ...reservation } = input;
  const existing = await repository.reserve(reservation);
  if (existing) return existing;
  try {
    return await identities.create({ email: input.email, password, requestId: input.requestId });
  } catch (error) {
    // A concurrent request or lost response may have committed successfully.
    // Re-read the durable reservation; never delete a possibly committed account.
    const completed = await repository.reserve(reservation);
    if (completed) return completed;
    throw error;
  }
}
export async function updateAccount(
  actor: ActorContext,
  input: UpdateAccountInput,
  repository: AccountRepository,
) {
  requireAdmin(actor);
  if (input.accountId === actor.id && (!input.active || input.role !== "ADMIN")) {
    throw new ApplicationError(
      "FORBIDDEN",
      "You cannot disable yourself or remove your own administrator role.",
    );
  }
  await repository.update(input);
}
