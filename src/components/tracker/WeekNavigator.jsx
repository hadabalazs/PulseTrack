import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, subWeeks, endOfWeek, isSameWeek, startOfWeek } from "date-fns";

export default function WeekNavigator({ currentWeekStart, onWeekChange }) {
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {isCurrentWeek ? "This Week" : format(currentWeekStart, "MMM d")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(currentWeekStart, "MMMM d")} — {format(weekEnd, "MMMM d, yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onWeekChange(subWeeks(currentWeekStart, 1))} className="rounded-xl" aria-label="Previous week">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {!isCurrentWeek && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="rounded-xl text-xs"
          >
            Today
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={() => onWeekChange(addWeeks(currentWeekStart, 1))} className="rounded-xl" aria-label="Next week">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
