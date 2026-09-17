import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const artifactDirectory = resolve("artifacts/demo-walkthrough");
mkdirSync(artifactDirectory, { recursive: true });

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(`${email}@masteryloop.local`);
  await page.getByLabel("Password", { exact: true }).fill("MasteryLoop-local-2026!");
  await page.getByRole("button", { name: "Enter your learning space" }).click();
}

test("Demo Walkthrough: landing page to an authorized teacher workspace", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every day.");
  await page.screenshot({ path: resolve(artifactDirectory, "landing-page.png"), fullPage: true });

  await signIn(page, "teacher");
  await expect(page).toHaveURL("/teacher");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Make understanding");
  await expect(page.getByRole("heading", { name: "Your classes" })).toBeVisible();
  await page.screenshot({
    path: resolve(artifactDirectory, "demo-walkthrough.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "Manage connections" }).click();
  await expect(page.getByRole("heading", { name: "Build your connections" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create a class" })).toBeVisible();
});
