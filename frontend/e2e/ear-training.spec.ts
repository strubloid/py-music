import { expect, test, type Page } from '@playwright/test';

const openReadyRun = async (page: Page) => {
  await page.goto('/play/ear-training');
  await expect(page.getByRole('heading', { name: 'Sound Gates' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
  await expect(page.locator('.note-runner__rank')).toContainText('Unranked');
  await expect(page.locator('.note-runner__rank')).toContainText('Lv. 1/10');
};

const playUntilInputUnlocks = async (page: Page) => {
  const play = page.getByRole('button', { name: /start .* musical question/i });
  await play.click();
  await expect(page.locator('.answer-gate').first()).toBeEnabled({ timeout: 20_000 });
};

test('Sound Gates is keyboard playable, locks input during audio, and exposes feedback', async ({ page }) => {
  await openReadyRun(page);

  const gates = page.locator('.answer-gate');
  await expect(gates).toHaveCount(await gates.count());
  expect(await gates.count()).toBeGreaterThanOrEqual(2);
  await expect(gates.first()).toBeDisabled();

  await playUntilInputUnlocks(page);
  await page.keyboard.press('ArrowRight');
  await expect(gates.nth(1)).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');

  await expect(page.locator('.round-feedback')).toBeVisible();
  await expect(page.getByRole('button', { name: /compare/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /next gate/i })).toBeVisible();
  await expect(page.locator('[aria-live="polite"]')).not.toHaveText('');
});

test('pause, accessibility settings, and control remapping are operable dialogs', async ({ page }) => {
  await openReadyRun(page);

  await page.getByRole('button', { name: /pause game/i }).click();
  const pauseDialog = page.getByRole('dialog', { name: /run paused/i });
  await expect(pauseDialog).toBeVisible();
  await pauseDialog.getByRole('button', { name: /resume run/i }).click();

  await page.getByRole('button', { name: /open game settings/i }).click();
  const settings = page.getByRole('dialog', { name: /game accessibility/i });
  await expect(settings).toBeVisible();
  await settings.getByLabel(/reduced motion/i).check();
  await expect(page.locator('.note-runner')).toHaveClass(/note-runner--reduced-motion/);
  await settings.getByLabel('Move left key').selectOption('KeyJ');
  await settings.getByRole('button', { name: 'Done' }).click();
  await expect(settings).toBeHidden();
});

test.describe('mobile touch layout', () => {
  test.use({ viewport: { width: 360, height: 780 }, hasTouch: true });

  test('keeps Nomi and the virtual pad visible without horizontal page overflow', async ({ page }) => {
    await openReadyRun(page);
    await expect(page.locator('.nomi')).toBeVisible();
    await expect(page.getByRole('group', { name: /touch controls/i })).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await playUntilInputUnlocks(page);
    await page.getByRole('button', { name: /move right/i }).click();
    await expect(page.locator('.answer-gate').nth(1)).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: /commit selected answer/i }).click();
    await expect(page.locator('.round-feedback')).toBeVisible();
  });
});
