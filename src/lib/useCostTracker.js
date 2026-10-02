import { useState, useCallback } from "react";
import { useStorageSync } from "@/lib/useStorageSync";

const COST_KEY = "pulsetrack_cost_tracker";
const DEFAULT_SETTINGS = { view: "merged", sports: [], open: false };

function load() {
  try { const r = localStorage.getItem(COST_KEY); return r ? { ...DEFAULT_SETTINGS, ...JSON.parse(r) } : DEFAULT_SETTINGS; }
  catch { return DEFAULT_SETTINGS; }
}
function save(d) { localStorage.setItem(COST_KEY, JSON.stringify(d)); }

function freshEntry(sport, startDate, endDate) {
  return {
    id: crypto?.randomUUID?.() || String(Date.now() + Math.random()),
    sport, sessionCost: "", yearlyCost: "", startDate, endDate, history: [],
  };
}

export function useCostTracker() {
  const [settings, setSettings] = useState(() => load());
  useStorageSync(COST_KEY, useCallback(() => setSettings(load()), []));

  const update = useCallback((updater) => {
    setSettings(prev => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      save(next);
      return next;
    });
  }, []);

  const addSport = useCallback((sport) => {
    const today = new Date().toISOString().slice(0, 10);
    const oneYearLater = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10);
    update(prev => ({ ...prev, sports: [...prev.sports, freshEntry(sport, today, oneYearLater)] }));
  }, [update]);

  const removeSport = useCallback((id) => {
    update(prev => ({ ...prev, sports: prev.sports.filter(s => s.id !== id) }));
  }, [update]);

  const updateSport = useCallback((id, fields) => {
    update(prev => ({ ...prev, sports: prev.sports.map(s => s.id === id ? { ...s, ...fields, history: s.history || [] } : s) }));
  }, [update]);

  const setView = useCallback((view) => { update(prev => ({ ...prev, view })); }, [update]);
  const setOpen = useCallback((open) => { update(prev => ({ ...prev, open: typeof open === "function" ? open(prev.open) : open })); }, [update]);

  const archiveAndRenew = useCallback((id, snapshot, nextDates) => {
    update(prev => ({
      ...prev,
      sports: prev.sports.map(s => {
        if (s.id !== id) return s;
        const archived = {
          archivedId: crypto?.randomUUID?.() || String(Date.now() + Math.random()),
          sport: s.sport, sessionCost: s.sessionCost, yearlyCost: s.yearlyCost,
          startDate: s.startDate, endDate: s.endDate,
          archivedAt: new Date().toISOString(),
          ...snapshot,
        };
        return {
          ...s, sessionCost: "", yearlyCost: "",
          startDate: nextDates.startDate, endDate: nextDates.endDate,
          history: [archived, ...(s.history || [])],
        };
      }),
    }));
  }, [update]);

  const deleteHistoryEntry = useCallback((sportId, archivedId) => {
    update(prev => ({
      ...prev,
      sports: prev.sports.map(s =>
        s.id === sportId ? { ...s, history: (s.history || []).filter(h => h.archivedId !== archivedId) } : s
      ),
    }));
  }, [update]);

  return { settings, addSport, removeSport, updateSport, setView, setOpen, archiveAndRenew, deleteHistoryEntry };
}
