import { toPixels } from '../../../utils/canvasCoords';
import { effectiveW, effectiveH } from './furnitureGeometry';
import type { FurnitureItem, RoomLayout } from '../types/room';

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
  return {
    left: item.x,
    right: item.x + effectiveW(item),
    top: item.y,
    bottom: item.y + effectiveH(item),
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

function scanNeighbor(
  others: BoundingBox[],
  wallEdge: number,
  perpOverlap: (ob: BoundingBox) => boolean,
  isBetter: (scanEdge: number, currentBest: number) => boolean,
  getEdge: (ob: BoundingBox) => number,
  overlapMid: (ob: BoundingBox) => number,
  defaultMid: number,
): { edge: number; mid: number; isWall: boolean } {
  let edge = wallEdge;
  let mid = defaultMid;
  let isWall = true;
  for (const ob of others) {
    if (!perpOverlap(ob)) continue;
    const e = getEdge(ob);
    if (isBetter(e, edge)) {
      edge = e;
      mid = overlapMid(ob);
      isWall = false;
    }
  }
  return { edge, mid, isWall };
}

export function findNearestNeighbors(
  furniture: FurnitureItem[],
  layout: RoomLayout
): MeasurementArrow[] {
  const arrows: MeasurementArrow[] = [];

  for (const item of furniture) {
    const box = getBoundingBox(item);
    const obbs = furniture.filter(f => f.id !== item.id).map(getBoundingBox);

    const horizOverlap = (ob: BoundingBox) => ob.bottom > box.top && ob.top < box.bottom;
    const vertOverlap  = (ob: BoundingBox) => ob.right > box.left && ob.left < box.right;
    const horizMid     = (ob: BoundingBox) => Math.max(box.top, ob.top) / 2 + Math.min(box.bottom, ob.bottom) / 2;
    const vertMid      = (ob: BoundingBox) => Math.max(box.left, ob.left) / 2 + Math.min(box.right, ob.right) / 2;

    // Left
    const L = scanNeighbor(obbs, 0, horizOverlap,
      (e, best) => e <= box.left && e > best,
      ob => ob.right, horizMid, (box.top + box.bottom) / 2);
    const lGap = box.left - L.edge;
    if (lGap >= 0 || L.isWall) arrows.push(makeArrow(L.edge, L.mid, box.left, L.mid, Math.max(0, lGap)));

    // Right
    const R = scanNeighbor(obbs, layout.widthIn, horizOverlap,
      (e, best) => e >= box.right && e < best,
      ob => ob.left, horizMid, (box.top + box.bottom) / 2);
    const rGap = R.edge - box.right;
    if (rGap >= 0 || R.isWall) arrows.push(makeArrow(box.right, R.mid, R.edge, R.mid, Math.max(0, rGap)));

    // Up
    const U = scanNeighbor(obbs, 0, vertOverlap,
      (e, best) => e <= box.top && e > best,
      ob => ob.bottom, vertMid, (box.left + box.right) / 2);
    const uGap = box.top - U.edge;
    if (uGap >= 0 || U.isWall) arrows.push(makeArrow(U.mid, U.edge, U.mid, box.top, Math.max(0, uGap)));

    // Down
    const D = scanNeighbor(obbs, layout.heightIn, vertOverlap,
      (e, best) => e >= box.bottom && e < best,
      ob => ob.top, vertMid, (box.left + box.right) / 2);
    const dGap = D.edge - box.bottom;
    if (dGap >= 0 || D.isWall) arrows.push(makeArrow(D.mid, box.bottom, D.mid, D.edge, Math.max(0, dGap)));
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

  const cpAx = clamp((bb.left + bb.right) / 2, ba.left, ba.right);
  const cpAy = clamp((bb.top + bb.bottom) / 2, ba.top, ba.bottom);
  const cpBx = clamp((ba.left + ba.right) / 2, bb.left, bb.right);
  const cpBy = clamp((ba.top + ba.bottom) / 2, bb.top, bb.bottom);

  const dx = Math.max(0, Math.max(ba.left, bb.left) - Math.min(ba.right, bb.right));
  const dy = Math.max(0, Math.max(ba.top, bb.top) - Math.min(ba.bottom, bb.bottom));
  const gapIn = Math.sqrt(dx * dx + dy * dy);

  const isOverlap = gapIn <= 0;

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
  }

  return makeArrow(fromX, fromY, toX, toY, gapIn);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
