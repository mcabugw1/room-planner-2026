# Goal 08: Zone-Based Color Recommendations

## What ships
After "Analyze" in Advanced mode, the issue list gains a new **Recommendations** section below violations. Each furniture piece in an identified Bagua zone gets a color suggestion:

> "Your bed sits in the **Career zone (Kan)**. Native element: Water. Suggested accent colors: black, dark blue, charcoal. Avoid: bright reds or oranges."

Also flags element conflicts:
> "Your desk (Wood element furniture) in the **Love zone (Kun)** — Wood drains Earth. Consider a beige/terracotta throw or ceramic object to reinforce the zone's Earth element."

## Prerequisites
Goals 01–07 complete (Bagua zones computed, furniture categories set).

## Logic
1. For each FS-relevant furniture piece, find which Bagua zone its center falls in
2. Look up zone's native element and recommended colors (from `bagua.ts` zone data)
3. Check furniture's element (derived from `category`: bed=Wood, desk=Wood, sofa=Earth, stove=Fire)
4. Apply Five Elements productive/weakening/destructive cycle to assess harmony
5. Emit `severity: 'info'` issue with color recommendation + element note

## Furniture element mapping (default)
| Category | Default element | Rationale |
|----------|----------------|-----------|
| `bed` | Wood | Wood frame, organic rest |
| `desk` | Wood | Wood surface, growth/study |
| `sofa` | Earth | Grounding, stability |
| `stove` | Fire | Heat, cooking |
| `other` | — | Skip element check |

## Files to create / modify
| File | Change |
|------|--------|
| `src/features/room-planner/feng-shui/elements.ts` | **New.** `FURNITURE_ELEMENT` map; `elementRelationship(zoneElement, pieceElement)` → `'productive' \| 'weakening' \| 'destructive' \| 'same'` |
| `src/features/room-planner/feng-shui/rules/zoneColorRecommendation.ts` | **New.** Rule evaluator: takes furniture + bagua zones → emits info-level issues with color/element text |
| `src/features/room-planner/feng-shui/engine.ts` | Run zone color rule in Advanced mode only; append to issue list |
| `src/features/room-planner/components/IssueList.tsx` | Separate "Recommendations" section below "Issues" in the rendered list |

## Acceptance criteria
- [ ] Every FS-relevant furniture piece in a named zone gets at least one color recommendation
- [ ] Recommendations only appear in Advanced mode (not Simple)
- [ ] Element conflict (destructive relationship) emits a `warning`; productive/weakening emits `info`
- [ ] Color names are human-friendly ("dark blue, charcoal") not hex codes
- [ ] Pieces outside room bounds (shouldn't happen, but guard) don't crash zone lookup
