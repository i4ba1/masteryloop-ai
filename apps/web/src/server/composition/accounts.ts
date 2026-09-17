import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SupabaseAccountIdentity, SupabaseAccountRepository } from "@masteryloop/infrastructure";
import type { Database } from "@masteryloop/infrastructure";
import { ApplicationError } from "@masteryloop/domain";
import { rosterContext } from "./roster";
import { createSessionClient } from "@/server/auth/client";
import { getPublicConfig } from "@/shared/config/public";
import { getAccountConfig } from "@/server/config/environment";
export async function accountContext() {
  const { actor } = await rosterContext();
  if (actor.role !== "ADMIN")
    throw new ApplicationError("FORBIDDEN", "Only administrators can manage accounts.");
  const repository = new SupabaseAccountRepository(await createSessionClient());
  return { actor, repository };
}
export function accountIdentity() {
  const config = getAccountConfig();
  return new SupabaseAccountIdentity(
    createClient<Database>(getPublicConfig().url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
      },
    }),
  );
}
