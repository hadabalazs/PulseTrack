import test from 'node:test';
import assert from 'node:assert/strict';
import { weeklyDistanceRecords } from '../src/lib/distanceRecords.js';
const log = (date, distance, exercise = 'Swimming') => ({date, distance, exercise});
test('sums Monday–Sunday sessions and preserves strict historical records', () => {
 const logs = [log('2026-09-07', 600), log('2026-09-13', 400), log('2026-09-14', 1200), log('2026-09-21', 1200), log('2026-09-28', 1500)];
 const before = JSON.stringify(logs);
 const records = weeklyDistanceRecords([...logs].reverse());
 assert.deepEqual(records.map(r => [r.date,r.distance,r.improvement]), [['2026-09-07',1000,1000],['2026-09-14',1200,200],['2026-09-28',1500,300]]);
 assert.equal(JSON.stringify(logs),before);
});
test('separates sports and groups correctly across year boundaries', () => {
 const records = weeklyDistanceRecords([log('2025-12-29',500),log('2026-01-04',600),log('2026-01-05',1100),log('2026-01-01',10000,'Running')]);
 assert.equal(records.length,2);
 assert.equal(records.find(r=>r.exercise==='Swimming').distance,1100);
 assert.ok(records.every(r=>r.date==='2025-12-29'));
});
test('handles empty/invalid distances and recomputes backdated or edited totals', () => {
 assert.deepEqual(weeklyDistanceRecords([]),[]);
 assert.deepEqual(weeklyDistanceRecords([null,0,-1,Infinity,NaN].map(d=>log('2026-01-01',d))),[]);
 const records=weeklyDistanceRecords([log('2026-01-12',1200),log('2026-01-05',500),log('2026-01-06',800)]);
 assert.deepEqual(records.map(r=>r.distance),[1300]);
});
