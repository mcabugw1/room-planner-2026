import { useRef, useState, useLayoutEffect, useEffect } from 'react';

const MIN_SCALE = 0.12;
const MAX_SCALE = 3;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

interface Vp { scale: number; tx: number; ty: number }

export function useCanvasViewport(canvasW: number, canvasH: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [vp, setVp] = useState<Vp>({ scale: 1, tx: 0, ty: 0 });
  const fitted = useRef(false);
  const canvasWRef = useRef(canvasW);
  const canvasHRef = useRef(canvasH);
  const prevCanvasW = useRef(canvasW);
  const prevCanvasH = useRef(canvasH);
  canvasWRef.current = canvasW;
  canvasHRef.current = canvasH;

  function fit(el: HTMLDivElement) {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w === 0) return;
    const cw = canvasWRef.current;
    const ch = canvasHRef.current;
    const s = clamp(Math.min(w / cw, h / ch), MIN_SCALE, MAX_SCALE);
    setVp({ scale: s, tx: (w - cw * s) / 2, ty: Math.max(8, (h - ch * s) / 2) });
  }

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const dimensionsChanged =
      canvasWRef.current !== prevCanvasW.current ||
      canvasHRef.current !== prevCanvasH.current;
    prevCanvasW.current = canvasWRef.current;
    prevCanvasH.current = canvasHRef.current;
    if (!fitted.current || dimensionsChanged) {
      fit(el);
      fitted.current = true;
    }
  });

  function refit() {
    const el = containerRef.current;
    if (el) fit(el);
  }

  // Zoom at a container-relative point using functional setState for safety
  const vpRef = useRef(vp);
  vpRef.current = vp;

  function zoomAt(ox: number, oy: number, factor: number) {
    setVp(prev => {
      const next = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      const f = next / prev.scale;
      return { scale: next, tx: ox - f * (ox - prev.tx), ty: oy - f * (oy - prev.ty) };
    });
  }

  // Imperative wheel + touch — both need e.preventDefault() so passive:false
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, 1 - e.deltaY * 0.001);
    }

    let lastDist: number | null = null;
    let lastMidX = 0;
    let lastMidY = 0;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDist = Math.hypot(dx, dy);
        lastMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        lastMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      } else {
        lastDist = null;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || lastDist === null) return;
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const pinch = dist / lastDist;
      const panDx = midX - lastMidX;
      const panDy = midY - lastMidY;
      const ox = midX - rect.left;
      const oy = midY - rect.top;
      setVp(prev => {
        const next = clamp(prev.scale * pinch, MIN_SCALE, MAX_SCALE);
        const f = next / prev.scale;
        return { scale: next, tx: ox - f * (ox - prev.tx) + panDx, ty: oy - f * (oy - prev.ty) + panDy };
      });
      lastDist = dist;
      lastMidX = midX;
      lastMidY = midY;
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) lastDist = null;
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function zoomIn() {
    const el = containerRef.current;
    if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, 1.25);
  }
  function zoomOut() {
    const el = containerRef.current;
    if (el) zoomAt(el.clientWidth / 2, el.clientHeight / 2, 1 / 1.25);
  }

  return { containerRef, scale: vp.scale, tx: vp.tx, ty: vp.ty, zoomIn, zoomOut, refit };
}
