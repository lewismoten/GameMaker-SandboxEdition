// The Sandbox Software regulars tucked into the library (games/kit/TIN-HEARTS.md), each block
// added after everything else in its set so no other block's number moves: the tin heart on
// the reading room floor by the west shelves, a painted Easter egg in the Reserve Stacks' far
// corner by the fern (a few points each, no sound, gone when touched; Joe's walk to the books
// never passes them), and Watt from Ohm Sweet Ohm in the Laboratory, seeing to the inventor's
// wiring where a panel of it stood (as solid as it was).
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { wattCameo } from '../../../kit/cameos';
import { PAL, c } from '../art/pal';
import { on } from '../art/kit';
import type { CompiledHub } from './hub';
import type { compileWing } from './wing';
import { LAB } from './wings/lab';

/** Where they are, in a window's own cells (the reading room, the Stacks, book 1 of the Lab). */
export const HIDDEN = { heart: { x: 1, y: 4 }, egg: { x: 1, y: 8 }, watt: { x: 9, y: 1 } };

export function addHidden(hub: CompiledHub, wings: ReturnType<typeof compileWing>[]): void {
  const a = hub.area;
  const floor = a.tiles.pic('floor');
  const tin = { ink: c('ink', 0), tin: [c('tin', 2), c('tin', 3), c('tin', 4)], white: c('paper', 4), dark: c('ink', 1) };
  for (let k = 0; k < SHINE_FRAMES; k++)
    a.tile(`tinHeart${k || ''}`, drawTinHeart(on(floor), tin, k), { score: 100, touch: 'floor', next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`, ntime: k ? 2 : 50 });
  a.set(hub.room.ox + HIDDEN.heart.x, hub.room.oy + HIDDEN.heart.y, 'tinHeart');
  const egg = { ink: c('ink', 0), shell: [c('teal', 1), c('teal', 2), c('teal', 3)], paint: [c('brass', 2), c('brass', 3)], accent: c('pink', 3), white: c('paper', 4) };
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    a.tile(`easterEgg${k || ''}`, drawEasterEgg(on(floor), egg, 'stars', k), { score: 25, touch: 'floor', next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`, ntime: k ? 2 : 70 });
  a.set(hub.stacks.ox + HIDDEN.egg.x, hub.stacks.oy + HIDDEN.egg.y, 'easterEgg');
  // Watt, rolled up to the wiring in Great Minds, Strange Priorities
  const lab = wings.find((w) => w.spec === LAB)!;
  const book = lab.books[0].win;
  const wa = lab.area;
  wa.solid('watt', on(wa.tiles.pic(lab.books[0].spec.floor), wattCameo(PAL.pal, 'down', 0, 'ok')));
  wa.set(book.ox + HIDDEN.watt.x, book.oy + HIDDEN.watt.y, 'watt');
}
