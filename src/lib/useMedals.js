import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { evaluateMedals } from './medals/evaluateMedals.js';

export function useMedals(logs) {
  const [today, setToday] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  useEffect(() => {
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      const now = new Date();
      setToday(format(now, 'yyyy-MM-dd'));
      timer = setTimeout(refresh, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime() + 100);
    };
    refresh();window.addEventListener('focus', refresh);document.addEventListener('visibilitychange', refresh);
    return () => { clearTimeout(timer);window.removeEventListener('focus', refresh);document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return useMemo(() => evaluateMedals(logs, new Date(`${today}T23:59:59`)), [logs, today]);
}
