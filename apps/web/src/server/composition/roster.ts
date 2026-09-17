import "server-only";
import { SupabaseRosterRepository } from "@masteryloop/infrastructure";
import { requireActor } from "@masteryloop/application";
import { createSessionClient } from "@/server/auth/client";

export async function rosterContext() {
  const repository = new SupabaseRosterRepository(await createSessionClient());
  const actor = await requireActor(repository);
  return { actor, repository };
}
