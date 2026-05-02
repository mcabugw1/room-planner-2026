import type { RoomLayout } from '../types/room';

export const DEFAULT_ROOM: RoomLayout = {
  widthIn: 120,
  heightIn: 120,
  features: [
    { type: 'window',       id: 1, wall: 'left',   offsetIn: 30,   lengthIn: 60                          },
    { type: 'wall-segment', id: 2, wall: 'right',  offsetIn: 0,    lengthIn: 50                          },
    { type: 'door-swing',   id: 3, wall: 'right',  offsetIn: 50,   swingIn:  36, hingeDirection: 'right' },
    { type: 'wall-segment', id: 4, wall: 'right',  offsetIn: 86,   lengthIn: 29                          },
    { type: 'wall-segment', id: 5, wall: 'bottom', offsetIn: 34.5, lengthIn: 50.5                        },
  ],
};
