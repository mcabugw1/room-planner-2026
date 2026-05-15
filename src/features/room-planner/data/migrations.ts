import type { RoomFeature, WindowFeature, WallSegmentFeature, DoorSwingFeature, FurnitureItem, FurnitureCategory, RoomType, FengShuiConfig } from '../types/room';

export interface LayoutSnapshot {
  widthIn: number;
  heightIn: number;
  ceilingHeightIn: number;
  roomType: RoomType;
  fengShuiConfig?: FengShuiConfig;
  features: RoomFeature[];
  furniture: FurnitureItem[];
}

function migrateFeature(f: unknown): RoomFeature {
  const feat = f as Record<string, unknown>;
  if (feat['type'] === 'window') {
    return { ...(feat as unknown as WindowFeature), sillHeightIn: (feat['sillHeightIn'] as number) ?? 36, openingHeightIn: (feat['openingHeightIn'] as number) ?? 48 };
  }
  if (feat['type'] === 'wall-segment') {
    return { ...(feat as unknown as WallSegmentFeature), heightIn: (feat['heightIn'] as number) ?? 96 };
  }
  return { ...(feat as unknown as DoorSwingFeature), doorHeightIn: (feat['doorHeightIn'] as number) ?? 80 };
}

function migrateFurniture(f: unknown): FurnitureItem {
  const item = f as Record<string, unknown>;
  return {
    ...(item as unknown as FurnitureItem),
    heightIn: (item['heightIn'] as number) ?? 36,
    zOffsetIn: (item['zOffsetIn'] as number) ?? 0,
    category: (item['category'] as FurnitureCategory) ?? 'other',
  };
}

export function migrateSnapshot(raw: unknown): LayoutSnapshot {
  const s = raw as Record<string, unknown>;
  return {
    widthIn: (s['widthIn'] as number) ?? 120,
    heightIn: (s['heightIn'] as number) ?? 120,
    ceilingHeightIn: (s['ceilingHeightIn'] as number) ?? 96,
    roomType: (s['roomType'] as RoomType) ?? 'bedroom',
    fengShuiConfig: s['fengShuiConfig'] as FengShuiConfig | undefined,
    features: ((s['features'] as unknown[]) ?? []).map(migrateFeature),
    furniture: ((s['furniture'] as unknown[]) ?? []).map(migrateFurniture),
  };
}
