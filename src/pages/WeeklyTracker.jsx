import { useMemo, useState, useCallback } from "react";
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
import { useSports } from "@/lib/useSports";
import { useMedals } from '@/lib/useMedals';
import SessionDialog from '@/components/tracker/SessionDialog';
import MedalFlow from '@/components/medals/MedalFlow';

export default function WeeklyTracker() {
  const { sports } = useSports();
  const [currentWeekStart, setCurrentWeekStart] = useSelectedWeek();
  const { logs: rawLogs, addLog, updateLog, removeLog } = useWorkoutLogs();
  const { trackerSports, addTrackerSport, removeTrackerSport, updateTrackerSport } = useTrackerSports();
  const { appSettings } = useAppSettings();
  const isMobile = useIsMobile();
  const [sessionTarget, setSessionTarget] = useState(null);
  const [medalTarget, setMedalTarget] = useState(null);
  const closeSession = useCallback(() => setSessionTarget(null), []);
  const closeMedals = useCallback(() => setMedalTarget(null), []);
  const medals = useMedals(rawLogs);

  const logs = useMemo(() => enrichLogs(rawLogs), [rawLogs]);

  const handleAddSport = () => {
    const used = new Set(trackerSports.map(s => s.sport));
    addTrackerSport(sports.find(e => !used.has(e)) || sports[0]);
  };

  return (
    <div className="space-y-4">
      <WeekNavigator currentWeekStart={currentWeekStart} onWeekChange={setCurrentWeekStart} />

      <SwipeableWeek currentWeekStart={currentWeekStart} onWeekChange={setCurrentWeekStart} disabled={!!sessionTarget || !!medalTarget}>
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
                showSessionHighlights={appSettings.showSessionHighlights}
                sessionHighlightColor={appSettings.sessionHighlightColor}
                onSessionIntent={setSessionTarget}
                medals={medals}
                onOpenMedals={setMedalTarget}
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
      <SessionDialog target={sessionTarget} logs={rawLogs} onClose={closeSession} onOptions={setSessionTarget} updateLog={updateLog} removeLog={removeLog} />
      {medalTarget && <MedalFlow target={medalTarget} awards={medals} onClose={closeMedals} />}
    </div>
  );
}
