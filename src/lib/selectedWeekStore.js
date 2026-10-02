import { useSyncExternalStore, useCallback } from "react";
import { startOfWeek } from "date-fns";

const thisMonday = () => startOfWeek(new Date(), { weekStartsOn: 1 });

let current = thisMonday();
const listeners = new Set();

function set(next) {
  const value = typeof next === "function" ? next(current) : next;
  if (value?.getTime?.() === current.getTime()) return;
  current = value;
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useSelectedWeek() {
  const weekStart = useSyncExternalStore(subscribe, () => current, () => current);
  const setWeekStart = useCallback((next) => set(next), []);
  return [weekStart, setWeekStart];
}

export function resetToThisWeek() {
  set(thisMonday());
}
