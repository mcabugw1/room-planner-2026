import type { FurnitureItem, DoorSwingFeature, RoomLayout } from '../../types/room';
import type { FengShuiIssue } from '../types';
import {
  itemAabb, aabbCenter, doorThreshold,
  isLineOfSightBlocked, intervalsOverlap,
} from '../geometry';

const COMMAND_CATEGORIES = new Set(['bed', 'desk', 'sofa', 'stove']);

function isInDoorLine(
  item: FurnitureItem,
  door: DoorSwingFeature,
): boolean {
  const a = itemAabb(item);
  const bandStart = door.offsetIn;
  const bandEnd = door.offsetIn + door.swingIn;

  // Band is projected perpendicular into the room from the door's wall.
  // Check if item AABB overlaps the band along the wall axis.
  if (door.wall === 'top' || door.wall === 'bottom') {
    // Band is vertical strip: x ∈ [bandStart, bandEnd]
    return intervalsOverlap(a.x, a.x + a.w, bandStart, bandEnd);
  } else {
    // Band is horizontal strip: y ∈ [bandStart, bandEnd]
    return intervalsOverlap(a.y, a.y + a.h, bandStart, bandEnd);
  }
}

export function checkCommandPosition(
  furniture: FurnitureItem[],
  door: DoorSwingFeature,
  layout: RoomLayout,
): FengShuiIssue[] {
  const issues: FengShuiIssue[] = [];
  const threshold = doorThreshold(door, layout.widthIn, layout.heightIn);

  for (const item of furniture) {
    if (!COMMAND_CATEGORIES.has(item.category)) continue;

    const center = aabbCenter(itemAabb(item));
    const blocked = isLineOfSightBlocked(center, threshold, furniture, item.id);
    const inLine = isInDoorLine(item, door);

    if (blocked) {
      issues.push({
        ruleId: 'command-position',
        severity: 'error',
        affectedItemId: item.id,
        title: `${item.name} lacks command position`,
        description: 'Cannot see the entry door — blocked by another piece of furniture.',
        suggestion: 'Reposition so you have a clear sightline to the door without moving into its direct path.',
      });
    } else if (inLine) {
      issues.push({
        ruleId: 'door-direct-line',
        severity: 'warning',
        affectedItemId: item.id,
        title: `${item.name} is in the door's direct line`,
        description: 'The piece has a clear view of the door but sits directly in its path, exposing occupants to sharp chi.',
        suggestion: 'Shift left or right to move out of the door\'s direct axis while keeping sightline.',
      });
    }
  }

  return issues;
}
