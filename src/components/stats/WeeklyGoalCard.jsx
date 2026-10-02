import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";
import { Target, ChevronLeft, ChevronRight, Check, Pencil, Trophy, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { goalForWeek, currentGoal } from "@/lib/useAppSettings";
import { logKey, logDate } from "@/lib/dates";
import { useSelectedWeek } from "@/lib/selectedWeekStore";

const GREEN = "#22c55e";

function fmt(m) {
  if (m == null || isNaN(m)) return "0 m";
  if (m >= 1000) return `${(m / 1000).toFixed(m % 1000 === 0 ? 0 : 2)} km`;
  return `${Math.round(m)} m`;
}
function fmtCompact(m) {
  if (m >= 1000) return `${(m / 1000).toFixed(1)}k`;
  return String(Math.round(m));
}

function GoalRing({ total, goal, reached }) {
  const R = 74, STROKE = 13;
  const C = 2 * Math.PI * R;
  const pct = goal > 0 ? Math.min(total / goal, 1) : 0;
  const offset = C * (1 - pct);
  const size = (R + STROKE) * 2;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" strokeWidth={STROKE} strokeLinecap="round"
          stroke={reached ? GREEN : "hsl(var(--primary))"} strokeDasharray={C} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,0.61,0.36,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-3xl font-bold leading-none">{fmt(total)}</p>
        <p className="text-sm text-muted-foreground mt-1">{fmt(goal)}</p>
        {reached && <Check className="w-6 h-6 mt-1.5" strokeWidth={3} style={{ color: GREEN }} />}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  if (!p.isDay || p.cum == null) return null;
  return (
    <div className="bg-card border rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-display text-sm font-bold">{fmt(p.cum)} total</p>
      {p.dayTotal > 0 && <p className="text-xs" style={{ color: GREEN }}>+{fmt(p.dayTotal)} that day</p>}
    </div>
  );
}

function GoalEditor({ initial, onSave, onCancel }) {
  const [value, setValue] = useState(initial ? String(initial) : "");
  const presets = [2000, 5000, 6000, 10000];
  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Weekly goal (metres)</label>
      <input type="text" inputMode="numeric" pattern="[0-9]*" enterKeyHint="done" autoComplete="off" placeholder="e.g. 6000"
        value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
        onKeyDown={(e) => { if (e.key === "Enter") onSave(value === "" ? null : Number(value)); }}
        className="w-full px-3 py-2.5 text-base rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button key={p} type="button" onClick={() => setValue(String(p))}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:text-foreground select-none">{fmt(p)}</button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        This applies from <strong>this week onward</strong>. Past weeks keep showing whatever goal was active for them at the time.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onSave(value === "" ? null : Number(value))}
          className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium select-none">Save goal</button>
        <button type="button" onClick={onCancel}
          className="h-10 px-4 rounded-xl border text-sm text-muted-foreground hover:text-foreground select-none">Cancel</button>
      </div>
      {initial > 0 && (
        <button type="button" onClick={() => onSave(null)} className="w-full text-xs text-destructive hover:underline select-none">
          Stop tracking a goal from this week on
        </button>
      )}
    </div>
  );
}

export default function WeeklyGoalCard({ logs, sportKey, goalHistory, onSaveGoal, isFiltered }) {
  const [weekStart, setWeekStart] = useSelectedWeek();
  const [editing, setEditing] = useState(false);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isCurrentWeek = isSameDay(weekStart, thisWeekStart);
  const canGoForward = !isCurrentWeek;
  const today = new Date();

  const goal = goalForWeek(goalHistory, weekStart);
  const editableGoal = currentGoal(goalHistory);
  const prevWeekGoal = goalForWeek(goalHistory, subWeeks(weekStart, 1));
  const goalChangedFromLastWeek = goal > 0 && prevWeekGoal > 0 && goal !== prevWeekGoal;
  const goalStartedThisWeek = goal > 0 && prevWeekGoal === 0;

  const { chartData, total, sessions, best, crossLabel } = useMemo(() => {
    const perDay = {};
    logs.forEach((l) => {
      if (l.distance == null || l.distance <= 0) return;
      const key = logKey(l);
      perDay[key] = (perDay[key] || 0) + l.distance;
    });

    let running = 0, sessionCount = 0, bestSession = 0, cross = null;

    logs.forEach((l) => {
      const d = logDate(l);
      if (d >= weekStart && d <= weekEnd && l.distance > 0) {
        sessionCount += 1;
        if (l.distance > bestSession) bestSession = l.distance;
      }
    });

    const rows = [{ label: " ", cum: 0, dayTotal: 0, isDay: false }];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const key = format(date, "yyyy-MM-dd");
      const dayTotal = perDay[key] || 0;
      const isFuture = isCurrentWeek && date > today && !isSameDay(date, today);
      if (isFuture) {
        rows.push({ label: format(date, "EEE"), cum: null, dayTotal: 0, isDay: true });
        continue;
      }
      const before = running;
      running += dayTotal;
      if (cross === null && goal > 0 && before < goal && running >= goal) cross = format(date, "EEE");
      rows.push({ label: format(date, "EEE"), cum: running, dayTotal, isDay: true });
    }
    return { chartData: rows, total: running, sessions: sessionCount, best: bestSession, crossLabel: cross };
  }, [logs, weekStart, weekEnd, goal, isCurrentWeek, today]);

  const hasGoal = goal > 0;
  const hasAnyGoalEver = (goalHistory || []).length > 0;
  const reached = hasGoal && total >= goal;
  const pctOfGoal = hasGoal ? Math.round((total / goal) * 100) : 0;
  const remaining = hasGoal ? Math.max(0, goal - total) : 0;
  const yMax = Math.max(goal || 0, total, 100) * 1.15;

  return (
    <div className="rounded-2xl bg-card border p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="w-5 h-5 text-primary shrink-0" />
          <h3 className="font-display font-semibold truncate">Weekly Goal{isFiltered ? ` · ${sportKey}` : ""}</h3>
        </div>
        {hasAnyGoalEver && !editing && (
          <button type="button" onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors select-none shrink-0">
            <Pencil className="w-3.5 h-3.5" />Edit
          </button>
        )}
      </div>

      {editing ? (
        <GoalEditor initial={editableGoal} onSave={(v) => { onSaveGoal(v); setEditing(false); }} onCancel={() => setEditing(false)} />
      ) : !hasAnyGoalEver ? (
        <div className="text-center space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Set a weekly distance goal{isFiltered ? ` for ${sportKey}` : ""} and track your progress through the week.
          </p>
          <button type="button" onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium select-none">
            <Target className="w-4 h-4" />Set a weekly goal
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setWeekStart(subWeeks(weekStart, 1))}
              className="w-9 h-9 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors select-none">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-medium">
              {isCurrentWeek ? "This Week" : `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`}
            </p>
            <button type="button" disabled={!canGoForward} onClick={() => canGoForward && setWeekStart(addWeeks(weekStart, 1))}
              className={cn("w-9 h-9 rounded-full border flex items-center justify-center transition-colors select-none",
                canGoForward ? "text-muted-foreground hover:text-foreground hover:border-primary/30" : "text-muted-foreground/30 cursor-not-allowed")}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!hasGoal ? (
            <div className="text-center space-y-2 py-6">
              <p className="text-sm text-muted-foreground">No goal was set for this week.</p>
              {sessions > 0 && (
                <p className="text-xs text-muted-foreground">{sessions} session{sessions !== 1 ? "s" : ""} logged · {fmt(total)} total</p>
              )}
            </div>
          ) : (
            <>
              {(goalChangedFromLastWeek || goalStartedThisWeek) && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground -mt-1">
                  <History className="w-3 h-3" />
                  {goalStartedThisWeek ? "Goal started this week" : `Goal changed from ${fmt(prevWeekGoal)} the week before`}
                </div>
              )}

              <GoalRing total={total} goal={goal} reached={reached} />

              <div className="text-center space-y-1.5">
                <p className={cn("text-sm font-medium", reached ? "" : "text-muted-foreground")} style={reached ? { color: GREEN } : {}}>
                  {pctOfGoal}% of Goal
                </p>
                {reached ? (
                  <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                    style={{ background: "rgba(34,197,94,0.12)", color: GREEN }}>
                    <Trophy className="w-4 h-4" />
                    {total > goal ? `Goal smashed — ${fmt(total - goal)} over!` : "Nice! You reached your weekly goal."}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{fmt(remaining)}</span> to go</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Weekly Timeline</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={0} />
                      <YAxis domain={[0, yMax]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={fmtCompact} />
                      <Tooltip content={<ChartTooltip />} />
                      <ReferenceLine y={goal} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 5" strokeWidth={1.5} />
                      <Line type="stepAfter" dataKey="cum" stroke={reached ? GREEN : "hsl(var(--primary))"} strokeWidth={2.5}
                        dot={{ r: 2.5, strokeWidth: 0, fill: reached ? GREEN : "hsl(var(--primary))" }} activeDot={{ r: 5 }}
                        isAnimationActive={false} connectNulls={false} />
                      {crossLabel && <ReferenceDot x={crossLabel} y={goal} r={4.5} fill="hsl(var(--card))" stroke={GREEN} strokeWidth={2} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="inline-block w-4 border-t-2 border-dashed border-muted-foreground/60" />
                  Weekly goal · {fmt(goal)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="rounded-xl bg-muted/40 border p-3 text-center">
                  <p className="font-display text-base font-bold">{sessions}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sessions</p>
                </div>
                <div className="rounded-xl bg-muted/40 border p-3 text-center">
                  <p className="font-display text-base font-bold">{fmt(best)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Best</p>
                </div>
                <div className="rounded-xl bg-muted/40 border p-3 text-center">
                  <p className="font-display text-base font-bold">{sessions > 0 ? fmt(total / sessions) : "—"}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg</p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
