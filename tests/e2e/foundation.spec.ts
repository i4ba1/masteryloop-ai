import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(`${email}@masteryloop.local`);
  await page.getByLabel("Password", { exact: true }).fill("MasteryLoop-local-2026!");
  await page.getByRole("button", { name: "Enter your learning space" }).click();
}
for (const [email, role] of [
  ["emma", "student"],
  ["teacher", "teacher"],
  ["parent", "parent"],
  ["admin", "admin"],
]) {
  test(`${role} reaches their own dashboard`, async ({ page }) => {
    await login(page, email!);
    await expect(page).toHaveURL(`/${role}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/login");
    await page.goto(`/${role}`);
    await expect(page).toHaveURL("/login");
  });
}
test("parent cannot switch to teacher UI or see unrelated children", async ({ page }) => {
  await login(page, "parent");
  await expect(page).toHaveURL("/parent");
  await expect(page.getByRole("heading", { name: "Emma", exact: true })).toBeVisible();
  await expect(page.getByText("Daniel", { exact: true })).toHaveCount(0);
  await page.goto("/teacher");
  await expect(page).toHaveURL("/parent");
});
test("teacher creates a class and persists it after reload", async ({ page }) => {
  await login(page, "teacher");
  await expect(page).toHaveURL("/teacher");
  const name = `Science ${Date.now()}`;
  await page.getByLabel("Class name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Create class", exact: true }).click();
  await expect(page.getByText("Your class is ready.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
});
test("landing page and keyboard navigation are usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every day.");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
