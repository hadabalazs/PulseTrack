import { subWeeks, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";

export const RANGES = [
  { key: "4w",  label: "4W",  weeks: 4 },
  { key: "12w", label: "12W", weeks: 12 },
  { key: "6m",  label: "6M",  weeks: 26 },
  { key: "1y",  label: "1Y",  weeks: 52 },
  { key: "all", label: "All", weeks: null },
];

export function rangeCutoff(key) {
  const r = RANGES.find(x => x.key === key);
  if (!r || r.weeks == null) return null;
  return startOfWeek(subWeeks(new Date(), r.weeks - 1), { weekStartsOn: 1 });
}

export default function RangeSelector({ value, onChange }) {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center gap-1 bg-muted rounded-xl p-1">
        {RANGES.map(r => (
          <button key={r.key} type="button" onClick={() => onChange(r.key)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all select-none min-w-[42px]", value === r.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
