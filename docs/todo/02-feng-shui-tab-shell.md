# Goal 02: Feng Shui Tab Shell

## What ships
A third tab — **"Feng Shui"** — appears next to "Floor Plan" and "3D View". Clicking it shows:
- Simple / Advanced toggle at the top
- Entry door selector (auto-selects if one door; dropdown if multiple)
- Room type confirmation (read from layout, links to Room section to change)
- Empty analysis panel placeholder ("Run analysis to see results")
- "Analyze" button (disabled until entry door is set)

No rules computed yet. Tab is fully navigable and the config is persisted.

## Prerequisites
Goal 01 complete (`roomType`, `category`, `FengShuiConfig` in types).

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/types/room.ts` | Flesh out `FengShuiConfig`: `{ entryDoorId: number \| null; mode: 'simple' \| 'advanced' }` |
| `src/features/room-planner/components/FengShuiTab.tsx` | **New.** Full tab component: mode toggle, door selector, analyze button, empty results area |
| `src/features/room-planner/hooks/useFengShuiConfig.ts` | **New.** State + persistence for `FengShuiConfig` (reads/writes to layout via coordinator) |
| `src/features/room-planner/components/RoomPlanner.tsx` | Add `'feng-shui'` to `viewMode` type; render `<FengShuiTab>` when active; add tab button |
| `src/features/room-planner/hooks/useRoomCoordinator.ts` | Thread `fengShuiConfig` + setter through coordinator |

## Acceptance criteria
- [x] "Feng Shui" tab visible and clickable
- [x] Simple/Advanced toggle works (state persists in `FengShuiConfig`)
- [x] Entry door dropdown shows all `DoorSwingFeature` items by wall + offset; auto-selects if only one
- [x] If no doors added: shows "Add a door in the Walls section first"
- [x] "Analyze" button present (disabled state OK, no action yet)
- [x] Switching layouts loads the correct `FengShuiConfig` for that layout

## Implementation notes (2026-05-16)
- `useFengShuiConfig` hook mirrors `useWallFeatures` — owns its own state, composed into coordinator
- `FengShuiConfig.entryDoorId: number | null` (required, not optional `?: number`)
- `FengShuiConfig.mode: 'simple' | 'advanced'` (required), default `'simple'`
- Auto-select runs in `FengShuiTab` `useEffect([], [])` — init only, never overrides
- Door label: `"Right wall, 4' 2""` via `formatDim(offsetIn, unitSystem)`
- Analyze button disabled: `title="Select an entry door first"`
- CSS added to `globals.css` under `/* ── Feng Shui tab ── */`
