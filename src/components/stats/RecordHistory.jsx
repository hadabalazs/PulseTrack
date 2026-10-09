import { useMemo } from "react";
import { format } from "date-fns";
import { Trophy } from "lucide-react";
import { distanceRecords } from "@/lib/distanceRecords";
import { logDate } from "@/lib/dates";

const metres = value => `${value.toLocaleString()} m`;

export default function RecordHistory({ logs }) {
  const groups = useMemo(() => {
    const bySport = new Map();
    distanceRecords(logs).forEach(record => {
      if (!bySport.has(record.exercise)) bySport.set(record.exercise, []);
      bySport.get(record.exercise).push(record);
    });
    return [...bySport.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [logs]);

  return (
    <section className="rounded-2xl bg-card border p-6 space-y-5" aria-labelledby="record-history-heading">
      <div className="space-y-1">
        <h3 id="record-history-heading" className="flex items-center gap-2 font-display font-semibold">
          <Trophy className="w-5 h-5 text-amber-500" />Distance Records
        </h3>
        <p className="text-xs text-muted-foreground">All-time personal bests for each sport. Gold marks a new record; matching it doesn’t count.</p>
      </div>
      {groups.length === 0 && <p className="text-sm text-muted-foreground">Log a distance to set your first record.</p>}
      {groups.map(([sport, records]) => {
        const best = records[records.length - 1].distance;
        return (
          <div key={sport} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <h4 className="text-sm font-semibold">{sport}</h4>
              <span className="text-xs text-muted-foreground">{records.length} record{records.length !== 1 ? "s" : ""} · Best {metres(best)}</span>
            </div>
            <ol className="space-y-3" aria-label={`${sport} record distances, oldest first`}>
              {records.map(record => (
                <li key={record.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">{format(logDate(record), "d MMM yyyy")}</span>
                    <span className="font-semibold tabular-nums">{metres(record.distance)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${record.distance / best * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{record.previous === 0 ? "First record" : `+${metres(record.improvement)} from previous record`}</p>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </section>
  );
}
