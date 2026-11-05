// Which helper leads a Starter. Kit leads the first Starter of each group and his own games (Kit's Moves, Kit Ducks,
// Kit's Shop); the eight helpers take the rest in turn, one each down the learning order (STARTER_ORDER), so each leads about the
// same number. The answer is kept in a game's about.json as "hero" (the one place every text, card and palette reads);
// heroFor is the deterministic table that wrote it, and a test keeps the two in step.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STARTER_GROUPS } from '../../../web/src/project/starter';
import { helperPalettes, KIT_LOOK, type Look } from './heroLook';

/** Games whose story is Kit's own. */
const KIT_GAMES = new Set(['kit-moves', 'duck', 'kits-shop']);
const HELPERS = helperPalettes.map((h) => h.name);

/** Every Starter's hero, by id: Kit, then the helpers in turn down the learning order. */
const TABLE: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  let n = 0;
  for (const g of STARTER_GROUPS)
    g.games.forEach((id, at) => {
      out[id] = at === 0 || KIT_GAMES.has(id) ? 'KIT' : HELPERS[n++ % HELPERS.length];
    });
  return out;
})();

/** The hero's name (KIT, MIA ...) for a Starter id. A game outside the groups, or one that is Kit's own, gets Kit. */
export const heroFor = (gameId: string): string => (KIT_GAMES.has(gameId) ? 'KIT' : (TABLE[gameId] ?? 'KIT'));

/** The look (palette ramps) of a hero by name. */
export const lookOf = (name: string): Look => (name === 'KIT' ? KIT_LOOK : (helperPalettes.find((h) => h.name === name) ?? { look: KIT_LOOK }).look);

/** A name as written in text: Kit, Mia, Lena. */
export const titleCase = (name: string): string => name[0] + name.slice(1).toLowerCase();

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
/** The hero named in a game's about.json (`hero`), Kit when it has none. */
export function heroOf(gameId: string): string {
  try {
    const about = JSON.parse(readFileSync(join(root, gameId, 'about.json'), 'utf8')) as { hero?: string };
    return about.hero ?? 'KIT';
  } catch {
    return 'KIT';
  }
}
