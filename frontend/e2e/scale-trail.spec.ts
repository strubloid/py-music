import { expect, test } from '@playwright/test'
import { createUser } from './helpers'

test('Scale Trail rolls six or seven movements and preserves progress while changing instruments', async ({ page }) => {
  await createUser(page, `scale-trail-${Date.now()}`)
  await page.goto('/play/scales')

  await expect(page.getByRole('heading', { name: /choose your path through the instrument gardens/i })).toBeVisible()
  const runResponse = page.waitForResponse(
    (response) => response.url().includes('/api/scale-path/run') && response.request().method() === 'GET',
  )
  await page.getByRole('button', { name: /piano garden/i }).click()
  const run = await (await runResponse).json()
  await expect(page.locator('.musical-die')).toBeVisible()
  await expect(page.locator('.living-scale-trail')).toBeVisible({ timeout: 15_000 })

  const progressNodes = page.locator('.trail-progress i')
  const count = await progressNodes.count()
  expect([6, 7]).toContain(count)
  expect(run.fragments).toHaveLength(count)
  for (let index = 1; index < run.fragments.length; index += 1) {
    const previousLanding = run.fragments[index - 1].candidates.find(
      (candidate) =>
        candidate.string === run.fragments[index].anchor.string && candidate.fret === run.fragments[index].anchor.fret,
    )
    expect(previousLanding).toEqual(run.fragments[index].anchor)
    expect(run.fragments[index].root).toBe(run.root)
    expect(run.fragments[index].mode).toBe(run.mode)
  }
  for (const fragment of run.fragments) {
    expect(new Set(fragment.candidates.map((candidate) => candidate.pitch)).size).toBe(fragment.candidates.length)
  }
  await expect(page.getByText(`Move 1 of ${count}`, { exact: true })).toBeVisible()
  await expect(page.locator('.mission-step--key')).toContainText(`${run.root} ${run.mode}`)
  await expect(page.locator('.mission-step--start')).toContainText(run.fragments[0].anchor.note)
  await expect(page.locator('.mission-step--degree')).toContainText(`Degree ${run.fragments[0].degreeClue}`)
  await expect(page.locator('.mission-step--answer strong')).toHaveText('Pick a note')

  const legalKey = page.locator('.piano-keyboard .pk-key-legal').first()
  await expect(legalKey).toBeEnabled()
  await expect(legalKey).not.toHaveText('')
  await expect(page.locator('.piano-keyboard .pk-key-start')).not.toHaveText('')
  let completionRequestCount = 0
  page.on('request', (request) => {
    if (request.url().includes('/api/scale-path/complete') && request.method() === 'POST') {
      completionRequestCount += 1
    }
  })
  const completionResponse = page.waitForResponse(
    (response) => response.url().includes('/api/scale-path/complete') && response.request().method() === 'POST',
  )
  await legalKey.evaluate((element) => {
    const button = element as HTMLButtonElement
    button.click()
    button.click()
  })
  const completion = await (await completionResponse).json()
  expect(completionRequestCount).toBe(1)
  await expect(page.locator('.trail-feedback')).toBeVisible()
  await expect(page.locator('.piano-keyboard .pk-key-correct')).toHaveCount(1)
  if (!completion.correct) await expect(page.locator('.piano-keyboard .pk-key-wrong')).toHaveCount(1)
  await expect(page.getByText(`Move 2 of ${count}`, { exact: true })).toBeVisible({ timeout: 8_000 })

  await page.getByRole('button', { name: /^guitar$/i }).click()
  await expect(page.getByText(`Move 2 of ${count}`, { exact: true })).toBeVisible()
  await expect(page.locator('.fretboard-container')).toBeVisible()
  const legalFrets = page.locator('.fretboard-container .pk-fret-button.pk-key-legal')
  await expect(legalFrets).toHaveCount(run.fragments[1].candidates.length)
  await expect(legalFrets.first().locator('.note-dot')).not.toHaveText('')
  await expect(page.locator('.fretboard-container .pk-key-start .note-dot')).not.toHaveText('')
  const legalFret = legalFrets.first()
  await expect(legalFret).toBeEnabled()
  await legalFret.click()
  await expect(page.getByText(`Move 3 of ${count}`, { exact: true })).toBeVisible({ timeout: 8_000 })
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
  await expect(page.locator('.fretboard-container')).toBeVisible()
})
