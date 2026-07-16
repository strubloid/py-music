import { expect, test } from '@playwright/test'
import { createUser } from './helpers'

test('Scale Trail rolls six or seven movements and preserves progress while changing instruments', async ({ page }) => {
  await createUser(page, `scale-trail-${Date.now()}`)
  await page.goto('/play/scales')

  await expect(page.getByRole('heading', { name: /choose your path through the instrument gardens/i })).toBeVisible()
  await page.getByRole('button', { name: /piano garden/i }).click()
  await expect(page.locator('.musical-die')).toBeVisible()
  await expect(page.locator('.living-scale-trail')).toBeVisible({ timeout: 15_000 })

  const progressNodes = page.locator('.trail-progress i')
  const count = await progressNodes.count()
  expect([6, 7]).toContain(count)
  await expect(page.getByText(new RegExp(`Movement 1 of ${count}`))).toBeVisible()

  const legalKey = page.locator('.game-piano__key.is-legal').first()
  await expect(legalKey).toBeEnabled()
  await legalKey.click()
  await expect(page.getByText(new RegExp(`Movement 2 of ${count}`))).toBeVisible({ timeout: 8_000 })

  await page.getByRole('button', { name: /^guitar$/i }).click()
  await expect(page.getByText(new RegExp(`Movement 2 of ${count}`))).toBeVisible()
  await expect(page.locator('.game-fretboard')).toBeVisible()
})

test('Scale Trail instrument surface does not create mobile page overflow', async ({ page }) => {
  await createUser(page, `scale-mobile-${Date.now()}`)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/play/scales')
  await page.getByRole('button', { name: /guitar bridge/i }).click()
  await expect(page.locator('.living-scale-trail')).toBeVisible({ timeout: 15_000 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
  await expect(page.locator('.game-fretboard')).toBeVisible()
})
