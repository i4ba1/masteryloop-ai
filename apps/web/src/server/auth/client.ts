import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicConfig } from "@/shared/config/public";
import type { Database } from "@masteryloop/infrastructure";

export async function createSessionClient() {
  const store = await cookies();
  const config = getPublicConfig();
  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          for (const { name, value, options } of values) store.set(name, value, options);
        } catch {
          // Server Components cannot write cookies; proxy.ts refreshes them before rendering.
        }
      },
    },
  });
}
