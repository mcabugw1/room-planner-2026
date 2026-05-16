import type { FurnitureItem, DoorSwingFeature, WallSide, RotationDeg } from '../types/room';
import { effectiveW, effectiveH } from '../utils/furnitureGeometry';

export interface Vec2 { x: number; y: number }

export interface Aabb {
  x: number; y: number; w: number; h: number;
}

export function itemAabb(item: FurnitureItem): Aabb {
  return { x: item.x, y: item.y, w: effectiveW(item), h: effectiveH(item) };
}

export function aabbCenter(a: Aabb): Vec2 {
  return { x: a.x + a.w / 2, y: a.y + a.h / 2 };
}

/** 2D cross product of vectors a and b. */
export function cross2d(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

/** 2D dot product. */
export function dot2d(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function dist2(a: Vec2, b: Vec2): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** Door opening center as a 2D point 6" inside the room (threshold). */
export function doorThreshold(door: DoorSwingFeature, roomW: number, roomH: number): Vec2 {
  const mid = door.offsetIn + door.swingIn / 2;
  const INSET = 6;
  switch (door.wall) {
    case 'top':    return { x: mid, y: INSET };
    case 'bottom': return { x: mid, y: roomH - INSET };
    case 'left':   return { x: INSET, y: mid };
    case 'right':  return { x: roomW - INSET, y: mid };
  }
}

/**
 * Returns true if the segment from p1 to p2 intersects the AABB [ax, ax+aw] × [ay, ay+ah].
 * Uses parametric slab intersection.
 */
export function segmentIntersectsAabb(p1: Vec2, p2: Vec2, a: Aabb): boolean {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  let tmin = 0, tmax = 1;

  if (Math.abs(dx) < 1e-9) {
    if (p1.x < a.x || p1.x > a.x + a.w) return false;
  } else {
    const tx1 = (a.x - p1.x) / dx;
    const tx2 = (a.x + a.w - p1.x) / dx;
    tmin = Math.max(tmin, Math.min(tx1, tx2));
    tmax = Math.min(tmax, Math.max(tx1, tx2));
  }

  if (Math.abs(dy) < 1e-9) {
    if (p1.y < a.y || p1.y > a.y + a.h) return false;
  } else {
    const ty1 = (a.y - p1.y) / dy;
    const ty2 = (a.y + a.h - p1.y) / dy;
    tmin = Math.max(tmin, Math.min(ty1, ty2));
    tmax = Math.min(tmax, Math.max(ty1, ty2));
  }

  return tmin <= tmax;
}

/** True if any other furniture AABB blocks the segment from p1 to p2. */
export function isLineOfSightBlocked(
  p1: Vec2, p2: Vec2,
  allFurniture: FurnitureItem[],
  excludeId: number,
): boolean {
  return allFurniture.some(f => {
    if (f.id === excludeId) return false;
    return segmentIntersectsAabb(p1, p2, itemAabb(f));
  });
}

/**
 * Back-edge distance to nearest wall (the wall the item faces away from).
 * headAtStart=true: head/back at leading edge (top when rotation=0).
 * Returns { distance, wall }.
 */
export function backEdgeDistance(
  item: FurnitureItem,
  roomW: number,
  roomH: number,
): number {
  const ew = effectiveW(item);
  const eh = effectiveH(item);
  const headAtStart = item.headAtStart ?? false;
  const rot = item.rotation as RotationDeg;

  // Mapping: (headAtStart, rotation) → distance from back edge to its wall
  if (headAtStart) {
    switch (rot) {
      case 0:   return item.y;                    // head=top, wall=top
      case 90:  return item.x + ew > roomW ? 0 : roomW - (item.x + ew); // head=right, wall=right... actually head=right edge
      case 180: return roomH - (item.y + eh);     // head=bottom, wall=bottom
      case 270: return item.x;                    // head=left, wall=left
    }
  } else {
    switch (rot) {
      case 0:   return roomH - (item.y + eh);     // head=bottom, foot=top → back=bottom...
      case 90:  return item.x;                    // head=left edge, wall=left
      case 180: return item.y;                    // head=top edge, wall=top
      case 270: return roomW - (item.x + ew);     // head=right edge, wall=right
    }
  }
  return Infinity;
}

/**
 * Returns the wall that the back/head edge faces, its position along that wall,
 * and its span (start, end) along that wall — used for window overlap check.
 */
export function headEdgeInfo(
  item: FurnitureItem,
  roomW: number,
  roomH: number,
): { wall: WallSide; edgeDist: number; spanStart: number; spanEnd: number } {
  const ew = effectiveW(item);
  const eh = effectiveH(item);
  const headAtStart = item.headAtStart ?? false;
  const rot = item.rotation as RotationDeg;

  if (headAtStart) {
    switch (rot) {
      case 0:   return { wall: 'top',    edgeDist: item.y,          spanStart: item.x,     spanEnd: item.x + ew };
      case 90:  return { wall: 'right',  edgeDist: roomW - (item.x + ew), spanStart: item.y,  spanEnd: item.y + eh };
      case 180: return { wall: 'bottom', edgeDist: roomH - (item.y + eh), spanStart: item.x, spanEnd: item.x + ew };
      case 270: return { wall: 'left',   edgeDist: item.x,          spanStart: item.y,     spanEnd: item.y + eh };
    }
  } else {
    switch (rot) {
      case 0:   return { wall: 'bottom', edgeDist: roomH - (item.y + eh), spanStart: item.x, spanEnd: item.x + ew };
      case 90:  return { wall: 'left',   edgeDist: item.x,               spanStart: item.y,  spanEnd: item.y + eh };
      case 180: return { wall: 'top',    edgeDist: item.y,               spanStart: item.x,  spanEnd: item.x + ew };
      case 270: return { wall: 'right',  edgeDist: roomW - (item.x + ew), spanStart: item.y, spanEnd: item.y + eh };
    }
  }
  // unreachable
  return { wall: 'top', edgeDist: Infinity, spanStart: 0, spanEnd: 0 };
}

/** True if intervals [a1,a2] and [b1,b2] overlap (not just touch). */
export function intervalsOverlap(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && b1 < a2;
}

/**
 * Foot direction unit vector for an item, given rotation and headAtStart.
 * headAtStart=true means head is at the top when rotation=0; foot is opposite.
 */
export function footVector(rotation: RotationDeg, headAtStart: boolean): Vec2 {
  // headAtStart=true: foot points away from head (top)
  // rotation=0 → foot = (0,1) south
  // rotation=90 → head at right, foot = (-1,0) west? No: head at right means foot at left
  // Wait: after rotation, the item's "top" (head) has moved.
  // headAtStart=true + rotation=0: head=top, foot=down (0,1)
  // headAtStart=true + rotation=90: item rotated 90° CW, original top now at right → head=right, foot=left (-1,0)?
  // Hmm, "original top now at right" means the head faces right. Foot faces left. Foot vector = (-1,0).

  // Actually let me re-derive: after CW 90° rotation:
  // the item's local top edge is now the AABB's right side.
  // headAtStart=true: head is at local top = right side of AABB → foot points left (-1,0)?
  // But wait: effectiveW for rotation=90 = item.h, effectiveH = item.w.
  // The item fills AABB [x, x+item.h] × [y, y+item.w].
  // The "natural top" of the item (local top when rotation=0) maps to the RIGHT edge of AABB when rotation=90.
  // So head is at AABB right (x+item.h), foot is at AABB left (x).
  // Foot vector = pointing toward left = (-1, 0).

  if (headAtStart) {
    switch (rotation) {
      case 0:   return { x: 0, y: 1 };    // foot points south
      case 90:  return { x: -1, y: 0 };   // foot points west
      case 180: return { x: 0, y: -1 };   // foot points north
      case 270: return { x: 1, y: 0 };    // foot points east
    }
  } else {
    switch (rotation) {
      case 0:   return { x: 0, y: -1 };   // head at bottom → foot points north
      case 90:  return { x: 1, y: 0 };    // head at left → foot points east
      case 180: return { x: 0, y: 1 };    // head at top → foot points south
      case 270: return { x: -1, y: 0 };   // head at right → foot points west
    }
  }
  return { x: 0, y: 1 };
}

/**
 * Normalize a vector. Returns {x:0,y:0} if length is near 0.
 */
export function normalize(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-9) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Angle in radians between two unit vectors.
 */
export function angleBetween(a: Vec2, b: Vec2): number {
  const d = Math.max(-1, Math.min(1, dot2d(a, b)));
  return Math.acos(d);
}
