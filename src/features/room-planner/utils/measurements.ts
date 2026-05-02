import { toPixels } from '../../../utils/coordinates';
import type { FurnitureItem } from '../hooks/useFurniture';
import type { RoomLayout } from '../types/room';

export interface BoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface MeasurementArrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  midX: number;
  midY: number;
  gapIn: number;
  label: string;
  isOverlap: boolean;
}

export function getBoundingBox(item: FurnitureItem): BoundingBox {
  const isOdd = item.rotation === 90 || item.rotation === 270;
  const w = isOdd ? item.h : item.w;
  const h = isOdd ? item.w : item.h;
  return {
    left: item.x,
    right: item.x + w,
    top: item.y,
    bottom: item.y + h,
  };
}

export function formatGap(inches: number): string {
  const totalIn = Math.round(inches);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;
  if (ft === 0) return `${inch}"`;
  if (inch === 0) return `${ft}'`;
  return `${ft}' ${inch}"`;
}

function makeArrow(
  fromX: number, fromY: number, toX: number, toY: number, gapIn: number
): MeasurementArrow {
  const isOverlap = gapIn <= 0;
  return {
    fromX: toPixels(fromX),
    fromY: toPixels(fromY),
    toX: toPixels(toX),
    toY: toPixels(toY),
    midX: toPixels((fromX + toX) / 2),
    midY: toPixels((fromY + toY) / 2),
    gapIn,
    label: isOverlap ? 'overlap' : formatGap(gapIn),
    isOverlap,
  };
}

export function findNearestNeighbors(
  furniture: FurnitureItem[],
  layout: RoomLayout
): MeasurementArrow[] {
  const arrows: MeasurementArrow[] = [];

  for (const item of furniture) {
    const box = getBoundingBox(item);
    const others = furniture.filter(f => f.id !== item.id);

    // Left direction: find closest right edge to our left edge
    {
      const wallEdge = 0;
      let closestEdge = wallEdge;
      let closestMidY = (box.top + box.bottom) / 2;
      let isWall = true;

      for (const other of others) {
        const ob = getBoundingBox(other);
        // Must overlap on Y axis
        if (ob.bottom <= box.top || ob.top >= box.bottom) continue;
        if (ob.right <= box.left && ob.right > closestEdge) {
          closestEdge = ob.right;
          closestMidY = Math.max(box.top, ob.top) / 2 + Math.min(box.bottom, ob.bottom) / 2;
          isWall = false;
        }
      }

      const fromX = box.left;
      const toX = closestEdge;
      const midY = isWall ? (box.top + box.bottom) / 2 : closestMidY;
      const gapIn = fromX - toX;
      if (gapIn >= 0 || isWall) {
        arrows.push(makeArrow(toX, midY, fromX, midY, Math.max(0, gapIn)));
      }
    }

    // Right direction
    {
      const wallEdge = layout.widthIn;
      let closestEdge = wallEdge;
      let closestMidY = (box.top + box.bottom) / 2;
      let isWall = true;

      for (const other of others) {
        const ob = getBoundingBox(other);
        if (ob.bottom <= box.top || ob.top >= box.bottom) continue;
        if (ob.left >= box.right && ob.left < closestEdge) {
          closestEdge = ob.left;
          closestMidY = Math.max(box.top, ob.top) / 2 + Math.min(box.bottom, ob.bottom) / 2;
          isWall = false;
        }
      }

      const fromX = box.right;
      const toX = closestEdge;
      const midY = isWall ? (box.top + box.bottom) / 2 : closestMidY;
      const gapIn = toX - fromX;
      if (gapIn >= 0 || isWall) {
        arrows.push(makeArrow(fromX, midY, toX, midY, Math.max(0, gapIn)));
      }
    }

    // Up direction
    {
      const wallEdge = 0;
      let closestEdge = wallEdge;
      let closestMidX = (box.left + box.right) / 2;
      let isWall = true;

      for (const other of others) {
        const ob = getBoundingBox(other);
        if (ob.right <= box.left || ob.left >= box.right) continue;
        if (ob.bottom <= box.top && ob.bottom > closestEdge) {
          closestEdge = ob.bottom;
          closestMidX = Math.max(box.left, ob.left) / 2 + Math.min(box.right, ob.right) / 2;
          isWall = false;
        }
      }

      const fromY = box.top;
      const toY = closestEdge;
      const midX = isWall ? (box.left + box.right) / 2 : closestMidX;
      const gapIn = fromY - toY;
      if (gapIn >= 0 || isWall) {
        arrows.push(makeArrow(midX, toY, midX, fromY, Math.max(0, gapIn)));
      }
    }

    // Down direction
    {
      const wallEdge = layout.heightIn;
      let closestEdge = wallEdge;
      let closestMidX = (box.left + box.right) / 2;
      let isWall = true;

      for (const other of others) {
        const ob = getBoundingBox(other);
        if (ob.right <= box.left || ob.left >= box.right) continue;
        if (ob.top >= box.bottom && ob.top < closestEdge) {
          closestEdge = ob.top;
          closestMidX = Math.max(box.left, ob.left) / 2 + Math.min(box.right, ob.right) / 2;
          isWall = false;
        }
      }

      const fromY = box.bottom;
      const toY = closestEdge;
      const midX = isWall ? (box.left + box.right) / 2 : closestMidX;
      const gapIn = toY - fromY;
      if (gapIn >= 0 || isWall) {
        arrows.push(makeArrow(midX, fromY, midX, toY, Math.max(0, gapIn)));
      }
    }
  }

  return deduplicateArrows(arrows);
}

function arrowKey(a: MeasurementArrow): string {
  const [x1, y1, x2, y2] = [
    Math.min(a.fromX, a.toX),
    Math.min(a.fromY, a.toY),
    Math.max(a.fromX, a.toX),
    Math.max(a.fromY, a.toY),
  ];
  return `${x1},${y1},${x2},${y2}`;
}

function deduplicateArrows(arrows: MeasurementArrow[]): MeasurementArrow[] {
  const seen = new Map<string, MeasurementArrow>();
  for (const a of arrows) {
    const key = arrowKey(a);
    if (!seen.has(key)) seen.set(key, a);
  }
  return Array.from(seen.values());
}

export function measureTwoObjects(a: FurnitureItem, b: FurnitureItem): MeasurementArrow {
  const ba = getBoundingBox(a);
  const bb = getBoundingBox(b);

  // Closest points on each bounding box
  const ax = clamp(bb.left + (bb.right - bb.left) / 2, ba.left, ba.right);
  const ay = clamp(bb.top + (bb.bottom - bb.top) / 2, ba.top, ba.bottom);
  const bx = clamp(ba.left + (ba.right - ba.left) / 2, bb.left, bb.right);
  const by = clamp(ba.top + (ba.bottom - ba.top) / 2, bb.top, bb.bottom);

  // Refine: closest point on A to center of B
  const cpAx = clamp((bb.left + bb.right) / 2, ba.left, ba.right);
  const cpAy = clamp((bb.top + bb.bottom) / 2, ba.top, ba.bottom);
  const cpBx = clamp((ba.left + ba.right) / 2, bb.left, bb.right);
  const cpBy = clamp((ba.top + ba.bottom) / 2, bb.top, bb.bottom);

  const dx = Math.max(0, Math.max(ba.left, bb.left) - Math.min(ba.right, bb.right));
  const dy = Math.max(0, Math.max(ba.top, bb.top) - Math.min(ba.bottom, bb.bottom));
  const gapIn = Math.sqrt(dx * dx + dy * dy);

  const isOverlap = gapIn <= 0;

  // Pick arrow endpoints on the facing edges
  let fromX: number, fromY: number, toX: number, toY: number;

  if (isOverlap) {
    fromX = (ba.left + ba.right) / 2;
    fromY = (ba.top + ba.bottom) / 2;
    toX = (bb.left + bb.right) / 2;
    toY = (bb.top + bb.bottom) / 2;
  } else {
    fromX = cpAx;
    fromY = cpAy;
    toX = cpBx;
    toY = cpBy;
    void ax; void ay; void bx; void by;
  }

  return makeArrow(fromX, fromY, toX, toY, gapIn);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
