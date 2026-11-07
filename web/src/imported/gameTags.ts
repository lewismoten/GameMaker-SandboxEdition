// Suggested tags for an imported game, worked out from its files alone: no AI, the same
// answer every time. They are guesses an author can ignore, read from what the files hold:
// gravity in the background blocks (side view) or none (top-down), a weapon that gives birth
// to a monster (shooter), how many monsters sit on the maps, keys that sequences need, and
// how big the scrolling maps are. They never go into the DOS files.
import { parseGame, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap, MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseBlocks, BACKBL, MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';

export const TAGS = ['platformer', 'top-down', 'shooter', 'action', 'keys and doors', 'puzzle', 'exploration', 'maze'] as const;
export type GameTag = (typeof TAGS)[number];

/** What the rules read: facts about the whole game. */
export interface TagFacts {
  gravity: boolean;
  /** A character sequence that gives birth to a monster (a shot). */
  shoots: boolean;
  monsters: number;
  /** A sequence needs a block in the inventory (a key). */
  keys: boolean;
  /** Widest or tallest used part of any map, in blocks. */
  worldW: number;
  worldH: number;
  scrolls: boolean;
  scenes: number;
}

/** The tag rules, kept apart from the file reading so they can be tested. */
export function tagsFor(f: TagFacts): GameTag[] {
  if (!f.scenes) return [];
  const t: GameTag[] = [];
  t.push(f.gravity ? 'platformer' : 'top-down');
  if (f.shoots && f.monsters > 0) t.push('shooter');
  else if (f.monsters >= 8) t.push('action');
  if (f.keys) t.push(f.monsters < 4 ? 'puzzle' : 'keys and doors');
  if (f.scrolls && f.scenes >= 10) t.push('exploration');
  if (!f.gravity && f.monsters === 0 && f.worldW >= 24) t.push('maze');
  return t;
}

type Get = (name: string) => Uint8Array | undefined;

/** Reads the game's files into facts; undefined when the .gam can't be read. */
export function tagFacts(gam: Uint8Array, get: Get): TagFacts | undefined {
  let game;
  try {
    game = parseGame(gam);
  } catch {
    return undefined;
  }
  const f: TagFacts = { gravity: false, shoots: false, monsters: 0, keys: false, worldW: 0, worldH: 0, scrolls: false, scenes: 0 };
  for (const s of game.scenes) {
    if (s.gametype !== ADVTYPE) continue;
    f.scenes++;
    try {
      const bbl = get(s.files[2] ?? '');
      if (bbl && parseBlocks(bbl, BACKBL).some((b) => b.grav !== 0)) f.gravity = true;
      const chr = get(s.files[5] ?? '');
      if (chr) {
        for (const q of parseCharacter(chr).sequences) {
          if (q.frames.some((fr) => fr.pic2 === MONBL)) f.shoots = true;
          if (q.key && q.bloc < BACKBL) f.keys = true;
        }
      }
      const map = get(s.files[1] ?? '');
      if (map) {
        const m = parseMap(map);
        f.monsters += m.monsters.filter((p) => p.monnum < 64).length;
        const counts = new Map<number, number>();
        for (const b of m.blocks) counts.set(b, (counts.get(b) ?? 0) + 1);
        const bg = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        let x0 = MWID;
        let x1 = -1;
        let y0 = MLEN;
        let y1 = -1;
        m.blocks.forEach((b, i) => {
          if (b === bg) return;
          const x = i % MWID;
          const y = Math.floor(i / MWID);
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        });
        if (x1 >= 0) {
          f.worldW = Math.max(f.worldW, x1 - x0 + 1);
          f.worldH = Math.max(f.worldH, y1 - y0 + 1);
        }
      }
      const sc = s.scroll;
      if (sc.up || sc.down || sc.left || sc.right) f.scrolls = true;
    } catch {
      /* a damaged scene adds nothing */
    }
  }
  return f;
}

/** Suggested tags for a game's files, or [] when they can't be read. */
export function suggestTags(gam: Uint8Array, get: Get): GameTag[] {
  const f = tagFacts(gam, get);
  return f ? tagsFor(f) : [];
}
