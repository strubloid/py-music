#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const rootPackage = require(path.join(root, 'package.json'));
const frontendPackage = require(path.join(root, 'frontend/package.json'));
const tsconfig = JSON.parse(fs.readFileSync(path.join(root, 'frontend/tsconfig.json'), 'utf8'));

const failures = [];

if (rootPackage.scripts?.['check:frontend:types'] !== 'npm --prefix frontend run typecheck') {
  failures.push('check:frontend:types must delegate to the frontend typecheck script');
}

if (frontendPackage.scripts?.typecheck !== 'tsc --noEmit --project tsconfig.json') {
  failures.push('frontend typecheck must explicitly load frontend/tsconfig.json');
}

if (!Array.isArray(tsconfig.include) || !tsconfig.include.includes('src')) {
  failures.push('frontend/tsconfig.json must include the src directory');
}

if (failures.length > 0) {
  for (const failure of failures) {
    process.stderr.write(`Tooling configuration error: ${failure}\n`);
  }
  process.exit(1);
}

process.stdout.write('Tooling configuration is valid.\n');