import { expect, test, type Page } from '@playwright/test'
import { createUser } from './helpers'

const openReadyRun = async (page: Page) => {
  await page.goto('/play/ear-training')
  await expect(page.getByRole('heading', { name: 'Sound Gates' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible()
  await expect(page.locator('.sound-gates-header__rank')).toContainText('Unranked')
  await expect(page.locator('.sound-gates-header__rank')).toContainText('Level 1 · 9 to Bronze')
  await expect(page.locator('.game-arena')).toHaveAttribute('data-phase', 'ready')
  await expect(page.locator('.game-gate').first()).toHaveAttribute('data-gate-state', 'locked')
}

const playUntilInputUnlocks = async (page: Page) => {
  const play = page.getByRole('button', { name: /start .* musical question/i })
  await play.click()
  await expect(page.locator('.game-gate').first()).toBeEnabled({ timeout: 20_000 })
}

test('Sound Gates is keyboard playable, locks input during audio, and exposes feedback', async ({ page }) => {
  await openReadyRun(page)

  const gates = page.locator('.game-gate')
  await expect(gates).toHaveCount(await gates.count())
  expect(await gates.count()).toBeGreaterThanOrEqual(2)
  await expect(gates.first()).toBeDisabled()

  await playUntilInputUnlocks(page)
  await expect(gates.first()).toHaveAttribute('data-gate-state', /revealed|focused/)
  await page.keyboard.press('ArrowRight')
  await expect(gates.nth(1)).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Enter')
  await expect(page.locator('.result-presentation')).toBeVisible()
  await expect(page.locator('.game-arena')).toHaveAttribute('data-phase', /showing-correct|showing-incorrect/)
  await expect(page.getByRole('button', { name: /compare/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /next gate/i })).toBeVisible()
  await page.getByRole('button', { name: /compare/i }).click()
  await expect(page.locator('[data-comparison-mode="hologram"]')).toBeVisible()
  await expect(page.locator('.game-arena')).toHaveClass(/game-arena--comparison/)
  await expect(page.locator('[aria-live="polite"]')).not.toHaveText('')
})

test('Echo Replay spends exactly one server-authoritative Focus once', async ({ page }) => {
  await createUser(page, `replay-${Date.now()}`)
  await openReadyRun(page)
  await playUntilInputUnlocks(page)
  await expect(page.locator('.focus-crystal')).toContainText('5')
  const replay = page.getByRole('button', { name: /echo replay/i })
  await replay.click()
  await expect(page.locator('.focus-crystal')).toContainText('4')
  await expect(replay).toBeDisabled()
})

for (const sample of [
  { type: 'direction', variant: 'catch-root', label: 'Catch the Root', notes: ['C4', 'G4'] },
  { type: 'interval', variant: 'bridge-builder', label: 'Bridge Builder', notes: ['C4', 'E4'] },
  { type: 'shape', variant: 'echo-chase', label: 'Echo Chase', notes: ['C4', 'E4', 'D4'] },
]) {
  test(`stages ${sample.label} as a distinct accessible world verb`, async ({ page }) => {
    await page.route('**/api/daily-challenges?**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          challenges: [
            {
              id: 9000 + sample.notes.length,
              category: 'ear_training',
              difficulty: 1,
              xp_reward: 25,
              exercise: {
                type: sample.type,
                title: sample.label,
                question: 'Follow the musical signal.',
                options: ['First path', 'Second path', 'Third path'],
                notes: sample.notes,
                answer_mode: 'listen',
              },
            },
          ],
        }),
      })
    })
    await page.goto('/play/ear-training')
    const arena = page.locator('.game-arena')
    await expect(arena).toHaveAttribute('data-variant', sample.variant)
    await expect(page.getByLabel(`Challenge variant: ${sample.label}`)).toBeVisible()
    await expect(page.locator(`.game-gate--${sample.variant}`).first()).toBeVisible()
  })
}

test('pause, accessibility settings, and control remapping are operable dialogs', async ({ page }) => {
  await openReadyRun(page)

  await page.getByRole('button', { name: /pause game/i }).click()
  const pauseDialog = page.getByRole('dialog', { name: /run paused/i })
  await expect(pauseDialog).toBeVisible()
  await pauseDialog.getByRole('button', { name: /resume run/i }).click()

  await page.getByRole('button', { name: /open game settings/i }).click()
  const settings = page.getByRole('dialog', { name: /game accessibility/i })
  await expect(settings).toBeVisible()
  await settings.getByLabel(/reduced motion/i).check()
  await expect(page.locator('.sound-gates-game')).toHaveClass(/sound-gates-game--reduced-motion/)
  await settings.getByLabel('Move left key').selectOption('KeyJ')
  await settings.getByRole('button', { name: 'Done' }).click()
  await expect(settings).toBeHidden()
})

test.describe('mobile touch layout', () => {
  test.use({ viewport: { width: 360, height: 780 }, hasTouch: true })

  test('keeps Nomi and the virtual pad visible without horizontal page overflow', async ({ page }) => {
    await openReadyRun(page)
    await expect(page.locator('.player-mascot')).toBeVisible()
    await expect(page.getByRole('group', { name: /touch controls/i })).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    await playUntilInputUnlocks(page)
    await page.getByRole('button', { name: /move right/i }).click()
    await expect(page.locator('.game-gate').nth(1)).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('button', { name: /commit selected answer/i }).click()
    await expect(page.locator('.result-presentation')).toBeVisible()
  })
})
