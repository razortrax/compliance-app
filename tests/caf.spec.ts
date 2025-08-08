import { test, expect } from '@playwright/test'

const masterOrgId = process.env.E2E_MASTER_ORG_ID
const orgId = process.env.E2E_ORG_ID

test.describe('CAF flow (guarded)', () => {
  test.beforeEach(async function () {
    if (!masterOrgId || !orgId) {
      test.skip(true, 'Set E2E_MASTER_ORG_ID and E2E_ORG_ID to run this scenario')
    }
  })

  test('navigate to CAFs page', async ({ page }) => {
    await page.goto(`/master/${masterOrgId}/cafs`)
    await expect(page.getByText(/CAFs/i).or(page.getByRole('heading', { name: /CAFs/i }))).toBeVisible()
  })

  test('open CAF detail view if present, else pass', async ({ page }) => {
    await page.goto(`/master/${masterOrgId}/cafs`)
    // Try to click first "View" button if present
    const viewBtn = page.getByRole('button', { name: /view/i })
    if (await viewBtn.count()) {
      await viewBtn.first().click()
      await expect(page.getByText(/CAF Details/i).or(page.getByRole('heading', { name: /CAF/i }))).toBeVisible()
      // Close the dialog if a close button exists
      const closeBtn = page.getByRole('button', { name: /close|cancel/i })
      if (await closeBtn.count()) {
        await closeBtn.first().click()
      } else {
        await page.keyboard.press('Escape')
      }
    }
  })
})


