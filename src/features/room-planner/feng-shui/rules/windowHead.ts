import type { FurnitureItem, RoomFeature, RoomLayout } from '../../types/room';
import type { FengShuiIssue } from '../types';
import { headEdgeInfo, intervalsOverlap } from '../geometry';

const HEAD_WALL_THRESHOLD = 6;

export function checkWindowHead(
  furniture: FurnitureItem[],
  features: RoomFeature[],
  layout: RoomLayout,
): FengShuiIssue[] {
  const issues: FengShuiIssue[] = [];
  const windows = features.filter(f => f.type === 'window');

  for (const item of furniture) {
    if (item.category !== 'bed') continue;
    if (item.headAtStart === undefined) continue;

    const { wall, edgeDist, spanStart, spanEnd } = headEdgeInfo(item, layout.widthIn, layout.heightIn);

    if (edgeDist > HEAD_WALL_THRESHOLD) continue;

    const overlappingWindow = windows.find(
      f => f.wall === wall && intervalsOverlap(spanStart, spanEnd, f.offsetIn, f.offsetIn + f.lengthIn),
    );

    if (overlappingWindow) {
      issues.push({
        ruleId: 'window-head',
        severity: 'warning',
        affectedItemId: item.id,
        title: `${item.name} headboard is under a window`,
        description: 'Sleeping with the head under a window weakens support energy and disturbs rest.',
        suggestion: 'Move the bed so the headboard is against a solid wall, not a window.',
      });
    }
  }

  return issues;
}
