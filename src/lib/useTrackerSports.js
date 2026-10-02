import { useState, useCallback } from "react";
import { useStorageSync } from "@/lib/useStorageSync";
const KEY = "pulsetrack_tracker_sports";
const DEFAULT = [{ id: "primary", sport: "Swimming" }];
function load() { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : DEFAULT; } catch { return DEFAULT; } }
function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }
export function useTrackerSports() {
  const [trackerSports, setTrackerSports] = useState(() => load());
  useStorageSync(KEY, useCallback(() => setTrackerSports(load()), []));
  const addTrackerSport = useCallback((sport) => { setTrackerSports(prev => { const next = [...prev, { id: crypto?.randomUUID?.() || String(Date.now()), sport }]; save(next); return next; }); }, []);
  const removeTrackerSport = useCallback((id) => { setTrackerSports(prev => { if (prev.length <= 1) return prev; const next = prev.filter(s => s.id !== id); save(next); return next; }); }, []);
  const updateTrackerSport = useCallback((id, sport) => { setTrackerSports(prev => { const next = prev.map(s => s.id === id ? { ...s, sport } : s); save(next); return next; }); }, []);
  return { trackerSports, addTrackerSport, removeTrackerSport, updateTrackerSport };
}
