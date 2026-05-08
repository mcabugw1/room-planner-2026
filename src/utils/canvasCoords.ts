export const CANVAS_SCALE = 4;

export function toPixels(inches: number): number {
  return inches * CANVAS_SCALE;
}

export function toInches(pixels: number): number {
  return pixels / CANVAS_SCALE;
}
