export type WallSide = 'left' | 'right' | 'top' | 'bottom';

export interface WindowFeature {
  type: 'window';
  wall: WallSide;
  offsetIn: number;
  lengthIn: number;
}

export interface WallSegmentFeature {
  type: 'wall-segment';
  wall: WallSide;
  offsetIn: number;
  lengthIn: number;
}

export interface DoorSwingFeature {
  type: 'door-swing';
  wall: WallSide;
  offsetIn: number;
  swingIn: number;
}

export type RoomFeature = WindowFeature | WallSegmentFeature | DoorSwingFeature;

export interface RoomLayout {
  widthIn: number;
  heightIn: number;
  features: RoomFeature[];
}
