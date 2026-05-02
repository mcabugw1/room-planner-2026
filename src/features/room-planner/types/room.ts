export type WallSide = 'left' | 'right' | 'top' | 'bottom';

export interface WindowFeature {
  type: 'window';
  id: number;
  wall: WallSide;
  offsetIn: number;
  lengthIn: number;
}

export interface WallSegmentFeature {
  type: 'wall-segment';
  id: number;
  wall: WallSide;
  offsetIn: number;
  lengthIn: number;
}

export interface DoorSwingFeature {
  type: 'door-swing';
  id: number;
  wall: WallSide;
  offsetIn: number;
  swingIn: number;
  hingeDirection: 'left' | 'right';
  swingDirection: 'in' | 'out';
}

export type RoomFeature = WindowFeature | WallSegmentFeature | DoorSwingFeature;

export interface RoomLayout {
  widthIn: number;
  heightIn: number;
  features: RoomFeature[];
}
