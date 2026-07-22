import { expect, test } from '@playwright/test'
import { createUser } from './helpers'

test('Scale Lab reveals a scale only after the learner adopts it from the panel', async ({ page }) => {
  await createUser(page, `scale-lab-${Date.now()}`)
  await page.goto('/play/learn-scales')

  await expect(page.getByRole('heading', { name: /build a scale/i })).toBeVisible()

  // No target by default: the build board is in free-explore mode and the
  // target badge is the empty-state variant.
  await expect(page.getByRole('status', { name: /no target scale selected/i })).toBeVisible()
  await expect(page.getByRole('group', { name: /free exploration on piano/i })).toBeVisible()

  // Switch to the piano build board; the guitar is the default.
  await page
    .getByRole('group', { name: /build board instrument/i })
    .getByRole('button', { name: /^piano$/i })
    .click()

  for (const note of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
    const key = page
      .getByRole('group', { name: /free exploration on piano/i })
      .locator('.pk-natural-key.pk-key-button', { hasText: new RegExp(`^${note}$`) })
      .first()
    await key.click()
  }

  // "Show the rest" is gated on a target — the learner must commit to one
  // before the system will reveal the missing scale notes.
  await expect(page.getByRole('button', { name: /show the rest/i })).toBeDisabled()

  // Adopting a candidate from the panel promotes the scale to a target and
  // re-skins the build board with the target shape.
  await page.getByRole('button', { name: /set ionian \(major\) as the target scale/i }).click()
  await expect(page.getByRole('status', { name: /target scale: c ionian/i })).toBeVisible()
  await expect(page.getByRole('group', { name: /c ionian target scale on piano/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /show the rest/i })).toBeEnabled()

  // With the target set, the C Ionian notes are classified as "in target"
  // (green). The legend must reflect the new states.
  await expect(
    page
      .getByRole('group', { name: /c ionian target scale on piano/i })
      .locator('.pk-natural-key.pk-key-button.pk-key-match', { hasText: 'C' })
      .first(),
  ).toBeVisible()
  await expect(page.getByText(/in target \(placed\)/i)).toBeVisible()
  await expect(page.getByText(/off target \(placed\)/i)).toBeVisible()

  // Add an off-target note and confirm it shows up in the "miss" state.
  const missKey = page
    .getByRole('group', { name: /c ionian target scale on piano/i })
    .locator('.pk-natural-key.pk-key-button', { hasText: 'F#' })
    .first()
  await missKey.click()
  await expect(
    page
      .getByRole('group', { name: /c ionian target scale on piano/i })
      .locator('.pk-natural-key.pk-key-button.pk-key-miss', { hasText: 'F#' })
      .first(),
  ).toBeVisible()

  const analyzeResponse = page.waitForResponse(
    (response) => response.url().includes('/api/scale-path/verify') && response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: /analyze sound formula/i }).click()
  const response = await analyzeResponse
  expect(response.ok()).toBe(true)
  const analysis = await response.json()
  expect(analysis.analysisEngine).toBe('music21')
  expect(analysis.confirmed).toBe(false)

  await expect(page.getByRole('region', { name: /sound formula analysis/i })).toBeVisible()
  await expect(page.getByText(/music21 laboratory analysis/i)).toBeVisible()

  // Clearing the target returns the build board to free-explore mode.
  await page.getByRole('button', { name: /clear target scale/i }).click()
  await expect(page.getByRole('status', { name: /no target scale selected/i })).toBeVisible()
  await expect(page.getByRole('group', { name: /free exploration on piano/i })).toBeVisible()
})
