import type { RoomLayout } from '../types/room';

export const DEFAULT_ROOM: RoomLayout = {
  widthIn: 120,
  heightIn: 120,
  features: [
    { type: 'window',       wall: 'left',   offsetIn: 30,   lengthIn: 60   },
    { type: 'wall-segment', wall: 'right',  offsetIn: 0,    lengthIn: 50   },
    { type: 'door-swing',   wall: 'right',  offsetIn: 50,   swingIn:  36   },
    { type: 'wall-segment', wall: 'right',  offsetIn: 86,   lengthIn: 29   },
    { type: 'wall-segment', wall: 'bottom', offsetIn: 34.5, lengthIn: 50.5 },
  ],
};
