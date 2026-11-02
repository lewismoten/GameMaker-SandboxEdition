// The garage at dawn behind the title, the menu, the cards, the pages and the cartoons: the shop
// light, a pegboard over the workbench (the wrenches' painted shapes empty: Gwinn buried them),
// shelves of paint cans and boxes, the rolling tool chest, the sunrise window with Gwinn's bed and
// toys under it, THE CHEZ's charger on the right wall (it's electric: no gas cans), and a
// concrete slab with its seams. Everything is placed from the floor line, so any floor works.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '../../../snowbound/src/art/draw';
import { SP } from './art';

const c = SP.c;

/** The pegboard over the bench: a hammer, a saw, and the painted shapes of three missing wrenches. */
function pegboard(p: Pixels, F: number): void {
  const x0 = 10;
  const y0 = F - 104;
  p.rect(x0, y0, 92, 60, c('wood', 3)).frame(x0, y0, 92, 60, c('wood', 1));
  for (let y = y0 + 4; y < y0 + 58; y += 5) for (let x = x0 + 4; x < x0 + 90; x += 5) p.set(x, y, c('wood', 1));
  // the hammer
  p.rect(20, y0 + 10, 3, 24, c('wood', 1)).rect(21, y0 + 10, 1, 24, c('wood', 4));
  p.rect(15, y0 + 6, 13, 5, c('metal', 1)).rect(15, y0 + 6, 13, 1, c('metal', 4));
  // the saw: a tapering blade, its teeth along the bottom, a wooden grip
  for (let i = 0; i < 14; i++) p.rect(36, y0 + 8 + i, 24 - i, 1, c('metal', i ? 3 : 4));
  for (let x = 37; x < 59; x += 2) p.set(x, y0 + 22 - Math.round((x - 36) * 0.5) + 1, c('metal', 1));
  p.rect(30, y0 + 6, 7, 12, c('wood', 2)).rect(32, y0 + 9, 3, 5, c('wood', 3));
  // where the wrenches hang: their outlines painted on, the pegs bare
  [
    [70, 28],
    [80, 24],
    [90, 20],
  ].forEach(([x, len]) => {
    const top = y0 + 10;
    // a shadow board: each wrench's shape painted dark, with nothing hanging on it
    p.disc(x, top, 3, c('wood', 1))
      .rect(x - 1, top + 2, 3, len - 4, c('wood', 1))
      .disc(x, top + len - 1, 3, c('wood', 1));
    p.disc(x, top - 1, 1, c('wood', 3)).disc(x, top + len, 1, c('wood', 3));
    p.set(x, top - 6, c('metal', 2)).set(x, top - 5, c('metal', 2));
  });
}

/** The workbench under the pegboard: a thick top, a vise, a lower shelf with a box on it. */
function bench(p: Pixels, F: number): void {
  p.rect(6, F - 36, 100, 6, c('wood', 3))
    .rect(6, F - 36, 100, 1, c('wood', 4))
    .rect(6, F - 31, 100, 1, c('wood', 1));
  p.rect(10, F - 30, 4, 32, c('wood', 1)).rect(98, F - 30, 4, 32, c('wood', 1));
  p.rect(10, F - 10, 92, 3, c('wood', 2)).rect(10, F - 7, 92, 1, c('wood', 0));
  // the vise, bolted at the end
  p.rect(84, F - 44, 14, 8, c('mach', 3))
    .rect(84, F - 44, 14, 1, c('mach', 5))
    .rect(80, F - 42, 4, 4, c('mach', 2));
  p.rect(98, F - 41, 6, 1, c('metal', 4));
  // a coffee can of screws and a box on the shelf below
  p.rect(20, F - 44, 8, 8, c('metal', 3))
    .rect(20, F - 44, 8, 1, c('metal', 4))
    .rect(21, F - 41, 6, 2, c('red', 2));
  p.rect(24, F - 22, 26, 12, c('hay', 1))
    .rect(24, F - 22, 26, 1, c('hay', 3))
    .rect(36, F - 22, 2, 12, c('hay', 2));
  p.rect(60, F - 18, 18, 8, c('hay', 2)).rect(60, F - 18, 18, 1, c('hay', 3));
}

/** A paint can `w` wide on a shelf at y (its bottom), its label in `label`. */
function can(p: Pixels, x: number, y: number, w: number, label: number): void {
  const h = w + 2;
  p.rect(x, y - h, w, h, c('metal', 3))
    .rect(x, y - h, w, 1, c('metal', 4))
    .rect(x + w - 2, y - h, 2, h, c('metal', 1));
  p.rect(x, y - h + 3, w, h - 6, label).rect(x + 2, y - h + 5, w - 5, 2, c('paint', 3));
  p.set(x + 1, y - h + 1, label); // a drip down from the lid
}

/** Metal shelves: paint cans on the top, boxes and a can below. */
function shelves(p: Pixels, F: number): void {
  for (const y of [F - 104, F - 72]) {
    p.rect(112, y, 78, 3, c('metal', 3))
      .rect(112, y, 78, 1, c('metal', 4))
      .rect(112, y + 3, 78, 1, c('metal', 0));
    p.line(116, y + 4, 122, y + 10, c('metal', 1)).line(186, y + 4, 180, y + 10, c('metal', 1));
  }
  can(p, 116, F - 104, 12, c('red', 2));
  can(p, 131, F - 104, 12, c('blue', 2));
  can(p, 146, F - 104, 10, c('yellow', 2));
  can(p, 160, F - 104, 12, c('paint', 1));
  p.rect(174, F - 116, 14, 12, c('hay', 1)).rect(174, F - 116, 14, 1, c('hay', 3));
  p.rect(116, F - 88, 30, 16, c('hay', 1))
    .rect(116, F - 88, 30, 1, c('hay', 3))
    .rect(130, F - 88, 2, 16, c('hay', 2));
  p.rect(148, F - 84, 22, 12, c('hay', 2)).rect(148, F - 84, 22, 1, c('hay', 3));
  can(p, 174, F - 72, 12, c('green', 1));
}

/** The rolling tool chest: blue drawers, chrome pulls, casters. */
function chest(p: Pixels, F: number): void {
  p.rect(120, F - 42, 54, 38, c('mach', 3))
    .frame(120, F - 42, 54, 38, c('mach', 0))
    .rect(121, F - 41, 52, 1, c('mach', 5));
  for (let y = F - 37; y < F - 8; y += 7) p.rect(123, y, 48, 5, c('mach', 2)).rect(139, y + 2, 16, 1, c('metal', 4));
  for (const x of [124, 166]) p.disc(x + 2, F - 2, 2, c('ink', 0));
}

/** Gwinn's bed under the window, a rope toy, a squeaky bone and a ball beside it. */
function dogBed(p: Pixels, F: number): void {
  p.rect(210, F - 12, 48, 16, c('blue', 1))
    .disc(210, F - 4, 7, c('blue', 1))
    .disc(258, F - 4, 7, c('blue', 1));
  p.rect(206, F - 12, 56, 2, c('blue', 2))
    .rect(214, F - 7, 40, 7, c('blue', 3))
    .rect(214, F - 7, 40, 1, c('cloud', 0));
  // a rope toy in the bed, a bone and a ball on the floor
  p.line(222, F - 4, 236, F - 6, c('red', 2)).line(222, F - 3, 236, F - 5, c('cloud', 2));
  p.rect(268, F + 1, 8, 2, c('cloud', 2))
    .disc(268, F + 1, 1.5, c('cloud', 2))
    .disc(268, F + 3, 1.5, c('cloud', 2));
  p.disc(276, F + 1, 1.5, c('cloud', 2)).disc(276, F + 3, 1.5, c('cloud', 2));
  p.disc(286, F, 3, c('green', 1)).set(285, F - 1, c('green', 2));
}

/** THE CHEZ's charger on the right wall: its box and light, the conduit up, the cord coiled on a hook. */
function charger(p: Pixels, F: number): void {
  p.rect(305, 0, 2, F - 84, c('metal', 2));
  p.rect(298, F - 84, 16, 24, c('paint', 2))
    .frame(298, F - 84, 16, 24, c('metal', 0))
    .rect(299, F - 83, 14, 1, c('paint', 3));
  p.rect(302, F - 80, 8, 4, c('green', 0)).set(303, F - 79, c('green', 2));
  p.line(306, F - 74, 304, F - 70, c('yellow', 3))
    .line(304, F - 70, 308, F - 70, c('yellow', 3))
    .line(308, F - 70, 306, F - 66, c('yellow', 3));
  p.rect(305, F - 60, 2, 8, c('ink', 1)).rect(304, F - 52, 4, 2, c('metal', 3));
  for (let r = 5; r <= 7; r++) p.ring(306, F - 42, r, c('ink', r === 6 ? 1 : 0));
  p.rect(303, F - 34, 6, 5, c('ink', 1)).rect(304, F - 34, 4, 1, c('metal', 3));
}

/** The shop light: a fixture on two chains, its tube lit. */
function light(p: Pixels): void {
  p.line(140, 0, 140, 4, c('metal', 1)).line(180, 0, 180, 4, c('metal', 1));
  p.rect(132, 5, 56, 4, c('metal', 3)).rect(132, 5, 56, 1, c('metal', 4)).rect(134, 9, 52, 2, c('lamp', 4));
}

/** The slab: speckled concrete with its saw-cut seams running back to the wall. */
function slab(p: Pixels, F: number): void {
  gradient(p, 0, F, 320, 200 - F, SP.r('floor'), 1, 3);
  let s = 11;
  for (let i = 0; i < (200 - F) * 5; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    p.set((s >> 8) % 320, F + 2 + ((s >> 17) % (200 - F - 2)), c('floor', (s >> 4) % 2 ? 1 : 4));
  }
  const vy = F - 70; // where the seams would meet
  for (const x of [40, 160, 280]) p.line(x, F + 2, 160 + ((x - 160) * (200 - vy)) / (F - vy), 200, c('floor', 1));
  p.line(0, Math.round(F + (200 - F) * 0.5), 319, Math.round(F + (200 - F) * 0.5), c('floor', 1));
  p.rect(0, F, 320, 2, c('floor', 4));
}

/** The garage at dawn with the floor from `floor`. */
export function garage(floor = 160): Pixels {
  const p = new Pixels(320, 200, c('wall', 3));
  gradient(p, 0, 0, 320, floor, SP.r('wall'), 2, 4);
  for (let y = 8; y < floor - 4; y += 10) for (let x = 6; x < 320; x += 10) p.set(x, y, c('wall', 1));
  // the window: sunrise through it
  p.rect(200, 20, 96, 64, c('mach', 1));
  gradient(p, 204, 24, 88, 56, SP.r('lamp'), 1, 4);
  p.rect(246, 24, 4, 56, c('mach', 1)).rect(204, 50, 88, 4, c('mach', 1));
  light(p);
  pegboard(p, floor);
  shelves(p, floor);
  charger(p, floor);
  slab(p, floor);
  bench(p, floor);
  chest(p, floor);
  dogBed(p, floor);
  return p;
}
