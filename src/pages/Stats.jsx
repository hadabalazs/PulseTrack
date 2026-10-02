import { useState, useMemo } from "react";
import { useWorkoutLogs } from "@/lib/useWorkoutLogs";
import { useAppSettings } from "@/lib/useAppSettings";
import { enrichLogs } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Layers, Calendar, Settings, History } from "lucide-react";
import { Link } from "react-router-dom";
import StatsCards from "@/components/stats/StatsCards";
import WorkoutChart from "@/components/stats/WorkoutChart";
import ExerciseBreakdown from "@/components/stats/ExerciseBreakdown";
import ExportButton from "@/components/stats/ExportButton";
import MonthlyCalendar from "@/components/stats/MonthlyCalendar";
import DistanceStats from "@/components/stats/DistanceStats";
import SportFilter from "@/components/stats/SportFilter";
import WeeklyGoalCard from "@/components/stats/WeeklyGoalCard";
import RangeSelector from "@/components/stats/RangeSelector";
import LifetimeStatsPanel from "@/components/tracker/LifetimeStatsPanel";
import { useCostTracker } from "@/lib/useCostTracker";

const chartTypes = [
  { key: "bar", label: "Bar", icon: BarChart3 },
  { key: "line", label: "Line", icon: TrendingUp },
  { key: "area", label: "Area", icon: Layers },
];

export default function Stats() {
  const [chartType, setChartType] = useState("bar");
  const [view, setView] = useState("chart");
  const [lifetimeCostOpen, setLifetimeCostOpen] = useState(false);
  const { logs: rawLogs } = useWorkoutLogs();
  const { appSettings, updateSetting, setWeeklyGoal } = useAppSettings();
  const { settings: costSettings } = useCostTracker();

  const logs = useMemo(() => enrichLogs(rawLogs), [rawLogs]);
  const hasArchivedHistory = costSettings.sports.some(s => (s.history || []).length > 0);

  const allSports = useMemo(() => Array.from(new Set(logs.map(l => l.exercise))).sort(), [logs]);

  const selectedSport =
    appSettings.statsSportFilter !== "all" && !allSports.includes(appSettings.statsSportFilter)
      ? "all"
      : appSettings.statsSportFilter;

  const filteredLogs = useMemo(
    () => (selectedSport === "all" ? logs : logs.filter(l => l.exercise === selectedSport)),
    [logs, selectedSport]
  );

  const isFiltered = selectedSport !== "all";
  const goalHistory = (appSettings.weeklyDistanceGoals || {})[selectedSport] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">Statistics</h1>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {isFiltered ? `Showing ${selectedSport} only` : "Your workout history at a glance"}
          </p>
        </div>
        <ExportButton logs={filteredLogs} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <SportFilter sports={allSports} value={selectedSport} onChange={(v) => updateSetting("statsSportFilter", v)} />
        {isFiltered && (
          <button onClick={() => updateSetting("statsSportFilter", "all")}
            className="text-xs text-primary font-medium hover:underline select-none shrink-0">Clear filter</button>
        )}
      </div>

      <StatsCards logs={filteredLogs} />

      <div className="rounded-2xl bg-card border p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">{view === "chart" ? "Workouts per Week" : "Monthly Calendar"}</h3>
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
            <button onClick={() => setView("chart")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all select-none", view === "chart" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Chart</button>
            <button onClick={() => setView("calendar")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all select-none", view === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><Calendar className="w-3.5 h-3.5" />Month</button>
          </div>
        </div>
        {view === "chart" ? (
          <>
            <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
              {chartTypes.map(ct => (
                <button key={ct.key} onClick={() => setChartType(ct.key)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all select-none", chartType === ct.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <ct.icon className="w-3.5 h-3.5" />{ct.label}
                </button>
              ))}
            </div>
            <WorkoutChart logs={filteredLogs} chartType={chartType} selectedSport={selectedSport} allSports={allSports} range={appSettings.workoutsChartRange} />
            <RangeSelector value={appSettings.workoutsChartRange} onChange={(v) => updateSetting("workoutsChartRange", v)} />
          </>
        ) : (
          <MonthlyCalendar logs={filteredLogs} />
        )}
      </div>

      {appSettings.trackDistance && (
        <WeeklyGoalCard
          logs={filteredLogs}
          sportKey={selectedSport}
          goalHistory={goalHistory}
          onSaveGoal={(metres) => setWeeklyGoal(selectedSport, metres)}
          isFiltered={isFiltered}
        />
      )}

      {!isFiltered && (
        <div className="rounded-2xl bg-card border p-6 space-y-5">
          <h3 className="font-display font-semibold">Exercise Breakdown</h3>
          <ExerciseBreakdown logs={logs} />
        </div>
      )}

      {appSettings.trackDistance && (
        <DistanceStats logs={filteredLogs} weeklyRange={appSettings.distanceChartRange} onWeeklyRangeChange={(v) => updateSetting("distanceChartRange", v)} />
      )}

      {hasArchivedHistory && (
        <div className="space-y-2">
          <button type="button" onClick={() => setLifetimeCostOpen(v => !v)}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors select-none">
            <History className="w-4 h-4" />
            {lifetimeCostOpen ? "Hide Lifetime Cost Stats" : "Lifetime Cost Stats"}
          </button>
          {lifetimeCostOpen && <LifetimeStatsPanel sports={costSettings.sports} />}
        </div>
      )}

      <Link to="/settings" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors select-none">
        <Settings className="w-4 h-4" />Settings
      </Link>
    </div>
  );
}
