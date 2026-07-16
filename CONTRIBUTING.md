# Contributing

## Required local validation

This repository contains a Flask/Python backend and a React/Vite/TypeScript frontend. Install Python development dependencies and frontend dependencies before validating:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
npm --prefix frontend ci
npx --prefix frontend playwright install chromium
```

Backend authentication tests require a strong test-only `TEST_PASSWORD`. Store it in your local `.env` or export it for the validation process. CI generates an ephemeral value and does not require a repository secret.

Run the complete fail-fast validation gate from the repository root:

```bash
npm run validate
```

No task, pull request, or coding-agent run should be marked complete until this command passes. The command runs TypeScript and Python type checks, linting, formatting validation, unit and integration/E2E tests, coverage generation, the production and Storybook builds, Python compilation, and dependency audits.

Useful focused commands:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:coverage
npm run build
npm run audit
```

## Dependency updates

CI only validates dependencies and never edits manifests or lockfiles. Review safe updates locally:

```bash
npm --prefix frontend audit
npm --prefix frontend audit fix --dry-run
npm --prefix frontend audit fix
npm --prefix frontend ci
npm run validate
```

Do not run `npm audit fix --force` in CI. Forced fixes and major-version upgrades require human review of the manifest and lockfile diff followed by the complete validation gate. In particular, npm can propose a downgrade that removes one advisory while introducing peer conflicts or other vulnerabilities.

## Secrets

Never commit `.env`, credentials, production database URLs, API keys, SMTP passwords, or Fly.io secrets. Production values such as `SECRET_KEY`, `DATABASE_URL`, `FRONTEND_URL`, LLM provider keys, and SMTP credentials belong in Fly.io or GitHub Actions secrets only when a workflow genuinely needs them. The validation workflow uses SQLite and local fallbacks and does not require production secrets.
