#!/usr/bin/env node
/**
 * check-all-errors — full project error scan.
 *
 * Runs every available static check across the backend (Python) and frontend
 * (TypeScript / React). Exits non-zero if any check fails so CI can use it as
 * a single gate.
 *
 * Usage:
 *   npm run check-all-errors
 *
 * Individual checks (also available individually):
 *   npm run check:backend         — pyright on the backend (pyrightconfig.json)
 *   npm run check:backend:compile — py_compile every backend .py file
 *   npm run check:frontend        — eslint on the frontend
 *   npm run check:frontend:types  — tsc --noEmit on the frontend
 *   npm run check:frontend:build  — vite build (catches type + import issues)
 *   npm run check:backend:tests   — python unit tests
 */

const { spawnSync } = require('node:child_process');

const root = __dirname.replace(/scripts$/, '');

const checks = [
  {
    name: 'backend: py_compile',
    cmd: 'python',
    args: ['-c', `import compileall, sys; sys.exit(0 if compileall.compile_dir('${root}backend/project', quiet=1, maxlevels=20) else 1)`],
    cwd: root,
  },
  {
    name: 'backend: pyright',
    cmd: 'pyright',
    args: ['-p', 'pyrightconfig.json'],
    cwd: root,
  },
  {
    name: 'frontend: eslint',
    cmd: 'npm',
    args: ['--prefix', 'frontend', 'run', 'lint'],
    cwd: root,
  },
  {
    name: 'frontend: tsc --noEmit',
    cmd: `${root}frontend/node_modules/.bin/tsc`,
    args: ['--noEmit'],
    cwd: `${root}frontend`,
  },
  {
    name: 'frontend: vite build',
    cmd: 'npm',
    args: ['--prefix', 'frontend', 'run', 'build'],
    cwd: root,
  },
];

let failed = 0;
let passed = 0;

for (const check of checks) {
  process.stdout.write(`\n▶ ${check.name}\n`);
  const result = spawnSync(check.cmd, check.args, {
    cwd: check.cwd,
    stdio: 'inherit',
  });
  if (result.error) {
    process.stdout.write(`  ⚠️  ${check.cmd} is not installed: ${result.error.message}\n`);
    failed += 1;
    continue;
  }
  if (result.status !== 0) {
    process.stdout.write(`  ❌ ${check.name} failed (exit ${result.status})\n`);
    failed += 1;
  } else {
    process.stdout.write(`  ✅ ${check.name}\n`);
    passed += 1;
  }
}

process.stdout.write(`\n────────────────────────────────────────\n`);
process.stdout.write(`Passed: ${passed}  Failed: ${failed}\n`);
process.exit(failed === 0 ? 0 : 1);
