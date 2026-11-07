import test from 'node:test';
import assert from 'node:assert/strict';
import { recordStreaks } from '../src/lib/recordStreaks.js';

const logs = (...dates) => dates.map(date => ({ date }));
const now = new Date(2026, 10, 7);
test('finds historical records, deduplicates days and handles unsorted entries', () => {
  const entries = logs('2026-10-22', '2026-10-06', '2026-10-05', '2026-10-07', '2026-10-06', '2026-10-12');
  const before = JSON.stringify(entries);
  assert.deepEqual(recordStreaks(entries, now), { daily: 3, weekly: 3 });
  assert.equal(JSON.stringify(entries), before);
});
test('uses Monday weeks and preserves streaks across the year boundary', () => {
  assert.deepEqual(recordStreaks(logs('2025-12-28', '2025-12-29', '2026-01-04', '2026-01-05'), now), { daily: 2, weekly: 3 });
});
test('counts calendar days across daylight-saving changes', () => {
  assert.deepEqual(recordStreaks(logs('2026-03-07', '2026-03-08', '2026-03-09'), now), { daily: 3, weekly: 2 });
});
test('handles empty data, future dates, invalid dates and a single workout today', () => {
  assert.deepEqual(recordStreaks([], now), { daily: 0, weekly: 0 });
  assert.deepEqual(recordStreaks(logs('invalid', '2026-11-08'), now), { daily: 0, weekly: 0 });
  assert.deepEqual(recordStreaks(logs('2026-11-07'), now), { daily: 1, weekly: 1 });
});
test('recomputes records for sport filters, edits and deletions', () => {
  const entries = logs('2026-10-05', '2026-10-06', '2026-10-07');
  entries.forEach((entry, index) => { entry.exercise = index === 1 ? 'Running' : 'Swimming'; });
  assert.equal(recordStreaks(entries, now).daily, 3);
  assert.equal(recordStreaks(entries.filter(entry => entry.exercise === 'Swimming'), now).daily, 1);
  entries[1].date = '2026-10-20';
  assert.equal(recordStreaks(entries, now).daily, 1);
});
