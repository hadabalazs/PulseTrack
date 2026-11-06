import { addWeeks, endOfDay, format, isValid, startOfWeek } from "date-fns";
import { logDate } from "./dates.js";

// Calendar weeks include gaps and the current partial week in the average.
export function weeklyDistances(logs, now = new Date()) {
  const totals = new Map();
  const today = endOfDay(now);
  for (const log of logs) {
    if (!Number.isFinite(log.distance) || log.distance <= 0) continue;
    const date = logDate(log);
    if (!isValid(date) || date > today) continue;
    const key = format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
    totals.set(key, (totals.get(key) || 0) + log.distance);
  }
  const keys = [...totals.keys()].sort();
  if (!keys.length) return { weeks: [], total: 0, average: 0, best: 0 };
  const weeks = [];
  const current = startOfWeek(now, { weekStartsOn: 1 });
  for (let date = logDate({ date: keys[0] }); date <= current; date = addWeeks(date, 1)) {
    const key = format(date, "yyyy-MM-dd");
    weeks.push({ key, date, total: totals.get(key) || 0 });
  }
  const total = weeks.reduce((sum, week) => sum + week.total, 0);
  return { weeks, total, average: total / weeks.length, best: Math.max(...weeks.map(week => week.total)) };
}
