import React from 'react';
import { toPixels } from '../../../utils/coordinates';
import type { RoomFeature, RoomLayout } from '../types/room';

function renderFeature(
  feature: RoomFeature,
  selectedId: number | null,
  onFeatureClick: (id: number) => void,
): React.ReactNode {
  const selected = feature.id === selectedId;
  const clickHandler = (e: React.MouseEvent) => { e.stopPropagation(); onFeatureClick(feature.id); };
  const selectionOutline = selected ? '2px solid #0066ff' : undefined;

  switch (feature.type) {
    case 'window': {
      const horizontal = feature.wall === 'top' || feature.wall === 'bottom';
      return (
        <div
          key={feature.id}
          title="Window"
          onClick={clickHandler}
          style={{
            position: 'absolute',
            left:   feature.wall === 'left'   ? -5
                  : feature.wall === 'bottom' || feature.wall === 'top' ? toPixels(feature.offsetIn)
                  : undefined,
            right:  feature.wall === 'right'  ? -5 : undefined,
            top:    feature.wall === 'top'    ? -5
                  : feature.wall === 'left' || feature.wall === 'right' ? toPixels(feature.offsetIn)
                  : undefined,
            bottom: feature.wall === 'bottom' ? -5 : undefined,
            height: horizontal ? 10 : toPixels(feature.lengthIn),
            width:  horizontal ? toPixels(feature.lengthIn) : 10,
            background: '#87CEEB',
            border: selectionOutline ?? '1px solid #555',
            cursor: 'pointer',
          }}
        />
      );
    }

    case 'wall-segment': {
      const horizontal = feature.wall === 'top' || feature.wall === 'bottom';
      return (
        <div
          key={feature.id}
          onClick={clickHandler}
          style={{
            position: 'absolute',
            left:   feature.wall === 'left'   ? -5
                  : feature.wall === 'bottom' || feature.wall === 'top' ? toPixels(feature.offsetIn)
                  : undefined,
            right:  feature.wall === 'right'  ? -5 : undefined,
            top:    feature.wall === 'top'    ? -5
                  : feature.wall === 'left' || feature.wall === 'right' ? toPixels(feature.offsetIn)
                  : undefined,
            bottom: feature.wall === 'bottom' ? -5 : undefined,
            height: horizontal ? 5 : toPixels(feature.lengthIn),
            width:  horizontal ? toPixels(feature.lengthIn) : 5,
            background: '#333',
            outline: selectionOutline,
            cursor: 'pointer',
          }}
        />
      );
    }

    case 'door-swing': {
      const sw = toPixels(feature.swingIn);

      let posStyle: React.CSSProperties = {};
      let borderRadius = '';

      if (feature.wall === 'right') {
        posStyle = { right: 0, top: toPixels(feature.offsetIn) };
        borderRadius = feature.hingeDirection === 'left' ? '0 0 0 100%' : '100% 0 0 0';
      } else if (feature.wall === 'left') {
        posStyle = { left: 0, top: toPixels(feature.offsetIn) };
        borderRadius = feature.hingeDirection === 'right' ? '0 0 100% 0' : '0 100% 0 0';
      } else if (feature.wall === 'bottom') {
        posStyle = { bottom: 0, left: toPixels(feature.offsetIn) };
        borderRadius = feature.hingeDirection === 'left' ? '100% 0 0 0' : '0 100% 0 0';
      } else {
        posStyle = { top: 0, left: toPixels(feature.offsetIn) };
        borderRadius = feature.hingeDirection === 'left' ? '0 0 0 100%' : '0 0 100% 0';
      }

      return (
        <div
          key={feature.id}
          title="Door"
          onClick={clickHandler}
          style={{
            position: 'absolute',
            ...posStyle,
            height: sw,
            width: sw,
            border: selectionOutline ?? '1px dashed #999',
            borderRadius,
            cursor: 'pointer',
          }}
        />
      );
    }
  }
}

interface Props {
  layout: RoomLayout;
  features: RoomFeature[];
  selectedFeatureId: number | null;
  onFeatureClick: (id: number) => void;
  snapGridIn?: number;
  children?: React.ReactNode;
}

export default function RoomCanvas({ layout, features, selectedFeatureId, onFeatureClick, snapGridIn, children }: Props) {
  const gridPx = snapGridIn ? toPixels(snapGridIn) : null;
  return (
    <div
      style={{
        width: toPixels(layout.widthIn),
        height: toPixels(layout.heightIn),
        border: '5px solid #333',
        position: 'relative',
        background: '#fff',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
        backgroundImage: gridPx
          ? `linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)`
          : undefined,
        backgroundSize: gridPx ? `${gridPx}px ${gridPx}px` : undefined,
      }}
    >
      {features.map(f => renderFeature(f, selectedFeatureId, onFeatureClick))}
      {children}
    </div>
  );
}
