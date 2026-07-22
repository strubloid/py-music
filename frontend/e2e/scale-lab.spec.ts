import { expect, test } from '@playwright/test'
import { createUser } from './helpers'

test('Scale Lab confirms a complete Sound Formula through music21', async ({ page }) => {
  await createUser(page, `scale-lab-${Date.now()}`)
  await page.goto('/play/learn-scales')

  await expect(page.getByRole('heading', { name: /build a scale/i })).toBeVisible()

  // Switch to the piano build board; the guitar is the default.
  await page.getByRole('group', { name: /build board instrument/i }).getByRole('button', { name: /^piano$/i }).click()

  // The range-aware piano is now visible. Its accessible name describes the
  // current root and mode rather than a fixed C3-C4 span.
  await expect(page.getByRole('group', { name: /C ionian scale shape on piano/i })).toBeVisible()

  for (const note of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
    const key = page
      .getByRole('group', { name: /C ionian scale shape on piano/i })
      .locator('.pk-natural-key.pk-key-button', { hasText: new RegExp(`^${note}$`) })
      .first()
    await key.click()
  }

  const analyzeResponse = page.waitForResponse(
    (response) => response.url().includes('/api/scale-path/verify') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: /analyze sound formula/i }).click()
  const response = await analyzeResponse
  expect(response.ok()).toBe(true)
  const analysis = await response.json()
  expect(analysis.analysisEngine).toBe('music21')
  expect(analysis.confirmed).toBe(true)

  await expect(page.getByRole('region', { name: /sound formula analysis/i })).toBeVisible()
  await expect(page.getByText(/music21 laboratory analysis/i)).toBeVisible()
  await expect(page.getByText(/formula confirmed: c ionian/i)).toBeVisible()
  await expect(page.getByLabel(/formula 1 – 2 – 3 – 4 – 5 – 6 – 7/i)).toBeVisible()
})
