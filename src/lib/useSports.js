import { useMemo, useSyncExternalStore } from "react";
import { addSportName, DEFAULT_SPORTS, normalizeCustomSports } from "./sports";

const KEY = "pulsetrack_custom_sports";
const CHANGE_EVENT = "pulsetrack:sports-changed";

function readSnapshot() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function parseSports(raw) {
  try { return normalizeCustomSports(JSON.parse(raw)); } catch { return []; }
}

function subscribe(listener) {
  const onStorage = event => { if (event.key === KEY || event.key === null) listener(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function addCustomSport(value) {
  const result = addSportName(parseSports(readSnapshot()), value);
  if (result.error) return result;
  try {
    localStorage.setItem(KEY, JSON.stringify(result.sports));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return result;
  } catch {
    return { error: "Couldn't save this sport. Check that browser storage is available and try again." };
  }
}

export function useSports() {
  const raw = useSyncExternalStore(subscribe, readSnapshot, () => null);
  const customSports = useMemo(() => parseSports(raw), [raw]);
  const sports = useMemo(() => [...DEFAULT_SPORTS, ...customSports], [customSports]);
  return { sports, customSports, addCustomSport };
}
