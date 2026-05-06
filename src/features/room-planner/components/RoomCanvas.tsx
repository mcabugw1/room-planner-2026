import React from 'react';
import { toPixels } from '../../../utils/coordinates';
import type { RoomFeature, RoomLayout } from '../types/room';
import type { MeasurementArrow } from '../utils/measurements';
import { featureLenIn } from '../hooks/useWallFeatureDrag';
import type { DragMode, LiveState } from '../hooks/useWallFeatureDrag';
import { getDoorSwingStyle } from '../utils/wallFeatureStyles';
import MeasurementOverlay from './MeasurementOverlay';

interface Props {
  layout: RoomLayout;
  features: RoomFeature[];
  selectedFeatureId: number | null;
  onFeatureClick: (id: number) => void;
  liveState: LiveState;
  onFeatureMouseDown: (e: React.MouseEvent, feature: RoomFeature, mode: DragMode) => void;
  snapGridIn?: number;
  measurementArrows?: MeasurementArrow[];
  children?: React.ReactNode;
}

function resizeHandleStyle(horizontal: boolean, end: 'start' | 'end', thickness: number): React.CSSProperties {
  const perp = Math.floor((thickness - 8) / 2);
  return {
    position: 'absolute',
    width: 8, height: 8,
    background: 'var(--accent)', borderRadius: 2, zIndex: 10,
    cursor: horizontal ? 'ew-resize' : 'ns-resize',
    ...(horizontal
      ? { [end === 'start' ? 'left' : 'right']: -4, top: perp }
      : { [end === 'start' ? 'top' : 'bottom']: -4, left: perp }),
  };
}

export default function RoomCanvas({
  layout, features, selectedFeatureId, onFeatureClick,
  liveState, onFeatureMouseDown, snapGridIn, measurementArrows, children,
}: Props) {
  const gridPx = snapGridIn ? toPixels(snapGridIn) : null;

  return (
    <div
      style={{
        width: toPixels(layout.widthIn),
        height: toPixels(layout.heightIn),
        border: '5px solid var(--text-primary)',
        position: 'relative',
        background: 'var(--bg-canvas)',
        overflow: 'visible',
        boxShadow: '0 2px 20px rgba(0,0,0,0.07)',
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
              onMouseDown={e => onFeatureMouseDown(e, liveFeature, 'move')}
              style={{
                position: 'absolute',
                left: feature.wall === 'left' ? -5 : horiz ? toPixels(offsetIn) : undefined,
                right: feature.wall === 'right' ? -5 : undefined,
                top: feature.wall === 'top' ? -5 : !horiz ? toPixels(offsetIn) : undefined,
                bottom: feature.wall === 'bottom' ? -5 : undefined,
                height: horiz ? 10 : lenPx,
                width: horiz ? lenPx : 10,
                background: '#87CEEB',
                border: selected ? '2px solid var(--accent)' : '1px solid var(--border-strong)',
                cursor: 'grab',
              }}
            >
              {selected && <>
                <div style={resizeHandleStyle(horiz, 'start', 10)} onMouseDown={e => onFeatureMouseDown(e, liveFeature, 'resize-start')} />
                <div style={resizeHandleStyle(horiz, 'end', 10)} onMouseDown={e => onFeatureMouseDown(e, liveFeature, 'resize-end')} />
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
              onMouseDown={e => onFeatureMouseDown(e, liveFeature, 'move')}
              style={{
                position: 'absolute',
                left: feature.wall === 'left' ? -5 : horiz ? toPixels(offsetIn) : undefined,
                right: feature.wall === 'right' ? -5 : undefined,
                top: feature.wall === 'top' ? -5 : !horiz ? toPixels(offsetIn) : undefined,
                bottom: feature.wall === 'bottom' ? -5 : undefined,
                height: horiz ? 5 : lenPx,
                width: horiz ? lenPx : 5,
                background: 'var(--text-primary)',
                outline: selected ? '2px solid var(--accent)' : 'none',
                cursor: 'grab',
              }}
            >
              {selected && <>
                <div style={resizeHandleStyle(horiz, 'start', 5)} onMouseDown={e => onFeatureMouseDown(e, liveFeature, 'resize-start')} />
                <div style={resizeHandleStyle(horiz, 'end', 5)} onMouseDown={e => onFeatureMouseDown(e, liveFeature, 'resize-end')} />
              </>}
            </div>
          );
        }

        if (feature.type === 'door-swing') {
          const sw = toPixels(feature.swingIn);
          const { posStyle, borderRadius } = getDoorSwingStyle(feature, offsetIn);
          return (
            <div
              key={feature.id}
              title="Door"
              onClick={clickHandler}
              onMouseDown={e => onFeatureMouseDown(e, feature, 'move')}
              style={{
                position: 'absolute',
                ...posStyle,
                height: sw, width: sw,
                border: selected ? '2px solid var(--accent)' : '1px dashed var(--text-tertiary)',
                borderRadius,
                cursor: 'grab',
              }}
            />
          );
        }

        return null;
      })}
      {children}
      {measurementArrows && measurementArrows.length > 0 && (
        <MeasurementOverlay
          arrows={measurementArrows}
          widthPx={toPixels(layout.widthIn)}
          heightPx={toPixels(layout.heightIn)}
        />
      )}
    </div>
  );
}
