import { writeFileSync, existsSync, readFileSync, appendFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { localStatus } from "./local-supabase.mjs";
const status = localStatus();
const destination = "apps/web/.env.local";
const appUrl = process.env.MASTERYLOOP_LOCAL_APP_URL ?? "http://localhost:3000";
if (!["http://localhost:3000", "http://localhost:3100"].includes(appUrl))
  throw new Error("Unsupported local app URL.");
if (!existsSync(destination)) {
  writeFileSync(
    destination,
    `NEXT_PUBLIC_SUPABASE_URL=${status.API_URL}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.ANON_KEY}\nAPP_URL=${appUrl}\n`,
  );
}
const current = readFileSync(destination, "utf8");
if (!/^SUPABASE_SERVICE_ROLE_KEY=/m.test(current)) {
  appendFileSync(destination, `\nSUPABASE_SERVICE_ROLE_KEY=${status.SERVICE_ROLE_KEY}\n`);
}
if (!existsSync("supabase/.env.local")) {
  writeFileSync("supabase/.env.local", `WORKER_TRIGGER_TOKEN=${randomBytes(32).toString("hex")}\n`);
}
console.log(
  "Local web/worker configuration ready. Existing values preserved; credentials were not printed.",
);
