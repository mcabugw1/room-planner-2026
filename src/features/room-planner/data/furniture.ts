import type { FurnitureItem } from '../types/room';

export const INITIAL_FURNITURE: FurnitureItem[] = [
  { id: 1, name: 'Bed',  category: 'bed',  w: 54, h: 75, x: 10, y: 10, color: '#ffcccb', rotation: 0, heightIn: 24, zOffsetIn: 0 },
  { id: 2, name: 'Desk', category: 'desk', w: 48, h: 24, x: 70, y: 10, color: '#add8e6', rotation: 0, heightIn: 30, zOffsetIn: 0 },
];
