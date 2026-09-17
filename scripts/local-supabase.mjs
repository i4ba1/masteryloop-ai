import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
export function localStatus() {
  const binary = resolve("node_modules/supabase/dist/supabase.js");
  const status = JSON.parse(
    execFileSync(process.execPath, [binary, "status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
  const config = readFileSync("supabase/config.toml", "utf8");
  const configuredPort = config.match(/\[api\][\s\S]*?\bport\s*=\s*(\d+)/)?.[1];
  const project = config.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
  const url = new URL(status.API_URL);
  if (
    !["127.0.0.1", "localhost"].includes(url.hostname) ||
    url.port !== configuredPort ||
    !["54321", "55321"].includes(url.port) ||
    !project?.startsWith("masteryloop-")
  ) {
    throw new Error(
      "This script only supports the configured disposable local MasteryLoop Supabase project.",
    );
  }
  return status;
}
