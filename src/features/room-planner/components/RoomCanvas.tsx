import React, { useRef, useState } from 'react';
import { toPixels, toInches } from '../../../utils/coordinates';
import type { RoomFeature, RoomLayout, WallSide } from '../types/room';
import type { FeatureChanges } from '../hooks/useWallFeatures';

const SNAP_IN = 15 / 4;
const MIN_LEN_IN = 6;

function featureLenIn(f: RoomFeature): number {
  return f.type === 'door-swing' ? f.swingIn : f.lengthIn;
}

function wallDimIn(wall: WallSide, layout: RoomLayout): number {
  return wall === 'top' || wall === 'bottom' ? layout.widthIn : layout.heightIn;
}

function computeMoveOffset(desired: number, len: number, wallLen: number, siblings: RoomFeature[]): number {
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

function computeResizeEnd(offsetIn: number, desiredLen: number, wallLen: number, siblings: RoomFeature[]): number {
  const rNeighbor = siblings
    .filter(s => s.offsetIn > offsetIn)
    .sort((a, b) => a.offsetIn - b.offsetIn)[0];
  const maxEnd = rNeighbor?.offsetIn ?? wallLen;
  let len = Math.max(MIN_LEN_IN, Math.min(maxEnd - offsetIn, desiredLen));
  if (rNeighbor && Math.abs(offsetIn + len - rNeighbor.offsetIn) < SNAP_IN) len = rNeighbor.offsetIn - offsetIn;
  if (Math.abs(offsetIn + len - wallLen) < SNAP_IN) len = wallLen - offsetIn;
  return Math.max(MIN_LEN_IN, Math.min(maxEnd - offsetIn, len));
}

function computeResizeStart(desiredOff: number, fixedEnd: number, siblings: RoomFeature[]): [number, number] {
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

type LiveState = { id: number; offsetIn: number; lengthIn: number } | null;
type DragMode = 'move' | 'resize-start' | 'resize-end';

interface Props {
  layout: RoomLayout;
  features: RoomFeature[];
  selectedFeatureId: number | null;
  onFeatureClick: (id: number) => void;
  onFeatureUpdate: (id: number, changes: FeatureChanges) => void;
  snapGridIn?: number;
  children?: React.ReactNode;
}

export default function RoomCanvas({
  layout, features, selectedFeatureId, onFeatureClick, onFeatureUpdate, snapGridIn, children,
}: Props) {
  const gridPx = snapGridIn ? toPixels(snapGridIn) : null;
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

  function resizeHandleStyle(horizontal: boolean, end: 'start' | 'end', thickness: number): React.CSSProperties {
    const perp = Math.floor((thickness - 8) / 2);
    return {
      position: 'absolute',
      width: 8, height: 8,
      background: '#0066ff', borderRadius: 2, zIndex: 10,
      cursor: horizontal ? 'ew-resize' : 'ns-resize',
      ...(horizontal
        ? { [end === 'start' ? 'left' : 'right']: -4, top: perp }
        : { [end === 'start' ? 'top' : 'bottom']: -4, left: perp }),
    };
  }

  return (
    <div
      style={{
        width: toPixels(layout.widthIn),
        height: toPixels(layout.heightIn),
        border: '5px solid #333',
        position: 'relative',
        background: '#fff',
        overflow: 'visible',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        backgroundImage: gridPx
          ? `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`
          : undefined,
        backgroundSize: gridPx ? `${gridPx}px ${gridPx}px` : undefined,
      }}
    >
      {features.map(feature => {
        const selected = feature.id === selectedFeatureId;
        const live = liveState?.id === feature.id ? liveState : null;
        const offsetIn = live?.offsetIn ?? feature.offsetIn;
        const curLenIn = live?.lengthIn ?? featureLenIn(feature);
        const lenPx = toPixels(curLenIn);
        const clickHandler = (e: React.MouseEvent) => { e.stopPropagation(); onFeatureClick(feature.id); };

        if (feature.type === 'window') {
          const horiz = feature.wall === 'top' || feature.wall === 'bottom';
          const liveFeature = { ...feature, offsetIn, lengthIn: curLenIn };
          return (
            <div
              key={feature.id}
              title="Window"
              onClick={clickHandler}
              onMouseDown={e => startDrag(e, liveFeature, 'move')}
              style={{
                position: 'absolute',
                left: feature.wall === 'left' ? -5 : horiz ? toPixels(offsetIn) : undefined,
                right: feature.wall === 'right' ? -5 : undefined,
                top: feature.wall === 'top' ? -5 : !horiz ? toPixels(offsetIn) : undefined,
                bottom: feature.wall === 'bottom' ? -5 : undefined,
                height: horiz ? 10 : lenPx,
                width: horiz ? lenPx : 10,
                background: '#87CEEB',
                border: selected ? '2px solid #0066ff' : '1px solid #555',
                cursor: 'grab',
              }}
            >
              {selected && <>
                <div style={resizeHandleStyle(horiz, 'start', 10)} onMouseDown={e => startDrag(e, liveFeature, 'resize-start')} />
                <div style={resizeHandleStyle(horiz, 'end', 10)} onMouseDown={e => startDrag(e, liveFeature, 'resize-end')} />
              </>}
            </div>
          );
        }

        if (feature.type === 'wall-segment') {
          const horiz = feature.wall === 'top' || feature.wall === 'bottom';
          const liveFeature = { ...feature, offsetIn, lengthIn: curLenIn };
          return (
            <div
              key={feature.id}
              title="Wall Segment"
              onClick={clickHandler}
              onMouseDown={e => startDrag(e, liveFeature, 'move')}
              style={{
                position: 'absolute',
                left: feature.wall === 'left' ? -5 : horiz ? toPixels(offsetIn) : undefined,
                right: feature.wall === 'right' ? -5 : undefined,
                top: feature.wall === 'top' ? -5 : !horiz ? toPixels(offsetIn) : undefined,
                bottom: feature.wall === 'bottom' ? -5 : undefined,
                height: horiz ? 5 : lenPx,
                width: horiz ? lenPx : 5,
                background: '#333',
                outline: selected ? '2px solid #0066ff' : undefined,
                cursor: 'grab',
              }}
            >
              {selected && <>
                <div style={resizeHandleStyle(horiz, 'start', 5)} onMouseDown={e => startDrag(e, liveFeature, 'resize-start')} />
                <div style={resizeHandleStyle(horiz, 'end', 5)} onMouseDown={e => startDrag(e, liveFeature, 'resize-end')} />
              </>}
            </div>
          );
        }

        if (feature.type === 'door-swing') {
          const sw = toPixels(feature.swingIn);
          const swingOut = feature.swingDirection === 'out';
          let posStyle: React.CSSProperties = {};
          let borderRadius = '';

          if (feature.wall === 'right') {
            posStyle = swingOut
              ? { left: '100%', top: toPixels(offsetIn) }
              : { right: 0, top: toPixels(offsetIn) };
            borderRadius = swingOut
              ? (feature.hingeDirection === 'left' ? '0 0 100% 0' : '0 100% 0 0')
              : (feature.hingeDirection === 'left' ? '0 0 0 100%' : '100% 0 0 0');
          } else if (feature.wall === 'left') {
            posStyle = swingOut
              ? { right: '100%', top: toPixels(offsetIn) }
              : { left: 0, top: toPixels(offsetIn) };
            borderRadius = swingOut
              ? (feature.hingeDirection === 'right' ? '0 0 0 100%' : '100% 0 0 0')
              : (feature.hingeDirection === 'right' ? '0 0 100% 0' : '0 100% 0 0');
          } else if (feature.wall === 'bottom') {
            posStyle = swingOut
              ? { top: '100%', left: toPixels(offsetIn) }
              : { bottom: 0, left: toPixels(offsetIn) };
            borderRadius = swingOut
              ? (feature.hingeDirection === 'left' ? '0 0 0 100%' : '0 0 100% 0')
              : (feature.hingeDirection === 'left' ? '100% 0 0 0' : '0 100% 0 0');
          } else {
            posStyle = swingOut
              ? { bottom: '100%', left: toPixels(offsetIn) }
              : { top: 0, left: toPixels(offsetIn) };
            borderRadius = swingOut
              ? (feature.hingeDirection === 'left' ? '100% 0 0 0' : '0 100% 0 0')
              : (feature.hingeDirection === 'left' ? '0 0 0 100%' : '0 0 100% 0');
          }

          return (
            <div
              key={feature.id}
              title="Door"
              onClick={clickHandler}
              onMouseDown={e => startDrag(e, feature, 'move')}
              style={{
                position: 'absolute',
                ...posStyle,
                height: sw, width: sw,
                border: selected ? '2px solid #0066ff' : '1px dashed #999',
                borderRadius,
                cursor: 'grab',
              }}
            />
          );
        }

        return null;
      })}
      {children}
    </div>
  );
}
