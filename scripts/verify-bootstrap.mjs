import { spawnSync, spawn } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, basename } from "node:path";
const root = process.cwd();
const destination = resolve(root, ".bootstrap", `run-${Date.now()}`);
const excluded = new Set([
  ".git",
  ".bootstrap",
  ".tools",
  "node_modules",
  ".next",
  "test-results",
  "playwright-report",
  ".temp",
  ".branches",
  "coverage",
]);
mkdirSync(destination, { recursive: true });
for (const entry of readdirSync(root)) {
  if (
    excluded.has(entry) ||
    entry.endsWith(".pdf") ||
    (entry.startsWith(".env") && entry !== ".env.example")
  )
    continue;
  cpSync(resolve(root, entry), resolve(destination, entry), {
    recursive: true,
    filter: (path) =>
      !excluded.has(basename(path)) &&
      !(basename(path).startsWith(".env") && basename(path) !== ".env.example") &&
      !path.endsWith(".tsbuildinfo"),
  });
}
const configPath = resolve(destination, "supabase/config.toml");
let config = readFileSync(configPath, "utf8").replace(
  'project_id = "masteryloop-ai"',
  'project_id = "masteryloop-bootstrap"',
);
for (const port of [54320, 54321, 54322, 54323, 54324])
  config = config.replaceAll(String(port), String(port + 1000));
config = config
  .replaceAll("localhost:3000", "localhost:3100")
  .replaceAll("127.0.0.1:3000", "127.0.0.1:3100");
writeFileSync(configPath, config);
const pnpmEntry = process.env.npm_execpath;
if (!pnpmEntry) throw new Error("Run through pnpm bootstrap:verify.");
const executable = pnpmEntry.endsWith(".exe") ? pnpmEntry : process.execPath;
const prefix = pnpmEntry.endsWith(".exe") ? [] : [pnpmEntry];
const env = { ...process.env, CI: "true", MASTERYLOOP_LOCAL_APP_URL: "http://localhost:3100" };
const steps = [];
function run(label, args) {
  const started = Date.now();
  const result = spawnSync(executable, [...prefix, ...args], {
    cwd: destination,
    env,
    encoding: "utf8",
    timeout: 900000,
    maxBuffer: 16 * 1024 * 1024,
  });
  // Tool output may include local credentials (Supabase start), so keep only step outcomes.
  steps.push({
    label,
    seconds: Math.round((Date.now() - started) / 1000),
    passed: result.status === 0,
  });
  if (result.status !== 0) {
    const safeOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.replace(
      /(?:sb_secret_|eyJ)[A-Za-z0-9_.-]+/g,
      "[REDACTED]",
    );
    writeFileSync(resolve(destination, "bootstrap-failure.log"), safeOutput);
    throw new Error(`${label} failed; inspect ${destination}/bootstrap-failure.log`);
  }
  console.log(`${label}: passed (${steps.at(-1).seconds}s)`);
}
let worker;
let started;
let failure;
try {
  run("Frozen dependency install", ["install", "--frozen-lockfile"]);
  started = Date.now();
  run("Start isolated local database", ["db:start"]);
  run("Reset isolated local database", ["db:reset"]);
  run("Configure local environments", ["setup:local"]);
  run("Provision synthetic roles", ["seed:local"]);
  run("Generated database types", ["db:types:check"]);
  run("Database authorization tests", ["test:rls"]);
  run("Deno package check", ["worker:check"]);
  run("Deno compatibility tests", ["worker:test"]);
  worker = spawn(executable, [...prefix, "worker:serve"], {
    cwd: destination,
    env,
    stdio: "ignore",
    windowsHide: true,
  });
  const token = readFileSync(resolve(destination, "supabase/.env.local"), "utf8")
    .match(/^WORKER_TRIGGER_TOKEN=(.+)$/m)?.[1]
    ?.trim();
  let healthy = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch("http://127.0.0.1:55321/functions/v1/grading-worker/health", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok && (await response.json()).gradingEnabled === false) {
        healthy = true;
        break;
      }
    } catch {
      /* The local worker may still be booting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!healthy) throw new Error("Isolated worker health did not become ready.");
  const denied = await fetch("http://127.0.0.1:55321/functions/v1/grading-worker/health", {
    method: "POST",
    signal: AbortSignal.timeout(3000),
  });
  if (denied.status !== 401) throw new Error("Worker accepted missing credentials.");
  steps.push({ label: "Authenticated worker health and denial", passed: true });
  console.log("Isolated worker health and authentication: passed");
  run("Four role browser dashboards", [
    "exec",
    "playwright",
    "test",
    "--grep",
    "reaches their own dashboard",
  ]);
} catch (error) {
  failure = error instanceof Error ? error.message : "Bootstrap failed";
} finally {
  if (worker) worker.kill();
  const elapsed = started ? Math.round((Date.now() - started) / 1000) : null;
  // Stop only the dedicated project. No source workspace containers or volumes are removed.
  try {
    run("Stop isolated database", ["exec", "supabase", "stop"]);
  } catch {
    failure ??= "Isolated database cleanup failed";
  }
  const report = {
    date: new Date().toISOString(),
    sourceCopy: destination,
    dependencyDownloadsExcluded: true,
    setupSeconds: elapsed,
    within30Minutes: elapsed !== null && elapsed <= 1800,
    steps,
    failure: failure ?? null,
  };
  mkdirSync(resolve(root, "docs/verification"), { recursive: true });
  writeFileSync(
    resolve(root, "docs/verification/bootstrap.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  if (failure) {
    console.error(failure);
    process.exitCode = 1;
  } else if (elapsed > 1800) {
    console.error("Bootstrap exceeded 30 minutes.");
    process.exitCode = 1;
  } else
    console.log(
      `Bootstrap verified in ${elapsed}s excluding dependency install. Report: docs/verification/bootstrap.json`,
    );
}
