import { useState, useRef } from "react";
import { useWorkoutLogs } from "@/lib/useWorkoutLogs";
import { useAppSettings } from "@/lib/useAppSettings";
import { Button } from "@/components/ui/button";
import { Trash2, Moon, Smartphone, Dumbbell, Download, Upload, CheckCircle, AlertCircle, Ruler, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

function Toggle({ checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none select-none", checked?"bg-primary":"bg-muted")}>
      <span className={cn("pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200", checked?"translate-x-5":"translate-x-0")}/>
    </button>
  );
}

function buildBackupFile(logs) {
  const filename = `pulsetrack-backup-${new Date().toISOString().slice(0,10)}.json`;
  const content = JSON.stringify(logs, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  return { filename, content, blob };
}

export default function Settings() {
  const { logs, clearAll } = useWorkoutLogs();
  const { appSettings, updateSetting } = useAppSettings();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [importMode, setImportMode] = useState(null);
  const [pendingLogs, setPendingLogs] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);
  const [shareMessage, setShareMessage] = useState("");
  const fileInputRef = useRef(null);

  const handleExportData = () => {
    const { filename, blob } = buildBackupFile(logs);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=filename; a.click(); URL.revokeObjectURL(url);
  };

  const handleShareBackup = async () => {
    setShareStatus(null); setShareMessage("");
    const { filename, blob } = buildBackupFile(logs);
    const file = new File([blob], filename, { type: "application/json" });
    const canShareFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

    if (navigator.share && canShareFiles) {
      try {
        await navigator.share({
          files: [file],
          title: "PulseTrack Backup",
          text: `PulseTrack backup — ${logs.length} workout${logs.length !== 1 ? "s" : ""}`,
        });
      } catch (err) {
        if (err?.name !== "AbortError") {
          setShareStatus("error");
          setShareMessage("Couldn't open the share sheet. Falling back to download.");
          handleExportData();
        }
      }
    } else {
      setShareStatus("info");
      setShareMessage("Sharing files isn't supported in this browser — downloaded instead.");
      handleExportData();
    }
  };

  const handleFileSelect = (e) => {
    const file=e.target.files?.[0]; if(!file)return;
    setImportStatus(null); setImportMessage("");
    const reader=new FileReader();
    reader.onload=(ev)=>{try{const parsed=JSON.parse(ev.target.result);if(!Array.isArray(parsed))throw new Error("Invalid format");if(!parsed.every(l=>l.id&&l.exercise&&l.date))throw new Error("File contains invalid workout entries");setPendingLogs(parsed);setImportMode("choose");}catch(err){setImportStatus("error");setImportMessage(err.message||"Could not read the backup file.");}};
    reader.readAsText(file); e.target.value="";
  };

  const handleImport = (mode) => {
    if(!pendingLogs)return;
    const KEY="workout_tracker_logs";
    if(mode==="replace"){localStorage.setItem(KEY,JSON.stringify(pendingLogs));setImportStatus("success");setImportMessage(`Restored ${pendingLogs.length} workout logs. Refreshing…`);}
    else{const ids=new Set(logs.map(l=>l.id));const newLogs=pendingLogs.filter(l=>!ids.has(l.id));localStorage.setItem(KEY,JSON.stringify([...logs,...newLogs]));setImportStatus("success");setImportMessage(`Merged ${newLogs.length} new logs (${pendingLogs.length-newLogs.length} duplicates skipped). Refreshing…`);}
    setPendingLogs(null);setImportMode(null);setTimeout(()=>window.location.reload(),1800);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-bold tracking-tight">Settings</h1><p className="text-sm text-muted-foreground mt-1">Manage your app preferences and data</p></div>

      <div className="rounded-2xl bg-card border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Ruler className="w-5 h-5 text-primary"/></div>
          <div className="flex-1"><h3 className="font-display font-semibold">Tracking Options</h3><p className="text-sm text-muted-foreground mt-1">Customise what data you log per session.</p></div>
        </div>
        <div className="flex items-center justify-between py-1">
          <div><p className="text-sm font-medium">Track distance (metres)</p><p className="text-xs text-muted-foreground mt-0.5">Log exercise distance and see distance stats</p></div>
          <Toggle checked={appSettings.trackDistance} onChange={v=>updateSetting("trackDistance",v)}/>
        </div>
      </div>

      <div className="rounded-2xl bg-card border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Smartphone className="w-5 h-5 text-primary"/></div>
          <div><h3 className="font-display font-semibold">Local Storage</h3><p className="text-sm text-muted-foreground mt-1">Your workout data is stored entirely on this device. Currently storing <span className="font-medium text-foreground">{logs.length}</span> workout{logs.length!==1?"s":""}.</p></div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center shrink-0"><Moon className="w-5 h-5 text-purple-500"/></div>
          <div><h3 className="font-display font-semibold">Appearance</h3><p className="text-sm text-muted-foreground mt-1">Dark mode follows your system preference.</p></div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0"><Download className="w-5 h-5 text-blue-500"/></div>
          <div className="flex-1"><h3 className="font-display font-semibold">Backup & Restore</h3><p className="text-sm text-muted-foreground mt-1">Download your logs for safekeeping, or restore from a previous backup.</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleShareBackup} className="select-none"><Share2 className="w-4 h-4 mr-2"/>Share Backup</Button>
          <Button variant="outline" onClick={handleExportData} className="select-none"><Download className="w-4 h-4 mr-2"/>Download Backup</Button>
          <Button variant="outline" onClick={()=>fileInputRef.current?.click()} className="select-none"><Upload className="w-4 h-4 mr-2"/>Restore from Backup</Button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect}/>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          <strong>Share Backup</strong> opens your device's share sheet so you can send the file to yourself by email, Messages, or any app.
        </p>
        {shareStatus==="info"&&<div className="flex items-center gap-2 text-sm text-muted-foreground"><Download className="w-4 h-4 shrink-0"/>{shareMessage}</div>}
        {shareStatus==="error"&&<div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="w-4 h-4 shrink-0"/>{shareMessage}</div>}
        {importMode==="choose"&&pendingLogs&&<div className="rounded-xl border bg-muted/40 p-4 space-y-3">
          <p className="text-sm font-medium">Found <span className="text-foreground">{pendingLogs.length}</span> workout logs. How would you like to import?</p>
          <div className="flex flex-wrap gap-2"><Button size="sm" onClick={()=>handleImport("merge")} className="select-none">Merge with existing</Button><Button size="sm" variant="destructive" onClick={()=>handleImport("replace")} className="select-none">Replace all data</Button><Button size="sm" variant="ghost" onClick={()=>{setPendingLogs(null);setImportMode(null);}} className="select-none">Cancel</Button></div>
          <p className="text-xs text-muted-foreground"><strong>Merge</strong> keeps current logs and adds new ones.<br/><strong>Replace</strong> wipes current data and restores the backup.</p>
        </div>}
        {importStatus==="success"&&<div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"><CheckCircle className="w-4 h-4 shrink-0"/>{importMessage}</div>}
        {importStatus==="error"&&<div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="w-4 h-4 shrink-0"/>{importMessage}</div>}
      </div>

      <div className="rounded-2xl bg-card border border-destructive/20 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0"><Trash2 className="w-5 h-5 text-destructive"/></div>
          <div className="flex-1"><h3 className="font-display font-semibold text-destructive">Clear All Data</h3><p className="text-sm text-muted-foreground mt-1">Permanently delete all {logs.length} workout log{logs.length!==1?"s":""} from this device.</p></div>
        </div>
        {confirmingClear?<div className="flex gap-2"><Button variant="destructive" onClick={()=>{clearAll();setConfirmingClear(false);}} className="select-none">Yes, delete everything</Button><Button variant="outline" onClick={()=>setConfirmingClear(false)} className="select-none">Cancel</Button></div>:
          <Button variant="destructive" onClick={()=>setConfirmingClear(true)} className="select-none">Clear All Data</Button>}
      </div>

      <div className="text-center text-xs text-muted-foreground pt-4 flex items-center justify-center gap-1.5"><Dumbbell className="w-3 h-3"/><span>PulseTrack · PWA Edition</span></div>
    </div>
  );
}
