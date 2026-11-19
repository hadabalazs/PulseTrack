import { useState, useMemo, useCallback, memo } from "react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { X, ChevronDown, Check, Flame, Dumbbell, Ruler, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { SETTLE_MS } from "@/components/tracker/SwipeableWeek";
import { distanceRecords } from "@/lib/distanceRecords";
import { logKey, logDate } from "@/lib/dates";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSports } from "@/lib/useSports";
import DailyStreakCelebration from "@/components/tracker/DailyStreakCelebration";
import { useLongPress } from '@/hooks/useLongPress';
import { sessionTapIntent } from '@/lib/sessionInteractions';
import WeeklyMedalStrip from '@/components/medals/WeeklyMedalStrip';

const CENTRE = -100 / 3;
const EASE = "cubic-bezier(0.22, 0.61, 0.36, 1)";
const EMPTY_DRAFTS = Object.freeze({});

function SessionButton({ date, interactive, onToggle, onOptions, ...props }) {
  const gestures = useLongPress({ disabled: !interactive, onTap: origin => onToggle(date, origin), onHold: origin => onOptions(date, origin) });
  return <button {...props} {...gestures} style={{ ...props.style, WebkitTouchCallout: 'none' }} disabled={!interactive} />;
}

function SportSelector({ sport, id, onSportChange, isMobile, drawerOpen, setDrawerOpen }) {
  const { sports } = useSports();
  if (!isMobile) {
    return (
      <Select value={sport} onValueChange={(v) => onSportChange(id, v)}>
        <SelectTrigger className="h-10 text-sm font-medium rounded-xl flex-1"><SelectValue /></SelectTrigger>
        <SelectContent>{sports.map(ex => <SelectItem key={ex} value={ex}>{ex}</SelectItem>)}</SelectContent>
      </Select>
    );
  }
  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <button type="button" className="h-10 text-sm font-medium rounded-xl flex-1 flex items-center justify-between px-3 bg-background border hover:border-primary/30 transition-colors select-none">
          <span>{sport}</span><ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>Select Sport</DrawerTitle></DrawerHeader>
        <div
          // Let the list scroll and its buttons receive clicks without Vaul capturing the pointer for a drag.
          onPointerDown={e => e.stopPropagation()}
          data-vaul-no-drag
          className="px-4 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-1 max-h-[60dvh] overflow-y-auto overscroll-contain"
        >
          {sports.map(ex => (
            <button key={ex} type="button" onClick={() => { onSportChange(id, ex); setDrawerOpen(false); }}
              className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-colors select-none", ex === sport ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              {ex}{ex === sport && <Check className="w-4 h-4" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** @typedef {{ days: any[], interactive: boolean, trackDistance: boolean, draftValues: Record<string,string>, onToggle: Function, onOptions: Function, onDistanceChange: Function, showSessionHighlights: boolean, sessionHighlightColor: string }} DayGridProps */
const DayGrid = memo(/** @param {DayGridProps} props */ function DayGrid({ days, interactive, trackDistance, draftValues, onToggle, onOptions, onDistanceChange, showSessionHighlights, sessionHighlightColor }) {
  return (
    <div
      className={cn("grid grid-cols-7 gap-1.5 shrink-0", !interactive && "pointer-events-none")}
      style={{ width: "33.3333%" }}
    >
      {days.map(day => (
        <div key={day.date} className="flex flex-col gap-1">
          <SessionButton
            type="button"
            date={day.date} interactive={interactive} onToggle={onToggle} onOptions={onOptions}
            style={day.isHighlighted && showSessionHighlights ? { outline: `2px solid ${sessionHighlightColor}`, outlineOffset: "-2px" } : undefined}
            aria-pressed={day.isCompleted}
            aria-label={`${day.date}${day.isHighlighted ? ", highlighted session" : ""}${day.isRecord ? `, distance record: ${day.distance} metres` : ""}`}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-colors duration-200",
              day.isRecord
                ? "bg-amber-400 text-amber-950 border-amber-500 shadow-sm shadow-amber-500/20"
                : day.isCompleted
                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                : "bg-muted/40 border-border hover:border-primary/30",
              day.isToday && !day.isCompleted && "ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
            )}
          >
            <span className={cn("text-[10px] font-medium", day.isRecord ? "text-amber-950/80" : day.isCompleted ? "text-primary-foreground/80" : "text-muted-foreground")}>{day.name}</span>
            <span className={cn("text-sm font-bold", day.isRecord ? "text-amber-950" : day.isCompleted ? "text-primary-foreground" : "text-foreground")}>{day.dayNumber}</span>
            {day.isRecord ? <Trophy className="w-4 h-4 text-amber-950" aria-hidden="true" /> : <div className={cn("w-4 h-4 rounded-md border-2 flex items-center justify-center", day.isCompleted ? "bg-primary-foreground/20 border-primary-foreground" : "border-muted-foreground/30")}>
              {day.isCompleted && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
            </div>}
          </SessionButton>

          {interactive && day.isCompleted && <button type="button" className="sr-only focus:not-sr-only focus:rounded-lg focus:p-1 focus:text-xs" onClick={e => onOptions(day.date, e.currentTarget)} aria-label={`Session options for ${day.date}`}>Options</button>}

          {trackDistance && day.isCompleted && (
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="done"
              autoComplete="off"
              placeholder="m"
              aria-label={`Distance in metres for ${day.date}`}
              value={draftValues[day.date] ?? (day.distance != null ? String(day.distance) : "")}
              onChange={(e) => onDistanceChange(day.date, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              className="w-full text-center leading-none rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary distance-input"
            />
          )}
        </div>
      ))}
    </div>
  );
});

export default function SportTrackerRow({
  trackerSport, logs, addLog, removeLog, updateLog, currentWeekStart,
  onSportChange, onRemove, canRemove, isPrimary, trackDistance,
  showSessionHighlights, sessionHighlightColor, onSessionIntent, medals, onOpenMedals,
  dragX = 0, phase = "idle",
}) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const draftValues = EMPTY_DRAFTS;
  const { sport, id } = trackerSport;

  const exerciseLogs = useMemo(() => logs.filter(l => l.exercise === sport), [logs, sport]);

  const recordIds = useMemo(() => new Set(distanceRecords(exerciseLogs).map(log => log.id)), [exerciseLogs]);

  const logByDate = useMemo(() => {
    const m = {};
    exerciseLogs.forEach(l => { m[logKey(l)] = l; });
    return m;
  }, [exerciseLogs]);

  const daysFor = useCallback((weekStart) => Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const log = logByDate[dateStr];
    return {
      name: format(date, "EEE"),
      date: dateStr,
      dayNumber: format(date, "d"),
      isCompleted: !!log,
      logId: log?.id,
      isHighlighted: !!log?.highlighted,
      excludePayment: !!log?.excludePayment,
      isRecord: !!log && recordIds.has(log.id),
      isToday: isSameDay(date, new Date()),
      distance: log?.distance ?? null,
    };
  }), [logByDate, recordIds]);

  const weeks = useMemo(
    () => [subWeeks(currentWeekStart, 1), currentWeekStart, addWeeks(currentWeekStart, 1)],
    [currentWeekStart]
  );

  const weekDays = useMemo(() => weeks.map(daysFor), [weeks, daysFor]);

  const streak = useMemo(() => {
    const weekSet = new Set();
    exerciseLogs.forEach(l => {
      weekSet.add(format(startOfWeek(logDate(l), { weekStartsOn: 1 }), "yyyy-MM-dd"));
    });
    let count = 0;
    let checkWeek = currentWeekStart;
    if (!weekSet.has(format(checkWeek, "yyyy-MM-dd"))) checkWeek = subWeeks(checkWeek, 1);
    while (weekSet.has(format(checkWeek, "yyyy-MM-dd"))) { count++; checkWeek = subWeeks(checkWeek, 1); }
    return count;
  }, [exerciseLogs, currentWeekStart]);

  const handleToggle = useCallback((dateStr, origin) => {
    const existing = logByDate[dateStr];
    const intent = sessionTapIntent(existing);
    if (intent === 'confirm') onSessionIntent({ id: existing.id, mode: 'confirm', origin });
    else if (intent === 'remove') removeLog(existing.id);
    else addLog(sport, dateStr);
  }, [logByDate, removeLog, addLog, sport, onSessionIntent]);
  const handleOptions = useCallback((dateStr, origin) => {
    const existing = logByDate[dateStr];
    if (existing) onSessionIntent({ id: existing.id, mode: 'options', origin });
  }, [logByDate, onSessionIntent]);
  // Persist by exact ID immediately: no delayed save can cross sports or survive removal.
  const handleDistanceChange = useCallback((dateStr, raw) => {
    const cleaned = raw.replace(/[^\d]/g, "");
    const log = logByDate[dateStr];
    const value = cleaned === '' ? null : Number(cleaned);
    if (log && (value === null || Number.isFinite(value))) updateLog(log.id, { distance: value });
  }, [updateLog, logByDate]);

  let trackTransform;
  if (phase === "next")      trackTransform = "translateX(-66.6667%)";
  else if (phase === "prev") trackTransform = "translateX(0%)";
  else                       trackTransform = `translateX(calc(${CENTRE}% + ${dragX}px))`;

  const animating = phase === "next" || phase === "prev" || phase === "back";
  const currentDays = weekDays[1];

  return (
    <div className="rounded-2xl bg-card border p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground w-16 shrink-0">{isPrimary ? "Primary" : "Sport"}</span>
        <SportSelector
          sport={sport} id={id} onSportChange={onSportChange}
          isMobile={isMobile} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}
        />
        {canRemove && (
          <button type="button" onClick={() => onRemove(id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors select-none shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <DailyStreakCelebration logs={logs} sport={sport} />

      <div className="overflow-hidden -mx-1 px-1">
        <div
          className="flex"
          style={{
            width: "300%",
            transform: trackTransform,
            transition: animating ? `transform ${SETTLE_MS}ms ${EASE}` : "none",
            willChange: "transform",
          }}
        >
          {weeks.map((w, i) => {
            const isCurrent = i === 1;
            return (
              <DayGrid
                key={format(w, "yyyy-MM-dd")}
                days={weekDays[i]}
                interactive={isCurrent && phase === "idle"}
                trackDistance={trackDistance}
                showSessionHighlights={showSessionHighlights}
                sessionHighlightColor={sessionHighlightColor}
                draftValues={isCurrent ? draftValues : EMPTY_DRAFTS}
                onToggle={handleToggle}
                onOptions={handleOptions}
                onDistanceChange={handleDistanceChange}
              />
            );
          })}
        </div>
      </div>

      <WeeklyMedalStrip medals={medals} sport={sport} weekStart={currentWeekStart} onOpen={onOpenMedals} />
      <p className="text-[11px] text-muted-foreground">Hold a checked session for options.</p>

      {trackDistance && currentDays.some(d => d.isCompleted) && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Ruler className="w-3 h-3" /><span>Enter distance in metres below each session</span>
        </div>
      )}

      {currentDays.some(day => day.isRecord) && (
        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Trophy className="w-3 h-3 text-amber-500" />Gold = a new distance record on that day</p>
      )}

      <div className="flex gap-3">
        <div className={cn("flex items-center gap-2 flex-1 rounded-xl px-3 py-2", streak > 0 ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/30" : "bg-muted/50 border border-border")}>
          <Flame className={cn("w-4 h-4 shrink-0", streak > 0 ? "text-orange-500" : "text-muted-foreground")} />
          <div><span className="font-display text-lg font-bold">{streak}</span><span className="text-xs text-muted-foreground ml-1">wk streak</span></div>
        </div>
        <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2 bg-muted/50 border border-border">
          <Dumbbell className="w-4 h-4 text-primary shrink-0" />
          <div><span className="font-display text-lg font-bold">{exerciseLogs.length}</span><span className="text-xs text-muted-foreground ml-1">total</span></div>
        </div>
      </div>
    </div>
  );
}
