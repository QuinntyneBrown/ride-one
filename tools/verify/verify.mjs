#!/usr/bin/env node
// Builds and checks everything CI checks, as fast as this machine allows: the backend (build, unit and
// acceptance tests) and the frontend (install, format, lint, unit tests, production build with its budget, then
// the Playwright behaviour specs) run side by side, and within the frontend the checks that share no output run
// at once. Prints each step's time and the total; exits non-zero on the first failure, with that step's output.
//
//   node tools/verify/verify.mjs            # everything
//   node tools/verify/verify.mjs --backend  # only the backend
//   node tools/verify/verify.mjs --frontend # only the frontend
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const frontend = join(root, 'frontend');
const args = new Set(process.argv.slice(2));
const only = args.has('--backend') ? 'backend' : args.has('--frontend') ? 'frontend' : null;
const started = performance.now();
const seconds = (from) => ((performance.now() - from) / 1000).toFixed(1).padStart(6) + 's';

function step(name, command, cwd = root) {
  const from = performance.now();
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd, shell: true, env: { ...process.env, FORCE_COLOR: '0' } });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`${seconds(from)}  ${name}`);
        resolve();
      } else {
        console.error(`\n✘ ${name} failed (exit ${code}):\n${output}`);
        reject(new Error(name));
      }
    });
  });
}

/** npm ci only when package-lock.json changed since the last install this script made. */
async function install() {
  const lock = readFileSync(join(frontend, 'package-lock.json'));
  const hash = createHash('sha256').update(lock).digest('hex');
  const stamp = join(frontend, 'node_modules', '.verify-lock-hash');
  if (existsSync(stamp) && readFileSync(stamp, 'utf8') === hash) {
    console.log('   0.0s  npm ci (package-lock.json unchanged, skipped)');
    return;
  }
  await step('npm ci', 'npm ci --no-audit --no-fund', frontend);
  writeFileSync(stamp, hash);
}

const backend = async () => {
  await step('dotnet build', 'dotnet build backend/Wattzup.sln');
  await step('dotnet test', 'dotnet test backend/Wattzup.sln --no-build');
};

const web = async () => {
  await install();
  await Promise.all([
    step('format', 'npm run format:check', frontend),
    step('lint', 'npm run lint', frontend),
    step('unit tests', 'npm test', frontend),
    (async () => {
      await step('production build and budget', 'npm run build', frontend);
      await step('browser edition build and budget', 'npm run build:browser', frontend);
      await step('behaviour specs', 'npm run e2e', frontend);
    })(),
  ]);
};

try {
  await Promise.all([only !== 'frontend' && backend(), only !== 'backend' && web()].filter(Boolean));
  console.log(`${seconds(started)}  TOTAL — everything passed`);
} catch {
  console.error(`${seconds(started)}  TOTAL — failed`);
  process.exit(1);
}
