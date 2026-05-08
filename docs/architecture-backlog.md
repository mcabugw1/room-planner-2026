# Architecture Backlog

Generated from `/improve-codebase-architecture` session. Each item is a deepening opportunity — turning shallow modules into deep ones.

---

## 1. Rotation geometry — 4 duplicate copies

**Files:**
- `src/features/room-planner/hooks/useFurniture.ts:25`
- `src/features/room-planner/components/RoomPlanner.tsx:410`
- `src/features/room-planner/utils/measurements.ts:24`
- `src/features/room-planner/utils/furnitureGeometry.ts:3`

**Problem:** `isOdd = rotation === 90 || rotation === 270 → swap w/h` duplicated 4x. One bug = 4 fixes. `furnitureGeometry.ts` has `effectiveW/H` but callers mostly bypass it.

**Solution:** Make `furnitureGeometry.ts` the single authority for all rotation-derived geometry. Delete the 3 duplicate sites. Force all callers through `effectiveW(item)` / `effectiveH(item)`.

**Benefits:** One place for rotation bugs. Tests move to one file against one interface.

---

## 2. RoomPlanner as hook wiring harness

**Files:**
- `src/features/room-planner/components/RoomPlanner.tsx:62-76`

**Problem:** RoomPlanner manually wires 9 hooks with explicit dependency arrows. Any hook interface change breaks this file. Business logic leaks into render: `clipsThrough` computation, `canvasW/H`, selection styling.

**Solution:** `useRoomCoordinator` absorbs all hook wiring — `useFurniture`, `useWallFeatures`, `useRoomSession`, `useMeasurementMode`, `useLayoutPersistence`. RoomPlanner calls one hook and gets a deep interface:
```ts
{ layout, furniture, features, measurement, persistence, select, remove, rotate, drag, viewport }
```

**Benefits:** RoomPlanner becomes testable by mocking one hook. Currently zero integration tests possible.

---

## 3. useRoomCoordinator as pass-through — fails deletion test

**Files:**
- `src/features/room-planner/hooks/useRoomCoordinator.ts`

**Problem:** Delete it — its 7 return values migrate to RoomPlanner unchanged. Only real logic: keyboard handler (lines 64–83) which reaches into 3 external hooks. Not a coordinator — thin wrapper.

**Solution:** Either:
- (a) Deepen it to absorb all hook composition (see item 2)
- (b) Delete it: keyboard logic → `useRoomKeyboard`, selection → moved into `useFurniture`/`useWallFeatures` directly

**Benefits:** Removes a shallow module that adds complexity without leverage.

---

## 4. useRoomUI — state bag, 20+ return values, untested

**Files:**
- `src/features/room-planner/hooks/useRoomUI.ts`
- `src/features/room-planner/components/WallFeatureForm.tsx`

**Problem:** Two unrelated responsibilities: (a) sidebar panel booleans, (b) new-wall-feature form draft. RoomPlanner passes 6 raw setters into `WallFeatureForm` — form shape change breaks 3 files. Completely untested.

**Solution:** Split into:
- `usePanelState` — 7 booleans + toggle functions, device-aware defaults
- `useNewFeatureDraft` — form state, exposes `{ draft, setDraft, buildFeature }` only

`WallFeatureForm` takes a draft object, not 12 individual props.

**Benefits:** Locality — panel bugs isolated from form bugs. `WallFeatureForm` interface shrinks from 12 props to ~4. Both independently testable.

---

## 5. Wall feature drag — test surface at wrong seam

**Files:**
- `src/features/room-planner/hooks/useWallFeatureDrag.ts`

**Problem:** `computeMoveOffset`, `computeResizeEnd`, `computeResizeStart` are pure and tested. But bug surface is `startDrag`: event capture, pointer-id filtering, stale scale closure, state updates. Zero tests for interaction. Real seam (drag behavior) has no test interface.

**Solution:** Either:
- Expose `simulateDrag(featureId, deltaScreenPx, mode)` from the hook for testing
- Extract a pure `dragReducer(state, event) → state` that `startDrag` feeds; reducer becomes test surface

**Benefits:** Tests verify actual interaction (`startDrag → pointermove → pointerup → settled state`), not just isolated math. Stale-scale and duplicate-event bugs caught before production.

---

## 6. Coordinate system — 16 import sites, conflated responsibilities

**Files:**
- `src/utils/coordinates.ts`
- 16 import sites across codebase

**Problem:** `toPixels` (coordinate math) and `formatDim` (display formatting) in same module. `SCALE = 4` is a global assumption baked into every layout calculation. `useWallFeatureDrag` already breaks this — divides by `canvasScale` after calling `toInches`, meaning two scale systems coexist.

**Solution:**
- Split `coordinates.ts` into `canvasCoords.ts` (`toPixels`, `toInches`, `CANVAS_SCALE`) and move `formatDim` to a display utility
- Long-term: `canvasCoords` takes a `scale` param so zoom-aware conversions are explicit

**Benefits:** Scale-aware conversions centralized. The stale-scale bug in `useWallFeatureDrag` becomes structurally impossible.

---

## Implementation order (suggested)

1. **Item 1** (rotation geometry) — pure refactor, no behavior change, all callers obvious
2. **Item 6** (coordinate split) — mechanical rename + move, clears path for scale work
3. **Item 4** (useRoomUI split) — contained, adds test surface
4. **Item 5** (drag reducer) — adds test coverage to untested interaction path
5. **Items 2+3** (coordinator deepening) — biggest leverage, hardest; do last when other seams are stable
