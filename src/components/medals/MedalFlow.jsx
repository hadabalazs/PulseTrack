import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Award } from 'lucide-react';
import Modal from '@/components/ui/dialog';
import { groupMedals } from '@/lib/medals/evaluateMedals';
import { FAMILY_LABELS, METAL_LABELS, medalTitle, scopeForSport, scopeLabel } from '@/lib/medals/catalog';
import MedalPoster from './MedalPoster';

const MedalStage = lazy(() => import('./three/MedalStage'));
class RenderBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function Posters({ groups, onInspect }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{groups.map(group => <button key={group.key} type="button" className="rounded-xl p-2 hover:bg-muted" onClick={() => onInspect?.(group.key)}><MedalPoster definition={group.definition} className="w-full aspect-square" /><p className="text-sm">{medalTitle(group.definition)}</p><p className="text-xs text-muted-foreground">{METAL_LABELS[group.definition.metal]} · {scopeLabel(group.scopeKey)} · ×{group.count}</p></button>)}</div>;
}

export default function MedalFlow({ target, awards, onClose }) {
  const [scope, setScope] = useState(target.scope ?? (target.sport ? scopeForSport(target.sport) : ''));
  const [period, setPeriod] = useState(target.weekStart ? 'week' : 'all');
  const [family, setFamily] = useState(target.family || ''), [selectedKey, setSelectedKey] = useState(target.selectedKey || null);
  const scrollRef = useRef(null), savedScroll = useRef(0), historyRef = useRef({ token: `medals-${Date.now()}`, depth: 0 });
  const closeRef = useRef(onClose);closeRef.current = onClose;
  const allGroups = useMemo(() => groupMedals(awards), [awards]);
  const scopes = useMemo(() => [...new Set([...awards.map(award => award.scopeKey), ...(target.sport ? [scopeForSport(target.sport)] : []), ...(target.scope ? [target.scope] : [])])].sort((a,b) => scopeLabel(a).localeCompare(scopeLabel(b))), [awards, target.sport, target.scope]);
  const groups = useMemo(() => groupMedals(awards, { scope, family, weekStart: period === 'week' ? target.weekStart : null }), [awards, scope, family, period, target.weekStart]);
  const selected = allGroups.find(group => group.key === selectedKey);
  const single = useMemo(() => selected ? [selected] : [], [selected]);
  const historyPush = useCallback(view => {
    const state = historyRef.current;window.history.pushState({ ...window.history.state, medalToken: state.token, medalView: view }, '');state.depth++;
  }, []);
  useEffect(() => {
    // Defer until after StrictMode's probe cleanup; never leave phantom history entries.
    let active = true;
    queueMicrotask(() => { if (active) { historyPush('browser');if (target.selectedKey) historyPush('inspector'); } });
    const onPop = event => {
      const state = historyRef.current;
      if (event.state?.medalToken === state.token) { state.depth = 1;setSelectedKey(null); }
      else { state.depth = 0;closeRef.current(); }
    };
    window.addEventListener('popstate', onPop);
    return () => { active = false;window.removeEventListener('popstate', onPop);if (window.history.state?.medalToken === historyRef.current.token && historyRef.current.depth) window.history.go(-historyRef.current.depth); };
  }, [historyPush, target.selectedKey]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.parentElement.scrollTop = selectedKey ? 0 : savedScroll.current;
  }, [selectedKey]);
  const inspect = useCallback(key => {
    savedScroll.current = scrollRef.current?.parentElement.scrollTop || 0;setSelectedKey(key);historyPush('inspector');
  }, [historyPush]);
  const back = () => { if (window.history.state?.medalView === 'inspector') window.history.back();else setSelectedKey(null); };
  const fallback = <><Posters groups={selected ? single : groups} onInspect={selected ? undefined : inspect} /><p className="text-xs text-muted-foreground text-center my-3">Medal images are available while 3D loads. If you are offline, reconnect once to load rotation.</p></>;
  return <Modal open fullScreen onClose={onClose} onBack={selectedKey ? back : undefined} title={selected ? medalTitle(selected.definition) : 'Medal collection'} description={selected ? scopeLabel(selected.scopeKey) : 'Your effort, worth collecting.'} returnFocus={target.origin}>
    <div ref={scrollRef}>
      {selectedKey ? <>
        <button type="button" className="text-sm flex items-center gap-1 text-primary min-h-10 mb-1" onClick={back}><ArrowLeft className="w-4 h-4" />Back to collection</button>
        {selected ? <>
          <RenderBoundary fallback={fallback}><Suspense fallback={fallback}><MedalStage groups={single} inspect /></Suspense></RenderBoundary>
          <div className="text-center max-w-xl mx-auto mt-4"><span className="text-xs font-semibold uppercase tracking-widest text-primary">{FAMILY_LABELS[selected.definition.family]} · {METAL_LABELS[selected.definition.metal]}</span><p className="text-sm mt-2">{selected.definition.rule}</p><p className="font-display font-bold text-lg mt-3">Achieved {selected.count} {selected.count === 1 ? 'time' : 'times'}</p><p className="text-xs text-muted-foreground mt-1">Lifetime count · drag to rotate</p></div>
          <div className="max-w-xl mx-auto mt-5 border-t pt-4"><h3 className="text-sm font-semibold mb-2">Achievement history</h3><ul className="space-y-2">{selected.instances.map(instance => <li key={instance.awardId} className="flex items-center gap-2 text-sm rounded-xl bg-muted/40 px-3 py-2"><Award className="w-4 h-4 text-primary shrink-0" /><span>{format(parseISO(instance.earnedDate), 'MMMM d, yyyy')}</span>{target.weekStart && instance.earnedDate >= format(target.weekStart,'yyyy-MM-dd') && instance.earnedDate <= format(new Date(target.weekStart.getFullYear(),target.weekStart.getMonth(),target.weekStart.getDate()+6),'yyyy-MM-dd') && <span className="text-xs text-primary ml-auto">Selected week</span>}</li>)}</ul></div>
        </> : <p className="py-12 text-center text-muted-foreground">This medal no longer qualifies after your workout history changed.</p>}
      </> : <>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          <label className="text-xs text-muted-foreground">Sport<select aria-label="Medal sport" value={scope} onChange={e => { setScope(e.target.value);savedScroll.current = 0;if (scrollRef.current) scrollRef.current.parentElement.scrollTop = 0; }} className="mt-1 w-full bg-background border text-foreground rounded-xl p-2.5 text-sm"><option value="">All medals</option>{scopes.map(key => <option key={key} value={key}>{scopeLabel(key)}</option>)}</select></label>
          <label className="text-xs text-muted-foreground">Collection<select aria-label="Medal category" value={family} onChange={e => { setFamily(e.target.value);savedScroll.current = 0;if (scrollRef.current) scrollRef.current.parentElement.scrollTop = 0; }} className="mt-1 w-full bg-background border text-foreground rounded-xl p-2.5 text-sm"><option value="">Every collection</option>{Object.entries(FAMILY_LABELS).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="text-xs text-muted-foreground">Period<select aria-label="Medal period" value={period} onChange={e => { setPeriod(e.target.value);savedScroll.current = 0;if (scrollRef.current) scrollRef.current.parentElement.scrollTop = 0; }} className="mt-1 w-full bg-background border text-foreground rounded-xl p-2.5 text-sm"><option value="all">All time</option>{target.weekStart && <option value="week">Week of {format(target.weekStart,'MMM d, yyyy')}</option>}</select></label>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Bronze → Silver → Gold → Platinum · Greater challenges earn rarer metals. Distance tiers follow each sport.</p>
        <p className="text-xs text-muted-foreground mb-2" aria-live="polite">{groups.length} unique medals · {period === 'week' ? 'Counts for the selected week' : 'Lifetime achievement counts'}</p>
        {groups.length ? <RenderBoundary fallback={fallback}><Suspense fallback={fallback}><MedalStage groups={groups} onInspect={inspect} /></Suspense></RenderBoundary> : <div className="text-center text-sm text-muted-foreground py-16"><Award className="w-10 h-10 mx-auto mb-3 opacity-40" />No medals earned in this selection yet.</div>}
      </>}
    </div>
  </Modal>;
}
