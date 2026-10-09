import test from 'node:test';
import assert from 'node:assert/strict';
import { distanceRecords } from '../src/lib/distanceRecords.js';
const log = (id, date, distance, exercise = 'Swimming') => ({ id, date, distance, exercise });
const history = [log('a', '2026-09-01', 1000), log('b', '2026-09-02', 1200), log('c', '2026-09-03', 1200), log('d', '2026-10-01', 1500)];
const ids = logs => distanceRecords(logs).map(l => l.id);
test('keeps every historical record, excludes ties, and sorts by workout date', () => {
  assert.deepEqual(ids([...history].reverse()), ['a', 'b', 'd']);
  assert.deepEqual(distanceRecords(history).map(l => l.improvement), [1000, 200, 300]);
  assert.deepEqual(history.map(l => l.id), ['a', 'b', 'c', 'd']);
});
test('records belong to each sport independently', () => {
  assert.deepEqual(ids([...history, log('run', '2026-08-01', 5000, 'Running')]), ['run', 'a', 'b', 'd']);
});
test('ignores missing, zero, negative and nonfinite distances', () => {
  assert.deepEqual(ids([null, undefined, 0, -10, NaN, Infinity, '1000'].map((d, i) => log(String(i), '2026-01-01', d))), []);
  assert.deepEqual(ids([]), []);
});
test('backdated entries, edits and deletions update the chronological history', () => {
  assert.deepEqual(ids([...history, log('older', '2026-08-01', 1100)]), ['older', 'b', 'd']);
  assert.deepEqual(ids(history.map(l => l.id === 'b' ? { ...l, distance: 900 } : l)), ['a', 'c', 'd']);
  assert.deepEqual(ids(history.filter(l => l.id !== 'b')), ['a', 'c', 'd']);
});
