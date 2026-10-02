import { useState, useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, subMonths, addMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { logKey } from "@/lib/dates";

const EXERCISE_COLORS = {
  Running: "bg-chart-1",
  Swimming: "bg-chart-2",
  Cycling: "bg-chart-3",
  "Weight Training": "bg-chart-4",
  Yoga: "bg-chart-5",
  HIIT: "bg-red-500",
  Walking: "bg-green-500",
  Pilates: "bg-purple-500",
  Football: "bg-orange-500",
};

export default function MonthlyCalendar({ logs }) {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const logsByDate = useMemo(() => {
    const map = {};
    logs.forEach((l) => {
      const d = logKey(l);
      if (!map[d]) map[d] = [];
      map[d].push(l.exercise);
    });
    return map;
  }, [logs]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = gridStart;
    while (day <= gridEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const monthWorkoutCount = useMemo(() => {
    return Object.keys(logsByDate).filter((d) => {
      const date = parseISO(d);
      return isSameMonth(date, currentMonth);
    }).reduce((sum, d) => sum + logsByDate[d].length, 0);
  }, [logsByDate, currentMonth]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-lg">{format(currentMonth, "MMMM yyyy")}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{monthWorkoutCount} workout{monthWorkoutCount !== 1 ? "s" : ""} this month</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-xl">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(startOfMonth(new Date()))} className="rounded-xl text-xs">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
        {calendarDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const exercises = logsByDate[dateStr] || [];
          const inMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={dateStr}
              className={cn(
                "min-h-[72px] rounded-xl border p-1.5 flex flex-col gap-1 transition-all",
                inMonth ? "bg-card" : "bg-muted/30 opacity-50",
                isToday && "ring-2 ring-primary/40",
                exercises.length > 0 && inMonth && "border-primary/30"
              )}
            >
              <span className={cn(
                "text-xs font-medium text-right",
                inMonth ? "text-foreground" : "text-muted-foreground"
              )}>
                {format(day, "d")}
              </span>
              <div className="flex flex-wrap gap-1 flex-1 content-start">
                {exercises.map((ex, i) => (
                  <div
                    key={i}
                    className={cn("w-2 h-2 rounded-full", EXERCISE_COLORS[ex] || "bg-primary")}
                    title={ex}
                  />
                ))}
              </div>
              {exercises.length > 0 && inMonth && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Dumbbell className="w-2.5 h-2.5" />
                  <span>{exercises.length}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 pt-2 border-t">
        {Object.entries(EXERCISE_COLORS).map(([ex, color]) => {
          const count = logs.filter((l) => l.exercise === ex).length;
          if (count === 0) return null;
          return (
            <div key={ex} className="flex items-center gap-1.5">
              <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
              <span className="text-xs text-muted-foreground">{ex}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}