import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { parseISO, format } from "date-fns";

function fmt(n) { return isNaN(n)||n===null?"0.00":Number(n).toFixed(2); }

function ProgressBar({ pct, broken }) {
  return <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full transition-all duration-500",broken?"bg-emerald-500":"bg-primary")} style={{width:`${Math.min(100,pct)}%`}}/></div>;
}

const SPORT_COLOURS = ["#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ec4899", "#14b8a6", "#eab308", "#ef4444"];

function ArchivedPeriodCard({ h, sport, colour }) {
  const [open, setOpen] = useState(false);
  const yc = parseFloat(h.yearlyCost) || 0;
  const pctUsed = yc > 0 ? Math.min(100, (h.totalSpent / yc) * 100) : 0;
  const perSession = h.sessionCount > 0 ? h.totalSpent / h.sessionCount : 0;

  return (
    <div className="rounded-xl border bg-background/60 overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between p-3 text-left select-none">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colour }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">
              {sport} · {h.startDate ? format(parseISO(h.startDate), "MMM yyyy") : "—"} – {h.endDate ? format(parseISO(h.endDate), "MMM yyyy") : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground">{h.sessionCount} sessions · AED {fmt(h.totalSpent)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", h.brokeEven ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground")}>
            {h.brokeEven ? "Broke even" : "Under used"}
          </span>
          <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t pt-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/40 p-2"><p className="text-sm font-bold">{h.sessionCount}</p><p className="text-[9px] text-muted-foreground uppercase">Sessions</p></div>
            <div className="rounded-lg bg-muted/40 p-2"><p className="text-sm font-bold">AED {fmt(perSession)}</p><p className="text-[9px] text-muted-foreground uppercase">Per Session</p></div>
            <div className="rounded-lg bg-muted/40 p-2"><p className="text-sm font-bold">AED {fmt(yc)}</p><p className="text-[9px] text-muted-foreground uppercase">Sub Cost</p></div>
          </div>
          {yc > 0 && (
            <div className="space-y-1">
              <ProgressBar pct={pctUsed} broken={h.brokeEven} />
              <p className="text-[10px] text-muted-foreground text-center">
                {h.brokeEven ? `Saved AED ${fmt(Math.max(0, yc - h.totalSpent))} vs pay-per-session` : `AED ${fmt(Math.max(0, yc - h.totalSpent))} of the subscription went unused`}
              </p>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">Archived {h.archivedAt ? format(parseISO(h.archivedAt.slice(0, 10)), "d MMM yyyy") : "—"}</p>
        </div>
      )}
    </div>
  );
}

export default function LifetimeStatsPanel({ sports }) {
  const [expandedSport, setExpandedSport] = useState(null);

  const rows = sports
    .filter(s => (s.history && s.history.length > 0) || parseFloat(s.yearlyCost) > 0)
    .map((s, i) => {
      const pastSpent = (s.history || []).reduce((sum, h) => sum + (h.totalSpent || 0), 0);
      const pastSessions = (s.history || []).reduce((sum, h) => sum + (h.sessionCount || 0), 0);
      const pastSubs = (s.history || []).reduce((sum, h) => sum + (parseFloat(h.yearlyCost) || 0), 0);
      const activeSub = parseFloat(s.yearlyCost) || 0;
      return {
        sport: s.sport, colour: SPORT_COLOURS[i % SPORT_COLOURS.length],
        periodsCount: (s.history || []).length + (activeSub > 0 ? 1 : 0),
        totalSpent: pastSpent, totalSessions: pastSessions,
        totalSubscriptionCost: pastSubs + activeSub, history: s.history || [],
      };
    });

  const grandTotalSpent = rows.reduce((s, r) => s + r.totalSpent, 0);
  const grandTotalSessions = rows.reduce((s, r) => s + r.totalSessions, 0);
  const grandTotalSub = rows.reduce((s, r) => s + r.totalSubscriptionCost, 0);

  const chartData = rows
    .flatMap(r => r.history.map(h => ({
      label: h.startDate ? format(parseISO(h.startDate), "MMM ''yy") : "—",
      sortKey: h.startDate || "", sport: r.sport, spent: Math.round(h.totalSpent), colour: r.colour,
    })))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-5 space-y-2">
        <p className="text-sm text-muted-foreground text-center py-4">
          No archived subscriptions yet. Once you renew a subscription and archive the old period, lifetime totals and charts show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5 space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted/40 border p-3 text-center"><p className="font-display text-base font-bold">AED {fmt(grandTotalSpent)}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lifetime Spent</p></div>
        <div className="rounded-xl bg-muted/40 border p-3 text-center"><p className="font-display text-base font-bold">{grandTotalSessions}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sessions (archived)</p></div>
        <div className="rounded-xl bg-muted/40 border p-3 text-center"><p className="font-display text-base font-bold">AED {fmt(grandTotalSub)}</p><p className="text-[10px] text-muted-foreground uppercase tracking-wide">Subscriptions Bought</p></div>
      </div>

      {chartData.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Spend per Archived Period</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return <div className="bg-card border rounded-lg px-3 py-2 shadow-lg text-xs"><p className="font-semibold">{p.sport}</p><p className="text-muted-foreground">{label}</p><p className="font-bold mt-0.5">AED {fmt(p.spent)}</p></div>;
                }} />
                <Bar dataKey="spent" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.colour} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">By Sport</p>
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.sport} className="rounded-xl border overflow-hidden">
              <button type="button" onClick={() => setExpandedSport(prev => prev === r.sport ? null : r.sport)} className="w-full flex items-center justify-between p-3 select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.colour }} />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold truncate">{r.sport}</p>
                    <p className="text-xs text-muted-foreground">{r.periodsCount} subscription{r.periodsCount !== 1 ? "s" : ""} · {r.totalSessions} archived session{r.totalSessions !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right"><p className="text-sm font-bold">AED {fmt(r.totalSpent)}</p><p className="text-[10px] text-muted-foreground">of AED {fmt(r.totalSubscriptionCost)}</p></div>
                  {r.history.length > 0 && <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedSport === r.sport && "rotate-180")} />}
                </div>
              </button>
              {expandedSport === r.sport && r.history.length > 0 && (
                <div className="p-3 pt-0 space-y-2">
                  {r.history.map(h => <ArchivedPeriodCard key={h.archivedId} h={h} sport={r.sport} colour={r.colour} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        "Sessions" and "Spent" here count only archived (renewed) periods — your currently active subscription shows its own live progress above.
      </p>
    </div>
  );
}
