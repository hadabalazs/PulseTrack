import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns";
import { Ruler, TrendingUp, Trophy, Zap, CalendarDays, CalendarRange, CalendarClock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import RangeSelector, { rangeCutoff } from "@/components/stats/RangeSelector";
import { logDate } from "@/lib/dates";

function fmt(m) {
  if (m == null || isNaN(m) || m === 0) return "—";
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-display text-lg font-bold">{fmt(payload[0].value)}</p>
    </div>
  );
};

function StatTile({ icon: Icon, value, label, sublabel, tone }) {
  const tones = {
    primary: "bg-primary/8 border-primary/15 text-primary",
    emerald: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30 text-emerald-500",
    purple: "bg-purple-50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-900/30 text-purple-500",
    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30 text-blue-500",
    slate: "bg-muted/50 border-border text-muted-foreground",
    orange: "bg-orange-50 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-900/30 text-orange-500",
  };
  return (
    <div className={cn("rounded-xl border p-3 text-center space-y-1", tones[tone] || tones.slate)}>
      <Icon className="w-4 h-4 mx-auto" />
      <p className="font-display text-base font-bold text-foreground leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-tight">{label}</p>
      {sublabel && <p className="text-[9px] text-muted-foreground/70 leading-tight">{sublabel}</p>}
    </div>
  );
}

function WeekCompareCard({ label, sessions, totalDist, avgDist, isCurrentWeek }) {
  return (
    <div className={cn("rounded-xl border p-4 space-y-2", isCurrentWeek ? "bg-primary/5 border-primary/20" : "bg-muted/40 border-border")}>
      <div className="flex items-center gap-1.5">
        <CalendarDays className={cn("w-3.5 h-3.5 shrink-0", isCurrentWeek ? "text-primary" : "text-muted-foreground")} />
        <p className={cn("text-xs font-semibold uppercase tracking-widest", isCurrentWeek ? "text-primary" : "text-muted-foreground")}>{label}</p>
      </div>
      {sessions === 0 ? (
        <p className="text-sm text-muted-foreground">No distance logged</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="font-display text-base font-bold">{sessions}</p><p className="text-[10px] text-muted-foreground">session{sessions !== 1 ? "s" : ""}</p></div>
          <div><p className="font-display text-base font-bold">{fmt(totalDist)}</p><p className="text-[10px] text-muted-foreground">total</p></div>
          <div><p className="font-display text-base font-bold">{fmt(avgDist)}</p><p className="text-[10px] text-muted-foreground">avg / session</p></div>
        </div>
      )}
    </div>
  );
}

export default function DistanceStats({ logs, weeklyRange = "all", onWeeklyRangeChange }) {
  const logsWithDistance = useMemo(() => logs.filter((l) => l.distance != null && l.distance > 0), [logs]);

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const fourWeekStart = startOfWeek(subWeeks(now, 3), { weekStartsOn: 1 });

  const { thisWeek, lastWeek, fourWeek } = useMemo(() => {
    const inRange = (l, start, end) => isWithinInterval(logDate(l), { start, end });
    const calc = (wLogs, weekCount) => {
      const sessions = wLogs.length;
      const total = wLogs.reduce((s, l) => s + l.distance, 0);
      return { sessions, total, avg: sessions > 0 ? total / sessions : 0, avgPerWeek: weekCount > 0 ? total / weekCount : 0 };
    };
    return {
      thisWeek: calc(logsWithDistance.filter((l) => inRange(l, thisWeekStart, thisWeekEnd)), 1),
      lastWeek: calc(logsWithDistance.filter((l) => inRange(l, lastWeekStart, lastWeekEnd)), 1),
      fourWeek: calc(logsWithDistance.filter((l) => inRange(l, fourWeekStart, thisWeekEnd)), 4),
    };
  }, [logsWithDistance, thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd, fourWeekStart]);

  const statsBySport = useMemo(() => {
    const map = {};
    logsWithDistance.forEach((l) => {
      if (!map[l.exercise]) map[l.exercise] = { total: 0, sessions: 0, best: 0 };
      map[l.exercise].total += l.distance;
      map[l.exercise].sessions += 1;
      if (l.distance > map[l.exercise].best) map[l.exercise].best = l.distance;
    });
    return map;
  }, [logsWithDistance]);

  const weeklyData = useMemo(() => {
    const cutoff = rangeCutoff(weeklyRange);
    const scoped = cutoff ? logsWithDistance.filter((l) => logDate(l) >= cutoff) : logsWithDistance;
    const weekMap = {};
    scoped.forEach((l) => {
      const monday = startOfWeek(logDate(l), { weekStartsOn: 1 });
      const key = format(monday, "MMM d");
      weekMap[key] = (weekMap[key] || 0) + l.distance;
    });
    return Object.entries(weekMap).map(([week, total]) => ({ week, total: Math.round(total) }));
  }, [logsWithDistance, weeklyRange]);

  const totalDistance = logsWithDistance.reduce((s, l) => s + l.distance, 0);
  const bestSession = logsWithDistance.reduce((best, l) => (l.distance > best ? l.distance : best), 0);
  const avgSession = logsWithDistance.length > 0 ? totalDistance / logsWithDistance.length : 0;

  if (logsWithDistance.length === 0) {
    return (
      <div className="rounded-2xl bg-card border p-6 space-y-3">
        <div className="flex items-center gap-2"><Ruler className="w-5 h-5 text-primary" /><h3 className="font-display font-semibold">Distance Stats</h3></div>
        <p className="text-sm text-muted-foreground">No distance data yet. Enter metres in the tracker after logging a session.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border p-6 space-y-6">
      <div className="flex items-center gap-2"><Ruler className="w-5 h-5 text-primary" /><h3 className="font-display font-semibold">Distance Stats</h3></div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">All Time</p>
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={TrendingUp} tone="primary" value={fmt(totalDistance)} label="Total" />
          <StatTile icon={Trophy} tone="emerald" value={fmt(bestSession)} label="Best" />
          <StatTile icon={Zap} tone="purple" value={fmt(avgSession)} label="Avg" sublabel="per session" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Averages</p>
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon={CalendarRange} tone="blue" value={fmt(fourWeek.avg)} label="4-Week Avg" sublabel={`per session · ${fmt(fourWeek.avgPerWeek)}/wk`} />
          <StatTile icon={CalendarClock} tone="slate" value={fmt(lastWeek.avg)} label="Last Week" sublabel={`per session · ${lastWeek.sessions} sess.`} />
          <StatTile icon={CalendarDays} tone="orange" value={fmt(thisWeek.avg)} label="This Week" sublabel={`per session · ${thisWeek.sessions} sess.`} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Weekly Comparison</p>
        <div className="grid grid-cols-1 gap-2">
          <WeekCompareCard label="This Week" sessions={thisWeek.sessions} totalDist={thisWeek.total} avgDist={thisWeek.avg} isCurrentWeek />
          <WeekCompareCard label="Last Week" sessions={lastWeek.sessions} totalDist={lastWeek.total} avgDist={lastWeek.avg} isCurrentWeek={false} />
        </div>
        {thisWeek.sessions > 0 && lastWeek.sessions > 0 && (
          <div className={cn("rounded-xl px-4 py-2.5 text-sm font-medium flex items-center gap-2", thisWeek.avg >= lastWeek.avg ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" : "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400")}>
            <span>{thisWeek.avg >= lastWeek.avg ? "↑" : "↓"}</span>
            <span>{thisWeek.avg >= lastWeek.avg ? "+" : "−"}{fmt(Math.abs(thisWeek.avg - lastWeek.avg))} avg per session vs last week</span>
          </div>
        )}
      </div>

      {Object.keys(statsBySport).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">By Sport</p>
          <div>
            {Object.entries(statsBySport).sort(([, a], [, b]) => b.total - a.total).map(([sport, s]) => (
              <div key={sport} className="flex items-center justify-between py-2.5 border-b last:border-0">
                <div><p className="text-sm font-semibold">{sport}</p><p className="text-xs text-muted-foreground">{s.sessions} session{s.sessions !== 1 ? "s" : ""} · avg {fmt(s.total / s.sessions)}</p></div>
                <div className="text-right"><p className="text-sm font-bold">{fmt(s.total)}</p><p className="text-xs text-muted-foreground">best {fmt(s.best)}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(weeklyData.length > 0 || weeklyRange !== "all") && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Distance per Week</p>
          {weeklyData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-sm text-muted-foreground">No distance logged in this period.</div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {onWeeklyRangeChange && <RangeSelector value={weeklyRange} onChange={onWeeklyRangeChange} />}
        </div>
      )}

      {totalDistance > 0 && (
        <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          {totalDistance >= 42195
            ? `🏅 You've covered ${(totalDistance / 42195).toFixed(1)} marathon distance${totalDistance >= 84390 ? "s" : ""}!`
            : totalDistance >= 1000
            ? `🏃 ${fmt(42195 - totalDistance)} to go until your first marathon distance!`
            : `💪 Keep going — ${fmt(1000 - totalDistance)} until your first kilometre!`}
        </div>
      )}
    </div>
  );
}
