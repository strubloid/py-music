import { test, expect } from '@playwright/test';
import { createUser } from './helpers';

test('user can register and logout from the app shell', async ({ page }) => {
  const suffix = `${Date.now()}`;
  await createUser(page, suffix);

  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page.getByRole('button', { name: /sign in \/ register/i })).toBeVisible();
});
