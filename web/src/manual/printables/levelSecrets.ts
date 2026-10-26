// Which background blocks a printed Level Map must never show (levelMaps.ts): a game's tin heart
// and its Easter egg (the block at the cell its about.json names, and every block it animates
// through) and its felt egg (the pickup block, or the blocks that move the counter, its
// about.json "egg" says the egg is). The Level Map draws the ground in their place, and never
// marks their cells. levelSecrets.json holds the answer for every game that may show Level
// Maps, written by web/scripts/levelSecrets.ts; a game that isn't in it gets no Level Maps.
import { BACKBL, parseBlocks, type Block } from '../../formats/blocks';
import { ADVTYPE, type Game } from '../../formats/game';
import { MLEN, parseMap } from '../../formats/map';
import type { FileSource } from '../../gfx/levelPicture';
import SECRETS from './levelSecrets.json';

/** The about.json fields that say where the secrets are. */
export interface AboutForSecrets {
  secret?: boolean;
  company?: string;
  series?: string;
  tinHeart?: { map?: string; at?: [number, number] };
  easterEgg?: { map?: string; at?: [number, number] };
  egg?: { block?: number; counter?: number };
}

/** A game's secret blocks: block set (.bbl, lower case) -> block numbers, ascending. */
export type SecretBlocks = Record<string, number[]>;

/** The blocks `b` animates through, starting with itself (nextBl, as the engine steps it). */
function animationChain(blocks: Block[], b: number): number[] {
  const out: number[] = [];
  while (blocks[b] && !out.includes(b)) {
    out.push(b);
    b = blocks[b].nextBl;
  }
  return out;
}

/** Does this game get Level Maps at all? Sandbox Software and Bard of Bizarre games, never a secret one. */
export const mayShowLevelMaps = (a: AboutForSecrets): boolean =>
  a.secret !== true && ((a.company ?? 'Sandbox Software') === 'Sandbox Software' || a.series === 'bizarre');

/** Every block a Level Map of this game must hide, by block set. */
export function secretBlocksOf(game: Game, files: FileSource, about: AboutForSecrets): SecretBlocks {
  const sets = new Map<string, Set<number>>();
  const add = (bbl: string, ns: number[]) => {
    const s = sets.get(bbl) ?? new Set<number>();
    ns.forEach((n) => s.add(n));
    sets.set(bbl, s);
  };
  const placed = [about.tinHeart, about.easterEgg].filter((p) => p?.map && p.at);
  for (const s of game.scenes) {
    if (s.gametype !== ADVTYPE || !s.files[1] || !s.files[2]) continue;
    const mapName = s.files[1].toLowerCase();
    const bbl = s.files[2].toLowerCase();
    const bblB = files.get(s.files[2]);
    if (!bblB) continue;
    const blocks = parseBlocks(bblB, BACKBL);
    for (const p of placed) {
      if (p!.map!.toLowerCase() !== mapName) continue;
      const mapB = files.get(s.files[1]);
      if (!mapB) continue;
      const [x, y] = p!.at!;
      add(bbl, animationChain(blocks, parseMap(mapB).blocks[y * MLEN + x]));
    }
    const egg = about.egg;
    if (egg?.block !== undefined && blocks[egg.block]?.obj) add(bbl, animationChain(blocks, egg.block));
    if (egg?.counter !== undefined) blocks.forEach((b, i) => b.effect === egg.counter && add(bbl, animationChain(blocks, i)));
  }
  return Object.fromEntries([...sets].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, [...v].sort((a, b) => a - b)]));
}

const LISTED = SECRETS as Record<string, SecretBlocks>;

/** The secret blocks of a game that may show Level Maps, or undefined: then it shows none. */
export const listedSecrets = (id: string): SecretBlocks | undefined => LISTED[id];
