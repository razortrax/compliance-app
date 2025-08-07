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
})


