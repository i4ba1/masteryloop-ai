import { expect, test } from "@playwright/test";
test("admin creates, edits and disables a school account", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("admin@masteryloop.local");
  await page.getByLabel("Password", { exact: true }).fill("MasteryLoop-local-2026!");
  await page.getByRole("button", { name: "Enter your learning space" }).click();
  await expect(page).toHaveURL("/admin");
  const name = `Account ${Date.now()}`;
  const form = page
    .locator("form")
    .filter({ has: page.getByLabel("Account email", { exact: true }) });
  await form
    .getByLabel("Account email", { exact: true })
    .fill(`account-${Date.now()}@masteryloop.local`);
  await form.getByLabel("Initial password").fill("Synthetic-password-2026!");
  await form.getByLabel("Display name").fill(name);
  await form.getByLabel("Account role").selectOption("PARENT");
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(form.getByText(/Account ready/)).toBeVisible();
  await page.reload();
  const row = page.getByRole("row").filter({ has: page.getByText(name, { exact: true }) });
  await expect(row).toHaveCount(1);
  await row.getByText(`Edit ${name}`, { exact: true }).click();
  await row.getByLabel("Account role").selectOption("TEACHER");
  await row.getByLabel("Account access").selectOption("false");
  await row.getByLabel("Reason for change").fill("Synthetic administration verification");
  await row.getByRole("button", { name: "Save account" }).click();
  await expect(row.getByRole("cell", { name: "Disabled", exact: true })).toBeVisible();
  await expect(row.getByRole("cell", { name: "teacher", exact: true })).toBeVisible();
});
test("invalid cursors fail safely", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("admin@masteryloop.local");
  await page.getByLabel("Password", { exact: true }).fill("MasteryLoop-local-2026!");
  await page.getByRole("button", { name: "Enter your learning space" }).click();
  await expect(page).toHaveURL("/admin");
  await page.goto("/admin?peopleAfter=invalid");
  await expect(page.getByRole("heading", { name: "Invalid page link" })).toBeVisible();
});
