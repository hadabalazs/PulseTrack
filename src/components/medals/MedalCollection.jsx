import { useMemo } from 'react';
import { Award, ArrowUpRight } from 'lucide-react';
import { groupMedals } from '@/lib/medals/evaluateMedals';
import { METAL_LABELS, medalTitle, scopeLabel } from '@/lib/medals/catalog';
import MedalPoster from './MedalPoster';

export default function MedalCollection({ awards, onOpen }) {
  const groups = useMemo(() => groupMedals(awards), [awards]);
  return <section className="rounded-2xl bg-card border p-4 sm:p-6" aria-label="Lifetime medal collection">
    <div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Medal collection</h2></div><button type="button" className="text-xs text-primary font-semibold min-h-10 flex items-center gap-1 shrink-0" onClick={e => onOpen({ origin: e.currentTarget })}>Browse collection<ArrowUpRight className="h-3 w-3" /></button></div>
    {groups.length ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">{groups.map(group => <button type="button" key={group.key} className="rounded-2xl border bg-background/40 hover:bg-muted p-3 text-center" aria-label={`${medalTitle(group.definition)}, ${scopeLabel(group.scopeKey)}, achieved ${group.count} times. Inspect medal`} onClick={e => onOpen({ selectedKey: group.key, origin: e.currentTarget })}>
      <MedalPoster definition={group.definition} className="w-full h-24 sm:h-32" /><p className="text-[11px] text-muted-foreground mt-1 truncate">{METAL_LABELS[group.definition.metal]} · {scopeLabel(group.scopeKey)}</p><p className="text-sm font-semibold mt-1">{medalTitle(group.definition)}</p><p className="text-xs text-primary font-medium mt-1">Achieved {group.count} {group.count === 1 ? 'time' : 'times'}</p>
    </button>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">No medals unlocked yet.</p>}
  </section>;
}
