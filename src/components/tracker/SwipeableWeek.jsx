import { useRef, useState, useCallback } from "react";
import { addWeeks, subWeeks } from "date-fns";

const SWIPE_THRESHOLD = 55;
const AXIS_LOCK = 12;
const RESISTANCE = 0.9;
const MAX_DRAG = 200;
export const SETTLE_MS = 280;

export default function SwipeableWeek({ currentWeekStart, onWeekChange, children }) {
  const [dragX, setDragX] = useState(0);
  const [phase, setPhase] = useState("idle");

  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef(null);
  const active = useRef(false);
  const dxRef = useRef(0);
  const settleTimer = useRef(null);

  const setDrag = (v) => { dxRef.current = v; setDragX(v); };

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const tag = e.target?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (settleTimer.current) return;

    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    axis.current = null;
    active.current = true;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!active.current) return;
    const moveX = e.touches[0].clientX - startX.current;
    const moveY = e.touches[0].clientY - startY.current;

    if (axis.current === null) {
      if (Math.abs(moveX) > AXIS_LOCK || Math.abs(moveY) > AXIS_LOCK) {
        axis.current = Math.abs(moveX) > Math.abs(moveY) ? "x" : "y";
        if (axis.current === "x") setPhase("dragging");
      }
      return;
    }
    if (axis.current !== "x") return;

    setDrag(Math.max(-MAX_DRAG, Math.min(MAX_DRAG, moveX * RESISTANCE)));
  }, []);

  const finish = useCallback(() => {
    if (!active.current) return;
    active.current = false;

    const moved = dxRef.current;
    const wasHorizontal = axis.current === "x";
    axis.current = null;

    if (!wasHorizontal) { setPhase("idle"); setDrag(0); return; }

    if (Math.abs(moved) >= SWIPE_THRESHOLD) {
      const dir = moved < 0 ? "next" : "prev";
      setPhase(dir);
      setDrag(0);
      settleTimer.current = window.setTimeout(() => {
        settleTimer.current = null;
        onWeekChange(dir === "next" ? addWeeks(currentWeekStart, 1) : subWeeks(currentWeekStart, 1));
        setPhase("idle");
      }, SETTLE_MS);
    } else {
      setPhase("back");
      setDrag(0);
      settleTimer.current = window.setTimeout(() => {
        settleTimer.current = null;
        setPhase("idle");
      }, SETTLE_MS);
    }
  }, [currentWeekStart, onWeekChange]);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={finish} onTouchCancel={finish}>
      {children({ dragX, phase })}
    </div>
  );
}
