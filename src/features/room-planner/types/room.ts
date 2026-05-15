export type WallSide = 'left' | 'right' | 'top' | 'bottom';

export type RotationDeg = 0 | 90 | 180 | 270;

export type FurnitureCategory = 'bed' | 'desk' | 'sofa' | 'stove' | 'other';

export type RoomType = 'bedroom' | 'living-room' | 'office' | 'kitchen' | 'dining-room' | 'other';

export interface FengShuiConfig {
  entryDoorId?: number;
  mode?: 'simple' | 'advanced';
  compassBearing?: number;
  birthYear?: number;
  // Kua number uses biological sex assignment, not gender identity
  sex?: 'male' | 'female';
  kuaNumber?: number;
  bathroomWalls?: WallSide[];
}

export interface FurnitureItem {
  id: number;
  name: string;
  category: FurnitureCategory;
  w: number;
  h: number;
  x: number;
  y: number;
  color: string;
  rotation: RotationDeg;
  heightIn: number;
  zOffsetIn: number;
}

export interface WindowFeature {
  type: 'window';
  id: number;
  wall: WallSide;
  offsetIn: number;
  lengthIn: number;
  sillHeightIn: number;
  openingHeightIn: number;
}

export interface WallSegmentFeature {
  type: 'wall-segment';
  id: number;
  wall: WallSide;
  offsetIn: number;
  lengthIn: number;
  heightIn: number;
}

export interface DoorSwingFeature {
  type: 'door-swing';
  id: number;
  wall: WallSide;
  offsetIn: number;
  swingIn: number;
  hingeDirection: 'left' | 'right';
  swingDirection: 'in' | 'out';
  doorHeightIn: number;
}

export type RoomFeature = WindowFeature | WallSegmentFeature | DoorSwingFeature;

export interface RoomLayout {
  widthIn: number;
  heightIn: number;
  ceilingHeightIn: number;
  roomType: RoomType;
  fengShuiConfig?: FengShuiConfig;
  features: RoomFeature[];
}
