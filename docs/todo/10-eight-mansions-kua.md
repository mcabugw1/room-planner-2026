# Goal 10: Eight Mansions — Kua Direction Recommendations

## What ships
When Kua number is set in Advanced mode, "Analyze" adds **direction-based recommendations** to the issue list:

> "⚠ Bed head points **Southwest (Wu Gui — Five Ghosts)**. For Kua 4, this direction governs betrayal and accidents. Rotate bed so head points North (Sheng Chi — Wealth/Career) or East (Yan Nian — Love/Longevity)."

> "✓ Desk faces **North (Sheng Chi)**. For Kua 4, this is your strongest career direction."

Also displays the user's **Four Auspicious** and **Four Inauspicious** directions in a compact table within the FS tab.

## Prerequisites
Goals 01–09 complete (Kua computation in `kua.ts`, compass bearing input).

## Eight Mansions direction table (from feng_shui.md §7)
| Kua | Sheng Chi | Tien Yi | Yan Nian | Fu Wei | Huo Hai | Liu Sha | Wu Gui | Jue Ming |
|-----|-----------|---------|----------|--------|---------|---------|--------|---------|
| 1 | SE | E | S | N | W | NE | SW | NW |
| 3 | S | N | SE | E | SW | NW | W | NE |
| 4 | N | S | E | SE | NE | SW | NW | W |
| 9 | E | SE | N | S | NW | W | NE | SW |
| 2 | NE | W | NW | SW | E | SE | N | S |
| 6 | W | NE | SW | NW | SE | E | S | N |
| 7 | NW | SW | NE | W | S | N | SE | E |
| 8 | SW | NW | W | NE | N | S | E | SE |

## Rule logic
- Requires `compassBearing` (to know which direction a furniture piece faces/heads)
- Bed: evaluate direction the headboard wall faces → map to compass direction → look up in Kua table
- Desk: evaluate direction user faces while sitting (front of desk) → compass direction → Kua table
- Emit `error` for Jue Ming, `warning` for Wu Gui / Liu Sha, `info` for auspicious confirmations

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/feng-shui/kua.ts` | Add `KUA_DIRECTIONS` table; `getDirectionName(kua, compassDir)` → `{ name, translation, severity, governs }`; `furnitureFacingDirection(item, compassBearing)` → cardinal direction |
| `src/features/room-planner/feng-shui/rules/kuaDirections.ts` | **New.** Rule evaluator: bed + desk items → direction check → issue per piece |
| `src/features/room-planner/feng-shui/engine.ts` | Run Kua rule when Advanced mode + `kuaNumber !== null` + `compassBearing !== null` |
| `src/features/room-planner/components/FengShuiTab.tsx` | Render auspicious/inauspicious direction table below inputs in Advanced mode |
| `src/features/room-planner/components/KuaDirectionTable.tsx` | **New.** Compact 2-column table: 4 auspicious (green) + 4 inauspicious (red) rows |

## Note on compass requirement
Kua direction rules require `compassBearing` to translate furniture rotation into real-world compass directions. If `compassBearing` is null, emit a single `info` issue: "Enter compass bearing to unlock Kua direction analysis."

## Acceptance criteria
- [ ] Kua direction table visible in Advanced mode when Kua is computed
- [ ] Bed and desk each get a Kua direction issue after Analyze
- [ ] Severity correct: Jue Ming = error, Wu Gui/Liu Sha = warning, auspicious = info (✓)
- [ ] Missing compass bearing shows single nudge message, not an error per piece
- [ ] All 8 Kua values tested in `kua.test.ts` (spot-check 3 directions each)
- [ ] Kua 5 edge cases (male→2, female→8) produce correct direction tables
