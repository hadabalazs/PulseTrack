import { useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import Modal from '@/components/ui/dialog';

export default function SessionDialog({ target, logs, onClose, onOptions, updateLog, removeLog }) {
  const cancelRef = useRef(null);
  const log = logs.find(entry => entry.id === target?.id);
  const confirming = target?.mode === 'confirm';
  useEffect(() => { if (target && !log) onClose(); }, [target, log, onClose]);
  useEffect(() => { if (confirming) cancelRef.current?.focus(); }, [confirming]);
  if (!log) return null;
  const description = `${log.exercise} · ${format(parseISO(log.date.slice(0, 10)), 'EEEE, MMMM d, yyyy')}${log.distance != null ? ` · ${log.distance.toLocaleString()} m` : ''}`;
  return <Modal open onClose={onClose} title={confirming ? 'Do you want to uncheck the session?' : 'Session options'} description={description} returnFocus={target.origin} initialFocus={confirming ? cancelRef : undefined}>
    {confirming ? <>
      <p className="text-sm text-muted-foreground mb-5">Unchecking removes this session and its distance.</p>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" className="rounded-xl px-3 py-3 bg-destructive text-destructive-foreground font-medium" onClick={() => { removeLog(log.id); onClose(); }}>Yes</button>
        <button type="button" ref={cancelRef} className="rounded-xl border px-3 py-3 font-medium hover:bg-muted" onClick={onClose}>Cancel</button>
        <button type="button" className="rounded-xl border px-3 py-3 font-medium hover:bg-muted" onClick={() => onOptions({ ...target, mode: 'options' })}>Options</button>
      </div>
    </> : <>
      <div className="divide-y border rounded-2xl overflow-hidden">
        <label className="flex items-center gap-3 p-4 cursor-pointer"><input type="checkbox" className="h-5 w-5 accent-sky-500" checked={!!log.highlighted} onChange={e => updateLog(log.id, { highlighted: e.target.checked })} /><span><span className="font-medium block">Highlight Session</span><span className="text-xs text-muted-foreground">Mark this session with your highlight color.</span></span></label>
        <label className="flex items-center gap-3 p-4 cursor-pointer"><input type="checkbox" className="h-5 w-5 accent-sky-500" checked={!!log.excludePayment} onChange={e => updateLog(log.id, { excludePayment: e.target.checked })} /><span><span className="font-medium block">Exclude Payment</span><span className="text-xs text-muted-foreground">Keep the workout, exclude its session payment.</span></span></label>
      </div>
      <p className="text-xs text-muted-foreground mt-3">Changes save automatically.</p>
      <button type="button" className="mt-5 w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium" onClick={onClose}>Done</button>
    </>}
  </Modal>;
}
