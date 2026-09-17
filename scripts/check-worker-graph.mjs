import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const deno = resolve("node_modules/deno/bin.cjs");
const output = execFileSync(
  process.execPath,
  [
    deno,
    "info",
    "--json",
    "--config",
    "supabase/functions/grading-worker/deno.json",
    "supabase/functions/_shared/compatibility_test.ts",
  ],
  { encoding: "utf8" },
);
const graph = JSON.parse(output);
for (const module of graph.modules) {
  if (module.error) throw new Error("Unresolved worker dependency.");
  const specifier = module.specifier;
  if (specifier.startsWith("file:")) {
    if (!/(\/packages\/(domain|application|contracts)\/|\/supabase\/functions\/)/.test(specifier))
      throw new Error(`Unsupported local worker dependency: ${specifier}`);
  } else if (!/^npm:\/?zod@4\.3\.6(?:\/|$)/.test(specifier)) {
    throw new Error(`Unsupported worker dependency: ${specifier}`);
  }
}
console.log("Worker graph contains only shared inward packages, worker code, and pinned Zod.");
