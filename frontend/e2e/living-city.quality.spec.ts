import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WORLD_ROUTES = ['/', '/play/ear-training', '/play/scales', '/play/learn-scales', '/play/quests'];

for (const route of WORLD_ROUTES) {
  test(`automated accessibility has no critical or serious violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const blocking = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact || ''));
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
  });
}

test('all Living City routes remain inside compact mobile and reference desktop widths', async ({ page }) => {
  const viewports = [
    { width: 320, height: 720 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of WORLD_ROUTES) {
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
      expect(dimensions.scroll, `${route} overflowed at ${viewport.width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
    }
  }
});

test('minimal motion removes travel displacement but preserves immediate navigation controls', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('strubloid:motion-profile', 'minimal'));
  await page.goto('/');
  await page.getByRole('button', { name: /quest vaults.*enter district/i }).click();
  const travel = page.getByRole('status').filter({ hasText: /quest vaults/i });
  await expect(travel).toBeVisible();
  await expect(travel.locator('.district-travel__pip')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: /skip travel/i }).click();
  await expect(page).toHaveURL(/\/play\/quests$/);
});

test('core world routes emit no browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of WORLD_ROUTES) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
  }
  expect(errors).toEqual([]);
});
