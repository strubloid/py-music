import { expect, test } from '@playwright/test'
import { answerCapturedChallenge, captureChallengeResponse, createUser, escapeForRegex } from './helpers'

test('daily challenge uses Nomi gates and awards the authoritative 10x reward', async ({ page }) => {
  await createUser(page, `reward-${Date.now()}`)
  const challenge = await captureChallengeResponse(page, '/play/daily')

  await expect(page.getByText(`Base +${challenge.xp_reward} XP`)).toBeVisible()
  await expect(page.getByText(`Current reward ${challenge.xp_reward} XP`)).toBeVisible()
  expect(challenge.xp_reward).toBeGreaterThanOrEqual(100)
  await expect(page.locator('.challenge-nomi-track .nomi')).toBeVisible()

  const correctOption = challenge.options[challenge.correct_index]
  await expect(page.getByRole('radio', { name: new RegExp(`^${escapeForRegex(correctOption)}$`) })).toBeVisible()
  await answerCapturedChallenge(page, challenge)
  await expect(page.getByRole('dialog', { name: 'Correct answer' })).toBeVisible()
  await expect(page.getByText(new RegExp(`= ${challenge.xp_reward} XP`))).toBeVisible()
  await expect(page.getByText(new RegExp(`the answer was|Perfect groove|Nice hit`, 'i'))).toBeVisible()
  await page.getByRole('dialog', { name: 'Correct answer' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('daily challenge streak is consistent between page header and user badge dropdown after completion', async ({
  page,
}) => {
  await createUser(page, `streak-${Date.now()}`)
  const challenge = await captureChallengeResponse(page, '/play/daily')

  await answerCapturedChallenge(page, challenge)
  await page.getByRole('dialog', { name: 'Correct answer' }).click()
  const streakLabel = page.getByText(/\d+ day streak/i).first()
  await expect(streakLabel).toBeVisible()
  const streakText = await streakLabel.textContent()
  const streakDays = streakText?.match(/\d+/)?.[0]
  expect(streakDays).toBeTruthy()

  const keepTraining = page.getByRole('button', { name: /keep training/i })
  await expect(keepTraining).toBeVisible()
  await keepTraining.click()
  await page.locator('.badge-trigger').click()
  await expect(page.getByText(new RegExp(`${streakDays} day`, 'i')).first()).toBeVisible()
})
