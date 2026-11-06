// Rain is pictures, not particles: timed block rings move blue-white streaks down through a tile.
// PLAYGAME.C 2330-2340 remaps each block number, so copies share a clock; map starts offset the rings.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book, PULL, SOLID } from '../../kit/starter/book';
import { buildStarterPalette, type Pal } from '../../kit/starter/palette';

export interface Timed {
  name: string;
  next: string;
  ticks: number;
}

/** Keep hero, signs and PLAYGAME's purple text intact; cool only the scenery ramps. */
export function rainPalette(): Pal {
  const pal = buildStarterPalette(undefined, 'rain');
  const ramp = (name: string, from: number[], to: number[]) => {
    const n = pal.r(name).length;
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) pal.pal[pal.c(name, i) * 3 + k] = Math.round((from[k] + ((to[k] - from[k]) * i) / (n - 1)) / 4);
  };
  ramp('sky', [28, 42, 66], [112, 140, 160]);
  ramp('grass', [24, 56, 56], [112, 160, 144]);
  ramp('dirt', [32, 40, 52], [100, 116, 128]);
  ramp('blue', [48, 88, 128], [192, 224, 244]);
  return pal;
}

/** A second palette for the SAME map and block pictures, not a new drawing or live palette cycle. */
export function stormPalette(pal: Pal): Uint8Array {
  const out = pal.pal.slice();
  for (const name of ['sky', 'grass', 'dirt', 'stone'])
    for (const at of pal.r(name)) for (let k = 0; k < 3; k++) out[at * 3 + k] = Math.round(out[at * 3 + k] * (k === 2 ? 0.72 : 0.52));
  return out;
}

/** Two thin diagonal streaks travel five pixels each frame, wrapping at the tile edge. */
function streaks(pal: Pal, frame: number): Pixels {
  const p = new Pixels(20, 20, pal.c('sky', 3));
  for (const [sx, sy] of [
    [5, 0],
    [15, 10],
  ])
    for (let d = 0; d < 5; d++) {
      const y = (sy + frame * 5 + d) % 20;
      const x = (sx - frame - Math.floor(d / 2) + 20) % 20;
      p.set(x, y, pal.c('blue', d === 4 ? 4 : 2));
    }
  return p;
}

/** The last air row: the drop reaches the floor, then kicks up two short blue splashes. */
function splash(pal: Pal, frame: number): Pixels {
  const p = new Pixels(20, 20, pal.c('sky', 3));
  if (frame < 2) {
    for (let d = 0; d < 5; d++) p.set(12 - Math.floor(d / 2), 5 + frame * 6 + d, pal.c('blue', d === 4 ? 4 : 2));
  } else {
    const spread = frame === 2 ? 3 : 6;
    for (const dir of [-1, 1]) {
      p.set(10 + dir * spread, frame === 2 ? 16 : 18, pal.c('blue', 4));
      p.set(10 + dir * (spread - 1), frame === 2 ? 17 : 19, pal.c('blue', 2));
    }
    p.rect(8 - (frame - 2) * 2, 19, 5 + (frame - 2) * 4, 1, pal.c('blue', 3));
  }
  return p;
}

/** A shallow three-tile pool inset in the solid path, with expanding elliptical ripple arcs. */
function puddle(pal: Pal, frame: number, part: number, ground: Pixels): Pixels {
  const wide = new Pixels(60, 20);
  for (let i = 0; i < 3; i++) wide.blit(ground, i * 20, 0);
  for (let y = 1; y < 11; y++)
    for (let x = 0; x < 60; x++) {
      const q = ((x - 29.5) / 29) ** 2 + ((y - 5.5) / 5) ** 2;
      if (q < 1) wide.set(x, y, pal.c('blue', y < 4 ? 1 : 0));
      if (q >= 0.78 && q < 1) wide.set(x, y, pal.c('blue', 2));
    }
  const rx = 3 + frame * 5;
  const ry = 1 + frame;
  for (let t = 0; t < 48; t++) {
    const a = (t * Math.PI) / 24;
    const x = Math.round(30 + Math.cos(a) * rx);
    const y = Math.round(6 + Math.sin(a) * ry * 0.65);
    wide.set(x, y, pal.c('blue', frame === 3 ? 2 : 4));
  }
  return wide.crop(part * 20, 0, 20, 20);
}

export function addRain(book: Book, pal: Pal, timed: Timed[], withPuddles: boolean): void {
  const ring = (base: string, draw: (f: number) => Pixels, solid = false) => {
    for (let f = 0; f < 4; f++) {
      book.add(`${base}.${f}`, draw(f), solid ? { solid: SOLID } : { grav: PULL.down });
      timed.push({ name: `${base}.${f}`, next: `${base}.${(f + 1) % 4}`, ticks: 2 });
    }
  };
  ring('rain', (f) => streaks(pal, f));
  ring('splash', (f) => splash(pal, f));
  if (withPuddles) for (let part = 0; part < 3; part++) ring(`pool${part}`, (f) => puddle(pal, f, part, book.pics.get('grass')!), true);
}

export function finishBlocks(l: { book: Book; timed: Timed[] }) {
  const blocks = l.book.finish();
  for (const t of l.timed) {
    const b = blocks[l.book.n(t.name)];
    b.nextBl = l.book.n(t.next);
    b.ntime = t.ticks;
  }
  return blocks;
}
