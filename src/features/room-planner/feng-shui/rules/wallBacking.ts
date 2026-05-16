import type { FurnitureItem, RoomLayout } from '../../types/room';
import type { FengShuiIssue } from '../types';
import { backEdgeDistance } from '../geometry';

const BACKING_CATEGORIES = new Set(['bed', 'desk', 'sofa', 'stove']);
const MAX_BACKING_DIST = 6;

export function checkWallBacking(
  furniture: FurnitureItem[],
  layout: RoomLayout,
): FengShuiIssue[] {
  const issues: FengShuiIssue[] = [];

  for (const item of furniture) {
    if (!BACKING_CATEGORIES.has(item.category)) continue;
    if (item.headAtStart === undefined) continue; // skip if user hasn't set orientation

    const dist = backEdgeDistance(item, layout.widthIn, layout.heightIn);
    if (dist > MAX_BACKING_DIST) {
      const label = item.category === 'bed' ? 'head' : 'back';
      issues.push({
        ruleId: 'wall-backing',
        severity: 'warning',
        affectedItemId: item.id,
        title: `${item.name} has no solid wall backing`,
        description: `The ${label} edge is ${Math.round(dist)}" from the nearest wall. Furniture without wall support creates instability.`,
        suggestion: `Push the ${label} of ${item.name} within 6" of a solid wall.`,
      });
    }
  }

  return issues;
}
