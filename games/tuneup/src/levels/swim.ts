// The dream's end, a scene played on the map (nobody steers it): Sir Reginald Cluckington III
// swims the clogged oil pipe, left to right. The pipe is glass, so the oil sloshes and bubbles
// rise inside it (rings of blocks), and the dream's clouds frame the screen over a warm glow, with stars
// twinkling in the haze, straps holding the pipe up and a Zzz or two. The hero is nobody
// (heroes.ts: a clear block, no keys), held where nothing pulls; when the swim is over, the
// blocks holding him start to pull, he drops into the link, and Doc Leo's card wakes the bird up.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { AIR, GRAV, kit, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { MON } from '../ids';
import { MapBuilder, at, type Level } from './maps';

/** The pipe's rows (glass top, oil, glass bottom) and the swim's length in ticks before the drop. */
export const SWIM = { top: 3, oil: [4, 5, 6] as number[], bottom: 7, hold: 190, w: 16 } as const;
/** Where nobody waits (the screen's middle, so the view frames the scene) and drops out. */
const HELD = 8;

export function swimBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'engine');
  const { book, c, P, R } = k;
  /** The dream's glow behind the haze, a gradient down a block from shade `a` to `b` of the lamp. */
  const glow = (a: number, b: number) => gradient(P(), 0, 0, 20, 20, R('lamp'), a, b);
  const still = { grav: GRAV.none } as const;
  // the dream's clouds: soft scallops along the top and bottom of the screen
  const cloud = (top: boolean) => {
    const p = top ? glow(2, 1) : glow(1, 2);
    for (let x = 0; x < 20; x += 10) p.disc(x + 5, top ? 3 : 17, 7, c('lamp', 4)).disc(x + 5, top ? 3 : 17, 5, c('paint', 3));
    return p;
  };
  book.add('cloud.top', cloud(true), still);
  book.add('cloud.bottom', cloud(false), still);
  book.add('dark', k.pic('bay'), still);
  // the dream's haze between the clouds and the pipe: a second, thinner row of scallops, and
  // stars that twinkle in turn (three frames, each cell started at its own)
  const haze = (top: boolean, star: number) => {
    const p = top ? glow(1, 0) : glow(0, 1);
    for (let x = 0; x < 20; x += 10)
      p.disc(x + 5, top ? 1 : 19, 8, c('lamp', 1))
        .disc(x + 5, top ? 0 : 20, 6, c('lamp', 2))
        .disc(x + 5, top ? -1 : 21, 4, c('lamp', 3));
    const sy = top ? 15 : 5;
    if (star >= 0) {
      const col = [c('paint', 3), c('lamp', 4), c('lamp', 2)][star];
      p.set(12, sy, col)
        .set(11, sy, col)
        .set(13, sy, col)
        .set(12, sy - 1, col)
        .set(12, sy + 1, col);
      if (star === 0)
        p.set(10, sy, c('lamp', 3))
          .set(14, sy, c('lamp', 3))
          .set(12, sy - 2, c('lamp', 3))
          .set(12, sy + 2, c('lamp', 3));
    }
    return p;
  };
  for (const top of [true, false]) {
    const n = top ? 'haze.top' : 'haze.bottom';
    book.add(n, haze(top, -1), still);
    for (let f = 0; f < 3; f++) book.add(`${n}${f}`, haze(top, f), { ...still, ntime: 9, next: `${n}${(f + 1) % 3}` });
  }
  // a strap the pipe hangs from, and a Zzz drifting up from the sleeping bird's dream
  const strap = glow(0, 0);
  strap.rect(8, 0, 4, 20, c('mach', 2)).rect(8, 0, 1, 20, c('mach', 4)).rect(6, 0, 8, 3, c('mach', 3));
  book.add('strap', strap, still);
  book.add('glow', glow(0, 0), still);
  for (let f = 0; f < 4; f++) {
    const p = glow(0, 0);
    const y = 11 - f * 3;
    const x = 4 + f * 2;
    p.rect(x, y, 8, 2, c('paint', 3)).rect(x, y + 6, 8, 2, c('paint', 3));
    for (let i = 0; i < 4; i++) p.rect(x + 6 - i * 2, y + 2 + i, 2, 1, c('paint', 3));
    book.add(`z${f}`, p, { ...still, ntime: 8, next: `z${(f + 1) % 4}` });
  }
  // the glass pipe's walls
  const glass = (top: boolean) => {
    const p = glow(0, 0);
    p.rect(0, top ? 14 : 0, 20, 6, c('pipe', 1)).rect(0, top ? 14 : 0, 20, 1, c('pipe', 4));
    p.rect(0, top ? 19 : 5, 20, 1, c('mach', 6));
    return p;
  };
  book.add('glass.top', glass(true), { solid: SOLID });
  const strapped = glass(true);
  strapped.rect(8, 0, 4, 14, c('mach', 2)).rect(8, 0, 1, 14, c('mach', 4)).rect(6, 12, 8, 2, c('mach', 3));
  book.add('glass.strap', strapped, { solid: SOLID });
  book.add('glass.bottom', glass(false), { solid: SOLID });
  // the oil: amber, sloshing (three frames), and bubbles rising through it (four)
  const oil = (f: number, bubble = -1) => {
    const p = P(c('pipe', 2));
    for (let x = 0; x < 20; x++) p.set(x, 2 + Math.round(Math.sin((x + f * 7) / 3)), c('pipe', 3));
    p.rect(0, 12, 20, 1, c('pipe', 1));
    if (bubble >= 0) p.ring(6 + (bubble % 2) * 6, 16 - bubble * 4, 1.6, c('paint', 3)).set(12, 18 - bubble * 4, c('paint', 3));
    return p;
  };
  for (let f = 0; f < 3; f++) book.add(`oil${f}`, oil(f), { ...still, ntime: 6, next: `oil${(f + 1) % 3}` });
  for (let f = 0; f < 4; f++) book.add(`bubble${f}`, oil(f % 3, f), { ...still, ntime: 4, next: `bubble${(f + 1) % 4}` });
  // where nobody waits: still, then pulling down when the swim is done
  const held = (name: string, pic: Pixels, solid = false) => {
    book.add(name, pic, { ...still, ntime: SWIM.hold, next: `${name}.drop` });
    book.add(`${name}.drop`, pic, solid ? { grav: GRAV.down } : AIR);
  };
  held('held.oil', oil(0));
  held('held.glass', glass(false));
  held('held.dark', haze(false, -1));
  return k;
}

export function swim(book: Kit['book']): Level {
  const { w } = SWIM;
  const m = new MapBuilder(book, { '.': 'dark', '^': 'cloud.top', v: 'cloud.bottom', '=': 'glass.top', _: 'glass.bottom' }, 'casting');
  m.fill(0, 0, w, 10, '.').fill(0, 0, w, 1, '^').fill(0, 9, w, 1, 'v');
  m.fill(0, SWIM.top, w, 1, '=').fill(0, SWIM.bottom, w, 1, '_');
  // the haze between: stars here and there, straps holding up the pipe, a Zzz or two
  for (let x = 0; x < w; x++) {
    m.set(x, 1, (x * 3) % 5 === 1 ? `haze.top${x % 3}` : 'haze.top');
    m.set(x, 8, (x * 7) % 5 === 2 ? `haze.bottom${(x + 1) % 3}` : 'haze.bottom');
  }
  for (const x of [2, 7, 13]) m.set(x, SWIM.top, 'glass.strap');
  m.fill(0, 2, w, 1, 'glow');
  for (const x of [2, 7, 13]) m.set(x, 2, 'strap');
  m.set(4, 2, 'z0').set(10, 2, 'z2');
  SWIM.oil.forEach((y, i) => {
    for (let x = 0; x < w; x++) m.set(x, y, (x * 5 + i * 3) % 7 === 0 ? `bubble${(x + i) % 4}` : `oil${(x + i) % 3}`);
  });
  // nobody, in the screen's middle; the column under him opens when the swim is done
  m.set(HELD, 5, 'held.oil').set(HELD, 6, 'held.oil').set(HELD, SWIM.bottom, 'held.glass');
  m.set(HELD, 8, 'held.dark');
  m.link(HELD, 8).link(HELD, 9);
  m.mon(MON.swim, 0, 5);
  return { m, start: at(HELD, 5), size: [w, 10] };
}
