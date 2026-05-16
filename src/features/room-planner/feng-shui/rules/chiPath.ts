import type { FurnitureItem, DoorSwingFeature, RoomFeature } from '../../types/room';
import type { FengShuiIssue } from '../types';
import { itemAabb, intervalsOverlap } from '../geometry';

function isChiPathBlocked(
  door: DoorSwingFeature,
  furniture: FurnitureItem[],
): boolean {
  const bandStart = door.offsetIn;
  const bandEnd = door.offsetIn + door.swingIn;

  return furniture.some(item => {
    const a = itemAabb(item);
    if (door.wall === 'top' || door.wall === 'bottom') {
      return intervalsOverlap(a.x, a.x + a.w, bandStart, bandEnd);
    } else {
      return intervalsOverlap(a.y, a.y + a.h, bandStart, bandEnd);
    }
  });
}

function oppositWallHasWindow(
  door: DoorSwingFeature,
  features: RoomFeature[],
): boolean {
  const bandStart = door.offsetIn;
  const bandEnd = door.offsetIn + door.swingIn;

  const oppositeWall = door.wall === 'top' ? 'bottom'
    : door.wall === 'bottom' ? 'top'
    : door.wall === 'left' ? 'right'
    : 'left';

  return features.some(f => {
    if (f.type !== 'window') return false;
    if (f.wall !== oppositeWall) return false;
    return intervalsOverlap(bandStart, bandEnd, f.offsetIn, f.offsetIn + f.lengthIn);
  });
}

export function checkChiPath(
  furniture: FurnitureItem[],
  features: RoomFeature[],
  door: DoorSwingFeature,
): FengShuiIssue[] {
  const blocked = isChiPathBlocked(door, furniture);
  if (blocked) return [];

  const hitsWindow = oppositWallHasWindow(door, features);

  if (hitsWindow) {
    return [{
      ruleId: 'chi-path-window',
      severity: 'error',
      affectedItemId: null,
      title: 'Chi shoots straight door-to-window',
      description: 'An unobstructed line runs from the entry door directly to a window on the opposite wall. Chi enters and exits without circulating.',
      suggestion: 'Place a piece of furniture, room divider, or screen between the door and window to redirect the flow.',
    }];
  }

  return [{
    ruleId: 'chi-path-open',
    severity: 'warning',
    affectedItemId: null,
    title: 'Chi path from door is unobstructed',
    description: 'Chi travels straight from the entry door to the opposite wall without circulating through the room.',
    suggestion: 'Place a piece of furniture or decorative element to break the straight-line path and encourage chi to meander.',
  }];
}
