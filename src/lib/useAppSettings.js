import { useState, useCallback } from "react";
import { startOfWeek, format } from "date-fns";
import { useStorageSync } from "@/lib/useStorageSync";

const SETTINGS_KEY = "pulsetrack_app_settings";
const DEFAULTS = {
  trackDistance: false,
  statsSportFilter: "all",
  weeklyDistanceGoals: {},
  workoutsChartRange: "12w",
  distanceChartRange: "12w",
};

function load() {
  try {
    const r = localStorage.getItem(SETTINGS_KEY);
    if (!r) return DEFAULTS;
    const parsed = JSON.parse(r);
    return { ...DEFAULTS, ...parsed, weeklyDistanceGoals: migrateGoals(parsed.weeklyDistanceGoals) };
  } catch {
    return DEFAULTS;
  }
}
function save(d) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(d)); }

function migrateGoals(goals) {
  if (!goals) return {};
  const out = {};
  for (const [key, val] of Object.entries(goals)) {
    if (Array.isArray(val)) { out[key] = val; continue; }
    if (typeof val === "number" && val > 0) {
      out[key] = [{ value: val, effectiveFrom: "2000-01-03" }];
    }
  }
  return out;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function goalForWeek(history, weekDate) {
  if (!history || history.length === 0) return 0;
  const weekKey = format(startOfWeek(weekDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const match = history.find(h => ISO_DAY.test(h.effectiveFrom) && h.effectiveFrom <= weekKey);
  return match ? match.value : 0;
}

export function currentGoal(history) {
  return goalForWeek(history, new Date());
}

export function useAppSettings() {
  const [appSettings, setAppSettings] = useState(() => load());
  useStorageSync(SETTINGS_KEY, useCallback(() => setAppSettings(load()), []));

  const updateSetting = useCallback((key, value) => {
    setAppSettings(prev => {
      const next = { ...prev, [key]: typeof value === "function" ? value(prev[key]) : value };
      save(next); return next;
    });
  }, []);

  const setWeeklyGoal = useCallback((sportKey, metres) => {
    setAppSettings(prev => {
      const goals = { ...(prev.weeklyDistanceGoals || {}) };
      const thisWeekKey = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const existing = goals[sportKey] || [];
      const withoutThisWeek = existing.filter(h => h.effectiveFrom !== thisWeekKey);
      const newValue = metres == null || metres <= 0 ? null : metres;
      const nextHistory = newValue == null
        ? withoutThisWeek
        : [{ value: newValue, effectiveFrom: thisWeekKey }, ...withoutThisWeek]
            .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
      if (nextHistory.length === 0) delete goals[sportKey];
      else goals[sportKey] = nextHistory;
      const next = { ...prev, weeklyDistanceGoals: goals };
      save(next);
      return next;
    });
  }, []);

  return { appSettings, updateSetting, setWeeklyGoal };
}
