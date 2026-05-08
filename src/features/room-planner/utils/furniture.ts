const HEIGHT_DEFAULTS: [RegExp, number][] = [
  [/bed|mattress/i, 24],
  [/coffee/i, 18],
  [/night.*stand|nightstand/i, 26],
  [/tv.*stand|entertainment/i, 24],
  [/desk/i, 30],
  [/table/i, 30],
  [/dresser/i, 54],
  [/wardrobe|armoire|closet/i, 72],
  [/bookcase|bookshelf|shelf|shelv/i, 72],
  [/cabinet/i, 36],
  [/sofa|couch/i, 36],
  [/chair/i, 36],
  [/counter/i, 36],
];

export function defaultFurnitureHeight(name: string): number {
  for (const [pattern, h] of HEIGHT_DEFAULTS) {
    if (pattern.test(name)) return h;
  }
  return 36;
}
