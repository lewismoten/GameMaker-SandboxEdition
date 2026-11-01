// The dream's end, a scene played on the map (nobody steers it): Sir Reginald Cluckington III
// swims the clogged oil pipe, left to right. The pipe is glass, so the oil sloshes and bubbles
// rise inside it (rings of blocks), and the dream's clouds frame the screen. The hero is nobody
// (heroes.ts: a clear block, no keys), held where nothing pulls; when the swim is over, the
// blocks holding him start to pull, he drops into the link, and Doc Leo's card wakes the bird up.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
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
  const { book, c, P } = k;
  const still = { grav: GRAV.none } as const;
  // the dream's clouds: soft scallops along the top and bottom of the screen
  const cloud = (top: boolean) => {
    const p = k.pic('bay');
    for (let x = 0; x < 20; x += 10) p.disc(x + 5, top ? 3 : 17, 7, c('lamp', 4)).disc(x + 5, top ? 3 : 17, 5, c('paint', 3));
    return p;
  };
  book.add('cloud.top', cloud(true), still);
  book.add('cloud.bottom', cloud(false), still);
  book.add('dark', k.pic('bay'), still);
  // the glass pipe's walls
  const glass = (top: boolean) => {
    const p = k.pic('bay');
    p.rect(0, top ? 14 : 0, 20, 6, c('pipe', 1)).rect(0, top ? 14 : 0, 20, 1, c('pipe', 4));
    p.rect(0, top ? 19 : 5, 20, 1, c('mach', 6));
    return p;
  };
  book.add('glass.top', glass(true), { solid: SOLID });
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
  held('held.dark', k.pic('bay'));
  return k;
}

export function swim(book: Kit['book']): Level {
  const { w } = SWIM;
  const m = new MapBuilder(book, { '.': 'dark', '^': 'cloud.top', v: 'cloud.bottom', '=': 'glass.top', _: 'glass.bottom' }, 'casting');
  m.fill(0, 0, w, 10, '.').fill(0, 0, w, 1, '^').fill(0, 9, w, 1, 'v');
  m.fill(0, SWIM.top, w, 1, '=').fill(0, SWIM.bottom, w, 1, '_');
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
