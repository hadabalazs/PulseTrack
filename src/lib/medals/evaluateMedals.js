import { addDays, addYears, differenceInCalendarDays, format, isValid, parseISO, startOfWeek } from 'date-fns';
import { DISTANCE_TIERS, MEDAL_BY_ID, medalAppearance, scopeForSport } from './catalog.js';

const dayKey = date => format(date, 'yyyy-MM-dd');
const weekKey = date => dayKey(startOfWeek(parseISO(date), { weekStartsOn: 1 }));

export function evaluateMedals(logs, now = new Date()) {
  if (!isValid(now)) return [];
  const today = dayKey(now), ids = new Set();
  const valid = (Array.isArray(logs) ? logs : []).flatMap((log, index) => {
    if (!log || typeof log.exercise !== 'string' || !log.exercise.trim() || typeof log.date !== 'string') return [];
    const date = log.date.slice(0, 10), parsed = parseISO(date), id = log.id || `entry-${index}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parsed) || dayKey(parsed) !== date || date > today || ids.has(id)) return [];
    ids.add(id);
    return [{ ...log, id, date }];
  }).sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));
  if (!valid.length) return [];
  const awards = [];
  const emit = (definitionId, scopeKey, periodKey, entries, earnedDate = entries.at(-1)?.date, metricValue) => {
    const definition = MEDAL_BY_ID.get(definitionId);
    if (!definition || !earnedDate) return;
    awards.push({ awardId: JSON.stringify([1, definitionId, scopeKey, periodKey]), definitionId, ruleVersion: 1, tier: definition.value, scopeKey, periodKey, earnedDate, metricValue: metricValue ?? definition.value, evidenceLogIds: entries.map(entry => entry.id) });
  };
  const scopes = new Map([['all', valid]]);
  for (const log of valid) {
    const key = scopeForSport(log.exercise);
    if (!scopes.has(key)) scopes.set(key, []);
    scopes.get(key).push(log);
  }
  for (const [scope, entries] of scopes) {
    const days = [...new Map(entries.map(log => [log.date, log])).values()];
    const periods = new Map();
    for (const log of days) for (const [family, period] of [['week', weekKey(log.date)], ['month', log.date.slice(0, 7)], ['year', log.date.slice(0, 4)]]) {
      const key = `${family}:${period}`;
      if (!periods.has(key)) periods.set(key, []);
      periods.get(key).push(log);
    }
    for (const [key, periodDays] of periods) {
      const [family, period] = key.split(':');
      const tiers = family === 'week' ? [3, 5] : family === 'month' ? [12, 20] : [100, 200];
      for (const tier of tiers) if (periodDays.length >= tier) emit(`${family}-${tier}`, scope, period, periodDays.slice(0, tier));
    }
    for (const tier of [1, 10, 25, 50, 100, 250, 500, 1000]) if (days.length >= tier) emit(`active-${tier}`, scope, 'lifetime', days.slice(0, tier));
    for (const [definition, suffix] of [['fresh-start', '-01-01'], ['earth-day', '-04-22']]) {
      for (const log of days.filter(entry => entry.date.endsWith(suffix))) emit(definition, scope, log.date.slice(0, 4), [log], log.date, 1);
    }
    if (scope !== 'all') {
      const tiers = DISTANCE_TIERS[entries[0].exercise] || [];
      let total = 0;
      const earned = new Set(), evidence = [];
      for (const log of entries) {
        if (typeof log.distance !== 'number' || !Number.isFinite(log.distance) || log.distance <= 0) continue;
        total += log.distance; evidence.push(log);
        for (const tier of tiers) if (total >= tier * 1000 && !earned.has(tier)) { emit(`distance-${tier}`, scope, 'lifetime', evidence, log.date, total); earned.add(tier); }
      }
    }
  }
  // Exploration and continuity are genuinely cross-sport awards.
  const firstSports = [...new Map([...valid].reverse().map(log => [log.exercise, log])).values()].sort((a, b) => a.date.localeCompare(b.date));
  for (const tier of [3, 5, 8]) if (firstSports.length >= tier) emit(`explore-${tier}`, 'all', 'lifetime', firstSports.slice(0, tier));
  for (const { family, required } of [{ family: 'week', required: 3 }, { family: 'month', required: 4 }]) {
    const groups = new Map();
    for (const log of valid) {
      const key = family === 'week' ? weekKey(log.date) : log.date.slice(0, 7);
      if (!groups.has(key)) groups.set(key, new Map());
      if (!groups.get(key).has(log.exercise)) groups.get(key).set(log.exercise, log);
    }
    for (const [period, sports] of groups) if (sports.size >= required) emit(`${family}-explore`, 'all', period, [...sports.values()].slice(0, required));
  }
  const years = new Map();
  for (const log of valid) {
    const year = log.date.slice(0, 4), month = log.date.slice(0, 7);
    if (!years.has(year)) years.set(year, new Map());
    if (!years.get(year).has(month)) years.get(year).set(month, log);
  }
  for (const [year, months] of years) if (months.size === 12) emit('year-months', 'all', year, [...months.values()]);
  const anniversary = addYears(parseISO(valid[0].date), 1), end = dayKey(addDays(anniversary, 6));
  const birthdayLog = valid.find(log => log.date >= dayKey(anniversary) && log.date <= end);
  if (birthdayLog) emit('first-year', 'all', 'lifetime', [valid[0], birthdayLog]);
  const uniqueDays = [...new Map(valid.map(log => [log.date, log])).values()];
  for (let i = 1; i < uniqueDays.length; i++) if (differenceInCalendarDays(parseISO(uniqueDays[i].date), parseISO(uniqueDays[i - 1].date)) >= 15) {
    emit('return', 'all', 'lifetime', [uniqueDays[i - 1], uniqueDays[i]], uniqueDays[i].date, 14); break;
  }
  return awards.sort((a, b) => b.earnedDate.localeCompare(a.earnedDate) || a.awardId.localeCompare(b.awardId));
}

export function groupMedals(awards, { scope = '', family = '', weekStart = null } = {}) {
  const groups = new Map();
  const from = weekStart ? dayKey(weekStart) : null, through = weekStart ? dayKey(addDays(weekStart, 6)) : null;
  for (const award of awards) {
    const definition = MEDAL_BY_ID.get(award.definitionId);
    if (!definition || (scope && award.scopeKey !== scope) || (family && definition.family !== family) || (from && (award.earnedDate < from || award.earnedDate > through))) continue;
    const key = JSON.stringify([award.definitionId, award.scopeKey]);
    if (!groups.has(key)) groups.set(key, { key, definition: medalAppearance(definition, award.scopeKey), scopeKey: award.scopeKey, instances: [] });
    groups.get(key).instances.push(award);
  }
  return [...groups.values()].map(group => ({ ...group, instances: group.instances.sort((a, b) => b.earnedDate.localeCompare(a.earnedDate)), count: group.instances.length, latest: group.instances.reduce((latest, award) => award.earnedDate > latest ? award.earnedDate : latest, '') }))
    .sort((a, b) => b.latest.localeCompare(a.latest) || a.definition.priority - b.definition.priority || a.scopeKey.localeCompare(b.scopeKey));
}
