import test from 'node:test';
import assert from 'node:assert/strict';
import { currentDailyStreak } from '../src/lib/currentDailyStreak.js';

const now = new Date(2026, 10, 16, 14);
const logs = (...dates) => dates.map(date => ({ date, exercise: 'Swimming' }));

test('counts consecutive days for the chosen sport and deduplicates its sessions', () => {
  const entries = logs('2026-11-16', '2026-11-14', '2026-11-15', '2026-11-16');
  entries.push({ date: '2026-11-15', exercise: 'Tennis' }, { date: '2026-11-16', exercise: 'Tennis' });
  const before = JSON.stringify(entries);
  assert.equal(currentDailyStreak(entries, 'Swimming', now), 3);
  assert.equal(currentDailyStreak(entries, 'Tennis', now), 2);
  assert.equal(JSON.stringify(entries), before);
});

test('alternating sports do not join up into a daily streak', () => {
  const entries = [...logs('2026-11-14', '2026-11-16'), { date: '2026-11-15', exercise: 'Tennis' }];
  assert.equal(currentDailyStreak(entries, 'Swimming', now), 1);
  assert.equal(currentDailyStreak(entries, 'Tennis', now), 1);
  assert.equal(currentDailyStreak(entries, 'Running', now), 0);
});

test('keeps yesterday’s streak active until today ends, then resets after a missed day', () => {
  const entries = logs('2026-11-14', '2026-11-15');
  assert.equal(currentDailyStreak(entries, 'Swimming', now), 2);
  assert.equal(currentDailyStreak(entries, 'Swimming', new Date(2026, 10, 17)), 0);
});

test('reports the current streak rather than an older record and updates after deletion or backfill', () => {
  const entries = logs('2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-15', '2026-11-16');
  assert.equal(currentDailyStreak(entries, 'Swimming', now), 2);
  assert.equal(currentDailyStreak(entries.filter(log => log.date !== '2026-11-15'), 'Swimming', now), 1);
  assert.equal(currentDailyStreak([...entries, ...logs('2026-11-14')], 'Swimming', now), 3);
});

test('ignores future and malformed entries and returns zero or one without a streak', () => {
  assert.equal(currentDailyStreak([], 'Swimming', now), 0);
  assert.equal(currentDailyStreak([...logs('invalid', '2026-11-17'), null, {}], 'Swimming', now), 0);
  assert.equal(currentDailyStreak(logs('2026-11-16'), 'Swimming', now), 1);
});

test('counts calendar days across daylight saving, leap days and year boundaries', () => {
  assert.equal(currentDailyStreak(logs('2026-03-07', '2026-03-08', '2026-03-09'), 'Swimming', new Date(2026, 2, 9)), 3);
  assert.equal(currentDailyStreak(logs('2024-02-28', '2024-02-29', '2024-03-01'), 'Swimming', new Date(2024, 2, 1)), 3);
  assert.equal(currentDailyStreak(logs('2025-12-31', '2026-01-01'), 'Swimming', new Date(2026, 0, 1)), 2);
});
