import type { FurnitureItem } from '../types/room';

export function effectiveW(item: FurnitureItem): number {
  return item.rotation === 90 || item.rotation === 270 ? item.h : item.w;
}

export function effectiveH(item: FurnitureItem): number {
  return item.rotation === 90 || item.rotation === 270 ? item.w : item.h;
}

export function safeColor(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#cccccc';
}
