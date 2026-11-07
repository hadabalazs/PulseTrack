import { differenceInCalendarDays, endOfDay, format, isValid, startOfWeek } from "date-fns";
import { logDate } from "./dates.js";

export function recordStreaks(logs, now = new Date()) {
  const days = new Map();
  const weeks = new Map();
  const today = endOfDay(now);
  for (const log of logs) {
    const date = logDate(log);
    if (!isValid(date) || date > today) continue;
    days.set(format(date, "yyyy-MM-dd"), date);
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    weeks.set(format(monday, "yyyy-MM-dd"), monday);
  }

  const longest = (dates, step) => {
    let best = 0;
    let current = 0;
    let previous;
    for (const [, date] of [...dates.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      current = previous && differenceInCalendarDays(date, previous) === step ? current + 1 : 1;
      best = Math.max(best, current);
      previous = date;
    }
    return best;
  };

  return { daily: longest(days, 1), weekly: longest(weeks, 7) };
}
