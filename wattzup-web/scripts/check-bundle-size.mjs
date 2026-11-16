// Fails the build when the initial bundle exceeds the 300 KB gzipped budget (AGENTS.md).
// Angular's own budgets measure raw bytes, so they stay as an early warning only.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMIT = 300 * 1024;
const dir = 'dist/wattzup-web/browser';
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const files = [
  ...html.matchAll(/<script[^>]+src="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+rel="(?:stylesheet|modulepreload)"[^>]+href="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+href="([^"]+)"[^>]+rel="(?:stylesheet|modulepreload)"/g),
]
  .map((m) => m[1])
  .filter((f, i, all) => !f.startsWith('http') && all.indexOf(f) === i);
let total = 0;
for (const file of files) {
  const size = gzipSync(readFileSync(join(dir, file))).length;
  total += size;
  console.log(`${file.padEnd(32)} ${(size / 1024).toFixed(1)} KB gzipped`);
}
console.log(`Initial total ${(total / 1024).toFixed(1)} KB gzipped (budget 300 KB)`);
if (total > LIMIT) {
  console.error('Initial bundle exceeds the 300 KB gzipped budget.');
  process.exit(1);
}
