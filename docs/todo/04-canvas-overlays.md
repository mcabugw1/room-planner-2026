# Goal 04: Canvas Overlays + Click-to-Highlight

## What ships
The Feng Shui canvas gains two visual layers:
1. **Furniture highlight rings** — colored SVG rings around pieces with issues (red = error, amber = warning, green = pass for FS-relevant pieces)
2. **Click-to-highlight** — clicking an issue in the panel scrolls canvas to that piece and pulses its ring

No Bagua grid yet — that's Goal 07.

## Prerequisites
Goals 01–03 complete (engine returns `FengShuiIssue[]` with `affectedItemId`).

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/feng-shui/types.ts` | Add `FengShuiOverlay` type: `{ highlights: { itemId: number; severity: 'error' \| 'warning' \| 'pass' }[] }` |
| `src/features/room-planner/components/RoomCanvas.tsx` | Accept optional `fengShuiOverlay?: FengShuiOverlay` prop; render `<FengShuiHighlightLayer>` as SVG `<g>` child |
| `src/features/room-planner/components/FengShuiHighlightLayer.tsx` | **New.** SVG `<g>` component; renders colored rings at each furniture item's bounding box; accepts `pulseItemId` for animation |
| `src/features/room-planner/components/FengShuiTab.tsx` | Track `activeIssueItemId`; pass overlay to canvas; handle issue click → set active item |
| `src/features/room-planner/components/IssueList.tsx` | Add `onIssueClick` callback; highlight active issue row |

## SVG ring spec
- Ring = `<rect>` slightly larger than furniture bounding box, `fill: none`, `stroke: <color>`, `stroke-width: 3`, `rx: 4`
- Colors: `#e53e3e` (error), `#d97706` (warning), `#38a169` (pass)
- Pulse animation: CSS `@keyframes` scale 1→1.05→1 on active item, 600ms, 2 cycles
- Rings render above wall SVG but below `react-rnd` furniture divs (z-order via SVG layer order)

## Acceptance criteria
- [ ] After "Analyze", furniture pieces show colored rings on the FS tab canvas
- [ ] Pieces with no FS-relevant category show no ring
- [ ] Clicking issue in panel → ring on corresponding piece pulses
- [ ] Rings stay pixel-aligned at all zoom levels (they live inside the viewport transform)
- [ ] Rings disappear when FS tab is not active (no prop passed to `RoomCanvas`)
