import { useMemo } from "react";
import { format, startOfWeek } from "date-fns";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SPORT_COLOURS } from "@/components/stats/SportFilter";
import { rangeCutoff } from "@/components/stats/RangeSelector";
import { logDate } from "@/lib/dates";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s,p) => s+(p.value||0),0);
  return (
    <div className="bg-card border rounded-xl px-4 py-3 shadow-lg space-y-1">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:p.color}}/>
          <span className="text-muted-foreground">{p.dataKey}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
      {payload.length > 1 && <p className="text-xs text-muted-foreground border-t pt-1 mt-1">Total: <strong>{total}</strong></p>}
    </div>
  );
};

export default function WorkoutChart({ logs, chartType, selectedSport = "all", allSports = [], range = "all" }) {
  const { data, sports } = useMemo(() => {
    const cutoff = rangeCutoff(range);
    const scoped = cutoff ? logs.filter(l => logDate(l) >= cutoff) : logs;
    const weekMap = {};
    scoped.forEach(l => {
      const monday = startOfWeek(logDate(l), { weekStartsOn: 1 });
      const key = format(monday,"yyyy-MM-dd");
      if (!weekMap[key]) weekMap[key] = { week: format(monday,"MMM d") };
      weekMap[key][l.exercise] = (weekMap[key][l.exercise]||0)+1;
    });
    const sortedData = Object.entries(weekMap).sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v);
    const sportsInData = selectedSport === "all"
      ? Array.from(new Set(scoped.map(l=>l.exercise))).sort()
      : [selectedSport];
    return { data: sortedData, sports: sportsInData };
  }, [logs, selectedSport, range]);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground text-sm text-center px-6">
        {selectedSport === "all"
          ? (range === "all" ? "No data yet. Start tracking your workouts!" : "No workouts in this period.")
          : (range === "all" ? `No ${selectedSport} sessions logged yet.` : `No ${selectedSport} sessions in this period.`)}
      </div>
    );
  }

  const colourFor = (sport) => {
    const idx = allSports.indexOf(sport);
    return SPORT_COLOURS[(idx >= 0 ? idx : 0) % SPORT_COLOURS.length];
  };

  const chartProps = { data, margin: { top:8, right:8, left:-20, bottom:0 } };
  const showLegend = selectedSport === "all" && sports.length > 1;

  const renderBars = () => sports.map((s,i) => <Bar key={s} dataKey={s} stackId="a" fill={colourFor(s)} radius={i===sports.length-1?[8,8,0,0]:[0,0,0,0]} isAnimationActive={false}/>);
  const renderLines = () => sports.map(s => <Line key={s} type="monotone" dataKey={s} stroke={colourFor(s)} strokeWidth={3} dot={{r:4}} activeDot={{r:6}} isAnimationActive={false}/>);
  const renderAreas = () => sports.map(s => <Area key={s} type="monotone" dataKey={s} stackId="a" stroke={colourFor(s)} fill={colourFor(s)} fillOpacity={0.25} strokeWidth={2} isAnimationActive={false}/>);

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "bar" ? (
          <BarChart {...chartProps}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/><XAxis dataKey="week" tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><YAxis allowDecimals={false} tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><Tooltip content={<CustomTooltip/>}/>{showLegend&&<Legend wrapperStyle={{fontSize:11}}/>}{renderBars()}</BarChart>
        ) : chartType === "line" ? (
          <LineChart {...chartProps}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/><XAxis dataKey="week" tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><YAxis allowDecimals={false} tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><Tooltip content={<CustomTooltip/>}/>{showLegend&&<Legend wrapperStyle={{fontSize:11}}/>}{renderLines()}</LineChart>
        ) : (
          <AreaChart {...chartProps}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/><XAxis dataKey="week" tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><YAxis allowDecimals={false} tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))"/><Tooltip content={<CustomTooltip/>}/>{showLegend&&<Legend wrapperStyle={{fontSize:11}}/>}{renderAreas()}</AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
