import "server-only";
import { z } from "zod";

export function getServerConfig() {
  const result = z.object({ appUrl: z.url() }).safeParse({ appUrl: process.env.APP_URL });
  if (!result.success) throw new Error("APP_URL is missing or invalid. Run pnpm setup:local.");
  return result.data;
}

export function getAccountConfig() {
  const result = z
    .object({ serviceRoleKey: z.string().min(20) })
    .safeParse({ serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY });
  if (!result.success)
    throw new Error(
      "Account creation is unavailable: configure the server-only SUPABASE_SERVICE_ROLE_KEY.",
    );
  return result.data;
}
