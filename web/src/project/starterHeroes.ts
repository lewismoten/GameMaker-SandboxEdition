// Which hero leads each Starter (its about.json "hero"): Kit leads the first game of every group and his own games
// (Kit's Moves, Kit Ducks, Kit's Shop); the eight helpers take the rest one each down the learning order, so each
// leads about the same number. A Starter added after the heroes were first dealt is in ADDED_LATER (starter.ts): it
// waits until every other game has its hero and then takes the next helper in turn, so adding it changes no other game's hero.
// games/kit/starter/heroFor.ts and the Cast page read this one table.
import { ADDED_LATER, STARTER_GROUPS } from './starter';

/** The helpers, in turn (games/kit/starter/heroLook.ts helperPalettes has their looks). */
export const HELPER_NAMES = ['MIA', 'LENA', 'MARA', 'LIAN', 'YANA', 'NOVA', 'RIMA', 'LAMI'];
/** Games whose story is Kit's own. */
const KIT_GAMES = new Set(['kit-moves', 'duck', 'kits-shop']);

/** Every grouped Starter's hero name, by game id. */
export const STARTER_HEROES: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  let n = 0;
  for (const g of STARTER_GROUPS)
    g.games.forEach((id, at) => {
      if (ADDED_LATER.includes(id)) return;
      out[id] = at === 0 || KIT_GAMES.has(id) ? 'KIT' : HELPER_NAMES[n++ % HELPER_NAMES.length];
    });
  for (const id of ADDED_LATER) out[id] = HELPER_NAMES[n++ % HELPER_NAMES.length];
  return out;
})();

/** The hero's name (KIT, MIA ...) for a Starter id; Kit when it is in no group. */
export const heroOfStarter = (id: string): string => STARTER_HEROES[id] ?? 'KIT';
