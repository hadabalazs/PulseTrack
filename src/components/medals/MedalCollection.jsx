import { useMemo, useState } from 'react';
import { Award, ArrowUpRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { groupMedals } from '@/lib/medals/evaluateMedals';
import { FAMILY_LABELS, METAL_LABELS, medalTitle, scopeLabel } from '@/lib/medals/catalog';
import MedalPoster from './MedalPoster';

export default function MedalCollection({ awards, onOpen }) {
  const [scope, setScope] = useState(''), [family, setFamily] = useState(''), [limit, setLimit] = useState(6);
  const groups = useMemo(() => groupMedals(awards, { scope, family }), [awards, scope, family]);
  const scopes = useMemo(() => [...new Set(awards.map(award => award.scopeKey))].sort((a,b) => scopeLabel(a).localeCompare(scopeLabel(b))), [awards]);
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  return <section className="rounded-2xl bg-card border p-4 sm:p-6" aria-label="Lifetime medal collection">
    <div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-lg font-bold flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Medal collection</h2><p className="text-xs text-muted-foreground mt-1">Every achievement, across your workout history.</p></div><button type="button" className="text-xs text-primary font-semibold min-h-10 flex items-center gap-1 shrink-0" onClick={e => onOpen({ origin: e.currentTarget, scope, family })}>Browse collection<ArrowUpRight className="h-3 w-3" /></button></div>
    <div className="flex flex-wrap gap-5 my-4"><p><span className="font-display text-2xl font-bold">{groups.length}</span><span className="text-xs text-muted-foreground ml-2">unique medals</span></p><p><span className="font-display text-2xl font-bold">{total}</span><span className="text-xs text-muted-foreground ml-2">total achievements</span></p></div>
    <div className="grid grid-cols-2 gap-2 mb-4"><select aria-label="Collection sport" value={scope} onChange={e => { setScope(e.target.value);setLimit(6); }} className="bg-background border rounded-xl p-2.5 text-sm min-w-0"><option value="">All sports</option>{scopes.map(key => <option key={key} value={key}>{scopeLabel(key)}</option>)}</select><select aria-label="Collection category" value={family} onChange={e => { setFamily(e.target.value);setLimit(6); }} className="bg-background border rounded-xl p-2.5 text-sm min-w-0"><option value="">Every collection</option>{Object.entries(FAMILY_LABELS).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></div>
    {groups.length ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{groups.slice(0,limit).map(group => <button type="button" key={group.key} className="rounded-2xl border bg-background/40 hover:bg-muted p-3 text-center" aria-label={`${medalTitle(group.definition)}, ${scopeLabel(group.scopeKey)}, achieved ${group.count} times. Inspect medal`} onClick={e => onOpen({ selectedKey: group.key, origin: e.currentTarget, scope, family })}>
      <MedalPoster definition={group.definition} className="w-full h-24 sm:h-32" /><p className="text-[11px] text-muted-foreground mt-1 truncate">{METAL_LABELS[group.definition.metal]} · {scopeLabel(group.scopeKey)}</p><p className="text-sm font-semibold mt-1">{medalTitle(group.definition)}</p><p className="text-xs text-primary font-medium mt-1">Achieved {group.count} {group.count === 1 ? 'time' : 'times'}</p><p className="text-[11px] text-muted-foreground mt-1">Latest {format(parseISO(group.latest),'MMM d, yyyy')}</p>
    </button>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Your earned medals will appear here. Every sport counts.</p>}
    {groups.length > limit && <button type="button" className="mt-4 w-full rounded-xl border py-3 text-sm font-medium hover:bg-muted" onClick={() => setLimit(value => value + 12)}>Show more medals ({groups.length - limit} remaining)</button>}
    <p className="text-[11px] text-muted-foreground mt-4">Each sport and threshold is a distinct medal. Repeat counts represent separate qualifying periods. Counts follow your saved workout history.</p>
  </section>;
}
