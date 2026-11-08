// Dresses a finished level (art/dress.ts draws the blocks): grass, dirt and rock vary cell by cell by a hash of
// where they are, so no tile repeats in a pattern; grass under a prop gets its shadow; empty sky gets the odd wisp
// of cloud and pair of birds; leaves drift down beside the trees; and a level may ask for distant hills in the
// haze along a row. Nothing it places changes what is solid, so the bot's routes are the same.
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL } from '../../kit/starter/book';
import { ORIGIN } from '../../kit/starter/map';
import type { Pal } from '../../kit/starter/palette';
import { birds, dirtVariant, farHill, grassShade, grassVariant, leaf, wisp } from './art/dress';
import { ladderOnRock } from './art/high';
import { crown, rock } from './art/land';
import { OPEN, type Level } from './level';

export interface DressOptions {
  /** Indoors or underground: no wisps of cloud, no birds. */
  indoor?: boolean;
  /** Birds in the sky (day looks only). */
  birds?: boolean;
  /** Every other tree a red maple instead of an orange oak (nine more blocks). */
  maples?: boolean;
  /** Distant hills: the row of their lower block, between columns `from` and `to` (default the whole level). */
  far?: { row: number; from?: number; to?: number };
}

const air = { grav: PULL.down };

/** A small, steady hash of a cell, 0 .. 1. */
const hash = (x: number, y: number, k = 0): number => {
  let h = (x * 374761393 + y * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const SKYISH = /^(sky|cloud[LR]|wisp[LR]|birds[AB]|leaf\d|far\.|rain\d|star[ABC]|faint|bright)/;

export function dress(l: Level, pal: Pal, o: DressOptions = {}): void {
  const { book } = l;
  const add = (name: string, pic: () => Pixels, rulesFrom?: string) => {
    if (!book.has(name)) book.add(name, pic(), rulesFrom ? book.rulesOf(rulesFrom) : air);
    return book.n(name);
  };
  const grass = book.pics.get('grass');
  const dirt = book.pics.get('dirt');
  if (!grass || !dirt) throw new Error(`${l.file}: no grass or dirt to dress`);
  const names = new Map<number, string>([...book.index].map(([n, i]) => [i, n]));
  const blocks = l.map.map.blocks;
  const at = (x: number, y: number) => (y + ORIGIN) * MLEN + x + ORIGIN;
  // a block added while dressing is looked up (and remembered) the first time it is met
  const nameOf = (i: number): string => {
    if (!names.has(i)) names.set(i, [...book.index].find(([, j]) => j === i)?.[0] ?? '');
    return names.get(i) as string;
  };
  const nameAt = (x: number, y: number) => (x < 0 || y < 0 || x >= l.map.width || y >= l.map.height ? 'sky' : nameOf(blocks[at(x, y)]));
  const solid = (name: string) => (book.has(name) ? (book.rulesOf(name).solid ?? 0) !== 0 : false);
  const put = (x: number, y: number, n: number) => (blocks[at(x, y)] = n);
  const W = l.map.width;
  const H = l.map.height;

  // a prop drawn again with `back` behind it wherever it shows sky (a Game-Maker cell shows one block, so nothing
  // shows through it), and so is what it turns into, touched or on its clock (an acorn taken leaves the rock)
  const rockish = (n: string) => /^(rock|ledge|scree|slope|gentle|ladderRock)/.test(n);
  const sky = pal.c('sky', 3);
  const showsSky = (name: string) => book.pics.get(name)?.px.includes(sky) ?? false;
  const onBack = (name: string, back: string): number => {
    const v = `${name}@${back}`;
    if (book.has(v)) return book.n(v);
    const later: string[] = [];
    const swap = (t: string) => (t === 'sky' ? back : showsSky(t) ? (later.push(t), `${t}@${back}`) : t);
    const r = book.rulesOf(name);
    if (r.touch) r.touch = swap(r.touch);
    const behind = book.pics.get(back) as Pixels;
    const pic = (book.pics.get(name) as Pixels).crop(0, 0, 20, 20).map((x, y, c) => (c === sky ? behind.get(x, y) : c));
    const n = book.add(v, pic, r);
    const clock = l.timed.find((t) => t.name === name);
    if (clock) l.timed.push({ ...clock, name: v, next: swap(clock.next) });
    for (const t of later) onBack(t, back);
    return n;
  };
  const onRock = (name: string): number => onBack(name, 'rock');

  // small props standing in front of rock (a cliff above them, or rock both sides) get the rock behind them
  for (let y = 0; y < H; y++)
    for (let x = 1; x < W - 1; x++) {
      const n = nameAt(x, y);
      if (/^(post|acorn|pie)$/.test(n) && (rockish(nameAt(x, y - 1)) || (rockish(nameAt(x - 1, y)) && rockish(nameAt(x + 1, y))))) put(x, y, onRock(n));
    }

  // the ground and the rock, cell by cell (the level's first and last columns stay plain: the ground carries on past them)
  for (let y = 0; y < H; y++)
    for (let x = 1; x < W - 1; x++) {
      const n = nameAt(x, y);
      const r = hash(x, y);
      if (n === 'grass') {
        const above = nameAt(x, y - 1);
        if (!SKYISH.test(above) && !solid(above) && above)
          put(
            x,
            y,
            add('grassShade', () => grassShade(pal, grass), 'grass'),
          );
        else if (r < 0.16)
          put(
            x,
            y,
            add('grassLeaves', () => grassVariant(pal, grass, 'leaves', 3), 'grass'),
          );
        else if (r < 0.24)
          put(
            x,
            y,
            add('grassPebble', () => grassVariant(pal, grass, 'pebble', 4), 'grass'),
          );
      } else if (n === 'dirt') {
        if (r < 0.18)
          put(
            x,
            y,
            add('dirtPebbles', () => dirtVariant(pal, dirt, 'pebbles', 5), 'dirt'),
          );
        else if (r < 0.27)
          put(
            x,
            y,
            add('dirtRoot', () => dirtVariant(pal, dirt, 'root', 6), 'dirt'),
          );
      } else if (
        n === 'ladder' &&
        (rockish(nameAt(x - 1, y)) || rockish(nameAt(x + 1, y)) || nameAt(x, y - 1) === 'ladderRock') &&
        ![nameAt(x - 1, y), nameAt(x + 1, y)].some((s) => SKYISH.test(s))
      ) {
        const lad = book.pics.get('ladder');
        if (lad)
          put(
            x,
            y,
            add('ladderRock', () => ladderOnRock(pal, lad, 40), 'ladder'),
          );
      } else if (n === 'ladder' && [nameAt(x - 1, y), nameAt(x + 1, y)].every((s) => /^(grass|dirt)/.test(s))) {
        // a ladder down a shaft cut through the ground: earth behind it, not sky
        put(x, y, onBack('ladder', 'dirt'));
      } else if ((n === 'rock' || n === 'rock2') && book.has('rock')) {
        const k = Math.floor(hash(x, y, 1) * 4);
        put(x, y, k < 2 ? book.n(k ? 'rock2' : 'rock') : add(`rock${k + 1}`, () => rock(pal, 10 + k), 'rock'));
      }
    }

  // the sky: a wisp of cloud or a pair of birds where a 4 x 3 patch is all clear sky
  const clear = (x: number, y: number, w: number, h: number) => {
    for (let dy = -1; dy < h; dy++) for (let dx = -1; dx < w; dx++) if (nameAt(x + dx, y + dy) !== 'sky') return false;
    return true;
  };
  for (let y = 1; y < H - 4; y++)
    for (let x = 2; x < W - 3; x++) {
      const r = hash(x, y, 2);
      if (o.indoor) continue;
      if (r < 0.012 && clear(x, y, 3, 2)) {
        const [a, b] = wisp(pal);
        put(
          x,
          y,
          add('wispL', () => a),
        );
        put(
          x + 1,
          y,
          add('wispR', () => b),
        );
      } else if (o.birds && r > 0.992 && clear(x, y, 2, 2)) {
        const f = hash(x, y, 3) < 0.5 ? 'A' : 'B';
        add('birdsA', () => birds(pal, 0));
        add('birdsB', () => birds(pal, 1));
        put(x, y, book.n(`birds${f}`));
      }
    }
  if (book.has('birdsA')) l.timed.push({ name: 'birdsA', next: 'birdsB', ticks: 6 }, { name: 'birdsB', next: 'birdsA', ticks: 6 });

  // every other tree a maple: its crown's nine blocks swapped
  if (o.maples) {
    let tree = 0;
    for (let x = 0; x < W; x++)
      for (let y = 0; y < H; y++)
        if (nameAt(x, y) === 'crown0' && tree++ % 2 === 1)
          for (let k = 0; k < 9; k++) {
            const [cx, cy] = [x + (k % 3), y + Math.floor(k / 3)];
            if (nameAt(cx, cy) === `crown${k}`)
              put(
                cx,
                cy,
                add(`maple${k}`, () => crown(pal, k, true)),
              );
          }
  }

  // leaves drifting down beside each tree's crown (the crown's lower corners are crown6 and crown8)
  let leaves = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const n = nameAt(x, y);
      if (!/^(crown|maple)[68]$/.test(n)) continue;
      const lx = n.endsWith('6') ? x - 1 : x + 1;
      for (const ly of [y + 1, y + 2])
        if (nameAt(lx, ly) === 'sky') {
          const f = (lx + ly) % 4;
          for (let k = 0; k < 4; k++) add(`leaf${k}`, () => leaf(pal, k));
          put(lx, ly, book.n(`leaf${f}`));
          leaves++;
        }
    }
  if (leaves) for (let k = 0; k < 4; k++) l.timed.push({ name: `leaf${k}`, next: `leaf${(k + 1) % 4}`, ticks: 7 });

  // the far hills: edge heights by column, sinking to nothing beside anything in the way
  if (o.far) {
    const { row } = o.far;
    const from = Math.max(1, o.far.from ?? 1);
    const to = Math.min(W - 2, o.far.to ?? W - 2);
    const open = (x: number) => x >= from && x <= to && [row, row - 1].every((y) => /^(sky|rain\d)$/.test(nameAt(x, y)));
    // a run of open columns shorter than four is left as sky (a hill that narrow is only a tent)
    const free = (x: number) => {
      if (!open(x)) return false;
      let a = x;
      let b = x;
      while (open(a - 1)) a--;
      while (open(b + 1)) b++;
      return b - a >= 3;
    };
    const edge: (0 | 1 | 2)[] = [];
    let last: 0 | 1 | 2 = 0;
    for (let x = from; x <= to + 1; x++) {
      if (!free(x - 1) || !free(x)) last = 0;
      else {
        const r = hash(x, row, 4);
        last = last === 0 ? 1 : r < 0.22 ? (last === 1 ? 2 : 1) : last;
      }
      edge[x] = last;
    }
    for (let x = from; x <= to; x++) {
      if (!free(x)) continue;
      const a = edge[x];
      const b = edge[x + 1];
      if (!a && !b) continue;
      const v = a === b ? Math.floor(hash(x, row, 5) * 3) : 0;
      const name = `far.${a}${b}${v}`;
      const [top, bottom] = farHill(pal, a, b, a * 3 + b + v * 11);
      put(
        x,
        row - 1,
        add(`${name}t`, () => top),
      );
      put(
        x,
        row,
        add(`${name}b`, () => bottom),
      );
    }
  }

  // every prop the level set over something solid (MountainMap.under: the mountain's rock, a house's wall, a shelf) gets
  // that behind it in place of sky; rock picks the same variety the ground pass would have
  for (const [k, base] of l.map.under) {
    const x = (k % MLEN) - ORIGIN;
    const y = Math.floor(k / MLEN) - ORIGIN;
    const n = nameAt(x, y);
    if (!n || n.includes('@') || OPEN.test(n) || !showsSky(n) || !book.has(base) || showsSky(base)) continue;
    let back = base;
    if ((base === 'rock' || base === 'rock2') && x > 0 && x < W - 1) {
      const v = Math.floor(hash(x, y, 1) * 4);
      back = v < 2 ? (v ? 'rock2' : 'rock') : `rock${v + 1}`;
      if (v >= 2) add(back, () => rock(pal, 10 + v), 'rock');
    }
    put(x, y, onBack(n, back));
  }
}
