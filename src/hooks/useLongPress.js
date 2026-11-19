import { useEffect, useRef } from 'react';
import { SESSION_HOLD_MS, SESSION_MOVE_PX } from '../lib/sessionInteractions.js';

export function useLongPress({ disabled, onTap, onHold }) {
  const latest = useRef({ disabled, onTap, onHold });
  latest.current = { disabled, onTap, onHold };
  const gesture = useRef({ timer: null, start: null, consumed: false });
  const cancel = () => {
    const g = gesture.current;
    clearTimeout(g.timer);
    if (g.start) g.consumed = true;
    g.start = null;
  };
  useEffect(() => {
    const interrupt = (event) => {
      if (event.type !== 'pointerdown' || (gesture.current.start && event.pointerId !== gesture.current.start.id)) cancel();
    };
    document.addEventListener('pointerdown', interrupt, true);
    document.addEventListener('scroll', interrupt, true);
    document.addEventListener('visibilitychange', interrupt);
    window.addEventListener('blur', interrupt);
    return () => {
      cancel();
      document.removeEventListener('pointerdown', interrupt, true);
      document.removeEventListener('scroll', interrupt, true);
      document.removeEventListener('visibilitychange', interrupt);
      window.removeEventListener('blur', interrupt);
    };
  }, []);
  useEffect(() => { if (disabled) cancel(); }, [disabled]);

  return {
    onPointerDown(event) {
      if (latest.current.disabled || event.button !== 0 || !event.isPrimary) return;
      const g = gesture.current;
      clearTimeout(g.timer);
      g.consumed = false;
      g.start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      const origin = event.currentTarget;
      origin.setPointerCapture?.(event.pointerId);
      g.timer = setTimeout(() => {
        if (!g.start || latest.current.disabled) return;
        g.consumed = true;
        latest.current.onHold(origin);
      }, SESSION_HOLD_MS);
    },
    onPointerMove(event) {
      const g = gesture.current;
      if (g.start && (Math.abs(event.clientX - g.start.x) > SESSION_MOVE_PX || Math.abs(event.clientY - g.start.y) > SESSION_MOVE_PX)) cancel();
    },
    onPointerUp() { clearTimeout(gesture.current.timer); gesture.current.start = null; },
    onPointerCancel: cancel,
    onLostPointerCapture: cancel,
    onClick(event) {
      if (latest.current.disabled) return;
      if (gesture.current.consumed && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); return; }
      latest.current.onTap(event.currentTarget);
    },
    onContextMenu(event) { event.preventDefault(); cancel(); latest.current.onHold(event.currentTarget); },
    onKeyDown(event) {
      if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
        event.preventDefault(); latest.current.onHold(event.currentTarget);
      }
    },
  };
}
