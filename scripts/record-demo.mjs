import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";

const root = process.cwd();
const output = resolve(root, "artifacts/demo-walkthrough");
const resultDirectory = resolve(root, "test-results");
mkdirSync(output, { recursive: true });
const pnpmEntry = process.env.npm_execpath;
if (!pnpmEntry) throw new Error("Run this script through pnpm record:demo.");
const executable = pnpmEntry.endsWith(".exe") ? pnpmEntry : process.execPath;
const prefix = pnpmEntry.endsWith(".exe") ? [] : [pnpmEntry];
const result = spawnSync(
  executable,
  [
    ...prefix,
    "exec",
    "playwright",
    "test",
    "tests/e2e/demo-walkthrough.spec.ts",
    "--project=chromium",
    "--headed",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      PLAYWRIGHT_RECORD: "1",
      MASTERYLOOP_LOCAL_APP_URL: "http://localhost:3100",
    },
    stdio: "inherit",
    windowsHide: false,
  },
);
if (result.status !== 0) process.exit(result.status ?? 1);
function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}
const videos = filesUnder(resultDirectory).filter((path) => extname(path) === ".webm");
if (!videos.length) throw new Error("Playwright completed without a WebM recording.");
const source = videos.sort((a, b) => b.localeCompare(a))[0];
if (!ffmpegPath) throw new Error("ffmpeg-static did not provide an encoder binary.");
if (!existsSync(ffmpegPath)) {
  const installed = spawnSync(process.execPath, [resolve(dirname(ffmpegPath), "install.js")], {
    stdio: "inherit",
  });
  if (installed.status !== 0 || !existsSync(ffmpegPath))
    throw new Error("Unable to install the local ffmpeg encoder.");
}
const mp4 = resolve(output, "demo-walkthrough.mp4");
const converted = spawnSync(
  ffmpegPath,
  ["-y", "-i", source, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4],
  { stdio: "inherit" },
);
if (converted.status !== 0) process.exit(converted.status ?? 1);
cpSync(resolve(output, "demo-walkthrough.png"), resolve(output, "Demo-Walkthrough-screenshot.png"));
console.log(`Demo recording: ${mp4}`);
console.log(`Demo screenshot: ${resolve(output, "Demo-Walkthrough-screenshot.png")}`);
