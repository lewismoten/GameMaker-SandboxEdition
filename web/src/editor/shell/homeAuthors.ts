// The Gameware and Shareware tabs' games grouped by who made them (the catalog's company, or
// its author when it has none): Recreational Software Designs' own first, then the makers with
// the most games, ties by name. home.ts packs the groups into rows like the Bard's collections.
import type { HomeGame } from './homeCards';

const RSD = 'Recreational Software Designs';

/** Who made a game, as the tab groups it. The CD's parts library (no game, no maker named) is RSD's. */
function makerOf(g: HomeGame): string {
  const e = g.entry;
  return e?.company || e?.author || (e && !e.gam ? RSD : 'Other makers');
}

/** `games` grouped by maker, each group in the order given. */
export function byMaker(games: readonly HomeGame[]): { name: string; games: HomeGame[] }[] {
  const groups = new Map<string, HomeGame[]>();
  for (const g of games) {
    const name = makerOf(g);
    groups.set(name, [...(groups.get(name) ?? []), g]);
  }
  return [...groups]
    .map(([name, list]) => ({ name, games: list }))
    .sort(
      (a, b) =>
        Number(b.name === RSD) - Number(a.name === RSD) || b.games.length - a.games.length || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
}
