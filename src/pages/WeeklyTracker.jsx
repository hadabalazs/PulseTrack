import { useMemo } from "react";
import { Plus, MoveHorizontal } from "lucide-react";
import { useWorkoutLogs } from "@/lib/useWorkoutLogs";
import { useTrackerSports } from "@/lib/useTrackerSports";
import { useAppSettings } from "@/lib/useAppSettings";
import { useSelectedWeek } from "@/lib/selectedWeekStore";
import { enrichLogs } from "@/lib/dates";
import { useIsMobile } from "@/hooks/use-mobile";
import WeekNavigator from "@/components/tracker/WeekNavigator";
import SwipeableWeek from "@/components/tracker/SwipeableWeek";
import SportTrackerRow from "@/components/tracker/SportTrackerRow";
import CostTracker from "@/components/tracker/CostTracker";

const EXERCISES = ["Running","Swimming","Cycling","Weight Training","Yoga","HIIT","Walking","Pilates","Football"];

export default function WeeklyTracker() {
  const [currentWeekStart, setCurrentWeekStart] = useSelectedWeek();
  const { logs: rawLogs, addLog, updateLog, removeLog } = useWorkoutLogs();
  const { trackerSports, addTrackerSport, removeTrackerSport, updateTrackerSport } = useTrackerSports();
  const { appSettings } = useAppSettings();
  const isMobile = useIsMobile();

  const logs = useMemo(() => enrichLogs(rawLogs), [rawLogs]);

  const handleAddSport = () => {
    const used = new Set(trackerSports.map(s => s.sport));
    addTrackerSport(EXERCISES.find(e => !used.has(e)) || EXERCISES[0]);
  };

  return (
    <div className="space-y-4">
      <WeekNavigator currentWeekStart={currentWeekStart} onWeekChange={setCurrentWeekStart} />

      <SwipeableWeek currentWeekStart={currentWeekStart} onWeekChange={setCurrentWeekStart}>
        {({ dragX, phase }) => (
          <div className="space-y-4">
            {trackerSports.map((ts, idx) => (
              <SportTrackerRow
                key={ts.id}
                trackerSport={ts}
                logs={logs}
                addLog={addLog}
                removeLog={removeLog}
                updateLog={updateLog}
                currentWeekStart={currentWeekStart}
                onSportChange={updateTrackerSport}
                onRemove={removeTrackerSport}
                canRemove={trackerSports.length > 1}
                isPrimary={idx === 0}
                trackDistance={appSettings.trackDistance}
                dragX={dragX}
                phase={phase}
              />
            ))}
          </div>
        )}
      </SwipeableWeek>

      {isMobile && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <MoveHorizontal className="w-3.5 h-3.5" />
          <span>Swipe left or right to change week</span>
        </div>
      )}

      <button type="button" onClick={handleAddSport} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors select-none">
        <Plus className="w-4 h-4" />Add sport
      </button>

      <CostTracker logs={logs} />
    </div>
  );
}
