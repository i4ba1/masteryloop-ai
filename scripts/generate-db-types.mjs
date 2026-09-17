import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const output = execFileSync(
  process.execPath,
  [
    resolve("node_modules/supabase/dist/supabase.js"),
    "gen",
    "types",
    "typescript",
    "--local",
    "--schema",
    "public",
  ],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
const path = "packages/infrastructure/src/db/database.types.ts";
if (process.argv.includes("--check")) {
  if (readFileSync(path, "utf8").replaceAll("\r\n", "\n") !== output.replaceAll("\r\n", "\n"))
    throw new Error("Database types are stale. Run pnpm db:types.");
  console.log("Database types match the local schema.");
} else {
  writeFileSync(path, output);
  console.log("Generated database types from the local schema.");
}
