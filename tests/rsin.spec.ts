import { test, expect } from '@playwright/test'

const masterOrgId = process.env.E2E_MASTER_ORG_ID
const orgId = process.env.E2E_ORG_ID
const equipmentId = process.env.E2E_EQUIPMENT_ID

test.describe('RSIN flow (guarded)', () => {
  test.beforeEach(async function () {
    if (!masterOrgId || !orgId || !equipmentId) {
      test.skip(true, 'Set E2E_MASTER_ORG_ID, E2E_ORG_ID, and E2E_EQUIPMENT_ID to run this scenario')
    }
  })

  test('navigate to equipment RSIN list', async ({ page }) => {
    await page.goto(`/master/${masterOrgId}/organization/${orgId}/equipment/${equipmentId}/roadside-inspections`)
    // Expect page to contain an RSIN-related heading/text
    const heading = page.getByRole('heading', { name: /roadside inspections?/i })
    const alt = page.getByText(/Roadside Inspections/i)
    await expect(heading.or(alt)).toBeVisible()
  })
})


