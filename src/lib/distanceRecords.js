import { logKey } from "./dates.js";

// Compare with earlier sessions of the same sport, never with the final best.
// Recomputing from history also handles imported, backdated and edited workouts.
export function distanceRecords(logs) {
  const bestBySport = new Map();
  return [...logs]
    .filter(log => Number.isFinite(log.distance) && log.distance > 0)
    .sort((a, b) => logKey(a).localeCompare(logKey(b)) ||
      (a.created_date || "").localeCompare(b.created_date || "") ||
      String(a.id).localeCompare(String(b.id)))
    .flatMap(log => {
      const previous = bestBySport.get(log.exercise) || 0;
      if (log.distance <= previous) return [];
      bestBySport.set(log.exercise, log.distance);
      return [{ ...log, previous, improvement: log.distance - previous }];
    });
}
