const SCALE = 4;

export function toPixels(inches: number): number {
  return inches * SCALE;
}

export function toInches(pixels: number): number {
  return pixels / SCALE;
}
