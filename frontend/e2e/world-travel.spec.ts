import { expect, test } from '@playwright/test'

test('district travel is skippable, map-driven, and remembers the last activity district', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /where will the music take you/i })).toBeVisible()

  await page.getByRole('button', { name: /scale lab.*enter district/i }).click()
  await expect(page.getByRole('status').filter({ hasText: /scale lab/i })).toBeVisible()
  await expect(page.getByText(/tuning a new route/i)).toBeVisible()
  await page.getByRole('button', { name: /skip travel/i }).click()
  await expect(page).toHaveURL(/\/play\/learn-scales$/)

  await page.keyboard.press('m')
  const map = page.getByRole('dialog', { name: /music city map/i })
  await expect(map).toBeVisible()
  await expect(map.getByRole('button', { name: /scale lab/i })).toHaveAttribute('aria-current', 'location')
  await map.getByRole('button', { name: /practice square/i }).click()
  await page.getByRole('button', { name: /skip travel/i }).click()
  await expect(page).toHaveURL('/')

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('strubloid:living-city-travel') || '{}'))
  expect(saved.lastDistrict).toBe('scale-lab')
  expect(saved.visited).toEqual(expect.arrayContaining(['practice-square', 'scale-lab']))

  await page.getByRole('button', { name: /scale lab.*enter district/i }).click()
  await expect(page.getByText(/familiar shortcut/i)).toBeVisible()
  await page.getByRole('button', { name: /skip travel/i }).click()
})

test('a slow Quest Vault import uses contextual status instead of a generic spinner', async ({ page }) => {
  await page.route('**/src/pages/play/Quests.tsx*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3400))
    await route.continue()
  })
  await page.goto('/play/quests')
  await expect(page.getByRole('status')).toContainText(/Vault Keeper is searching for the right key/i)
  await expect(page.getByRole('status')).toContainText(/taking longer than usual/i, { timeout: 5000 })
  await expect(page.getByRole('heading', { name: /Resonance Chamber/i })).toBeVisible({ timeout: 10000 })
})

test('a failed district import stays inside the world with expandable technical details', async ({ page }) => {
  await page.route('**/src/pages/play/Quests.tsx*', (route) => route.abort('failed'))
  await page.goto('/play/quests')
  await expect(page.getByRole('alert')).toContainText(/lost the district signal/i)
  await expect(page.getByRole('button', { name: /reconnect signal/i })).toBeVisible()
  await page.getByText(/technical details/i).click()
  await expect(page.locator('.district-error code')).not.toBeEmpty()
})

test.describe('mobile city map', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('keeps every district reachable without horizontal overflow', async ({ page }) => {
    await page.goto('/play/ear-training')
    await page.getByRole('button', { name: /open music city map/i }).click()
    await expect(page.getByRole('dialog', { name: /music city map/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /quest vaults/i })).toBeVisible()
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport + 1)
  })
})
