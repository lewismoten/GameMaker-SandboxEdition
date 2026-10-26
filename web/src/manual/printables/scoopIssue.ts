// The Sandbox Scoop's issue number in each game's box: the game's place among the Sandbox
// Software games in release order (its month in scoopIssues.ts; a game with none goes after
// its year's, by title), so no two boxes print the same number. The box's newsletter
// (gen.ts) and TURBO BUTTON's back-issue page both number it this way.
import { SCOOP_MONTHS } from './scoopIssues';

const released = (g: { id: string; year?: number }) => SCOOP_MONTHS[g.id] ?? `${g.year ?? 1995}-99`;

export function scoopIssue(id: string, games: readonly { id: string; title: string; year?: number }[]): number {
  const order = [...games].sort((a, b) => released(a).localeCompare(released(b)) || a.title.localeCompare(b.title));
  const place = order.findIndex((g) => g.id === id);
  return place >= 0 ? place + 1 : order.length + 1;
}
