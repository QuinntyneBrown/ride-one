// Unit tests for compare-performance.mjs (#676): `node --test scripts/`.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare } from './compare-performance.mjs';

const run = (results) => ({ createdAt: '2026-11-20T00:00:00Z', results });
const row = (scene, tier, medianMs, p95Ms) => ({ scene, tier, medianMs, p95Ms });

test('prints median and p95 deltas per scene and tier', () => {
  const table = compare(
    run([row('oldtown', 'low', 10, 20)]),
    run([row('oldtown', 'low', 10.5, 19)]),
  );
  assert.match(
    table,
    /\| oldtown \| low \| 10\.0 → 10\.5 \(\+5\.0 %\) \| 20\.0 → 19\.0 \(−5\.0 %\) \|  \|/,
  );
});

test('marks a median or p95 more than 10 % slower as a regression', () => {
  const table = compare(
    run([row('oldtown', 'low', 10, 20), row('coast', 'high', 10, 20)]),
    run([row('oldtown', 'low', 11.5, 20), row('coast', 'high', 10, 22.5)]),
  );
  const lines = table.split('\n');
  assert.match(lines.find((l) => l.includes('oldtown')) ?? '', /regression/);
  assert.match(lines.find((l) => l.includes('coast')) ?? '', /regression/);
});

test('a speed-up or exactly 10 % slower is no regression', () => {
  const table = compare(run([row('oldtown', 'low', 10, 20)]), run([row('oldtown', 'low', 11, 15)]));
  assert.doesNotMatch(table, /regression/);
});

test('names a scene and tier found in only one run', () => {
  const table = compare(run([row('oldtown', 'low', 10, 20)]), run([row('coast', 'low', 10, 20)]));
  assert.match(table, /\| oldtown \| low \| only in the first run/);
  assert.match(table, /\| coast \| low \| only in the second run/);
});

test('shows a missing number as n/a', () => {
  const table = compare(
    run([row('oldtown', 'low', null, null)]),
    run([row('oldtown', 'low', 10, 20)]),
  );
  assert.match(table, /\| oldtown \| low \| n\/a → 10\.0 \| n\/a → 20\.0 \|/);
});
