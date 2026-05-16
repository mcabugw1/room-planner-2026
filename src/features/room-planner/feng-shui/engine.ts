import type { FurnitureItem, RoomFeature, RoomLayout, DoorSwingFeature, FengShuiConfig } from '../types/room';
import type { FengShuiIssue, IssueSeverity } from './types';
import { checkCommandPosition } from './rules/commandPosition';
import { checkCoffinPosition } from './rules/coffinPosition';
import { checkWallBacking } from './rules/wallBacking';
import { checkWindowHead } from './rules/windowHead';
import { checkDoorSwingClear } from './rules/doorSwingClear';
import { checkChiPath } from './rules/chiPath';

const SEVERITY_ORDER: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };

export function analyze(
  furniture: FurnitureItem[],
  features: RoomFeature[],
  layout: RoomLayout,
  config: FengShuiConfig,
): FengShuiIssue[] {
  const entryDoor = features.find(
    (f): f is DoorSwingFeature => f.type === 'door-swing' && f.id === config.entryDoorId,
  );

  if (!entryDoor) return [];

  const issues: FengShuiIssue[] = [
    ...checkCommandPosition(furniture, entryDoor, layout),
    ...checkCoffinPosition(furniture, entryDoor, layout),
    ...checkWallBacking(furniture, layout),
    ...checkWindowHead(furniture, features, layout),
    ...checkDoorSwingClear(furniture, entryDoor, layout),
    ...checkChiPath(furniture, features, entryDoor),
  ];

  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
