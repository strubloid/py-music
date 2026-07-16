import { expect, test } from '@playwright/test';
import { answerCapturedChallenge, captureChallengeResponse, createUser } from './helpers';

test('Quest Vaults opens from three chamber doors into eighteen milestone objects', async ({ page }) => {
  await page.goto('/play/quests');

  const doors = page.locator('.vault-door');
  await expect(doors).toHaveCount(3);
  await expect(page.getByRole('region', { name: /quest vault chamber/i })).toBeVisible();
  await expect(page.getByLabel(/Pip waits at the centre/i)).toBeVisible();
  await expect(page.getByLabel(/Vault Keeper watches/i)).toBeVisible();

  await page.getByRole('button', { name: /open milestone vault/i }).click();
  await expect(page.getByRole('heading', { name: 'Milestone Vault' })).toBeVisible();
  await expect(page.locator('.mission-object')).toHaveCount(18);
  await expect(page.getByText('10,000 XP in the full vault')).toBeVisible();
  await expect(page.locator('.mission-seals').first()).toHaveAttribute('aria-label', /0 of 1 complete/);
});

test('a real completed mission releases server-authoritative seals only once', async ({ page }) => {
  await createUser(page, `vault-${Date.now()}`);
  const challenge = await captureChallengeResponse(page, '/play/daily');
  await answerCapturedChallenge(page, challenge);
  await expect(page.getByRole('dialog', { name: 'Correct answer' })).toBeVisible();

  await page.goto('/play/quests');
  const keepTraining = page.getByRole('button', { name: /keep training/i });
  await expect(keepTraining).toBeVisible();
  await keepTraining.click();
  await page.getByRole('button', { name: /open daily vault/i }).click();
  const release = page.getByRole('button', { name: /claim reward: 1-move warm-up/i });
  await expect(release).toBeVisible();

  const claimResponse = page.waitForResponse(
    (response) => response.url().includes('/api/me/quest-claim') && response.request().method() === 'POST',
  );
  await release.click();
  expect((await claimResponse).ok()).toBe(true);
  await expect(page.getByRole('dialog', { name: /1-move warm-up/i })).toBeVisible();
  await page.getByRole('button', { name: /keep exploring/i }).click();
  await expect(page.getByRole('button', { name: /claimed: 1-move warm-up/i })).toBeDisabled();

  await page.reload();
  await page.getByRole('button', { name: /open daily vault/i }).click();
  await expect(page.getByRole('button', { name: /claimed: 1-move warm-up/i })).toBeDisabled();
});

test.describe('mobile vault chamber', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('keeps all three doors reachable without horizontal overflow', async ({ page }) => {
    await page.goto('/play/quests');
    await expect(page.locator('.vault-door')).toHaveCount(3);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport + 1);
    await expect(page.getByRole('button', { name: /open milestone vault/i })).toBeVisible();
  });
});
