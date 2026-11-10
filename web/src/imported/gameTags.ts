// Suggested tags for an imported game, worked out from its files alone: no AI, the same
// answer every time. They are guesses an author can ignore. A tag has to be earned:
//   platformer  most levels are built of blocks that pull the hero down, and a key the player
//               presses makes the hero move up (a jump)
//   top-down    no level has that pull and the hero shows different pictures walking up and
//               down (a side-view hero floating in water or space doesn't)
//   shooter     a key the player presses (nothing to carry first) fires a monster, and eighty or
//               more monsters are on the maps
//   keys and doors / puzzle   a key's sequence needs a carried block; "puzzle" when there is
//               little or nothing to fight
//   maze        roomy top-down maps with no monsters
// They never go into the DOS files.
import { parseGame, ADVTYPE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap, MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { parseBlocks, BACKBL, CHARBL, MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { characterActions } from '../editor/keymap/keyMap';

type GameTag = 'platformer' | 'top-down' | 'shooter' | 'keys and doors' | 'puzzle' | 'maze';

/** What the rules read: facts about the whole game. */
export interface TagFacts {
  /** Levels whose background is mostly blocks that pull the hero down. */
  gravScenes: number;
  /** Different pictures for the hero walking up and walking down. */
  facing: boolean;
  /** A key the player presses makes the hero jump where gravity pulls down. */
  jump: boolean;
  /** A key the player presses fires a monster, with nothing to carry first. */
  shoots: boolean;
  monsters: number;
  /** A key's sequence needs a block carried (a key or tool). */
  keys: boolean;
  /** Widest used part of any map, in blocks. */
  worldW: number;
  /** Levels that scroll. */
  scrollScenes: number;
  scenes: number;
}

/** The tag rules, kept apart from the file reading so they can be tested. */
export function tagsFor(f: TagFacts): GameTag[] {
  if (!f.scenes) return [];
  const t: GameTag[] = [];
  const falls = f.gravScenes * 2 >= f.scenes;
  if (falls && f.jump) t.push('platformer');
  else if (f.gravScenes === 0 && f.facing) t.push('top-down');
  if (f.shoots && f.monsters >= 80) t.push('shooter');
  if (f.keys) t.push(f.monsters < 4 && !f.shoots ? 'puzzle' : 'keys and doors');
  if (f.gravScenes === 0 && f.monsters === 0 && f.worldW >= 24) t.push('maze');
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
  const f: TagFacts = { gravScenes: 0, facing: false, jump: false, shoots: false, monsters: 0, keys: false, worldW: 0, scrollScenes: 0, scenes: 0 };
  for (const s of game.scenes) {
    if (s.gametype !== ADVTYPE) continue;
    f.scenes++;
    try {
      const map = get(s.files[1] ?? '');
      const bbl = get(s.files[2] ?? '');
      let gravScene = false;
      if (map) {
        const m = parseMap(map);
        f.monsters += m.monsters.filter((p) => p.monnum < 64).length;
        if (bbl) {
          const bg = parseBlocks(bbl, BACKBL);
          const counts = new Map<number, number>();
          for (const b of m.blocks) counts.set(b, (counts.get(b) ?? 0) + 1);
          const common = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
          let x0 = MWID;
          let x1 = -1;
          let y0 = MLEN;
          let y1 = -1;
          m.blocks.forEach((b, i) => {
            if (b === common) return;
            const x = i % MWID;
            const y = Math.floor(i / MWID);
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
          });
          if (x1 < 0) {
            x0 = 0;
            x1 = MWID - 1;
            y0 = 0;
            y1 = MLEN - 1;
          }
          f.worldW = Math.max(f.worldW, x1 - x0 + 1);
          let down = 0;
          let total = 0;
          for (let y = y0; y <= y1; y++)
            for (let x = x0; x <= x1; x++) {
              total++;
              if ((bg[m.blocks[y * MWID + x]]?.grav ?? 0) & 4) down++;
            }
          gravScene = total > 0 && down / total >= 0.3;
        }
      }
      if (gravScene) f.gravScenes++;
      const chr = get(s.files[5] ?? '');
      if (chr) {
        const hero = parseCharacter(chr);
        const up = new Set<string>();
        const down = new Set<string>();
        for (const { scan, action } of characterActions(hero, gravScene)) {
          if (!scan) continue; // joystick only: not a key a player presses
          if (action.kind === 'move') {
            const fr = hero.sequences[action.seq].frames;
            const end = fr.findIndex((q) => q.pic2 === CHARBL + 1);
            const act = fr.slice(0, end < 0 ? fr.length : end).filter((q) => q.pic2 !== MONBL);
            const dx = act.reduce((n, q) => n + q.x, 0);
            const dy = act.reduce((n, q) => n + q.y, 0);
            const sig = act[0] ? `${act[0].pic1},${act[0].pic2},${act[0].orient}` : '';
            if (Math.abs(dy) > Math.abs(dx)) (dy < 0 ? up : down).add(sig);
          }
          if (action.kind === 'jump' && gravScene) f.jump = true;
          if (action.kind === 'fire' && action.needsBlock === undefined && action.fires.some((n) => n < 64)) f.shoots = true;
          if (action.needsBlock !== undefined) f.keys = true;
        }
        if (up.size && down.size && ![...up].some((x) => down.has(x))) f.facing = true;
      }
      const sc = s.scroll;
      if (sc.up || sc.down || sc.left || sc.right) f.scrollScenes++;
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
