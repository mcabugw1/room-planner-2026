# Goal 09: Compass-Aligned Bagua

## What ships
When the user enters a **compass bearing** in Advanced mode, the Bagua grid switches from BTB (door-relative) to **Compass School** (magnetically aligned). The 9 zones snap to cardinal directions regardless of where the entry door is.

The compass rose in the tab header rotates to show the room's facing direction. A small "N" indicator appears on the canvas pointing North.

## Prerequisites
Goals 01–08 complete (BTB Bagua overlay working, compass bearing input in place).

## Compass Bagua zone mapping (from feng_shui.md §2)
| Direction | Degrees center | Gua | Life Area | Element | Colors |
|-----------|---------------|-----|-----------|---------|--------|
| N | 0° | Kan | Career | Water | Blue, Black |
| NE | 45° | Gen | Knowledge | Earth | Beige, Light Yellow |
| E | 90° | Zhen | Family/Health | Wood | Green, Brown |
| SE | 135° | Xun | Wealth | Wood | Purple, Green |
| S | 180° | Li | Fame | Fire | Red, Orange, Pink |
| SW | 225° | Kun | Love/Marriage | Earth | Pink, Beige |
| W | 270° | Dui | Children/Creativity | Metal | White, Gray |
| NW | 315° | Qian | Helpful People | Metal | Gray, Silver |
| Center | — | Tai Ji | Health/Unity | Earth | Yellow |

## Zone geometry for compass alignment
- `compassBearing` = degrees the room's front wall faces from North (0–360)
- Each of the 8 cardinal zones = a wedge-shaped sector of the room... but for rectangular rooms, use a simplified 3×3 grid rotated to align with compass (center zone = center third of room; each outer zone = the third of the room closest to that compass direction)
- Implementation: compute which of the 8 compass directions each room "third" faces, assign that zone's data

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/feng-shui/bagua.ts` | Add `computeCompassZones(layout, compassBearing)` → `BaguaZone[]`; auto-switch logic: if `compassBearing !== null` use compass, else use BTB |
| `src/features/room-planner/feng-shui/bagua.test.ts` | Add compass zone tests (bearing 0°, 90°, 180°, 270°, and non-cardinal 45°) |
| `src/features/room-planner/components/BaguaOverlayLayer.tsx` | Accept `bearing?: number` prop; render North indicator arrow when compass mode active |
| `src/features/room-planner/components/FengShuiTab.tsx` | Pass `compassBearing` to zone computation; update canvas when bearing changes |

## Acceptance criteria
- [ ] Entering compass bearing switches Bagua from BTB to compass alignment immediately
- [ ] Clearing compass bearing reverts to BTB
- [ ] North indicator arrow appears on canvas pointing to the correct wall/corner for entered bearing
- [ ] Zone colors/labels match compass Bagua table above
- [ ] Color recommendations (Goal 08) use the compass zones when in compass mode
- [ ] Bearing 0° = N wall of canvas = North; 90° = right wall = East; etc.
