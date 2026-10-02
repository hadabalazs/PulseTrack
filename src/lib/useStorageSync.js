import { useEffect } from "react";

export function useStorageSync(key, reload) {
  useEffect(() => {
    const handler = (e) => { if (e.key === key) reload(); };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, reload]);
}
