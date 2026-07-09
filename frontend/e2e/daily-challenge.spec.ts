import { expect, test } from '@playwright/test';
import { answerCapturedChallenge, captureChallengeResponse, escapeForRegex, loginSharedUser } from './helpers';

test('daily challenge shows XP penalty preview and breakdown for remove one option', async ({ page }) => {
  await loginSharedUser(page);
  const challenge = await captureChallengeResponse(page, '/play/daily');

  await expect(page.getByText(`Base +${challenge.xp_reward} XP`)).toBeVisible();
  await page.getByRole('button', { name: /remove one option/i }).click();
  await expect(page.getByText('-10 XP').first()).toBeVisible();
  await expect(page.getByText(`Current reward ${Math.max(1, challenge.xp_reward - 10)} XP`)).toBeVisible();

  const correctOption = await answerCapturedChallenge(page, challenge);
  await expect(page.getByText(new RegExp(`= ${Math.max(1, challenge.xp_reward + 8 - 10)} XP`))).toBeVisible();
  await expect(page.getByText('-10 XP penalties')).toBeVisible();
  await expect(page.getByText(new RegExp(`the answer was|Perfect groove|Nice hit`, 'i'))).toBeVisible();
  await expect(page.getByText(new RegExp(`^${escapeForRegex(correctOption)}$`))).toBeVisible();
});

test('daily challenge streak is consistent between page header and user badge dropdown after completion', async ({ page }) => {
  await loginSharedUser(page);
  const challenge = await captureChallengeResponse(page, '/play/daily');

  await answerCapturedChallenge(page, challenge);
  await expect(page.getByText(/2 day streak/i)).toBeVisible();

  await page.locator('.badge-trigger').click();
  await expect(page.getByText(/2 day/i).first()).toBeVisible();
});
