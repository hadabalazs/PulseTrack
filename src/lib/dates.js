import { parseISO, format, isValid } from "date-fns";

export function normalizeDate(d) {
  return typeof d === "string" ? d.substring(0, 10) : format(new Date(d), "yyyy-MM-dd");
}

export function enrichLogs(logs) {
  return logs.map((l) => {
    const dateKey = normalizeDate(l.date);
    const dateObj = parseISO(dateKey);
    return { ...l, dateKey, dateObj: isValid(dateObj) ? dateObj : null };
  });
}

export function logKey(l) {
  return l.dateKey ?? normalizeDate(l.date);
}

export function logDate(l) {
  return l.dateObj ?? parseISO(normalizeDate(l.date));
}
