import { useState } from "react";
import { ChevronDown, Check, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const SPORT_COLOURS = ["hsl(var(--primary))","#f97316","#22c55e","#a855f7","#ec4899","#14b8a6","#eab308","#ef4444","#3b82f6"];

function colourFor(sport, sports) {
  const idx = sports.indexOf(sport);
  return SPORT_COLOURS[(idx >= 0 ? idx : 0) % SPORT_COLOURS.length];
}

export default function SportFilter({ sports, value, onChange }) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (sports.length === 0) return null;

  const label = value === "all" ? "All types" : value;
  const dotColour = value === "all" ? null : colourFor(value, sports);

  const TriggerButton = (
    <button type="button" className="inline-flex items-center gap-2 h-9 pl-3 pr-2.5 rounded-xl border bg-card text-sm font-medium hover:border-primary/30 transition-colors select-none">
      <ListFilter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      {dotColour && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColour }} />}
      <span className="truncate max-w-[140px]">{label}</span>
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    </button>
  );

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-auto min-w-[132px] gap-2 rounded-xl text-sm px-3">
          <ListFilter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <SelectValue placeholder="All types">
            <span className="flex items-center gap-1.5">
              {dotColour && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColour }} />}
              {label}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {sports.map((s, i) => (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: SPORT_COLOURS[i % SPORT_COLOURS.length] }} />
                {s}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader><DrawerTitle>Workout Type</DrawerTitle></DrawerHeader>
        <div className="px-4 pb-8 space-y-1 max-h-[60vh] overflow-y-auto">
          <button type="button" onClick={() => { onChange("all"); setDrawerOpen(false); }}
            className={cn("w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-colors select-none", value === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
            All types
            {value === "all" && <Check className="w-4 h-4" strokeWidth={3} />}
          </button>
          {sports.map((s, i) => (
            <button key={s} type="button" onClick={() => { onChange(s); setDrawerOpen(false); }}
              className={cn("w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-base font-medium transition-colors select-none", value === s ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SPORT_COLOURS[i % SPORT_COLOURS.length] }} />
              <span className="flex-1 text-left">{s}</span>
              {value === s && <Check className="w-4 h-4" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
