import { test, expect } from "@playwright/test";

const masterOrgId = process.env.E2E_MASTER_ORG_ID;
const orgId = process.env.E2E_ORG_ID;
const equipmentId = process.env.E2E_EQUIPMENT_ID;

test.describe("RSIN flow (guarded)", () => {
  test.beforeEach(async function () {
    if (!masterOrgId || !orgId || !equipmentId) {
      test.skip(
        true,
        "Set E2E_MASTER_ORG_ID, E2E_ORG_ID, and E2E_EQUIPMENT_ID to run this scenario",
      );
    }
  });

  test("navigate to equipment RSIN list", async ({ page }) => {
    await page.goto(
      `/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/roadside-inspections`,
    );
    // Expect page to contain an RSIN-related heading/text
    const heading = page.getByRole("heading", { name: /roadside inspections?/i });
    const alt = page.getByText(/Roadside Inspections/i);
    await expect(heading.or(alt)).toBeVisible();
  });

  test("open create RSIN dialog and cancel", async ({ page }) => {
    await page.goto(
      `/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/roadside-inspections`,
    );
    // Open dialog
    await page
      .getByRole("button", { name: /add inspection|create roadside inspection|add/i })
      .first()
      .click();
    // Expect dialog visible
    await expect(
      page
        .getByRole("heading", { name: /create roadside inspection/i })
        .or(page.getByText(/Create Roadside Inspection/i)),
    ).toBeVisible();
    // Close/cancel
    const cancel = page.getByRole("button", { name: /cancel/i });
    if (await cancel.count()) {
      await cancel.first().click();
    } else {
      await page.keyboard.press("Escape");
    }
    // Back on page
    const listHeading = page.getByRole("heading", { name: /roadside inspections?/i });
    await expect(listHeading).toBeVisible();
  });
});
