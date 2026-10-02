import { useState, lazy, Suspense } from "react";
import { DollarSign, ChevronDown, ChevronUp, Plus, X, Merge, LayoutList, CalendarRange, RotateCcw, History, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCostTracker } from "@/lib/useCostTracker";
import { parseISO, isWithinInterval, differenceInDays, format, isValid, addYears } from "date-fns";
import { logDate } from "@/lib/dates";

const LifetimeStatsPanel = lazy(() => import("@/components/tracker/LifetimeStatsPanel"));

const EXERCISES = ["Running","Swimming","Cycling","Weight Training","Yoga","HIIT","Walking","Pilates","Football"];
function fmt(n) { return isNaN(n)||n===null?"0.00":Number(n).toFixed(2); }
function parseDateSafe(str) { if(!str)return null; const d=parseISO(str); return isValid(d)?d:null; }

/** Single source of truth for which logs count toward a subscription period. */
function countSessionsInPeriod(entry, logs) {
  const start = parseDateSafe(entry.startDate), end = parseDateSafe(entry.endDate);
  return logs.filter(l => {
    if (l.exercise !== entry.sport) return false;
    if (!start || !end) return true;
    const ld = logDate(l);
    return ld && isWithinInterval(ld, { start, end });
  }).length;
}

/** `spent` is capped at the subscription cost for display; `raw` is not, so "saved" keeps growing past break-even. */
function computeSpend(entry, sessionCount) {
  const sc = parseFloat(entry.sessionCost) || 0, yc = parseFloat(entry.yearlyCost) || 0;
  const raw = sc * sessionCount;
  const spent = Math.min(raw, yc > 0 ? yc : Infinity);
  return { sc, yc, raw, spent, remaining: yc - raw, broken: yc > 0 && yc - raw <= 0, pct: yc > 0 ? Math.min(100, (spent / yc) * 100) : 0 };
}

function ProgressBar({ pct, broken }) {
  return <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full transition-all duration-500",broken?"bg-emerald-500":"bg-primary")} style={{width:`${Math.min(100,pct)}%`}}/></div>;
}

function DateRangeRow({ entry, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const start=parseDateSafe(entry.startDate), end=parseDateSafe(entry.endDate), today=new Date();
  const startLabel=start?format(start,"dd MMM yyyy"):"—", endLabel=end?format(end,"dd MMM yyyy"):"—";
  let daysLeft=null,daysTotal=null,rangePct=0,expired=false;
  if(start&&end&&isValid(start)&&isValid(end)){daysTotal=differenceInDays(end,start);daysLeft=differenceInDays(end,today);expired=daysLeft<0;rangePct=daysTotal>0?Math.min(100,Math.max(0,(differenceInDays(today,start)/daysTotal)*100)):0;}
  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setExpanded(v=>!v)} className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors select-none">
        <CalendarRange className="w-3.5 h-3.5 shrink-0"/><span className="font-medium">Subscription period:</span><span className="ml-1">{startLabel} → {endLabel}</span>
        {daysLeft!==null&&!expired&&<span className={cn("ml-auto font-semibold shrink-0",daysLeft<=30?"text-orange-500":"text-muted-foreground")}>{daysLeft}d left</span>}
        {expired&&<span className="ml-auto font-semibold text-destructive shrink-0">Expired</span>}
        <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform",expanded&&"rotate-180")}/>
      </button>
      {expanded&&<div className="grid grid-cols-2 gap-2 pt-1">
        <div className="flex flex-col gap-1"><label className="text-xs text-muted-foreground font-medium">Start date</label><input type="date" value={entry.startDate||""} onChange={e=>onUpdate(entry.id,{startDate:e.target.value})} className="w-full px-2 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"/></div>
        <div className="flex flex-col gap-1"><label className="text-xs text-muted-foreground font-medium">End date</label><input type="date" value={entry.endDate||""} onChange={e=>onUpdate(entry.id,{endDate:e.target.value})} className="w-full px-2 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"/></div>
      </div>}
      {daysTotal!==null&&daysTotal>0&&<div className="space-y-1"><div className="w-full h-1.5 rounded-full bg-muted overflow-hidden"><div className={cn("h-full rounded-full transition-all duration-500",expired?"bg-destructive":daysLeft<=30?"bg-orange-400":"bg-blue-400")} style={{width:`${rangePct}%`}}/></div><p className="text-[10px] text-muted-foreground">{expired?`Subscription ended ${Math.abs(daysLeft)} days ago`:`${Math.round(rangePct)}% elapsed · ${daysLeft} days remaining`}</p></div>}
    </div>
  );
}

function ArchiveConfirm({ entry, sessionCount, totalSpent, broken, onConfirm, onCancel }) {
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <RotateCcw className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Archive this subscription & start fresh?</p>
          <p className="text-xs text-muted-foreground mt-1">
            This period ({sessionCount} sessions, AED {fmt(totalSpent)} spent{broken ? " — broke even" : ""}) will be
            saved to {entry.sport}'s history, viewable anytime from Lifetime Cost Stats. The cost fields and dates
            above reset to a fresh subscription starting today.
          </p>
        </div>
      </div>
      <label className="flex items-start gap-2 text-xs text-muted-foreground select-none cursor-pointer">
        <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-0.5 shrink-0" />
        <span>Yes, I've renewed — archive this period and reset the fields.</span>
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={onConfirm} disabled={!acknowledged}
          className={cn("flex-1 h-9 rounded-lg text-xs font-medium select-none transition-colors", acknowledged ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed")}>
          Archive & start new period
        </button>
        <button type="button" onClick={onCancel} className="h-9 px-3 rounded-lg border text-xs text-muted-foreground hover:text-foreground select-none">Cancel</button>
      </div>
    </div>
  );
}

function HistoryList({ entry, onDelete }) {
  const [open, setOpen] = useState(false);
  const history = entry.history || [];
  if (history.length === 0) return null;
  const lifetimeSpent = history.reduce((s, h) => s + (h.totalSpent || 0), 0);
  const lifetimeSessions = history.reduce((s, h) => s + (h.sessionCount || 0), 0);
  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors select-none">
        <History className="w-3.5 h-3.5 shrink-0" />
        <span className="font-medium">{history.length} past subscription{history.length !== 1 ? "s" : ""} archived</span>
        <span className="ml-auto">{lifetimeSessions} sessions · AED {fmt(lifetimeSpent)}</span>
        <ChevronDown className={cn("w-3 h-3 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.archivedId} className="rounded-lg border bg-background/60 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {h.startDate ? format(parseISO(h.startDate), "MMM yyyy") : "—"} – {h.endDate ? format(parseISO(h.endDate), "MMM yyyy") : "—"}
                </span>
                <button type="button" onClick={() => onDelete(entry.id, h.archivedId)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{h.sessionCount} sessions · AED {fmt(h.totalSpent)} spent</span>
                <span className={h.brokeEven ? "text-emerald-500 font-medium" : ""}>{h.brokeEven ? "Broke even ✓" : "Didn't break even"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SportCostRow({ entry, logs, onUpdate, onRemove, onArchive, onDeleteHistory }) {
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const start=parseDateSafe(entry.startDate), end=parseDateSafe(entry.endDate);
  const sessionCount=countSessionsInPeriod(entry, logs);
  const { yc, spent: totalSpent, remaining, broken, pct } = computeSpend(entry, sessionCount);
  const allTimeCount=logs.filter(l=>l.exercise===entry.sport).length;

  const handleArchive = () => {
    const today = new Date().toISOString().slice(0, 10);
    const nextEnd = addYears(new Date(), 1).toISOString().slice(0, 10);
    onArchive(entry.id, { sessionCount, totalSpent, brokeEven: broken }, { startDate: today, endDate: nextEnd });
    setConfirmingArchive(false);
  };

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between"><span className="font-medium text-sm">{entry.sport}</span><button type="button" onClick={() => onRemove(entry.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><X className="w-3.5 h-3.5"/></button></div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col"><label className="text-xs text-muted-foreground font-medium h-8 flex items-end pb-1">Cost / session (AED)</label><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">د.إ</span><input type="text" inputMode="decimal" value={entry.sessionCost} onChange={e=>onUpdate(entry.id,{sessionCost:e.target.value.replace(/[^\d.]/g,"")})} placeholder="0.00" className="w-full pl-7 pr-2 py-2.5 text-base sm:text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"/></div></div>
        <div className="flex flex-col"><label className="text-xs text-muted-foreground font-medium h-8 flex items-end pb-1">Subscription cost (AED)</label><div className="relative"><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">د.إ</span><input type="text" inputMode="decimal" value={entry.yearlyCost} onChange={e=>onUpdate(entry.id,{yearlyCost:e.target.value.replace(/[^\d.]/g,"")})} placeholder="0.00" className="w-full pl-7 pr-2 py-2.5 text-base sm:text-sm rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary"/></div></div>
      </div>
      <DateRangeRow entry={entry} onUpdate={onUpdate}/>
      {yc>0&&<div className="space-y-1.5"><ProgressBar pct={pct} broken={broken}/><div className="flex justify-between text-xs"><span className="text-muted-foreground">{sessionCount} session{sessionCount!==1?"s":""}{ start&&end&&allTimeCount!==sessionCount&&<span className="opacity-60"> in period ({allTimeCount} all-time)</span>} · AED {fmt(totalSpent)} spent</span><span className={broken?"text-emerald-500 font-semibold":"text-destructive font-semibold"}>{broken?`+AED ${fmt(Math.abs(remaining))} saved`:`AED ${fmt(remaining)} to go`}</span></div></div>}

      {confirmingArchive ? (
        <ArchiveConfirm entry={entry} sessionCount={sessionCount} totalSpent={totalSpent} broken={broken} onConfirm={handleArchive} onCancel={() => setConfirmingArchive(false)} />
      ) : (
        yc > 0 && (
          <button type="button" onClick={() => setConfirmingArchive(true)} className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg border border-dashed text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors select-none">
            <RotateCcw className="w-3.5 h-3.5" />Renewed? Archive & start new period
          </button>
        )
      )}

      <HistoryList entry={entry} onDelete={onDeleteHistory} />
    </div>
  );
}

function MergedSummary({ sports, logs }) {
  const totalSub=sports.reduce((s,e)=>s+(parseFloat(e.yearlyCost)||0),0);
  let totalSpent=0, totalRawSpent=0;
  sports.forEach(e=>{
    const { raw, spent } = computeSpend(e, countSessionsInPeriod(e, logs));
    totalRawSpent+=raw;
    totalSpent+=spent;
  });
  const remaining=totalSub-totalRawSpent;
  const broken=totalSub>0&&remaining<=0,pct=totalSub>0?Math.min(100,(totalSpent/totalSub)*100):0;
  if(totalSub===0)return <p className="text-sm text-muted-foreground text-center py-2">Add subscription costs to see combined break-even progress.</p>;
  return <div className="space-y-3"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Total spent across all sports</span><span className="font-semibold">AED {fmt(totalSpent)}</span></div><ProgressBar pct={pct} broken={broken}/><div className="flex justify-between text-sm"><span className="text-muted-foreground">{pct.toFixed(0)}% of AED {fmt(totalSub)}</span><span className={cn("font-bold",broken?"text-emerald-500":"text-destructive")}>{broken?`🎉 Saved AED ${fmt(Math.abs(remaining))}`:`AED ${fmt(remaining)} to break even`}</span></div></div>;
}

export default function CostTracker({ logs }) {
  const [addingNew,setAddingNew]=useState(false),[newSport,setNewSport]=useState(EXERCISES[0]);
  const [lifetimeOpen, setLifetimeOpen] = useState(false);
  const {settings,addSport,removeSport,updateSport,setView,setOpen,archiveAndRenew,deleteHistoryEntry}=useCostTracker();
  const open = settings.open;
  const handleAddSport=()=>{addSport(newSport);setAddingNew(false);setNewSport(EXERCISES[0]);};
  const hasAnyHistory = settings.sports.some(s => (s.history || []).length > 0);

  return (
    <div className="space-y-2">
      <button type="button" onClick={()=>setOpen(v=>!v)} className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors select-none">
        <DollarSign className="w-4 h-4 text-primary"/><span className="font-display font-semibold text-foreground">Cost Tracker</span><span className="ml-auto">{open?<ChevronUp className="w-4 h-4"/>:<ChevronDown className="w-4 h-4"/>}</span>
      </button>
      {open&&<div className="rounded-2xl border bg-card p-5 space-y-4">
        {settings.sports.length>1&&<div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
          <button onClick={()=>setView("separate")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all select-none",settings.view==="separate"?"bg-card text-foreground shadow-sm":"text-muted-foreground hover:text-foreground")}><LayoutList className="w-3.5 h-3.5"/>Separate</button>
          <button onClick={()=>setView("merged")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all select-none",settings.view==="merged"?"bg-card text-foreground shadow-sm":"text-muted-foreground hover:text-foreground")}><Merge className="w-3.5 h-3.5"/>Merged</button>
        </div>}
        {settings.sports.length===0&&!addingNew&&<p className="text-sm text-muted-foreground text-center py-2">Add a sport to start tracking costs.</p>}
        {(settings.view==="separate"||settings.sports.length<=1)?<div className="space-y-3">{settings.sports.map(e=><SportCostRow key={e.id} entry={e} logs={logs} onUpdate={updateSport} onRemove={removeSport} onArchive={archiveAndRenew} onDeleteHistory={deleteHistoryEntry}/>)}</div>:
          <div className="space-y-3">{settings.sports.map(e=><SportCostRow key={e.id} entry={e} logs={logs} onUpdate={updateSport} onRemove={removeSport} onArchive={archiveAndRenew} onDeleteHistory={deleteHistoryEntry}/>)}<div className="rounded-xl border bg-primary/5 border-primary/20 p-4 space-y-2"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Combined Progress</p><MergedSummary sports={settings.sports} logs={logs}/></div></div>}
        {addingNew?<div className="flex items-center gap-2"><select value={newSport} onChange={e=>setNewSport(e.target.value)} className="flex-1 h-10 px-3 text-sm rounded-xl border bg-background focus:outline-none focus:ring-1 focus:ring-primary">{EXERCISES.map(ex=><option key={ex} value={ex}>{ex}</option>)}</select><button type="button" onClick={handleAddSport} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium select-none">Add</button><button type="button" onClick={()=>setAddingNew(false)} className="h-10 px-3 rounded-xl border text-sm text-muted-foreground hover:text-foreground select-none">Cancel</button></div>:
          <button type="button" onClick={()=>setAddingNew(true)} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors select-none"><Plus className="w-4 h-4"/>Add sport cost</button>}

        {hasAnyHistory && (
          <div className="pt-1 space-y-2">
            <button type="button" onClick={() => setLifetimeOpen(v => !v)} className="w-full flex items-center justify-center gap-1.5 h-9 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
              <History className="w-3.5 h-3.5" />{lifetimeOpen ? "Hide lifetime stats" : "View lifetime stats"}
            </button>
            {lifetimeOpen && (
              <Suspense fallback={<div className="h-40 rounded-2xl border bg-card animate-pulse" />}>
                <LifetimeStatsPanel sports={settings.sports} />
              </Suspense>
            )}
          </div>
        )}
      </div>}
    </div>
  );
}
