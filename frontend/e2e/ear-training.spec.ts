import { expect, test } from '@playwright/test';
import { answerCapturedChallenge, captureChallengeResponse, loginSharedUser } from './helpers';

test('ear training shows live XP preview and final breakdown when powers reduce reward', async ({ page }) => {
  await loginSharedUser(page);
  const challenge = await captureChallengeResponse(page, '/play/ear-training');

  await expect(page.getByText(`Base +${challenge.xp_reward} XP`)).toBeVisible();
  await page.getByRole('button', { name: /remove one option/i }).click();
  await expect(page.getByText('-10 XP')).toBeVisible();
  await expect(page.getByText(`Current reward ${Math.max(1, challenge.xp_reward - 10)} XP`)).toBeVisible();

  await answerCapturedChallenge(page, challenge);
  await expect(page.getByText('-10 XP penalties')).toBeVisible();
  await expect(page.getByText(/Correct\./i)).toBeVisible();
  await expect(page.getByText(new RegExp(`= ${Math.max(1, challenge.xp_reward + 8 - 10)} XP`))).toBeVisible();
});
