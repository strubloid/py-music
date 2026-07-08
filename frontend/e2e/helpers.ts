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

export const loginSharedUser = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('button', { name: /sign in \/ register/i }).click();
  await page.getByPlaceholder('Email').fill(SHARED_USER.email);
  await page.getByPlaceholder('Password').fill(SHARED_USER.password);

  const loginPromise = page.waitForResponse(
    (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
  );
  await page.locator('.login-form .submit-btn').click();
  const loginRes = await loginPromise;

  if (!loginRes.ok()) {
    // User doesn't exist yet — register via CSRF-exempt API
    const reg = await page.request.post('/api/auth/register', { data: SHARED_USER });
    if (![201, 409].includes(reg.status())) {
      throw new Error(`Unexpected register status: ${reg.status()}`);
    }
    // Retry login via form (reg sets session for 201, but React doesn't know)
    await page.goto('/');
    await page.getByRole('button', { name: /sign in \/ register/i }).click();
    await page.getByPlaceholder('Email').fill(SHARED_USER.email);
    await page.getByPlaceholder('Password').fill(SHARED_USER.password);
    const retry = page.waitForResponse(
      (r) => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
    );
    await page.locator('.login-form .submit-btn').click();
    const r2 = await retry;
    if (!r2.ok()) throw new Error(`Login failed: ${await r2.text()}`);
  }

  // Logged in (level 1). Award XP via page-context fetch (handles CSRF natively).
  await page.evaluate(async (amount) => {
    const getCookie = (n: string) => {
      const m = document.cookie.match(new RegExp('(^| )' + n + '=([^;]+)'));
      return m ? decodeURIComponent(m[2]) : null;
    };
    const csrf = getCookie('csrf_token');
    await fetch('/api/me/xp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRFToken': csrf } : {}) },
      body: JSON.stringify({ amount }),
    });
  }, 250);

  // Reload once to pick up level 3 in React state
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
