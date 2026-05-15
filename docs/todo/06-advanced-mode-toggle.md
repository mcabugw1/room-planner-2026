# Goal 06: Advanced Mode Toggle + Input Fields

## What ships
Switching to **Advanced** mode in the FS tab reveals additional input fields:
- **Compass bearing** — number input (0–360°) with a small compass rose SVG indicator that rotates to show the entered direction. Label: "Room faces (degrees from North)"
- **Birth year** — number input (e.g. 1990)
- **Gender** — toggle: Male / Female (used for Kua calculation per Eight Mansions)
- Computed **Kua number** displayed immediately below (e.g. "Kua 4 — East Group")

No rule changes yet — inputs are collected and stored in `FengShuiConfig`. Kua calculation runs client-side on input change.

## Prerequisites
Goals 01–05 complete.

## Kua calculation (from feng_shui.md §7)
```
// Pre-2000 births
male:   reduce(sumDigits(yearLast2)) → 10 - n  (5 → use 2)
female: reduce(sumDigits(yearLast2)) → n + 5    (5 → use 8)

// 2000+ births  
male:   reduce(sumDigits(yearLast2)) → 9 - n
female: reduce(sumDigits(yearLast2)) → n + 6
```
East Group: Kua 1, 3, 4, 9 | West Group: Kua 2, 6, 7, 8

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/types/room.ts` | Extend `FengShuiConfig`: add `compassBearing: number \| null`, `birthYear: number \| null`, `gender: 'male' \| 'female' \| null`, `kuaNumber: number \| null` |
| `src/features/room-planner/feng-shui/kua.ts` | **New.** Pure functions: `computeKua(birthYear, gender)`, `kuaGroup(kua)`, `kuaAuspiciousDirections(kua)` |
| `src/features/room-planner/feng-shui/kua.test.ts` | **New.** Unit tests for Kua calculation across birth years (pre/post 2000, male/female, Kua 5 edge cases) |
| `src/features/room-planner/components/FengShuiTab.tsx` | Render advanced input fields when `mode === 'advanced'`; compute + display Kua on change |
| `src/features/room-planner/components/CompassRose.tsx` | **New.** Small SVG compass rose (N/S/E/W labels + needle) that rotates based on `bearing` prop |

## Acceptance criteria
- [ ] Advanced inputs hidden in Simple mode, visible in Advanced mode
- [ ] Compass rose needle rotates correctly as bearing changes (0 = North up)
- [ ] Kua number computed and displayed in real time as birth year / gender change
- [ ] Kua 5 edge case handled (male → 2, female → 8)
- [ ] All inputs persist in `FengShuiConfig` on layout save/load
- [ ] Unit tests cover: pre-2000 male, pre-2000 female, post-2000 male, post-2000 female, Kua 5 both genders
