import { useState, useCallback } from "react";
import { useStorageSync } from "@/lib/useStorageSync";
const STORAGE_KEY = "workout_tracker_logs";
function loadLogs() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveLogs(logs) { localStorage.setItem(STORAGE_KEY, JSON.stringify(logs)); }
export function useWorkoutLogs() {
  const [logs, setLogs] = useState(() => loadLogs());
  useStorageSync(STORAGE_KEY, useCallback(() => setLogs(loadLogs()), []));
  const addLog = useCallback((exercise, date, distance = null) => {
    const newLog = { id: crypto?.randomUUID?.() || String(Date.now()+Math.random()), exercise, date, distance: distance !== null && distance !== "" ? Number(distance) : null, created_date: new Date().toISOString() };
    setLogs(prev => { const next = [...prev, newLog]; saveLogs(next); return next; });
  }, []);
  const updateLog = useCallback((id, fields) => { setLogs(prev => { const next = prev.map(l => l.id === id ? { ...l, ...fields } : l); saveLogs(next); return next; }); }, []);
  const removeLog = useCallback((id) => { setLogs(prev => { const next = prev.filter(l => l.id !== id); saveLogs(next); return next; }); }, []);
  const clearAll = useCallback(() => { setLogs([]); saveLogs([]); }, []);
  return { logs, addLog, updateLog, removeLog, clearAll };
}
