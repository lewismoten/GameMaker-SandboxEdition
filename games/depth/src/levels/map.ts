// Turning a level drawn in text into its two .MAP files (near and far focus share every block
// number; only the monsters differ), the scene links and where Ray starts.
import { LASTMM, MLEN, MWID, newMap, reindexMonsters, type GameMap } from '../../../../web/src/formats/map';
import { TileBook } from '../tiles/book';
import { ISO, KINDS, PLANES, type Ctx, type Plane } from '../tiles/cells';

/** Text map characters every level understands. */
const LEGEND: Record<string, string> = {
  '#': 'wall',
  '.': 'floor',
  '@': 'floor',
  ' ': 'void',
  O: 'pit',
  n: 'near',
  f: 'far',
  '=': 'nbridge',
  '~': 'fbridge',
  '*': 'photon',
  '+': 'bulb',
  R: 'lensR',
  G: 'lensG',
  B: 'lensB',
  r: 'gateR',
  g: 'gateG',
  b: 'gateB',
  X: 'exit',
  o: 'orb',
  E: 'egg',
  P: 'pulseA',
  Q: 'pulseB',
  '^': 'slopeN',
  '>': 'slopeE',
  v: 'slopeS',
  '<': 'slopeW',
  k: 'crystal',
  U: 'teapot',
  A: 'nest',
  I: 'pillar',
  m: 'mirrordoor',
  '[': 'chez:0',
  ']': 'chez:1',
  '{': 'chez:2',
  '}': 'chez:3',
  C: 'crowngate',
};

interface MonsterMark {
  mon: number;
  /** Which focus plane it lives in (it is not there at all in the other). */
  plane: Plane | 'both';
  /** The floor under it. */
  under?: string;
}

interface RingSpec {
  /** Where Ray arrives, relative to the ring, after pulling focus to the far plane / back to near. */
  toFar: [number, number];
  toNear: [number, number];
}

export interface LevelText {
  rows: string[];
  /** Level-specific characters. */
  legend?: Record<string, string>;
  monsters?: Record<string, MonsterMark>;
  /** Focus rings are digits 1..9 (a ring may appear once). */
  rings?: Record<string, RingSpec>;
  /** Where the map sits in the 100x100 world (so the void wraps around it). */
  at?: [number, number];
  /** Rectangles of cells drawn isometrically: [x0, y0, x1, y1], inclusive. */
  iso?: [number, number, number, number][];
}

export interface BuiltLevel {
  maps: Record<Plane, GameMap>;
  start: [number, number];
  exit: [number, number];
  rings: { at: [number, number]; spec: RingSpec }[];
  /** The kind in every cell (for the bot and the previews). */
  kinds: string[][];
  /** Where each marked character was found. */
  marks: Map<string, [number, number][]>;
  width: number;
  height: number;
  ox: number;
  oy: number;
}

export function buildLevel(book: TileBook, lv: LevelText): BuiltLevel {
  const legend = { ...LEGEND, ...(lv.legend ?? {}) };
  const h = lv.rows.length;
  const w = Math.max(...lv.rows.map((r) => r.length));
  const [ox, oy] = lv.at ?? [Math.floor((MLEN - w) / 2), Math.floor((MWID - h) / 2)];
  const kinds: string[][] = [];
  const marks = new Map<string, [number, number][]>();
  for (let y = 0; y < h; y++) {
    kinds.push([]);
    for (let x = 0; x < w; x++) {
      const ch = lv.rows[y][x] ?? ' ';
      const mon = lv.monsters?.[ch];
      let kind = mon ? (mon.under ?? 'floor') : /[1-9]/.test(ch) ? 'ring' : legend[ch];
      if (!kind) throw new Error(`Unknown map character "${ch}" at ${x},${y}`);
      kinds[y].push(kind);
      if (!marks.has(ch)) marks.set(ch, []);
      marks.get(ch)!.push([ox + x, oy + y]);
    }
  }
  // a kind may name a part of a bigger model: "chez:2"
  const kindAt = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 'void' : kinds[y][x].split(':')[0]);
  const partAt = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : Number(kinds[y][x].split(':')[1] ?? 0));
  const ctxAt = (x: number, y: number, p: Plane): Ctx => ({
    w: KINDS[kindAt(x - 1, y)].tall(p),
    n: KINDS[kindAt(x, y - 1)].tall(p),
    nw: KINDS[kindAt(x - 1, y - 1)].tall(p),
    nPit: KINDS[kindAt(x, y - 1)].ground(p) === 'pit',
  });
  const isIso = (x: number, y: number) =>
    KINDS[kindAt(x, y)].ground('near') !== 'pit' &&
    KINDS[kindAt(x, y)].ground('far') !== 'pit' &&
    (lv.iso ?? []).some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
  const blockAt = (x: number, y: number, kind = kindAt(x, y)) =>
    book.get({ kind, part: partAt(x, y), variant: isIso(x, y) ? ISO : 0, ctx: { near: ctxAt(x, y, 'near'), far: ctxAt(x, y, 'far') } });

  const maps = { near: newMap(), far: newMap() };
  // the whole world is void first, then the level is laid in
  const voidBlock = book.get({
    kind: 'void',
    ctx: { near: { w: false, n: false, nw: false, nPit: true }, far: { w: false, n: false, nw: false, nPit: true } },
  });
  for (const p of PLANES) maps[p].blocks.fill(voidBlock);
  for (let y = -1; y <= h; y++)
    for (let x = -1; x <= w; x++) {
      const b = blockAt(x, y);
      const mx = (ox + x + MLEN) % MLEN;
      const my = (oy + y + MWID) % MWID;
      for (const p of PLANES) maps[p].blocks[my * MLEN + mx] = b;
    }

  // monsters
  const slots = { near: 0, far: 0 };
  for (const [ch, list] of marks) {
    const m = lv.monsters?.[ch];
    if (!m) continue;
    for (const [x, y] of list)
      for (const p of PLANES) {
        if (m.plane !== 'both' && m.plane !== p) continue;
        if (slots[p] >= LASTMM) throw new Error('Too many monsters');
        maps[p].monsters[slots[p]++] = { monnum: m.mon, status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
      }
  }
  for (const p of PLANES) reindexMonsters(maps[p]);

  const first = (ch: string) => {
    const l = marks.get(ch);
    if (!l?.length) throw new Error(`No "${ch}" on the map`);
    return l[0];
  };
  const rings: BuiltLevel['rings'] = [];
  for (const [ch, spec] of Object.entries(lv.rings ?? {})) for (const at of marks.get(ch) ?? []) rings.push({ at, spec });
  return { maps, start: first('@'), exit: first('X'), rings, kinds, marks, width: w, height: h, ox, oy };
}
