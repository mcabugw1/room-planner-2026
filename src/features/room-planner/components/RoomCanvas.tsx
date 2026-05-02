import React from 'react';
import { toPixels } from '../../../utils/coordinates';
import type { RoomFeature, RoomLayout } from '../types/room';

function renderFeature(feature: RoomFeature, index: number): React.ReactNode {
  switch (feature.type) {
    case 'window':
      return (
        <div
          key={index}
          title="Sliding Window"
          style={{
            position: 'absolute',
            left: feature.wall === 'left' ? -5 : undefined,
            right: feature.wall === 'right' ? -5 : undefined,
            top: toPixels(feature.offsetIn),
            height: toPixels(feature.lengthIn),
            width: 10,
            background: '#87CEEB',
            border: '1px solid #555',
          }}
        />
      );

    case 'wall-segment': {
      const vertical = feature.wall === 'left' || feature.wall === 'right';
      return (
        <div
          key={index}
          style={{
            position: 'absolute',
            right:   feature.wall === 'right'  ? -5 : undefined,
            left:    feature.wall === 'left'   ? -5
                   : feature.wall === 'bottom' ? toPixels(feature.offsetIn)
                   : undefined,
            top:    vertical ? toPixels(feature.offsetIn) : undefined,
            bottom: feature.wall === 'bottom' ? -5 : undefined,
            height: vertical ? toPixels(feature.lengthIn) : 5,
            width:  vertical ? 5 : toPixels(feature.lengthIn),
            background: '#333',
          }}
        />
      );
    }

    case 'door-swing':
      return (
        <div
          key={index}
          style={{
            position: 'absolute',
            right: feature.wall === 'right' ? 0 : undefined,
            top: toPixels(feature.offsetIn),
            height: toPixels(feature.swingIn),
            width: toPixels(feature.swingIn),
            border: '1px dashed #999',
            borderRadius: '0 0 0 100%',
          }}
        />
      );
  }
}

interface Props {
  layout: RoomLayout;
  children?: React.ReactNode;
}

export default function RoomCanvas({ layout, children }: Props) {
  return (
    <div
      style={{
        width: toPixels(layout.widthIn),
        height: toPixels(layout.heightIn),
        border: '5px solid #333',
        position: 'relative',
        background: '#fff',
        boxShadow: '0 0 20px rgba(0,0,0,0.1)',
      }}
    >
      {layout.features.map((f, i) => renderFeature(f, i))}
      {children}
    </div>
  );
}
