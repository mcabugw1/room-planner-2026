import React, { useRef, useState } from 'react';
import { toInches } from '../../../utils/coordinates';
import type { RoomFeature, RoomLayout, WallSide } from '../types/room';
import type { FeatureChanges } from './useWallFeatures';

const SNAP_IN = 15 / 4;
const MIN_LEN_IN = 6;

export type DragMode = 'move' | 'resize-start' | 'resize-end';
export type LiveState = { id: number; offsetIn: number; lengthIn: number } | null;

export function featureLenIn(f: RoomFeature): number {
  return f.type === 'door-swing' ? f.swingIn : f.lengthIn;
}

function wallDimIn(wall: WallSide, layout: RoomLayout): number {
  return wall === 'top' || wall === 'bottom' ? layout.widthIn : layout.heightIn;
}

export function computeMoveOffset(
  desired: number,
  len: number,
  wallLen: number,
  siblings: RoomFeature[],
): number {
  const sorted = [...siblings].sort((a, b) => a.offsetIn - b.offsetIn);
  const center = desired + len / 2;
  let lo = 0, hi = wallLen;
  for (const s of sorted) {
    const sEnd = s.offsetIn + featureLenIn(s);
    if (sEnd <= center) lo = Math.max(lo, sEnd);
    else if (s.offsetIn >= center) hi = Math.min(hi, s.offsetIn);
  }
  let off = Math.max(lo, Math.min(hi - len, desired));
  for (const s of sorted) {
    const sEnd = s.offsetIn + featureLenIn(s);
    if (Math.abs(off - sEnd) < SNAP_IN) { off = sEnd; break; }
    if (Math.abs(off + len - s.offsetIn) < SNAP_IN) { off = s.offsetIn - len; break; }
  }
  if (Math.abs(off) < SNAP_IN) off = 0;
  if (Math.abs(off + len - wallLen) < SNAP_IN) off = wallLen - len;
  return Math.max(lo, Math.min(hi - len, off));
}

export function computeResizeEnd(
  offsetIn: number,
  desiredLen: number,
  wallLen: number,
  siblings: RoomFeature[],
): number {
  const rNeighbor = siblings
    .filter(s => s.offsetIn > offsetIn)
    .sort((a, b) => a.offsetIn - b.offsetIn)[0];
  const maxEnd = rNeighbor?.offsetIn ?? wallLen;
  let len = Math.max(MIN_LEN_IN, Math.min(maxEnd - offsetIn, desiredLen));
  if (rNeighbor && Math.abs(offsetIn + len - rNeighbor.offsetIn) < SNAP_IN) len = rNeighbor.offsetIn - offsetIn;
  if (Math.abs(offsetIn + len - wallLen) < SNAP_IN) len = wallLen - offsetIn;
  return Math.max(MIN_LEN_IN, Math.min(maxEnd - offsetIn, len));
}

export function computeResizeStart(
  desiredOff: number,
  fixedEnd: number,
  siblings: RoomFeature[],
): [number, number] {
  const lNeighbor = siblings
    .filter(s => s.offsetIn + featureLenIn(s) <= fixedEnd - MIN_LEN_IN)
    .sort((a, b) => (b.offsetIn + featureLenIn(b)) - (a.offsetIn + featureLenIn(a)))[0];
  const minOff = lNeighbor ? lNeighbor.offsetIn + featureLenIn(lNeighbor) : 0;
  let off = Math.max(minOff, Math.min(fixedEnd - MIN_LEN_IN, desiredOff));
  if (Math.abs(off) < SNAP_IN) off = 0;
  if (lNeighbor) {
    const lEnd = lNeighbor.offsetIn + featureLenIn(lNeighbor);
    if (Math.abs(off - lEnd) < SNAP_IN) off = lEnd;
  }
  off = Math.max(minOff, Math.min(fixedEnd - MIN_LEN_IN, off));
  return [off, fixedEnd - off];
}

export function useWallFeatureDrag(
  layout: RoomLayout,
  features: RoomFeature[],
  onFeatureClick: (id: number) => void,
  onFeatureUpdate: (id: number, changes: FeatureChanges) => void,
) {
  const [liveState, setLiveState] = useState<LiveState>(null);
  const dragRef = useRef<{
    featureId: number; mode: DragMode;
    startMousePx: number; startOffsetIn: number; startLengthIn: number; wall: WallSide;
  } | null>(null);

  function startDrag(e: React.MouseEvent, feature: RoomFeature, mode: DragMode) {
    e.stopPropagation();
    e.preventDefault();
    onFeatureClick(feature.id);

    const isH = feature.wall === 'top' || feature.wall === 'bottom';
    const startLenIn = featureLenIn(feature);
    let lastLive = { id: feature.id, offsetIn: feature.offsetIn, lengthIn: startLenIn };

    dragRef.current = {
      featureId: feature.id, mode,
      startMousePx: isH ? e.clientX : e.clientY,
      startOffsetIn: feature.offsetIn, startLengthIn: startLenIn, wall: feature.wall,
    };
    document.body.style.userSelect = 'none';

    function onMouseMove(me: MouseEvent) {
      const d = dragRef.current!;
      const isHoriz = d.wall === 'top' || d.wall === 'bottom';
      const deltaIn = toInches((isHoriz ? me.clientX : me.clientY) - d.startMousePx);
      const wallLen = wallDimIn(d.wall, layout);
      const siblings = features.filter(f => f.id !== d.featureId && f.wall === d.wall);
      let next: NonNullable<LiveState>;
      if (d.mode === 'move') {
        next = { id: d.featureId, offsetIn: computeMoveOffset(d.startOffsetIn + deltaIn, d.startLengthIn, wallLen, siblings), lengthIn: d.startLengthIn };
      } else if (d.mode === 'resize-end') {
        next = { id: d.featureId, offsetIn: d.startOffsetIn, lengthIn: computeResizeEnd(d.startOffsetIn, d.startLengthIn + deltaIn, wallLen, siblings) };
      } else {
        const [off, len] = computeResizeStart(d.startOffsetIn + deltaIn, d.startOffsetIn + d.startLengthIn, siblings);
        next = { id: d.featureId, offsetIn: off, lengthIn: len };
      }
      lastLive = next;
      setLiveState(next);
    }

    function onMouseUp() {
      const d = dragRef.current!;
      if (d.mode === 'move') {
        onFeatureUpdate(d.featureId, { offsetIn: lastLive.offsetIn });
      } else {
        onFeatureUpdate(d.featureId, { offsetIn: lastLive.offsetIn, lengthIn: lastLive.lengthIn });
      }
      dragRef.current = null;
      setLiveState(null);
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  return { liveState, startDrag };
}
