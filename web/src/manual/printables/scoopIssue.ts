// The Sandbox Scoop's issue number in each game's box: the game's place among the Sandbox
// Software games in release order (year, then title), so no two boxes print the same number.
// The box's newsletter (gen.ts) and TURBO BUTTON's back-issue page both number it this way.

export function scoopIssue(id: string, games: readonly { id: string; title: string; year?: number }[]): number {
  const released = [...games].sort((a, b) => (a.year ?? 1995) - (b.year ?? 1995) || a.title.localeCompare(b.title));
  const place = released.findIndex((g) => g.id === id);
  return place >= 0 ? place + 1 : released.length + 1;
}
