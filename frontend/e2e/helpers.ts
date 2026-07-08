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

const registerWithRetry = async (page: Page) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await page.request.post('/api/auth/register', { data: SHARED_USER });
    if (res.status() === 429) {
      await page.waitForTimeout(2000 * (attempt + 1)); // backoff: 2s, 4s, 6s, 8s
      continue;
    }
    if (![201, 409].includes(res.status())) {
      throw new Error(`Unexpected register status: ${res.status()}`);
    }
    return res;
  }
  throw new Error('Register rate limited after 5 retries');
};

const loginViaForm = async (page: Page) => {
  await page.getByPlaceholder('Email').fill(SHARED_USER.email);
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
  let loginRes = await loginViaForm(page);

  if (!loginRes.ok()) {
    await registerWithRetry(page);
    // Session might be set (201). Reload so React picks it up, then login.
    await page.goto('/');
    await page.getByRole('button', { name: /sign in \/ register/i }).click();
    loginRes = await loginViaForm(page);
    if (!loginRes.ok()) throw new Error(`Login failed: ${await loginRes.text()}`);
  }

  // Logged in (level 1). Award XP via page-context fetch (handles CSRF natively).
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
