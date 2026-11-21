#!/usr/bin/env node
// Compares two performance sweep reports (#676): the median and p95 frame times of each scene
// and tier, before and after, with a mark on every one more than 10 % slower. For comparing two
// runs on one machine; nothing in CI runs it.
//
//   node scripts/compare-performance.mjs performance-reports/<before>.json performance-reports/<after>.json
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Slower than this fraction counts as a regression. */
const REGRESSION = 0.1;

const ms = (v) => (typeof v === 'number' ? v.toFixed(1) : 'n/a');

/** `a → b (±d %)`, and whether b is more than 10 % slower than a. */
function delta(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number' || a === 0) {
    return { text: `${ms(a)} → ${ms(b)}`, worse: false };
  }
  const change = (b - a) / a;
  const sign = change >= 0 ? '+' : '−';
  return {
    text: `${ms(a)} → ${ms(b)} (${sign}${Math.abs(change * 100).toFixed(1)} %)`,
    worse: change > REGRESSION + 1e-9,
  };
}

/** A Markdown table of the deltas between two reports, one row per scene and tier. */
export function compare(before, after) {
  const key = (r) => `${r.scene}\u0000${r.tier}`;
  const first = new Map(before.results.map((r) => [key(r), r]));
  const second = new Map(after.results.map((r) => [key(r), r]));
  const rows = [
    `Comparing ${before.createdAt} with ${after.createdAt}.`,
    '',
    '| Scene | Tier | Median frame (ms) | p95 frame (ms) | |',
    '|---|---|---|---|---|',
  ];
  for (const k of new Set([...first.keys(), ...second.keys()])) {
    const a = first.get(k);
    const b = second.get(k);
    const { scene, tier } = a ?? b;
    if (!a || !b) {
      rows.push(`| ${scene} | ${tier} | only in the ${a ? 'first' : 'second'} run | | |`);
      continue;
    }
    const median = delta(a.medianMs, b.medianMs);
    const p95 = delta(a.p95Ms, b.p95Ms);
    const mark = median.worse || p95.worse ? 'regression' : '';
    rows.push(`| ${scene} | ${tier} | ${median.text} | ${p95.text} | ${mark} |`);
  }
  return rows.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [beforeFile, afterFile] = process.argv.slice(2);
  if (!beforeFile || !afterFile) {
    console.error('Usage: node scripts/compare-performance.mjs <before.json> <after.json>');
    process.exit(2);
  }
  const read = (f) => JSON.parse(readFileSync(f, 'utf8'));
  console.log(compare(read(beforeFile), read(afterFile)));
}
