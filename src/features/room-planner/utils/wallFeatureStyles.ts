import type { CSSProperties } from 'react';
import { toPixels } from '../../../utils/canvasCoords';
import type { DoorSwingFeature } from '../types/room';

export function getDoorSwingStyle(
  feature: DoorSwingFeature,
  offsetIn: number,
): { posStyle: CSSProperties; borderRadius: string } {
  const swingOut = feature.swingDirection === 'out';
  let posStyle: CSSProperties = {};
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
    // top wall
    posStyle = swingOut
      ? { bottom: '100%', left: toPixels(offsetIn) }
      : { top: 0, left: toPixels(offsetIn) };
    borderRadius = swingOut
      ? (feature.hingeDirection === 'left' ? '100% 0 0 0' : '0 100% 0 0')
      : (feature.hingeDirection === 'left' ? '0 0 0 100%' : '0 0 100% 0');
  }

  return { posStyle, borderRadius };
}
