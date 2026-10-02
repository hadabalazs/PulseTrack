import { useMemo } from "react";
import { startOfWeek, format } from "date-fns";
import { logDate } from "@/lib/dates";
import { Trophy, Flame, TrendingUp, Calendar } from "lucide-react";

export default function StatsCards({ logs }) {
  const totalWorkouts = logs.length;

  const { totalWeeks, avgPerWeek, topExercise } = useMemo(() => {
    const weeks = new Set();
    logs.forEach((l) => {
      const monday = startOfWeek(logDate(l), { weekStartsOn: 1 });
      weeks.add(format(monday, "yyyy-MM-dd"));
    });
    const tw = weeks.size;
    const avg = tw > 0 ? (totalWorkouts / tw).toFixed(1) : "0";

    const exerciseCounts = {};
    logs.forEach((l) => {
      exerciseCounts[l.exercise] = (exerciseCounts[l.exercise] || 0) + 1;
    });
    const top = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0];

    return { totalWeeks: tw, avgPerWeek: avg, topExercise: top };
  }, [logs, totalWorkouts]);

  const cards = [
    { label: "Total Workouts", value: totalWorkouts, icon: Trophy, color: "text-primary bg-primary/10" },
    { label: "Active Weeks", value: totalWeeks, icon: Calendar, color: "text-accent bg-accent/10" },
    { label: "Avg / Week", value: avgPerWeek, icon: TrendingUp, color: "text-purple-500 bg-purple-50" },
    { label: "Top Exercise", value: topExercise?.[0] || "—", icon: Flame, color: "text-chart-5 bg-red-50" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl bg-card border p-5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
            <card.icon className="w-4 h-4" />
          </div>
          <p className="font-display text-2xl font-bold">{card.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}