# Goal 07: BTB Bagua Overlay on Canvas

## What ships
In Advanced mode (with no compass bearing entered), the canvas shows a **9-zone Bagua grid** overlaid on the room — semi-transparent colored zones with Chinese trigram name + life area label.

BTB alignment: the entry door wall = bottom of the Bagua (Gen–Kan–Qian row). The grid divides the room into a 3×3 matrix of equal thirds.

## Prerequisites
Goals 01–06 complete.

## BTB zone layout (from feng_shui.md §2)
Door wall = bottom row. Looking into room from door:

| Col → | Left | Center | Right |
|-------|------|--------|-------|
| **Back** | Xun — Wealth (purple) | Li — Fame (red) | Kun — Love (pink) |
| **Mid** | Zhen — Family (green) | Tai Chi — Health (yellow) | Dui — Children (white) |
| **Front** | Gen — Knowledge (blue) | Kan — Career (black) | Qian — Helpful People (gray) |

When `compassBearing` is set → switch to Compass Bagua (Goal 09). This goal covers BTB only.

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/feng-shui/bagua.ts` | **New.** `computeBTBZones(layout, entryDoorWall)` → `BaguaZone[]`; each zone: `{ name, lifeArea, element, color, rect: {x,y,w,h} }` in inch coordinates |
| `src/features/room-planner/feng-shui/bagua.test.ts` | **New.** Tests for zone geometry across all 4 entry door walls |
| `src/features/room-planner/components/BaguaOverlayLayer.tsx` | **New.** SVG `<g>`: renders 9 `<rect>` zones with `fill-opacity: 0.12`, `stroke-opacity: 0.3`, zone label (`<text>`) centered in each zone |
| `src/features/room-planner/components/RoomCanvas.tsx` | Accept `baguaZones?: BaguaZone[]` prop; render `<BaguaOverlayLayer>` below highlight rings |
| `src/features/room-planner/components/FengShuiTab.tsx` | Compute BTB zones when in Advanced mode + entry door set; pass to canvas |

## Visual spec
- Zone fill: native element color at 12% opacity (e.g. Wealth = purple `#805ad5` at 0.12)
- Zone stroke: same color at 30% opacity, `stroke-width: 1`
- Label: two lines — trigram name (small, 9px) + life area (10px bold); centered; dark text
- Tai Chi center zone: yellow fill, no label crowding — just "Health" centered
- Grid lines align exactly to room boundary (no padding)

## Acceptance criteria
- [ ] 9 zones visible on canvas in Advanced mode when entry door is set
- [ ] Zones hidden in Simple mode
- [ ] Grid orientation correct for all 4 entry door walls (left/right/top/bottom)
- [ ] Zone colors match feng_shui.md §2 table
- [ ] Labels readable at default zoom; gracefully degrade (hide label) at very small room sizes
- [ ] Bagua zones persist correctly when room dimensions change
