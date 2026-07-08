import { expect, test } from '@playwright/test';
import { loginSharedUser } from './helpers';

test('debug daily challenge', async ({ page }) => {
  const user = await loginSharedUser(page);
  
  // Navigate to daily challenges
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/daily-challenges') && r.request().method() === 'GET'
  );
  await page.getByRole('button', { name: /^challenges$/i }).click();
  const response = await responsePromise;
  const data = await response.json();
  
  console.log('=== API RESPONSE ===');
  console.log('challenges count:', data.challenges?.length);
  if (data.challenges?.[0]) {
    console.log('first challenge:', JSON.stringify(data.challenges[0], null, 2));
  }
  
  // Wait for the page to render
  await page.waitForTimeout(3000);
  
  // Read the displayed XP
  const xpBase = await page.locator('.daily-xp-base').textContent();
  console.log('Displayed XP base:', xpBase);
  
  // Read all option button texts
  const options = await page.locator('.challenge-option').allTextContents();
  console.log('Displayed options:', options);
  
  // Check page URL
  console.log('Page URL:', page.url());
  console.log('Page title:', await page.title());
});
