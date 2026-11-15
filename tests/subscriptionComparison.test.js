import test from 'node:test';
import assert from 'node:assert/strict';
import { subscriptionComparison } from '../src/lib/subscriptionComparison.js';

const entry = { sport: 'Swimming', startDate: '2026-11-06', endDate: '2027-11-05', yearlyCost: '3650', sessionCost: '40' };
const now = new Date(2026, 10, 15, 18, 30);
const log = (date, extra = {}) => ({ date, exercise: 'Swimming', ...extra });

test('compares 10/365 of subscription price with eligible session prices through today', () => {
  const logs = [log('2026-11-06'), log('2026-11-10'), log('2026-11-15T23:00:00'),
    log('2026-11-05'), log('2026-11-16'), log('2026-11-12', { excludePayment: true }),
    log('2026-11-12', { exercise: 'Football' }), log('invalid')];
  assert.deepEqual(subscriptionComparison(entry, logs, now), {
    days: 10, accruedCost: 100, sessions: 3, sessionPrice: 40, sessionTotal: 120, savings: 20,
  });
});

test('counts the start date, returns zero before it, and stops at the end date', () => {
  assert.equal(subscriptionComparison(entry, [], new Date(2026, 10, 6)).days, 1);
  const future = subscriptionComparison(entry, [log('2026-11-06')], new Date(2026, 10, 5));
  assert.equal(future.days, 0);
  assert.equal(future.sessions, 0);
  const expired = subscriptionComparison({ ...entry, endDate: '2026-11-10' }, [log('2026-11-10'), log('2026-11-11')], now);
  assert.equal(expired.days, 5);
  assert.equal(expired.accruedCost, 50);
  assert.equal(expired.sessions, 1);
});

test('caps annual accrual at the full price and keeps the session equivalent uncapped', () => {
  const result = subscriptionComparison({ ...entry, startDate: '2024-01-01', endDate: '2027-01-01', sessionCost: '5000' }, [log('2026-11-15')], now);
  assert.equal(result.days, 365);
  assert.equal(result.accruedCost, 3650);
  assert.equal(result.sessionTotal, 5000);
  assert.equal(result.savings, 1350);
});

test('uses calendar days across leap days and daylight saving', () => {
  const result = subscriptionComparison({ ...entry, startDate: '2024-02-28', endDate: '2024-12-31' }, [], new Date(2024, 2, 12, 1));
  assert.equal(result.days, 14);
});

test('handles missing prices and invalid dates without misleading comparisons', () => {
  for (const fields of [{ startDate: '' }, { endDate: 'bad' }, { endDate: '2026-11-01' }, { yearlyCost: 'Infinity' }, { yearlyCost: '10.5.3' }]) {
    assert.equal(subscriptionComparison({ ...entry, ...fields }, [], now), null);
  }
  const missing = subscriptionComparison({ ...entry, sessionCost: '' }, [], now);
  assert.equal(missing.sessionTotal, null);
  assert.equal(missing.savings, null);
  const free = subscriptionComparison({ ...entry, sessionCost: '0' }, [log('2026-11-10')], now);
  assert.equal(free.sessionTotal, 0);
  assert.equal(free.savings, -100);
});

test('recomputes the comparison after price, date and session edits', () => {
  const logs = [log('2026-11-10')];
  assert.equal(subscriptionComparison(entry, logs, now).savings, -60);
  assert.equal(subscriptionComparison({ ...entry, sessionCost: '120' }, logs, now).savings, 20);
  assert.equal(subscriptionComparison({ ...entry, startDate: '2026-11-10' }, logs, now).accruedCost, 60);
  assert.equal(subscriptionComparison(entry, [log('2026-11-10', { excludePayment: true })], now).sessions, 0);
});
