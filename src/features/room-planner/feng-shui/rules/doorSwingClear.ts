import type { FurnitureItem, DoorSwingFeature, RoomLayout } from '../../types/room';
import type { FengShuiIssue } from '../types';
import { itemAabb, cross2d, dot2d } from '../geometry';
import type { Vec2, Aabb } from '../geometry';

interface SectorDef {
  hinge: Vec2;
  radius: number;
  dClosed: Vec2;
  dOpen: Vec2;
  /** true = CCW sweep, false = CW sweep (screen coords, y-down) */
  isCCW: boolean;
}

function buildSector(door: DoorSwingFeature, roomW: number, roomH: number): SectorDef {
  const { wall, offsetIn, swingIn, hingeDirection, swingDirection } = door;
  const R = swingIn;

  let hinge: Vec2;
  let dClosed: Vec2;
  let dOpen: Vec2;
  let isCCW: boolean;

  // dOpen directions per wall/swing:
  // top/bottom walls: swingIn → dOpen=(0,+/-1), swingOut → opposite
  // left/right walls: swingIn → dOpen=(+/-1,0), swingOut → opposite

  switch (wall) {
    case 'top': {
      hinge = hingeDirection === 'left'
        ? { x: offsetIn, y: 0 }
        : { x: offsetIn + swingIn, y: 0 };
      dClosed = hingeDirection === 'left' ? { x: 1, y: 0 } : { x: -1, y: 0 };
      const inward = swingDirection === 'in' ? 1 : -1;
      dOpen = { x: 0, y: inward };
      // CCW in screen-coords when dClosed points east and dOpen points south, with hingeLeft
      isCCW = hingeDirection === 'left' ? swingDirection === 'in' : swingDirection !== 'in';
      break;
    }
    case 'bottom': {
      hinge = hingeDirection === 'left'
        ? { x: offsetIn, y: roomH }
        : { x: offsetIn + swingIn, y: roomH };
      dClosed = hingeDirection === 'left' ? { x: 1, y: 0 } : { x: -1, y: 0 };
      const inward = swingDirection === 'in' ? -1 : 1;
      dOpen = { x: 0, y: inward };
      isCCW = hingeDirection === 'left' ? swingDirection !== 'in' : swingDirection === 'in';
      break;
    }
    case 'left': {
      hinge = hingeDirection === 'left'
        ? { x: 0, y: offsetIn }
        : { x: 0, y: offsetIn + swingIn };
      dClosed = hingeDirection === 'left' ? { x: 0, y: 1 } : { x: 0, y: -1 };
      const inward = swingDirection === 'in' ? 1 : -1;
      dOpen = { x: inward, y: 0 };
      isCCW = hingeDirection === 'left' ? swingDirection !== 'in' : swingDirection === 'in';
      break;
    }
    case 'right': {
      hinge = hingeDirection === 'left'
        ? { x: roomW, y: offsetIn }
        : { x: roomW, y: offsetIn + swingIn };
      dClosed = hingeDirection === 'left' ? { x: 0, y: 1 } : { x: 0, y: -1 };
      const inward = swingDirection === 'in' ? -1 : 1;
      dOpen = { x: inward, y: 0 };
      isCCW = hingeDirection === 'left' ? swingDirection === 'in' : swingDirection !== 'in';
      break;
    }
  }

  return { hinge: hinge!, radius: R, dClosed: dClosed!, dOpen: dOpen!, isCCW: isCCW! };
}

function pointInSector(p: Vec2, s: SectorDef): boolean {
  const rel = { x: p.x - s.hinge.x, y: p.y - s.hinge.y };
  if (rel.x * rel.x + rel.y * rel.y > s.radius * s.radius) return false;
  const c1 = cross2d(s.dClosed, rel);
  const c2 = cross2d(s.dOpen, rel);
  return s.isCCW ? c1 >= 0 && c2 <= 0 : c1 <= 0 && c2 >= 0;
}

function closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const ab2 = dot2d(ab, ab);
  if (ab2 < 1e-9) return a;
  const t = Math.max(0, Math.min(1, dot2d({ x: p.x - a.x, y: p.y - a.y }, ab) / ab2));
  return { x: a.x + t * ab.x, y: a.y + t * ab.y };
}

function aabbVsSector(aabb: Aabb, s: SectorDef): boolean {
  const { x, y, w, h } = aabb;
  const corners: Vec2[] = [
    { x, y }, { x: x + w, y }, { x, y: y + h }, { x: x + w, y: y + h },
  ];

  if (corners.some(c => pointInSector(c, s))) return true;

  // Check if arc passes through any AABB edge
  const edges: [Vec2, Vec2][] = [
    [corners[0], corners[1]],
    [corners[1], corners[3]],
    [corners[3], corners[2]],
    [corners[2], corners[0]],
  ];

  for (const [a, b] of edges) {
    const closest = closestPointOnSegment(s.hinge, a, b);
    const dx = closest.x - s.hinge.x, dy = closest.y - s.hinge.y;
    if (dx * dx + dy * dy <= s.radius * s.radius) {
      if (pointInSector(closest, s)) return true;
    }
  }

  return false;
}

export function checkDoorSwingClear(
  furniture: FurnitureItem[],
  door: DoorSwingFeature,
  layout: RoomLayout,
): FengShuiIssue[] {
  const sector = buildSector(door, layout.widthIn, layout.heightIn);
  const issues: FengShuiIssue[] = [];

  for (const item of furniture) {
    if (aabbVsSector(itemAabb(item), sector)) {
      issues.push({
        ruleId: 'door-swing-clear',
        severity: 'error',
        affectedItemId: item.id,
        title: `${item.name} blocks the door swing`,
        description: 'Furniture inside the door\'s swing arc prevents the door from opening fully.',
        suggestion: `Move ${item.name} outside the door swing area to restore free flow.`,
      });
    }
  }

  return issues;
}
