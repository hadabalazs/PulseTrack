import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import * as THREE from 'three';
import { createMedal, createStudio, createView, disposeModel } from './models';
import { METAL_LABELS, medalTitle, scopeLabel } from '@/lib/medals/catalog';
import MedalPoster from '../MedalPoster';

export default function MedalStage({ groups, inspect = false, onInspect = null }) {
  const rootRef = useRef(null), canvasRef = useRef(null), rotationsRef = useRef(new Map());
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    const root = rootRef.current, canvas = canvasRef.current;
    let renderer, environment, observer, views = new Map(), frame = 0;
    const removers = [];
    setReady(false);setFailed(false);
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));renderer.outputColorSpace = THREE.SRGBColorSpace;renderer.toneMapping = THREE.ACESFilmicToneMapping;renderer.toneMappingExposure = 1.05;
      environment = createStudio(renderer);
      const stages = [...root.querySelectorAll('[data-medal-stage]')];
      const scroll = root.closest('[data-modal-scroll]');
      const remember = (key, view) => rotationsRef.current.set(key, view.model.rotation.toArray());
      const ensureView = index => {
        const group = groups[index];
        if (!views.has(group.key)) {
          const view = createView(createMedal(group.definition), environment.texture);
          if (!inspect) view.camera.position.z = 4.2;
          const rotation = rotationsRef.current.get(group.key);
          if (rotation) view.model.rotation.fromArray(rotation);
          views.set(group.key, view);
        }
        return views.get(group.key);
      };
      let lastWidth = 0, lastHeight = 0;
      const draw = () => {
        if (document.hidden || renderer.getContext().isContextLost()) return;
        const bounds = root.getBoundingClientRect(), clip = scroll?.getBoundingClientRect();
        const top = Math.max(bounds.top, clip?.top ?? 0, 0), bottom = Math.min(bounds.bottom, clip?.bottom ?? innerHeight, innerHeight);
        const width = Math.round(bounds.width), height = Math.max(0, Math.ceil(bottom - top));
        if (!width || !height) return;
        canvas.style.top = `${top - bounds.top}px`;canvas.style.height = `${height}px`;
        if (width !== lastWidth || height !== lastHeight) { renderer.setSize(width, height, false);lastWidth = width;lastHeight = height; }
        renderer.setScissorTest(false);renderer.setClearColor(0, 0);renderer.clear();renderer.setScissorTest(true);
        stages.forEach((stage, index) => {
          const r = stage.getBoundingClientRect(), key = groups[index].key;
          if (r.bottom < top - 120 || r.top > bottom + 120) {
            const old = views.get(key);
            if (old) { remember(key, old);disposeModel(old.model);views.delete(key); }
            return;
          }
          const view = ensureView(index);
          if (r.bottom <= top || r.top >= bottom) return;
          const x = r.left - bounds.left, y = bottom - r.bottom;
          renderer.setViewport(x, y, r.width, r.height);
          renderer.setScissor(Math.max(0,x), Math.max(0,y), Math.min(r.width,width-x), Math.min(height,y+r.height)-Math.max(0,y));
          view.camera.aspect = r.width / r.height;view.camera.updateProjectionMatrix();renderer.render(view.scene, view.camera);
        });
        root.dataset.activeModels = String(views.size);
      };
      const scheduleDraw = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0;draw(); }); };
      const bind = (element, name, handler) => { element.addEventListener(name, handler);removers.push(() => element.removeEventListener(name, handler)); };
      for (const [index, stage] of stages.entries()) {
        const group = groups[index];
        let pointer = null, moved = false;
        bind(stage, 'pointerdown', e => { if (!e.isPrimary || e.button !== 0) return;pointer = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY };moved = false;stage.setPointerCapture(e.pointerId); });
        bind(stage, 'pointermove', e => {
          if (!pointer) return;
          if (Math.hypot(e.clientX - pointer.startX, e.clientY - pointer.startY) > 8) moved = true;
          if (!inspect && e.pointerType === 'touch' && Math.abs(e.clientY - pointer.startY) > Math.abs(e.clientX - pointer.startX) && moved) { pointer = null;return; }
          if (moved) { const view = ensureView(index);view.model.rotation.y += (e.clientX - pointer.x) * .013;view.model.rotation.x += (e.clientY - pointer.y) * .01;draw(); }
          pointer.x = e.clientX;pointer.y = e.clientY;
        });
        bind(stage, 'pointerup', () => { pointer = null; });
        bind(stage, 'pointercancel', () => { moved = true;pointer = null; });
        bind(stage, 'click', e => { if (!inspect && (e.detail === 0 || !moved)) onInspect?.(group.key); });
        bind(stage, 'keydown', e => {
          if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
          e.preventDefault();const view = ensureView(index);
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') view.model.rotation.y += e.key === 'ArrowLeft' ? -.25 : .25;
          else view.model.rotation.x += e.key === 'ArrowUp' ? -.25 : .25;
          draw();
        });
      }
      bind(canvas, 'webglcontextlost', event => { event.preventDefault();setReady(false);setFailed(true); });
      bind(document, 'visibilitychange', scheduleDraw);
      if (scroll) bind(scroll, 'scroll', scheduleDraw);
      bind(window, 'resize', scheduleDraw);
      observer = new ResizeObserver(scheduleDraw);observer.observe(root);draw();setReady(true);
    } catch { setFailed(true); }
    return () => {
      observer?.disconnect();removers.forEach(remove => remove());cancelAnimationFrame(frame);
      views.forEach((view, key) => { rotationsRef.current.set(key, view.model.rotation.toArray());disposeModel(view.model); });environment?.dispose();renderer?.dispose();
      // React may reuse this canvas on an effect refresh or StrictMode probe.
      // Lose the context only after the actual canvas has left the document.
      queueMicrotask(() => { if (!canvas.isConnected) renderer?.forceContextLoss(); });
    };
  }, [groups, inspect, onInspect, retry]);

  return <>
    <div ref={rootRef} className={`relative ${inspect ? '' : 'medal-browser-grid'}`} data-render-ready={ready}>
      <canvas key={retry} ref={canvasRef} className={`absolute left-0 top-0 w-full pointer-events-none ${ready ? '' : 'invisible'}`} aria-hidden="true" />
      {groups.map(group => <div key={group.key} className="min-w-0 relative">
        <button type="button" data-medal-stage className={`relative block w-full select-none ${inspect ? 'touch-none' : 'touch-pan-y'} ${inspect ? 'h-[min(46dvh,400px)]' : 'medal-browser-stage'}`} aria-label={`${inspect ? 'Rotate' : 'Inspect'} ${medalTitle(group.definition)}. Drag or use arrow keys to rotate.`}>
          <MedalPoster definition={group.definition} className={`absolute inset-0 w-full h-full ${ready ? 'invisible' : ''}`} />
        </button>
        {!inspect && <>
          <button type="button" className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-primary rounded-xl hover:bg-muted" aria-label={`Inspect ${medalTitle(group.definition)}`} onClick={() => onInspect(group.key)}><ArrowUpRight className="h-4 w-4" /></button>
          <div className="text-center px-1 pb-2"><p className="text-[11px] text-muted-foreground truncate">{METAL_LABELS[group.definition.metal]} · {scopeLabel(group.scopeKey)}</p><p className="text-xs font-display font-semibold mt-0.5 line-clamp-2 min-h-8 flex items-center justify-center">{medalTitle(group.definition)}</p><p className="text-[11px] text-muted-foreground mt-0.5">Achieved {group.count} {group.count === 1 ? 'time' : 'times'}</p></div>
        </>}
      </div>)}
    </div>
    {failed && <p role="status" className="text-xs text-muted-foreground text-center py-2">Showing medal images. 3D is unavailable. <button type="button" className="text-primary underline" onClick={() => setRetry(value => value + 1)}>Retry 3D</button></p>}
  </>;
}
