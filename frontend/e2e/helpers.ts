import { expect, Page } from '@playwright/test';

const SHARED_USER = {
  username: 'e2e-shared-player',
  email: 'e2e-shared-player@example.com',
  password: 'Unbroken!SharedTune987',
};

export const createUser = async (page: Page, suffix: string) => {
  const email = `e2e-${suffix}@example.com`;
  const username = `e2e-${suffix}`;
  const password = `Unbroken!${suffix}Tune9`;

  await page.goto('/');
  await page.getByRole('button', { name: /sign in \/ register/i }).click();
  await page.getByRole('button', { name: /sign up/i }).click();
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.locator('.badge-trigger')).toBeVisible();

  return { username, email, password };
};

const registerWithRetry = async (page: Page): Promise<boolean> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    // Use the UI registration form instead of direct API call
    // to ensure session cookies are properly set in the browser context.
    await page.goto('/');
    await page.getByRole('button', { name: /sign in \/ register/i }).click();
    await page.getByRole('button', { name: /sign up/i }).click();
    await page.getByPlaceholder('Username').fill(SHARED_USER.username);
    await page.getByPlaceholder(/email/i).fill(SHARED_USER.email);
    await page.getByPlaceholder('Password').fill(SHARED_USER.password);

    const resPromise = page.waitForResponse(
      (r) => r.url().includes('/api/auth/register') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /create account/i }).click();
    const res = await resPromise;

    if (res.status() === 429) {
      await page.waitForTimeout(2000 * (attempt + 1));
      continue;
    }
    if (res.status() === 201) return true;
    if (res.status() === 409) return false; // already exists
    throw new Error(`Unexpected register status: ${res.status()}`);
  }
  throw new Error('Register rate limited after 5 retries');
};

const loginViaForm = async (page: Page) => {
  await page.getByPlaceholder(/email/i).fill(SHARED_USER.email);
  await page.getByPlaceholder('Password').fill(SHARED_USER.password);
  const p = page.waitForResponse(
    (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
  );
  await page.locator('.login-form .submit-btn').click();
  return await p;
};

export const loginSharedUser = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign in \/ register/i }).click();
  const loginRes = await loginViaForm(page);

  if (!loginRes.ok()) {
    // User doesn't exist yet — register via UI (logs in automatically on success)
    const registered = await registerWithRetry(page);
    if (!registered) {
      // User already existed (409) — log in via form
      await page.goto('/');
      await page.getByRole('button', { name: /sign in \/ register/i }).click();
      await loginViaForm(page);
    }
  }

  // Wait for login to settle in the UI
  await expect(page.locator('.badge-trigger')).toBeVisible();

  // Award XP via page-context fetch (handles CSRF natively).
  await page.evaluate(async (amount) => {
    const g = (n: string) => {
      const m = document.cookie.match(new RegExp('(^| )' + n + '=([^;]+)'));
      return m ? decodeURIComponent(m[2]) : null;
    };
    const csrf = g('csrf_token');
    await fetch('/api/me/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRFToken': csrf } : {}) },
      body: JSON.stringify({ amount }),
    });
  }, 250);

  // Reload to pick up level 3 in React state
  await page.goto('/');
  await expect(page.locator('.badge-trigger')).toBeVisible();
  return SHARED_USER;
};

const PATH_BUTTON_LABEL: Record<string, RegExp> = {
  '/play/daily': /^challenges$/i,
  '/play/ear-training': /^ear training$/i,
};

export const captureChallengeResponse = async (page: Page, path: string) => {
  const challengeResponsePromise = page.waitForResponse((response) => (
    response.url().includes('/api/daily-challenges') && response.request().method() === 'GET'
  ));

  const buttonLabel = PATH_BUTTON_LABEL[path];
  if (buttonLabel) {
    await page.getByRole('button', { name: buttonLabel }).click();
  } else {
    await page.goto(path);
  }

  const response = await challengeResponsePromise;
  const data = await response.json();
  return data.challenges?.[0];
};

export const answerCapturedChallenge = async (page: Page, challenge: any) => {
  const correctOption = challenge.options[challenge.correct_index];
  await page.getByRole('button', { name: new RegExp(`^${escapeForRegex(correctOption)}$`) }).click();
  return correctOption;
};

export const escapeForRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
