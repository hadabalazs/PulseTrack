import { useMemo } from 'react';
import { Award, ArrowUpRight } from 'lucide-react';
import { groupMedals } from '@/lib/medals/evaluateMedals';
import { medalTitle, scopeForSport } from '@/lib/medals/catalog';
import MedalPoster from './MedalPoster';

export default function WeeklyMedalStrip({ medals = [], sport, weekStart, onOpen }) {
  const groups = useMemo(() => groupMedals(medals, { scope: scopeForSport(sport), weekStart }), [medals, sport, weekStart]);
  return <section className="border-t pt-3" aria-label={`${sport} medals this week`} data-no-week-swipe>
    <div className="flex items-center justify-between gap-2 mb-2"><h3 className="text-xs font-semibold flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-primary" />Medals this week</h3><button type="button" className="text-xs text-primary font-medium min-h-9 flex items-center gap-1 shrink-0" onClick={e => onOpen({ sport, weekStart, origin: e.currentTarget })}>See all medals<ArrowUpRight className="w-3 h-3" /></button></div>
    {groups.length ? <div className="flex overflow-x-auto overscroll-x-contain gap-1 pb-1" aria-label="Earned medals">
      {groups.map(group => <button type="button" key={group.key} className="relative shrink-0 w-[calc((100%-1rem)/5)] min-w-[3.25rem] rounded-xl hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${medalTitle(group.definition)}, achieved ${group.count} ${group.count === 1 ? 'time' : 'times'} this week. Inspect medal`} onClick={e => onOpen({ sport, weekStart, selectedKey: group.key, origin: e.currentTarget })}>
        <MedalPoster definition={group.definition} className="w-full aspect-square" />{group.count > 1 && <span className="absolute bottom-0 right-0 rounded-full bg-muted text-[10px] px-1.5">×{group.count}</span>}
      </button>)}
    </div> : <p className="text-xs text-muted-foreground py-2">No medals earned this week yet.</p>}
  </section>;
}
