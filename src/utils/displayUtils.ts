export type UnitSystem = 'ft-in' | 'in';

export function formatDim(inches: number, unit: UnitSystem): string {
  const rounded = Math.round(inches * 2) / 2;
  if (unit === 'in') return `${rounded}"`;
  const ft = Math.floor(rounded / 12);
  const inch = Math.round((rounded - ft * 12) * 2) / 2;
  if (ft === 0) return `${inch}"`;
  if (inch === 0) return `${ft}'`;
  return `${ft}' ${inch}"`;
}
