# Goal 03: Feng Shui Engine — Simple Mode Rules

## What ships
Clicking "Analyze" in the Feng Shui tab computes and displays an **issue list** in the panel. No canvas overlays yet — just the text results.

Rules evaluated (all 7 Simple mode rules):
1. **Command position** — `category: bed | desk | sofa | stove` piece can "see" the entry door (not blocked, not directly in line)
2. **Coffin position** — bed feet axis points toward door opening
3. **Not in door's direct line** — piece center falls on door's perpendicular axis into room
4. **Solid wall backing** — piece's back edge within 6" of a wall (accounts for rotation)
5. **Bed head not under window** — head edge of bed overlaps a `WindowFeature` on same wall
6. **Door swing clear** — no furniture overlaps the door's swing arc polygon
7. **Straight-line chi path blocked** — unobstructed line from door opening to opposite wall/window; flags if clear (recommends placing furniture/screen to break it)

Each issue has: `severity: 'error' | 'warning' | 'info'`, `ruleId`, `affectedItemId: number | null`, `title`, `description`, `suggestion`.

## Prerequisites
Goals 01–02 complete.

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/feng-shui/rules/commandPosition.ts` | **New.** Rule 1 + 3 evaluator |
| `src/features/room-planner/feng-shui/rules/coffinPosition.ts` | **New.** Rule 2 evaluator |
| `src/features/room-planner/feng-shui/rules/wallBacking.ts` | **New.** Rule 4 evaluator |
| `src/features/room-planner/feng-shui/rules/windowHead.ts` | **New.** Rule 5 evaluator |
| `src/features/room-planner/feng-shui/rules/doorSwingClear.ts` | **New.** Rule 6 evaluator |
| `src/features/room-planner/feng-shui/rules/chiPath.ts` | **New.** Rule 7 evaluator |
| `src/features/room-planner/feng-shui/engine.ts` | **New.** Orchestrates all rules; returns `FengShuiIssue[]` |
| `src/features/room-planner/feng-shui/types.ts` | **New.** `FengShuiIssue`, `FengShuiResult` types |
| `src/features/room-planner/components/FengShuiTab.tsx` | Wire "Analyze" button to engine; render issue list |
| `src/features/room-planner/components/IssueList.tsx` | **New.** Renders sorted issue list with severity badges |

## Geometry notes
- All coordinates in inches (same space as `FurnitureItem.x/y/w/h`)
- Door opening center = `feature.offsetIn + feature.swingIn / 2` along its wall
- "Sees door" = line from piece center to door center not intersected by any other furniture bounding box
- Coffin position = bed's foot-wall normal vector points toward door opening within ±15°
- Door swing arc = circular sector from hinge point; check AABB intersection with each furniture piece

## Acceptance criteria
- [x] Clicking "Analyze" runs in <100ms for rooms with ≤20 furniture pieces
- [x] Each of the 7 rules fires correctly for a manually constructed test case
- [x] Issues sorted: errors first, warnings second, info last
- [x] Pieces with `category: 'other'` skip command/coffin/backing checks
- [x] "No issues found" state shown when all rules pass
- [x] Unit tests for each rule evaluator in `feng-shui/rules/*.test.ts`

## Implementation notes (2026-05-16)

### Key files created
- `feng-shui/geometry.ts` — shared geometry helpers (not in spec, added for DRY)
- `feng-shui/types.ts`, `feng-shui/engine.ts`, `feng-shui/rules/*.ts` — all 7 rules
- `hooks/useFengShuiEngine.ts` — isolated hook for engine state (`issues`, `run`, `reset`)
- `components/IssueList.tsx` — severity badge list with click-to-select

### Schema change (from spec)
Added `headAtStart?: boolean` to `FurnitureItem` (not just `bed` — also `desk`, `sofa`, `stove`). Migration in `data/migrations.ts`. Toggle in `FurnitureForm.tsx` with per-category labels ("Head/Foot" for bed, "Back/Front" for others).

### Rule decisions from grill session
- Door target = wall point + 6" inward (threshold, not wall surface)
- Rule 3 band = AABB intersection with band width `swingIn`
- Rule 4 backing: uses `headAtStart` for all 4 categories; skips if `headAtStart` is undefined
- Rule 6 door swing: exact sector-vs-AABB (corners + closest-edge-point checks)
- Rule 7 chi path: door→nothing=`warning`, door→window=`error`; ray width=`swingIn`
- Severities: blocked sightline=`error`, in-direct-line=`warning`, coffin=`error`

### State
`useFengShuiEngine` holds `issues: FengShuiIssue[] | null` (null = not yet analyzed).
Composed in `useRoomCoordinator`, exposed as `fengShuiEngine`. Clicking an issue calls `selectFurniture(affectedItemId)` in `IssueList`.
