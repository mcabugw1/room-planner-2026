export type WallSide = 'left' | 'right' | 'top' | 'bottom';

export type RotationDeg = 0 | 90 | 180 | 270;

export interface FurnitureItem {
  id: number;
  name: string;
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
  features: RoomFeature[];
}
