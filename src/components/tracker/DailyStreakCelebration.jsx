import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Flame, X } from "lucide-react";
import { currentDailyStreak } from "@/lib/currentDailyStreak";

export default function DailyStreakCelebration({ logs, sport }) {
  const [today, setToday] = useState(() => new Date());
  const [dismissed, setDismissed] = useState("");

  useEffect(() => {
    let timer;
    const refresh = () => {
      window.clearTimeout(timer);
      const now = new Date();
      setToday(now);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = window.setTimeout(refresh, midnight.getTime() - now.getTime());
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const days = currentDailyStreak(logs, sport, today);
  const key = `${sport}:${format(today, "yyyy-MM-dd")}:${days}`;
  if (days < 2 || dismissed === key) return null;

  return (
    <div role="status" aria-label={`${sport} daily streak celebration`} className="flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500"><Flame className="h-6 w-6" aria-hidden="true" /></div>
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold"><span aria-hidden="true">🎉 </span>{days} days in a row!</p>
        <p className="text-xs text-muted-foreground mt-1 break-words">{sport} streak · Keep it going!</p>
      </div>
      <button type="button" aria-label={`Dismiss ${sport} streak celebration`} onClick={() => setDismissed(key)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-orange-500/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
