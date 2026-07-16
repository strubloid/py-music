import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('Practice Square city map visual regression', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /where will the music take you/i })).toBeVisible()
  await page.getByRole('button', { name: 'Open Music City map' }).click()
  await expect(page.getByRole('dialog', { name: 'Music City map' })).toBeVisible()
  await expect(page).toHaveScreenshot('practice-square-city-map.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
  })
})

test('Quest Vault chamber visual regression', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/play/quests')
  await expect(page.getByRole('heading', { name: 'The Resonance Chamber' })).toBeVisible()
  await expect(page).toHaveScreenshot('quest-vaults-chamber.png', { animations: 'disabled', maxDiffPixelRatio: 0.01 })
})

test('mobile Music City map visual regression', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Open Music City map' }).click()
  await expect(page.getByRole('dialog', { name: 'Music City map' })).toBeVisible()
  await expect(page).toHaveScreenshot('music-city-map-mobile.png', { animations: 'disabled', maxDiffPixelRatio: 0.01 })
})
