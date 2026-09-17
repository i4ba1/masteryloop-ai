import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.MASTERYLOOP_LOCAL_APP_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    video: process.env.PLAYWRIGHT_RECORD === "1" ? "on" : "off",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: `pnpm --filter @masteryloop/web dev --port ${process.env.MASTERYLOOP_LOCAL_APP_URL ? new URL(process.env.MASTERYLOOP_LOCAL_APP_URL).port : "3000"}`,
    url: process.env.MASTERYLOOP_LOCAL_APP_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI && !process.env.MASTERYLOOP_LOCAL_APP_URL,
    timeout: 120000,
  },
});
