import { differenceInCalendarDays, isValid, parseISO, startOfDay } from "date-fns";

const parseDate = value => typeof value === "string" ? parseISO(value.slice(0, 10)) : new Date(NaN);
const price = value => value !== "" && value != null && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;

/** Compare annual subscription accrual with eligible sessions through today (both dates inclusive). */
export function subscriptionComparison(entry, logs, now = new Date()) {
  const start = parseDate(entry.startDate), end = parseDate(entry.endDate);
  const subscriptionPrice = price(entry.yearlyCost), sessionPrice = price(entry.sessionCost);
  if (!isValid(start) || !isValid(end) || !isValid(now) || end < start || subscriptionPrice === null) return null;

  const today = startOfDay(now);
  const through = end < today ? end : today;
  const days = Math.min(365, Math.max(0, differenceInCalendarDays(through, start) + 1));
  const accruedCost = subscriptionPrice * days / 365;
  const sessions = logs.filter(log => {
    if (!log || log.exercise !== entry.sport || log.excludePayment) return false;
    const date = parseDate(log.dateKey ?? log.date);
    return isValid(date) && date >= start && date <= through;
  }).length;
  const sessionTotal = sessionPrice === null ? null : sessions * sessionPrice;
  return { days, accruedCost, sessions, sessionPrice, sessionTotal, savings: sessionTotal === null ? null : sessionTotal - accruedCost };
}
