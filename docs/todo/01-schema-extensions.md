# Goal 01: Schema Extensions

## What ships
Two new dropdowns appear in the existing sidebar:
- **Room section** gets a "Room type" dropdown (`bedroom | living-room | office | kitchen | dining-room | other`)
- **Furniture form** gets a "Category" dropdown (`bed | desk | sofa | stove | other`) after the Name field

No Feng Shui logic yet — just data model + UI fields.

## Why first
Every subsequent goal depends on `roomType` and `category` being in state and persisted. Doing this first means all future steps can read these values immediately.

## Decisions (from grilling session 2026-05-15)

### FengShuiConfig — full optional stub from day one
All fields optional so the type is final. Later goals just read the fields they need.

```ts
export interface FengShuiConfig {
  entryDoorId?: number;
  mode?: 'simple' | 'advanced';
  compassBearing?: number;
  birthYear?: number;
  sex?: 'male' | 'female';   // biological sex for Kua calculation — not gender identity
  kuaNumber?: number;
  bathroomWalls?: WallSide[]; // walls adjacent to a bathroom (bed-head rule)
}
```

- `sex` not `gender` — Kua number uses binary biological sex assignment
- `bathroomWalls` instead of `RoomType: 'bathroom'` — marks which walls border a bathroom; more precise than a room type flag
- No `bathroom` in `RoomType` — no rule branches on it; add only when a rule needs it

### FengShuiConfig placement
On `RoomLayout` (not persistence-layer only). FS config is layout-specific. Old layouts migrate with `fengShuiConfig: undefined` (not `{}`). `undefined` = never configured.

### FurnitureCategory
Rule-driven, not catalog-driven: `bed | desk | sofa | stove | other`. No extras until a rule needs them.

### Migration strategy
Extend inline `??` in existing `migrateFurniture` / `migrateSnapshot`. No versioned system — all new fields have safe defaults.

### Hook / action design
- `setRoomType(type: RoomType)` — named action on `useRoomSession`, consistent with `setWidthDims` etc.
- `useFurniture.add(name = 'New Block', category: FurnitureCategory = 'other')` — category param with default; caller passes category when known (e.g. future "Add Bed" shortcut)

### UI placement
- Category dropdown: after Name, before dimensions in `FurnitureForm`
- Room type dropdown: after ceiling height in Room `SectionPanel`

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/types/room.ts` | Add `FurnitureCategory`, `RoomType`, `FengShuiConfig`; add `category` to `FurnitureItem`; add `roomType` + `fengShuiConfig?` to `RoomLayout` |
| `src/features/room-planner/data/room.ts` | Set `roomType: 'bedroom'` on `DEFAULT_ROOM` |
| `src/features/room-planner/data/furniture.ts` | Set `category: 'bed'` on Bed, `category: 'desk'` on Desk |
| `src/features/room-planner/data/migrations.ts` | Extend `LayoutSnapshot`, `migrateFurniture` (`category ?? 'other'`), `migrateSnapshot` (`roomType ?? 'bedroom'`, `fengShuiConfig` passthrough) |
| `src/features/room-planner/hooks/useRoomSession.ts` | Add `setRoomType`; update `applySnapshot` to accept `roomType` + `fengShuiConfig` |
| `src/features/room-planner/hooks/useFurniture.ts` | Add `category` param to `add()` |
| `src/features/room-planner/hooks/useRoomCoordinator.ts` | Update `snapshot` memo + `restore` to include `roomType` + `fengShuiConfig` |
| `src/features/room-planner/components/FurnitureForm.tsx` | Add Category dropdown after Name |
| `src/features/room-planner/components/RoomPlanner.tsx` | Add Room Type dropdown after ceiling height in Room section; import `RoomType` |

## Acceptance criteria
- [ ] "Room type" dropdown visible in Room section; changing it updates state
- [ ] "Category" dropdown visible in Furniture form for selected piece, positioned after Name
- [ ] Saving + reloading a layout preserves both fields
- [ ] Existing saved layouts load without error (migration applied)
- [ ] `fengShuiConfig` field present on `RoomLayout` type; old layouts load with `undefined`
