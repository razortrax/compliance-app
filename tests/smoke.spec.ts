import { test, expect } from '@playwright/test'

test('landing page renders and shows hero', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Fleet Compliance Made Simple')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('DOT Compliance Made Simple')
})

test('test-sentry page loads in dev', async ({ page }) => {
  await page.goto('/test-sentry')
  // In dev we render the test page; in prod build it may show disabled text
  const devCard = page.getByText('Test Sentry (Dev)')
  const disabledText = page.getByText('This page is disabled outside development.')
  await expect(devCard.or(disabledText)).toBeVisible()
})


