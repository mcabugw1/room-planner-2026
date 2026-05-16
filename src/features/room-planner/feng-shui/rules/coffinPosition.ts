import type { FurnitureItem, DoorSwingFeature, RoomLayout } from '../../types/room';
import type { FengShuiIssue } from '../types';
import {
  itemAabb, aabbCenter, doorThreshold,
  footVector, normalize, angleBetween,
} from '../geometry';
import type { RotationDeg } from '../../types/room';

const COFFIN_THRESHOLD_RAD = (15 * Math.PI) / 180;

export function checkCoffinPosition(
  furniture: FurnitureItem[],
  door: DoorSwingFeature,
  layout: RoomLayout,
): FengShuiIssue[] {
  const issues: FengShuiIssue[] = [];
  const threshold = doorThreshold(door, layout.widthIn, layout.heightIn);

  for (const item of furniture) {
    if (item.category !== 'bed') continue;

    const center = aabbCenter(itemAabb(item));
    const fv = footVector(item.rotation as RotationDeg, item.headAtStart ?? false);
    const toDoor = normalize({ x: threshold.x - center.x, y: threshold.y - center.y });
    const angle = angleBetween(fv, toDoor);

    if (angle <= COFFIN_THRESHOLD_RAD) {
      issues.push({
        ruleId: 'coffin-position',
        severity: 'error',
        affectedItemId: item.id,
        title: `${item.name} is in coffin position`,
        description: 'The foot of the bed points directly at the entry door, a strongly inauspicious alignment.',
        suggestion: 'Rotate or reposition the bed so its foot does not face the door.',
      });
    }
  }

  return issues;
}
