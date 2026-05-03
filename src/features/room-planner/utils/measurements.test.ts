import { getBoundingBox, findNearestNeighbors, measureTwoObjects } from './measurements';
import type { FurnitureItem } from '../hooks/useFurniture';
import type { RoomLayout } from '../types/room';

const LAYOUT: RoomLayout = { widthIn: 120, heightIn: 120, features: [] };

function item(id: number, x: number, y: number, w: number, h: number): FurnitureItem {
  return { id, name: 'test', x, y, w, h, color: '#fff', rotation: 0 };
}

describe('getBoundingBox', () => {
  it('returns correct box for unrotated item', () => {
    const box = getBoundingBox(item(1, 10, 20, 30, 40));
    expect(box).toEqual({ left: 10, right: 40, top: 20, bottom: 60 });
  });

  it('swaps w/h for 90° rotation', () => {
    const f: FurnitureItem = { ...item(1, 10, 20, 30, 40), rotation: 90 };
    const box = getBoundingBox(f);
    expect(box).toEqual({ left: 10, right: 50, top: 20, bottom: 50 });
  });

  it('swaps w/h for 270° rotation', () => {
    const f: FurnitureItem = { ...item(1, 10, 20, 30, 40), rotation: 270 };
    const box = getBoundingBox(f);
    expect(box).toEqual({ left: 10, right: 50, top: 20, bottom: 50 });
  });
});

describe('findNearestNeighbors', () => {
  it('single item produces 4 wall arrows', () => {
    const furniture = [item(1, 20, 20, 20, 20)];
    const arrows = findNearestNeighbors(furniture, LAYOUT);
    expect(arrows).toHaveLength(4);
  });

  it('arrow gap from item to left wall is correct', () => {
    const furniture = [item(1, 30, 50, 20, 20)];
    const arrows = findNearestNeighbors(furniture, LAYOUT);
    // left wall gap = 30" (item.x); arrow goes from wall (px=0) to item left edge (px=30*4=120)
    const arrowToLeft = arrows.find(a => a.fromX === 0 || a.toX === 0);
    expect(arrowToLeft).toBeDefined();
    expect(arrowToLeft!.gapIn).toBe(30);
  });

  it('two horizontally adjacent items share one arrow between them (deduped)', () => {
    // A at x=0,w=20; B at x=30,w=20 — gap between = 10
    const furniture = [item(1, 0, 40, 20, 20), item(2, 30, 40, 20, 20)];
    const arrows = findNearestNeighbors(furniture, LAYOUT);
    const betweenArrows = arrows.filter(a => a.gapIn === 10);
    expect(betweenArrows).toHaveLength(1);
  });

  it('returns no negative-gap arrows for non-overlapping items', () => {
    const furniture = [item(1, 0, 0, 20, 20), item(2, 30, 0, 20, 20)];
    const arrows = findNearestNeighbors(furniture, LAYOUT);
    arrows.forEach(a => expect(a.gapIn).toBeGreaterThanOrEqual(0));
  });
});

describe('measureTwoObjects', () => {
  it('gap between non-overlapping items is positive', () => {
    const a = item(1, 0, 0, 20, 20);
    const b = item(2, 40, 0, 20, 20);
    const arrow = measureTwoObjects(a, b);
    expect(arrow.gapIn).toBe(20);
    expect(arrow.isOverlap).toBe(false);
  });

  it('gap is zero for touching items', () => {
    const a = item(1, 0, 0, 20, 20);
    const b = item(2, 20, 0, 20, 20);
    const arrow = measureTwoObjects(a, b);
    expect(arrow.gapIn).toBe(0);
  });

  it('marks overlap when items intersect', () => {
    const a = item(1, 0, 0, 30, 30);
    const b = item(2, 10, 10, 30, 30);
    const arrow = measureTwoObjects(a, b);
    expect(arrow.isOverlap).toBe(true);
  });

  it('diagonal gap uses euclidean distance', () => {
    // A occupies [0,20]x[0,20], B occupies [23,43]x[24,44] — gap dx=3, dy=4 → 5
    const a = item(1, 0, 0, 20, 20);
    const b = item(2, 23, 24, 20, 20);
    const arrow = measureTwoObjects(a, b);
    expect(arrow.gapIn).toBeCloseTo(5, 5);
  });
});
