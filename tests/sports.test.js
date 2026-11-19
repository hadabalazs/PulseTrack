import test from 'node:test';
import assert from 'node:assert/strict';
import { addSportName, DEFAULT_SPORTS, normalizeCustomSports, SPORT_NAME_LIMIT } from '../src/lib/sports.js';

test('adds a custom sport after the existing list and preserves its name across storage round-trips', () => {
  const result = addSportName([], '  Table   Tennis  ');
  assert.equal(result.name, 'Table Tennis');
  const saved = normalizeCustomSports(JSON.parse(JSON.stringify(result.sports)));
  assert.deepEqual(saved, ['Table Tennis']);
  assert.deepEqual([...DEFAULT_SPORTS, ...saved].slice(-2), ['Football', 'Table Tennis']);
  assert.equal(DEFAULT_SPORTS.length, 9);
});

test('rejects duplicates against both built-in and custom sports regardless of case or whitespace', () => {
  for (const value of [' swimming ', 'SWIMMING', 'Weight   Training']) assert.ok(addSportName([], value).error);
  const existing = ['Table Tennis'];
  assert.ok(addSportName(existing, ' table  TENNIS ').error);
  assert.deepEqual(existing, ['Table Tennis']);
});

test('rejects empty, invalid and overlong names while allowing Unicode names', () => {
  for (const value of ['', ' \t\n ', null, 5, 'x'.repeat(SPORT_NAME_LIMIT + 1)]) assert.ok(addSportName([], value).error);
  assert.equal(addSportName([], 'x'.repeat(SPORT_NAME_LIMIT)).name.length, SPORT_NAME_LIMIT);
  assert.equal(addSportName([], 'Vívás').name, 'Vívás');
});

test('recovers malformed saved lists and filters invalid entries without losing valid custom sports', () => {
  assert.deepEqual(normalizeCustomSports(null), []);
  assert.deepEqual(normalizeCustomSports({ sport: 'Tennis' }), []);
  assert.deepEqual(normalizeCustomSports(['Tennis', null, 'tennis', 'Swimming', '  Badminton ', '', 4]), ['Tennis', 'Badminton']);
});

test('adding another sport retains existing custom sports and does not mutate the input', () => {
  const saved = ['Tennis'];
  assert.deepEqual(addSportName(saved, 'Badminton').sports, ['Tennis', 'Badminton']);
  assert.deepEqual(saved, ['Tennis']);
});
