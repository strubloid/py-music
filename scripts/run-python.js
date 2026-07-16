#!/usr/bin/env node

const { spawnSync } = require('node:child_process')
const { existsSync } = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const candidates = [
  process.env.PYTHON,
  path.join(root, 'venv', 'bin', 'python'),
  path.join(root, '.venv', 'bin', 'python'),
  'python3',
  'python',
].filter(Boolean)

for (const command of candidates) {
  if (command.includes(path.sep) && !existsSync(command)) continue

  const probe = spawnSync(command, ['--version'], { stdio: 'ignore' })
  if (probe.error || probe.status !== 0) continue

  const result = spawnSync(command, process.argv.slice(2), {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
  })
  if (result.error) {
    console.error(`Failed to run ${command}: ${result.error.message}`)
    process.exit(1)
  }
  process.exit(result.status ?? 1)
}

console.error('No working Python interpreter found. Set PYTHON or create .venv/venv.')
process.exit(1)
