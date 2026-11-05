// Color cues: for each Starter (or any game with a built disk), finds the pairs of things a player must tell
// apart to play and measures whether anything but hue tells them apart, as a player who sees colors
// differently would meet them (the engine's gfx/colorVision matrices: normal, protan, deutan, tritan).
//
// The pairs, from each level's own blocks (what the map uses, and what each block does):
//   key/key     keys that add to different counters (gold vs silver key: which one opens which gate)
//   lock/lock   locks that spend different counters (a gold gate vs a silver gate)
//   hurt/good   a block that takes hit points vs a pickup that gives points, hit points or a count
//   hurt/floor  a block that hurts vs a plain block a hero stands or walks through (solid like it, or both passable)
//   monsters    a monster whose block hurts vs one whose block does not
// A pair is told apart by (any one is enough): light (the two differ by 20 or more in lightness, L*, for
// that vision), shape (a seventh of the cells differ in where they have ink, not sky) or pattern (the
// light and dark inside the blocks, mean lightness taken out, differ by 7 or more per cell). A pair told
// apart by none of these differs by hue alone: that is the finding. "look-alike" is a hue-alone pair whose
// colors also come within delta E 25 of each other under that vision.
//
//   cd web && npx vite-node ../games/kit/colorCuesCli.ts [id ...] [--pairs] [--json]
// With no id: every Starter. --pairs lists each finding. A finding is a suggestion an author can dismiss:
// it measures two flat blocks, not a whole screen, and cannot see animation (a block that blinks has a
// cue this doesn't count), a sign that names the thing, or where on the screen it stands. checkGames.ts
// shows the count as an advisory column.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deltaEBytes, lab, simulateBytes, type Rgb, type Vision } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import { TRANSPARENT, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { GameFiles } from '../../web/src/project/files';
import { gameOf } from '../../web/src/editor/check/playtest';
import { scenesOf, type SceneData } from '../../web/src/editor/check/sceneData';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';

const here = dirname(fileURLToPath(import.meta.url));
const games = join(here, '..');

export const LIGHT = 20;
export const SHAPE = 1 / 7;
export const PATTERN = 7;
const LOOK_ALIKE = 25;
const KINDS: (Vision | undefined)[] = [undefined, 'protan', 'deutan', 'tritan'];
const kindName = (v?: Vision) => v ?? 'normal';

export interface Pair {
  game: string;
  scene: number;
  kind: string;
  a: string;
  b: string;
  /** Per vision: lightness difference, color difference, and whether it is a look-alike. */
  light: Record<string, number>;
  delta: Record<string, number>;
  shape: number;
  pattern: Record<string, number>;
  /** The cue that tells them apart ("light", "shape", "pattern") per vision, or '' for none. */
  cue: Record<string, string>;
  hueOnly: boolean;
  lookAlike: string[];
}

const rgbOf = (pal: Uint8Array, i: number): Rgb => [0, 1, 2].map((k) => (pal[i * 3 + k] << 2) | (pal[i * 3 + k] >> 4)) as Rgb;

/** Every opaque pixel's color as `v` sees it, null where it is see-through or the scene's backdrop. */
function seen(b: Block, pal: Uint8Array, bg: number, v?: Vision): (Rgb | null)[] {
  const memo = new Map<number, Rgb>();
  return [...b.pixels].map((c) => {
    if (c === TRANSPARENT || c === bg) return null;
    let r = memo.get(c);
    if (!r) memo.set(c, (r = v ? simulateBytes(rgbOf(pal, c), v) : rgbOf(pal, c)));
    return r;
  });
}

function mean(px: (Rgb | null)[]): Rgb {
  const s = [0, 0, 0];
  let n = 0;
  for (const p of px) if (p) (n++, p.forEach((x, k) => (s[k] += x)));
  return (n ? s.map((x) => x / n) : [0, 0, 0]) as Rgb;
}

function measure(game: string, d: SceneData, kind: string, na: string, a: Block, nb: string, b: Block, bg: number): Pair {
  const light: Record<string, number> = {};
  const delta: Record<string, number> = {};
  const pattern: Record<string, number> = {};
  const cue: Record<string, string> = {};
  const lookAlike: string[] = [];
  let diff = 0;
  let ink = 0;
  for (let i = 0; i < a.pixels.length; i++) {
    const ia = a.pixels[i] !== TRANSPARENT && a.pixels[i] !== bg;
    const ib = b.pixels[i] !== TRANSPARENT && b.pixels[i] !== bg;
    if (ia !== ib) diff++;
    if (ia || ib) ink++;
  }
  // a full tile has no mask: the share is of the cells either one inks
  const shape = diff / Math.max(ink, 1);
  for (const v of KINDS) {
    const name = kindName(v);
    const pa = seen(a, d.palette, bg, v);
    const pb = seen(b, d.palette, bg, v);
    // light and color are taken over the cells where the two blocks are painted differently (a lever's knob, a
    // key's bow), not the whole block: two keys on one shape differ only where the paint does
    const la = lab(mean(pa))[0];
    const lb = lab(mean(pb))[0];
    let sl = 0;
    let se = 0;
    let nd = 0;
    for (let i = 0; i < pa.length; i++) {
      const x = pa[i];
      const y = pb[i];
      if (!x || !y || a.pixels[i] === b.pixels[i]) continue;
      nd++;
      sl += Math.abs(lab(x)[0] - lab(y)[0]);
      se += deltaEBytes(x, y);
    }
    light[name] = nd ? sl / nd : Math.abs(la - lb);
    delta[name] = nd ? se / nd : deltaEBytes(mean(pa), mean(pb));
    let sum = 0;
    let n = 0;
    const lAb = pa.map((p) => (p ? lab(p)[0] - la : null));
    const lBb = pb.map((p) => (p ? lab(p)[0] - lb : null));
    for (let i = 0; i < pa.length; i++) {
      const x = lAb[i];
      const y = lBb[i];
      if (x === null && y === null) continue;
      n++;
      sum += x === null || y === null ? 0 : Math.abs(x - y);
    }
    pattern[name] = n ? sum / n : 0;
    cue[name] = light[name] >= LIGHT ? 'light' : shape >= SHAPE ? 'shape' : pattern[name] >= PATTERN ? 'pattern' : '';
    if (!cue[name] && delta[name] < LOOK_ALIKE) lookAlike.push(name);
  }
  // hue alone: no cue other than color even for normal eyes (or a cue that fails for some kind of vision)
  const hueOnly = KINDS.some((v) => !cue[kindName(v)]);
  return { game, scene: d.scene, kind, a: na, b: nb, light, delta, shape, pattern, cue, hueOnly, lookAlike };
}

const sig = (b: Block) => b.pixels.join(',');

/** The pairs of one scene a player must tell apart. */
export function pairsOf(game: string, d: SceneData): Pair[] {
  const use = new Map<number, number>();
  for (const c of d.map.blocks) use.set(c, (use.get(c) ?? 0) + 1);
  const top = [...use].sort((x, y) => y[1] - x[1])[0]?.[0] ?? 0;
  const counts = new Map<number, number>();
  for (const p of d.bbl[top].pixels) counts.set(p, (counts.get(p) ?? 0) + 1);
  const bg = [...counts].sort((x, y) => y[1] - x[1])[0]?.[0] ?? 0;
  const out: Pair[] = [];
  const seenPair = new Set<string>();
  const add = (kind: string, na: string, a: Block, nb: string, b: Block) => {
    if (sig(a) === sig(b)) return;
    const key = `${kind}|${[na, nb].sort().join('|')}`;
    if (seenPair.has(key)) return;
    seenPair.add(key);
    out.push(measure(game, d, kind, na, a, nb, b, bg));
  };
  const used = [...use.keys()].filter((n) => n < d.bbl.length && n !== top);
  const bl = (n: number) => d.bbl[n];
  const name = (n: number) => `b${n}`;
  const keys = used.filter((n) => bl(n).effect >= 20 && bl(n).eamt > 0);
  const locks = used.filter((n) => bl(n).effect > 0 && bl(n).eamt < 0 && bl(n).solid !== 0);
  const hurt = used.filter((n) => bl(n).chHitPt < 0);
  const good = used.filter((n) => bl(n).chHitPt > 0 || (bl(n).scorePts > 0 && bl(n).solid === 0) || (bl(n).effect > 0 && bl(n).effect < 20 && bl(n).eamt > 0));
  const plain = used.filter((n) => bl(n).chHitPt === 0 && bl(n).effect === 0 && bl(n).scorePts === 0 && !bl(n).obj);
  const pair = (kind: string, xs: number[], ys: number[], same: boolean) => {
    for (const x of xs)
      for (const y of ys) {
        if (x === y || (same && y < x)) continue;
        // two keys or locks of one counter and amount do the same thing: nothing to tell apart
        if (same && bl(x).effect === bl(y).effect && bl(x).eamt === bl(y).eamt) continue;
        add(kind, name(x), bl(x), name(y), bl(y));
      }
  };
  pair('key/key', keys, keys, true);
  pair('lock/lock', locks, locks, true);
  pair('hurt/good', hurt, good, false);
  // plain ground a hero meets as the hazard does: compare with blocks solid alike (a floor) or both passable (a backdrop)
  for (const h of hurt)
    for (const p of plain) if ((bl(h).solid === 0) === (bl(p).solid === 0)) add('hurt/floor', name(h), bl(h), name(p), bl(p));
  // monsters: a hurting one against a harmless one
  const mons = new Map<number, number>();
  for (const m of d.mon) {
    const pic = m.used ? m.pic[0]?.[0] : undefined;
    if (pic !== undefined && pic >= 0 && pic < d.mbl.length) mons.set(pic, d.mbl[pic].chHitPt);
  }
  const mh = [...mons].filter(([, hp]) => hp < 0).map(([n]) => n);
  const mg = [...mons].filter(([, hp]) => hp >= 0).map(([n]) => n);
  for (const x of mh) for (const y of mg) add('monsters', `m${x}`, d.mbl[x], `m${y}`, d.mbl[y]);
  return out;
}

export function pairsOfGame(id: string): Pair[] {
  const disk = join(games, id, 'disk');
  if (!existsSync(disk)) return [];
  const files = new GameFiles(readDisk(disk));
  const game = gameOf(files);
  return scenesOf(game, files).flatMap((d) => pairsOf(id, d));
}

/** The number of hue-alone pairs in a game: what checkGames shows as an advisory. */
export const findings = (id: string): number => pairsOfGame(id).filter((p) => p.hueOnly).length;
