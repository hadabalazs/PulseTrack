import { format, isValid, startOfDay, subDays } from "date-fns";
import { logDate } from "./dates.js";

/** A sport's current streak ends today or yesterday; multiple sessions on one day count once. */
export function currentDailyStreak(logs, sport, now = new Date()) {
  if (!isValid(now)) return 0;
  const today = startOfDay(now);
  const days = new Set();
  for (const log of logs) {
    if (!log || log.exercise !== sport || (!log.date && !log.dateKey && !log.dateObj)) continue;
    const date = startOfDay(logDate(log));
    if (isValid(date) && date <= today) days.add(format(date, "yyyy-MM-dd"));
  }
  let day = days.has(format(today, "yyyy-MM-dd")) ? today : subDays(today, 1);
  let count = 0;
  while (days.has(format(day, "yyyy-MM-dd"))) {
    count++;
    day = subDays(day, 1);
  }
  return count;
}
