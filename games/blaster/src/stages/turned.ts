// Turned legs: a leg built the usual way (a strip flying up, a band flying right) and then laid,
// turned, into the spare part of another leg's map, so one map holds a run each way. A strip
// turned half a turn flies down; a band flipped left to right flies left. The new leg's blocks,
// virus pictures and paths are the stage's own, turned the same way (its own .bbl, .mon and
// .mbl), so everything still joins up and comes at the ship from ahead; words and numbers
// stay readable, and a few blocks the lane never shows become its distance meter.
import { BACKBL, emptyBlock, SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '../../../../web/src/formats/blocks';
import { MLEN, MWID } from '../../../../web/src/formats/map';
import type { Monster } from '../../../../web/src/formats/monster';
import { Pixels } from '../../../kit/pixels';
import { flipX, turn180 } from '../art/draw';
import { EGG_BLOCK } from '../blocks/egg';
import { Grid, LENGTH, STRIP_START, X0 } from './mapkit';
import { ROWS, SIDE_START, TOP } from './sideLeg';
import { meterSign } from '../blocks/sideTiles';
import type { StageArt } from '../blocks/tiles';
import type { Leg } from './stage';

/** The names of a picture made of blocks `${prefix}${row}${col}`, w by h, as rows. */
export const stampNames = (prefix: string, w: number, h: number): string[][] =>
  Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, k) => `${prefix}${r}${k}`));

/** Half a turn (up becomes down) or a mirror left to right (right becomes left). */
export type Turn = 'rot180' | 'flipX';

export interface TurnSpec {
  turn: Turn;
  /** Background blocks whose pictures stay as drawn (words, numbers). */
  upright?: string[];
  /** Pictures of several blocks (rows of names, as they stand upright) that keep reading the right way round. */
  stamps?: string[][][];
  /** Monster pictures (.mbl names) that stay as drawn. */
  uprightMons?: string[];
  /** Pictures drawn for the turned leg in place of a block's own, by name (an arrow that must point the new way). */
  pics?: Record<string, Pixels>;
  /** Blocks of the leg's own at numbers its lane never shows (its distance meter), by number. */
  extras?: Map<number, { pic: Pixels; next?: number; ntime?: number }>;
}

const turnPic = (t: Turn, p: Pixels) => (t === 'rot180' ? turn180(p) : flipX(p));

/** The pickups' letters (N, +, 1UP, BYTE) read the same in every leg. */
const PICKUPS = ['nova', 'repair', 'life', 'bit'].flatMap((k) => [k, `${k}1`]);

function pixelsOf(px: Uint8Array): Pixels {
  const p = new Pixels(20, 20);
  p.px.set(px);
  return p;
}

/** Side bits (solid sides, gravity: 1 up, 2 right, 4 down, 8 left) turned with the picture. */
function turnSides(t: Turn, v: number): number {
  const sw = (a: number, b: number, x: number) => ((x & a ? b : 0) | (x & b ? a : 0)) as number;
  let out = v & ~(SOLTOP | SOLRIG | SOLBOT | SOLLEF);
  out |= sw(SOLLEF, SOLRIG, v);
  out |= t === 'rot180' ? sw(SOLTOP, SOLBOT, v) : v & (SOLTOP | SOLBOT);
  return out;
}

/** A leg's background blocks turned: pictures, solid sides and gravity. */
export function turnBbl(blocks: Block[], names: string[], s: TurnSpec): Block[] {
  const upright = new Set(s.upright ?? []);
  const byName = new Map(names.map((n, i) => [n, i]));
  // a stamp's blocks trade pictures, so its words still read left to right, top to bottom
  const traded = new Map<string, string>();
  for (const rows of s.stamps ?? [])
    rows.forEach((row, r) =>
      row.forEach((name, k) => {
        upright.add(name);
        traded.set(name, s.turn === 'rot180' ? rows[rows.length - 1 - r][row.length - 1 - k] : row[row.length - 1 - k]);
      }),
    );
  return blocks.map((b, i) => {
    const extra = s.extras?.get(i);
    if (extra) return { ...emptyBlock(i), pixels: Uint8Array.from(extra.pic.px), nextBl: extra.next ?? i, ntime: extra.ntime ?? 0 };
    const name = names[i];
    const out: Block = { ...b, solid: turnSides(s.turn, b.solid), grav: turnSides(s.turn, b.grav), hitpt: turnSides(s.turn, b.hitpt) };
    const own = name !== undefined ? s.pics?.[name] : undefined;
    if (own) out.pixels = Uint8Array.from(own.px);
    else if (name !== undefined && traded.has(name)) out.pixels = Uint8Array.from(blocks[byName.get(traded.get(name)!)!].pixels);
    else if (name === undefined || !upright.has(name)) out.pixels = Uint8Array.from(turnPic(s.turn, pixelsOf(b.pixels)).px);
    return out;
  });
}

/** A leg's monster pictures turned, but for the ones that stay upright. */
export function turnMbl(blocks: Block[], names: string[], s: TurnSpec, keep: (name: string) => boolean): Block[] {
  const upright = new Set(s.uprightMons ?? []);
  return blocks.map((b, i) => {
    const name = names[i];
    if (name !== undefined && (upright.has(name) || keep(name))) return b;
    return { ...b, pixels: Uint8Array.from(turnPic(s.turn, pixelsOf(b.pixels)).px) };
  });
}

/** A leg's monsters' paths turned: every corner of the normal and the attack path. */
export function turnMon(mon: Monster[], s: TurnSpec): Monster[] {
  const fx = -1;
  const fy = s.turn === 'rot180' ? -1 : 1;
  return mon.map((m) => ({
    ...m,
    march: m.march.map((path) => path.map((c) => ({ ...c, x: c.x * fx || 0, y: c.y * fy || 0 }))) as Monster['march'],
  }));
}

/**
 * Block numbers a lane never shows: not on any of its cells, and not what one of those
 * animates into or becomes when touched (nor the egg's number, which the inventory keeps).
 */
function spareIds(g: Grid, region: { x: number; y: number; w: number; h: number }, count: number): number[] {
  const bs = g.bs;
  const used = new Set<number>([EGG_BLOCK]);
  const todo: number[] = [];
  for (let y = region.y; y < region.y + region.h; y++)
    for (let x = region.x; x < region.x + region.w; x++) todo.push(g.map.blocks[((y + MWID) % MWID) * MLEN + ((x + MLEN) % MLEN)]);
  while (todo.length) {
    const id = todo.pop()!;
    if (used.has(id)) continue;
    used.add(id);
    const name = bs.names[id];
    if (name && !name.startsWith('(empty')) for (const n of bs.leadsTo(name)) todo.push(bs.id(n));
  }
  const out: number[] = [];
  for (let id = BACKBL - 1; id >= 0 && out.length < count; id--) if (!used.has(id)) out.push(id);
  if (out.length < count) throw new Error(`Only ${out.length} block numbers spare for a turned lane`);
  return out;
}

/** The pictures of a meter along a down strip: a sign of the gate's arrow (3 frames) and its numbers. */
export interface StripMeter {
  arrow: Pixels[];
  /** Screens left to the gate, by sign: [screens, picture]. */
  numbers: [number, Pixels][];
}

/** A down strip's meter in a stage's own colors: an arrow pointing down, and 8, 6, 4 and 2 screens to go. */
export const stripMeter = (art: StageArt): StripMeter => ({
  arrow: [0, 1, 2].map((k) => meterSign(art, k, 'down')),
  numbers: [8, 6, 4, 2].map((n) => [n, meterSign(art, 0, 'down', n)]),
});

/**
 * A map of a turned leg's own, for one whose virus would hunt the ship across a shared map
 * (Leak Slugs chase from anywhere): a strip's floor and edges, or a band's solid fill.
 */
function ownGrid(src: Leg, fill?: () => string): Leg {
  const g = src.grid;
  return { ...src, mapFile: undefined, file: src.file, grid: new Grid(g.bs, g.beasts, g.art, 0, 1, 1, fill) };
}

/**
 * A strip leg turned half a turn and laid into the host leg's map with its left column at
 * `left` (or, with `host` 'own', into a map of its own): it flies down from the launch pad
 * near the top to the gate near the bottom. A meter sign stands every two screens, counting
 * the screens left.
 */
export function downLeg(
  hostLeg: Leg | 'own',
  src: Leg,
  o: { file: string; kitFile: string; title: string; card: string[]; left: number; spec: Omit<TurnSpec, 'turn' | 'extras'>; meter: StripMeter },
): Leg {
  const host = hostLeg === 'own' ? ownGrid({ ...src, file: o.file }) : hostLeg;
  const L = hostLeg === 'own' ? X0 : o.left;
  const to = (x: number, y: number): [number, number] => [L + 15 - (x - X0), MWID - 1 - y];
  const y0 = src.grid.y(src.grid.cardAt ?? 40) - 4;
  // the meter, on bare floor near a side, in the strip's own distances before it is turned
  const signs: { at: [number, number]; arrow: boolean; n: number }[] = [];
  for (const [n] of o.meter.numbers) {
    const d = LENGTH - n * 10;
    let placed = false;
    for (const dd of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6])
      for (const c of [13, 1, 12, 2, 11, 3, 10, 4, 9, 5, 8, 6, 7]) {
        if (placed) break;
        const cells: [number, number][] = [
          [c, d + dd],
          [c + 1, d + dd],
        ];
        if (!cells.every(([cc, ddd]) => cc >= 1 && cc <= 14 && /^floor\d$/.test(src.grid.get(cc, ddd)))) continue;
        if (src.grid.map.monsters.some((m) => m.monnum < 64 && Math.abs(m.cury - src.grid.y(d + dd)) <= 1 && Math.abs(m.curx - (X0 + c)) <= 2)) continue;
        // turned, the right-hand cell lands on the left: the arrow goes there, its number after it
        signs.push({ at: [X0 + c + 1, src.grid.y(d + dd)], arrow: true, n }, { at: [X0 + c, src.grid.y(d + dd)], arrow: false, n });
        placed = true;
      }
    if (!placed) throw new Error(`${o.file}: no room for the meter's ${n}`);
  }
  const region = { x: X0, y: 0, w: 16, h: MWID };
  host.grid.host(src.grid, region, to);
  const lane = { x: L, y: 0, w: 16, h: MWID };
  const ids = spareIds(src.grid, lane, o.meter.arrow.length + o.meter.numbers.length);
  const extras: NonNullable<TurnSpec['extras']> = new Map();
  // the arrow is a ring of pictures, so it runs toward the gate
  const arrowIds = o.meter.arrow.map(() => ids.shift()!);
  o.meter.arrow.forEach((pic, k) => extras.set(arrowIds[k], { pic, next: arrowIds[(k + 1) % arrowIds.length], ntime: 4 }));
  const numberIds = new Map(
    o.meter.numbers.map(([n, pic]) => {
      const id = ids.shift()!;
      extras.set(id, { pic });
      return [n, id];
    }),
  );
  for (const s of signs) {
    const [x, y] = to(...s.at);
    src.grid.map.blocks[y * MLEN + x] = s.arrow ? arrowIds[0] : numberIds.get(s.n)!;
  }
  return {
    file: o.file,
    kitFile: o.kitFile,
    mapFile: host.mapFile ?? host.file,
    title: o.title,
    kind: 'down',
    grid: src.grid,
    kit: src.kit,
    card: o.card,
    start: { x: L + 8, y: MWID - 1 - STRIP_START.y },
    cardView: { x: L, y: MWID - 5 - y0 },
    turn: { ...o.spec, upright: [...PICKUPS, ...(o.spec.upright ?? [])], turn: 'rot180', extras },
  };
}

/**
 * A side leg flipped left to right and laid into the host side leg's map with its band's top
 * at row `top`: it flies left from the launch rail near the right end to the gate near the left.
 */
export function leftLeg(
  hostLeg: Leg | 'own',
  src: Leg,
  o: { file: string; title: string; card: string[]; top: number; art: StageArt; spec?: Omit<TurnSpec, 'turn' | 'extras'> },
): Leg {
  const host = hostLeg === 'own' ? ownGrid({ ...src, file: o.file }, () => 'cIn') : hostLeg;
  const to = (x: number, y: number): [number, number] => [MLEN - 1 - x, y - TOP + o.top];
  host.grid.host(src.grid, { x: 0, y: TOP, w: MLEN, h: ROWS }, to);
  const cv = src.cardView!;
  return {
    file: o.file,
    kitFile: o.file,
    mapFile: host.mapFile ?? host.file,
    palFile: hostLeg === 'own' ? undefined : (host.palFile ?? host.file),
    title: o.title,
    kind: 'left',
    grid: src.grid,
    kit: src.kit,
    pal: src.pal,
    card: o.card,
    start: { x: MLEN - 1 - SIDE_START.x, y: SIDE_START.y - TOP + o.top },
    cardView: { x: MLEN - 16 - cv.x, y: cv.y - TOP + o.top },
    turn: {
      ...o.spec,
      // the meter's word and numbers read as before, its arrow points left
      upright: [...PICKUPS, 'mtrN1', 'mtrN2', 'mtrN3', 'mtrN4', ...(o.spec?.upright ?? [])],
      pics: { mtr0: meterSign(o.art, 0, 'left'), mtr1: meterSign(o.art, 1, 'left'), mtr2: meterSign(o.art, 2, 'left'), ...o.spec?.pics },
      turn: 'flipX',
    },
  };
}
