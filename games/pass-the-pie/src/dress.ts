// How a street is dressed after its map is laid out (graphics pass, version 3.1): the ground is printed from a few
// tiles (grass with tufts and clover, soil with roots and stones) instead of one repeated block, the sky is inked in
// bands that darken toward the top (a halftone: more dots every two rows up), and the props on paper cast a small
// offset shadow, like a print slightly out of register. A prop that stands in a banded row is printed again on that
// band's tile, so no square of plain paper shows around it. The map's own block names are not touched: `done()` is
// wrapped, so the kit's ground rule (grass and dirt carry on past the edges) still sees the plain names.
import type { Pal } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { ORIGIN } from '../../kit/starter/map';
import { SOLID } from '../../kit/starter/book';
import type { Level } from './levels/common';
import { gouges, hatch, oval, paperBlock, press, T } from './print';

const GROUND = ORIGIN + 17;
/** Sky bands, one row each going up from six rows above the ground; the last carries on to the top of the world. */
const BANDS = 6;
const bandRow = (k: number) => GROUND - 5 - k;
/** The dot density (sixteenths) at the bottom of band k's tile; band k tops out at the next entry. */
const DENS = [0, 2, 5, 8, 10, 13, 15];
/** Props that cast a shadow (blocks drawn on paper with an ink outline). */
const SHADOWED = new Set([
  'coin',
  'key',
  'keySilver',
  'bush',
  'flower',
  'spikes',
  'pumpkin',
  'leaf',
  'leafFlat',
  'fence',
  'pot',
  'bone',
  'dog',
  'dogChew',
  'goldAcorn',
  'cider',
  'trunk',
  'roof',
  'plank',
  'ladder',
  'gateSilver',
  'cranberry',
]);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];

/** The ink the sky fades toward at the top of a street, by mood: blue for the picture-book streets, red for a poster's sunset. */
function skyInk(pal: Pal, mood: Level['mood']): number {
  const { ink, acc, acc2 } = press(pal);
  if (mood === 'lawn') return acc[2];
  if (mood === 'parade') return ink[2];
  if (mood === 'dusk') return acc[3];
  return acc2[3];
}

/** A sky tile of band k (1 lowest): the paper with halftone dots, denser toward the tile's top (a hard-edged ramp, like a print). */
function bandTile(pal: Pal, k: number, dot: number): Pixels {
  const p = paperBlock(pal);
  const { paper } = press(pal);
  for (let y = 0; y < 20; y++) {
    const d = DENS[k - 1] + ((DENS[k] - DENS[k - 1]) * (19 - y)) / 19;
    for (let x = 0; x < 20; x++) if (bayer(x, y) < d && p.get(x, y) !== paper[3]) p.set(x, y, dot);
  }
  return p;
}

/** The pixels of `pic` that are paper (so a band can print over them). */
const isPaper = (c: number, paper: number[]) => c === paper[1] || c === paper[2];

/** A prop with a shadow two pixels down and right of its ink outline, cast on its paper. */
function shadowed(pal: Pal, pic: Pixels): Pixels {
  const { paper, ink } = press(pal);
  const out = new Pixels(pic.w, pic.h, T);
  out.px.set(pic.px);
  const isInk = (x: number, y: number) => pic.get(x, y) === ink[0];
  for (let y = 0; y < pic.h; y++)
    for (let x = 0; x < pic.w; x++) {
      if (!isPaper(pic.get(x, y), paper)) continue;
      if (isInk(x - 1, y - 1) || isInk(x - 2, y - 2) || isInk(x - 1, y) || isInk(x, y - 1) || isInk(x - 2, y - 1) || isInk(x - 1, y - 2))
        out.set(x, y, paper[0]);
    }
  return out;
}

/** Grass tile `v` (0-3): a leaf band with tufts pushing up through the ink edge, V cuts, a shaded underside. */
function grassTile(pal: Pal, v: number): Pixels {
  const { ink, leaf, acc, acc2 } = press(pal);
  const r = rng(40 + v);
  const p = new Pixels(20, 20, ink[0]);
  p.rect(0, 2, 20, 6, leaf[2]);
  p.rect(0, 5, 20, 2, leaf[1]);
  for (let x = 0; x < 20; x += 5 - (v & 1))
    p.set(x + 1, 3, leaf[3])
      .set(x + 2, 4, leaf[3])
      .set(x + 3, 3, leaf[3]);
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(r() * 16);
    p.set(x + 1, 0, leaf[2])
      .rect(x, 1, 3, 1, leaf[2])
      .set(x + 1, 1, leaf[3]);
    if (r() < 0.6) p.set(x + 4, 1, leaf[1]);
  }
  for (let i = 0; i < 5; i++) p.rect(Math.floor(r() * 17), 5 + (i & 1), 2, 1, leaf[0]);
  p.rect(0, 7, 20, 1, leaf[0]);
  // a clover or a seed head on some tiles
  if (v === 1) p.set(6, 3, acc2[2]).set(6, 4, acc2[2]).set(15, 4, acc[2]);
  if (v === 2) p.set(11, 3, acc[2]).set(12, 3, acc2[3]);
  // soil under it: ragged edge, cut marks
  for (let x = 0; x < 20; x += 3) p.rect(x, 8, 2, 1, ink[1]);
  gouges(p, 0, 10, 20, 10, ink[2], 4, 70 + v, 4);
  gouges(p, 0, 9, 20, 10, ink[1], 3, 80 + v, 2);
  if (v === 3) oval(p, 13, 13, 2.5, 1.5, ink[1]);
  return p;
}

/** A soil tile: `top` is the row right under the grass (roots hang from it). */
function soilTile(pal: Pal, v: number, top: boolean): Pixels {
  const { ink, acc } = press(pal);
  const r = rng(90 + v + (top ? 10 : 0));
  const p = new Pixels(20, 20, ink[0]);
  gouges(p, 0, 0, 20, 20, ink[2], 6, 100 + v, 4);
  gouges(p, 0, 0, 20, 20, ink[1], 5, 110 + v, 2);
  if (top) {
    for (let i = 0; i < 2; i++) {
      const x = 2 + Math.floor(r() * 16);
      const len = 3 + Math.floor(r() * 5);
      for (let k = 0; k < len; k++) p.set(x + (k > 3 ? 1 : 0), k, ink[1]);
    }
  } else if (v === 0) {
    oval(p, 6, 11, 3.5, 2.5, ink[1]);
    p.rect(4, 9, 4, 1, ink[2]).rect(4, 14, 5, 1, ink[0]);
  } else if (v === 1) {
    oval(p, 14, 7, 2.5, 2, ink[1]);
    p.rect(13, 5, 3, 1, ink[2]);
    oval(p, 4, 16, 1.5, 1, ink[2]);
  } else {
    p.rect(8, 13, 4, 2, acc[0]).rect(8, 13, 4, 1, acc[1]); // a buried brick end
    p.rect(2, 4, 6, 1, ink[2]).rect(15, 16, 4, 1, ink[2]);
  }
  return p;
}

/** Dresses a level: see the file's header. Run once, after the level is built. */
export function dress(level: Level, pal: Pal): void {
  const { paper } = press(pal);
  const dot = skyInk(pal, level.mood);
  const book = level.book;
  const map = level.map;
  const names = new Map<number, string>();
  const nameOf = (n: number) => {
    if (!names.size) for (const [k, i] of book.index) names.set(i, k);
    return names.get(n) ?? '';
  };

  // props first: shadows (keeps each block's number and rules)
  for (const name of SHADOWED) if (book.has(name)) book.redraw(name, shadowed(pal, book.pics.get(name)!));

  // the ground: its own tiles and rules
  book.redraw('grass', grassTile(pal, 0));
  book.redraw('dirt', soilTile(pal, 0, false));
  const ground: string[] = ['grass'];
  const soil: string[] = ['dirt'];
  const top: string[] = [];
  for (let v = 1; v < 4; v++) {
    book.add(`grass${v}`, grassTile(pal, v), { solid: SOLID });
    ground.push(`grass${v}`);
  }
  for (let v = 1; v < 3; v++) {
    book.add(`dirt${v}`, soilTile(pal, v, false), { solid: SOLID });
    soil.push(`dirt${v}`);
  }
  for (let v = 0; v < 3; v++) {
    book.add(`dirtTop${v}`, soilTile(pal, v, true), { solid: SOLID });
    top.push(`dirtTop${v}`);
  }

  // sky bands: the plain sky in each band, then props in a band's rows printed on that band's tile
  const bandName = (name: string, k: number) => `${name}~${k}`;
  const added = new Set<string>();
  const addBand = (name: string, k: number): string => {
    const to = bandName(name, k);
    if (added.has(to)) return to;
    if (book.index.size >= 150) return name; // out of room: that prop stays on plain paper
    added.add(to);
    const pic = book.pics.get(name)!;
    const rules = book.rulesOf(name);
    if (rules.touch) rules.touch = addBand(rules.touch, k);
    const tile =
      name === 'sky'
        ? bandTile(pal, k, dot)
        : (() => {
            const t = bandTile(pal, k, dot);
            return new Pixels(pic.w, pic.h, T).map((x, y) => (isPaper(pic.get(x, y), paper) ? t.get(x % 20, y % 20) : pic.get(x, y)));
          })();
    book.add(to, tile, rules);
    for (const t of level.timed.slice()) if (t.name === name) level.timed.push({ name: to, next: addBand(t.next, k), ticks: t.ticks });
    for (const b of level.births?.slice() ?? []) if (b.name === name) level.births!.push({ ...b, name: to });
    return to;
  };
  // walls: a hatched shade down the right side of a wall's last block and under a roof's eave
  const shade = (name: string, edge: string): string => {
    const to = `${name}^${edge}`;
    if (added.has(to) || book.index.size >= 150) return added.has(to) ? to : name;
    added.add(to);
    const { ink } = press(pal);
    const pic = book.pics.get(name)!;
    const t = new Pixels(pic.w, pic.h, T);
    t.px.set(pic.px);
    if (edge.includes('r')) hatch(t, 15, 0, 5, 20, ink[1], 2);
    if (edge.includes('e')) hatch(t, 0, 0, 20, 5, ink[1], 2);
    book.add(to, t, book.rulesOf(name));
    return to;
  };
  const hasPaper = (name: string) => {
    const pic = book.pics.get(name);
    if (!pic) return false;
    for (let i = 0; i < pic.px.length; i++) if (isPaper(pic.px[i], paper)) return true;
    return false;
  };
  for (let k = 1; k <= BANDS; k++) addBand('sky', k);
  const bandOf = (wy: number) => Math.min(BANDS, Math.max(0, GROUND - 5 - wy));

  const pristine = map.map.blocks.slice();
  const done = map.done.bind(map);
  const grass = book.n('grass');
  const dirt = book.n('dirt');
  map.done = () => {
    map.map.blocks.set(pristine);
    const m = done();
    const cells = m.blocks.slice();
    const lookup = new Map<string, number>();
    for (let wy = 0; wy < 100; wy++)
      for (let wx = 0; wx < 100; wx++) {
        const at = wy * 100 + wx;
        const n = cells[at];
        const h = (wx * 7 + wy * 13 + (wx >> 2) * 5) >>> 0;
        let to = '';
        const base0 = nameOf(n);
        if (base0 === 'brick' || base0 === 'siding') {
          const right = cells[at + 1] !== n;
          const eave = nameOf(cells[at - 100]) === 'roof';
          if (right || eave) to = shade(base0, (right ? 'r' : '') + (eave ? 'e' : ''));
        } else if (n === grass) to = ground[h % ground.length];
        else if (n === dirt) to = wy === GROUND + 1 ? top[h % top.length] : soil[h % soil.length];
        else if (wy <= bandRow(1)) {
          const k = bandOf(wy);
          const base = nameOf(n);
          if (k && base && hasPaper(base) && !base.includes('~') && !base.startsWith('bill.') && !base.startsWith('post')) to = addBand(base, k);
        }
        if (to) {
          if (!lookup.has(to)) lookup.set(to, book.n(to));
          m.blocks[at] = lookup.get(to)!;
        }
      }
    return m;
  };
}
