import test from 'node:test';
import assert from 'node:assert/strict';
import { weeklyDistances } from '../src/lib/weeklyDistances.js';

const log = (date, distance) => ({ date, distance });
test('sums Monday–Sunday weeks and counts empty and current weeks in the average', () => {
  const logs = [log('2026-10-19', 1000), log('2026-10-25', 500), log('2026-11-02', 3000)];
  const result = weeklyDistances([...logs].reverse(), new Date(2026, 10, 6));
  assert.deepEqual(result.weeks.map(w => [w.key, w.total]), [['2026-10-19', 1500], ['2026-10-26', 0], ['2026-11-02', 3000]]);
  assert.equal(result.total, 4500);
  assert.equal(result.average, 1500);
  assert.equal(result.best, 3000);
});
test('keeps years distinct and updates after edits or sport filtering', () => {
  const logs = [log('2025-01-06', 700), log('2026-01-05', 900)];
  const result = weeklyDistances(logs, new Date(2026, 0, 6));
  assert.equal(result.weeks.length, 53);
  assert.equal(result.total, 1600);
  assert.equal(result.average, 1600 / 53);
  assert.equal(weeklyDistances([logs[1]], new Date(2026, 0, 6)).average, 900);
  logs[1].distance = 1200;
  assert.equal(weeklyDistances(logs, new Date(2026, 0, 6)).best, 1200);
});
test('handles empty data, invalid distances, invalid dates and future entries', () => {
  const logs = [null, 0, -1, Infinity, NaN, '100'].map(d => log('2026-11-02', d));
  logs.push(log('invalid', 100), log('2026-11-07', 200));
  assert.deepEqual(weeklyDistances(logs, new Date(2026, 10, 6)), { weeks: [], total: 0, average: 0, best: 0 });
  const result = weeklyDistances([log('2026-11-06', 250)], new Date(2026, 10, 6));
  assert.equal(result.average, 250);
});
