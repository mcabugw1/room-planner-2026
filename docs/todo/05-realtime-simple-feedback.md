# Goal 05: Real-Time Simple Rule Feedback

## What ships
While on the Feng Shui tab, furniture highlight rings **update live as the user drags pieces** — no need to re-click "Analyze". Moving the bed out of coffin position instantly turns its ring from red to green.

The full scored report (issue list text) still requires "Analyze" — only the SVG ring colors update in real-time.

## Prerequisites
Goals 01–04 complete.

## Approach
- `useFengShui` hook subscribes to `furniture` and `wallFeatures` from the coordinator
- On each change (debounced 80ms to avoid thrashing during drag), re-runs the 7 Simple rules
- Returns `FengShuiOverlay` (highlights only — not the full issue list)
- `FengShuiTab` passes this live overlay to `RoomCanvas`
- "Analyze" still produces the full `FengShuiIssue[]` list with descriptions/suggestions

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/feng-shui/useFengShui.ts` | **New.** Hook: accepts furniture + wallFeatures + config; debounces re-evaluation; returns `{ liveOverlay: FengShuiOverlay; analyze: () => FengShuiIssue[] }` |
| `src/features/room-planner/components/FengShuiTab.tsx` | Replace direct engine call with `useFengShui`; pass `liveOverlay` to canvas continuously; call `analyze()` only on button click |

## Debounce note
80ms debounce on position changes. `react-rnd`'s `onDragStop` fires once at end of drag — the debounce mainly guards against rapid state updates from resize handles. Do not recompute on every pixel during drag; use `onDragStop` / `onResizeStop` events as the trigger.

## Acceptance criteria
- [ ] Drag bed from coffin position → ring turns green without clicking Analyze
- [ ] Drag desk away from wall → ring turns amber/red immediately on drop
- [ ] Issue list text does NOT update until "Analyze" is clicked (separates live overlay from full report)
- [ ] No visible lag during drag (debounce keeps it off the hot path)
- [ ] Switching away from FS tab stops real-time computation (hook cleanup)
