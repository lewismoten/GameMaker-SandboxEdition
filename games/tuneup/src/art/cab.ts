// The Beltway's driver's seat, painted whole (320x200, the one screen) and cut into blocks by
// beltway.ts. Fixed scenery: the beige headliner and the rear-view mirror, the windshield between
// the A-pillars (sky, the road bending right, its grass shoulders and the one wiper's arm parked
// at the base), the passenger door window with Teddy looking out of it, and the dash: the lane
// strip and its control row, the steering wheel, the speedometer, the charge gauge, the trip
// meter, the AM radio and the 8-track, and the door. What moves (the skyline and
// the trees, the instruments' needles and lamps) is drawn here too, one frame at a time.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { micro } from '../../../snowbound/src/art/font';
import type { Kit } from '../blocks/common';
import { SHIELD, STRIP } from '../levels/beltwayPlan';

/** The lane lamp's lens in its strip cell (the driver's picture lights it). */
export const LENS = { x: 10, y: 9, r: 5 } as const;
/** The speedometer's cell, the trip meter's, the charge gauge's and the 8-track's PLAY lamp. */
export const GAUGE = { speedo: [2, 6], trip: [4, 6], charge: [3, 6], play: [9, 8] } as const;

/** The road's left and right edges (pixels) at screen row y, bending right toward the vanishing point. */
export function roadEdges(y: number): [number, number] {
  // through the tracks' points (beltwayPlan.ts): at y 99 the lanes are 40 pixels apart, at y 79 20
  const t = (100 - y) / (100 - SHIELD.horizon);
  const center = 130 + 60 * t * t * 0.5 + 30 * t;
  const half = 60 * (1 - t);
  return [center - half, center + half];
}

/** Sky down the windshield (cloudless), then the grass and the road (no dashes: those are monsters). */
function shield(k: Kit, p: Pixels): void {
  const { c, R } = k;
  const [x0, x1] = [SHIELD.left * 20, (SHIELD.right + 1) * 20];
  gradient(p, x0, 20, x1 - x0, SHIELD.horizon - 20, R('sky'), 3, 6);
  for (let y = SHIELD.horizon; y < 100; y++) {
    const [l, r] = roadEdges(y);
    const near = (y - SHIELD.horizon) / 40;
    for (let x = x0; x < x1; x++) {
      const on = x >= l && x < r;
      const edge = on && (x < l + 1 + near * 2 || x >= r - 1 - near * 2);
      p.set(x, y, edge ? c('paint', 2) : on ? c('asphalt', near < 0.5 ? 2 : 1) : c('grass', ((x % 20) + (y % 20) * 3) % 7 ? 2 : 3));
    }
  }
  // the one wiper's arm, parked along the base (the driver's side), its blade's rubber under it
  p.rect(50, 95, 92, 2, c('ink', 0)).rect(50, 97, 92, 1, c('ink', 1)).rect(46, 94, 6, 5, c('metal', 1));
}

/** The far skyline, a 40-pixel strip that repeats (row 2): the hills' haze, the town and its water tower. */
export function skylineTile(k: Kit): Pixels {
  const { c, R } = k;
  const p = gradient(new Pixels(40, 20), 0, 0, 40, 20, R('sky'), 4, 6);
  for (let x = 0; x < 40; x++) {
    const hill = 12 + Math.round(3 * Math.sin((x / 40) * Math.PI * 2));
    p.rect(x, hill, 1, 20 - hill, c('pipe', 2));
  }
  // the town: blocks of buildings, and the water tower on its legs
  for (const [x, w, h] of [
    [3, 4, 9],
    [8, 3, 6],
    [12, 5, 11],
    [30, 4, 7],
  ])
    p.rect(x, 20 - h, w, h, c('pipe', 1)).rect(x + 1, 20 - h + 2, 1, 1, c('pipe', 3));
  p.rect(21, 4, 6, 4, c('pipe', 1)).rect(20, 7, 8, 1, c('pipe', 0)).rect(22, 8, 1, 12, c('pipe', 1)).rect(25, 8, 1, 12, c('pipe', 1));
  return p.rect(0, 19, 40, 1, c('grass', 1));
}

/** The roadside trees, a block that repeats (row 3's shoulders), going by fast. */
export function treeTile(k: Kit): Pixels {
  const { c } = k;
  const p = new Pixels(20, 20, c('grass', 2));
  p.rect(0, 0, 20, 6, c('leaf', 1));
  p.disc(5, 5, 6, c('leaf', 2)).disc(15, 3, 5, c('leaf', 1)).disc(5, 4, 3, c('leaf', 3));
  return p.rect(4, 10, 2, 5, c('wood', 1)).rect(14, 8, 2, 6, c('wood', 1));
}

/** Teddy in the passenger seat, his head in profile at (x, y) looking out of the door window. */
function teddy(k: Kit, p: Pixels, x: number, y: number): void {
  const { c } = k;
  // shoulders and chest, then the head, both ears up and alike, the muzzle toward the glass
  p.disc(x + 10, y + 40, 15, c('corgi', 2)).disc(x + 14, y + 42, 8, c('fur', 2));
  p.disc(x + 12, y + 18, 11, c('corgi', 3))
    .disc(x + 24, y + 22, 6, c('corgi', 3))
    .disc(x + 26, y + 24, 4, c('fur', 2));
  for (const ex of [x + 5, x + 12]) for (let i = 0; i < 9; i++) p.rect(ex + (i >> 2), y + 9 - i, 6 - Math.floor((i * 2) / 3), 1, c('corgi', i < 2 ? 3 : 2));
  p.rect(x + 7, y + 4, 2, 3, c('pink', 1)).rect(x + 14, y + 4, 2, 3, c('pink', 1));
  p.disc(x + 20, y + 16, 1.5, c('ink', 0))
    .set(x + 30, y + 22, c('ink', 0))
    .set(x + 31, y + 22, c('ink', 0));
  p.rect(x + 18, y + 12, 3, 9, c('fur', 2));
  p.rect(x + 22, y + 28, 6, 1, c('ink', 0));
  p.rect(x + 3, y + 30, 16, 3, c('red', 2)).set(x + 12, y + 33, c('gold', 2));
}

/** A small round gauge in a cell: face, `marks` ticks over the top half, a needle at `at` (0 left, 1 right). */
export function gauge(k: Kit, at: number, label: string): Pixels {
  const { c } = k;
  const p = new Pixels(20, 20, c('wall', 1));
  p.disc(10, 11, 9, c('mach', 3)).disc(10, 11, 8, c('shade', 0));
  for (let i = 0; i <= 5; i++) {
    const a = Math.PI * (1 - i / 5);
    p.set(Math.round(10 + Math.cos(a) * 7), Math.round(11 - Math.sin(a) * 7), c('lamp', 4));
  }
  const a = Math.PI * (1 - at);
  for (let r = 0; r < 7; r++) p.set(Math.round(10 + Math.cos(a) * r), Math.round(11 - Math.sin(a) * r), c('accent', 3));
  p.disc(10, 11, 1.2, c('mach', 5));
  micro(p, 10 - label.length * 2, 14, label, c('lamp', 3));
  return p;
}

/** The trip meter: miles to the exit, a lit digit in its window. */
export function tripPic(k: Kit, miles: number): Pixels {
  const { c } = k;
  const p = new Pixels(20, 20, c('wall', 1));
  p.rect(2, 4, 16, 12, c('mach', 3)).rect(3, 5, 14, 10, c('shade', 0));
  micro(p, 4, 7, String(miles), c('lamp', 4));
  micro(p, 10, 7, 'MI', c('lamp', 2));
  return p;
}

/** The 8-track's PLAY lamp (lit or not) beside the program lamps (program 1 on). */
export function playPic(k: Kit, on: boolean): Pixels {
  const { c } = k;
  const p = new Pixels(20, 20, c('mach', 2));
  p.frame(0, 0, 20, 20, c('mach', 0));
  micro(p, 2, 3, 'PLAY', c('ink', 0));
  p.disc(10, 13, 3, on ? c('glow', 3) : c('red', 0));
  return p;
}

/** The whole driver's seat, still: every block not on a ring is cut from it. */
export function paintCab(k: Kit): Pixels {
  const { c, R } = k;
  const p = new Pixels(320, 200, c('wall', 2));
  // the headliner, the mirror's stem and its glass over three cells (a pale reflection of the road behind)
  gradient(p, 0, 0, 320, 20, R('floor'), 3, 2);
  p.rect(166, 0, 6, 5, c('mach', 1));
  p.rect(141, 4, 58, 14, c('ink', 0)).rect(143, 5, 54, 12, c('sky', 5)).rect(143, 12, 54, 5, c('asphalt', 2)).rect(168, 13, 2, 1, c('paint', 2));
  shield(k, p);
  // the A-pillars, slanting in toward the top
  for (let y = 20; y < 100; y++) {
    const s = y < 60 ? 6 : 2;
    p.rect(20 + s, y, 20 - s, 1, c('wall', 1)).rect(240, y, 20 - s, 1, c('wall', 1));
    p.set(40 - 1, y, c('ink', 0)).set(240 - s + 19, y, c('ink', 0));
  }
  p.rect(0, 20, 20, 100, c('floor', 1));
  // the passenger door window (its own glass, the roadside going by) and Teddy at it
  gradient(p, 260, 22, 58, 52, R('sky'), 4, 6);
  p.rect(260, 74, 58, 30, c('grass', 2)).rect(260, 70, 58, 6, c('leaf', 1));
  p.rect(259, 21, 61, 1, c('wall', 0)).rect(259, 21, 1, 84, c('wall', 0));
  teddy(k, p, TEDDY_AT[0], TEDDY_AT[1]);
  // the dash: its top edge under the glass, then its face
  p.rect(0, 100, 320, 100, c('wall', 2)).rect(0, 100, 260, 3, c('wall', 4)).rect(0, 103, 260, 1, c('wall', 0));
  // the lane strip: a slot from the cap to the exit lamp, a dark lens over each lane
  const sx = STRIP.capL * 20;
  p.rect(sx, 105, (STRIP.exit + 1) * 20 - sx, 14, c('shade', 1)).frame(sx, 105, (STRIP.exit + 1) * 20 - sx, 14, c('mach', 2));
  for (const lx of STRIP.lanes) p.disc(lx * 20 + LENS.x, 100 + LENS.y, LENS.r, c('lamp', 0)).disc(lx * 20 + LENS.x, 100 + LENS.y, LENS.r - 2, c('shade', 0));
  // the cap, the gate and the exit run's chevrons, and the EXIT lamp (all dark till the end)
  p.rect(sx + 2, 107, 16, 10, c('mach', 3));
  p.rect(STRIP.gate * 20 + 2, 107, 16, 10, c('mach', 3)).rect(STRIP.gate * 20 + 9, 108, 2, 8, c('mach', 1));
  chevrons(k, p, STRIP.run * 20, 100, false);
  exitLamp(k, p, STRIP.exit * 20, 100, false);
  // the control row under the lanes: a lane icon each, its own lane bright
  for (const lx of STRIP.lanes) laneIcon(k, p, lx * 20, 120, lx - 8, false);
  // the steering wheel, low on the left, its hub and three spokes
  for (let y = 120; y < 200; y++)
    for (let x = 0; x < 120; x++) {
      const d = Math.hypot(x - 50, y - 196);
      if (d >= 34 && d < 41) p.set(x, y, c('wall', d < 36 || d > 39 ? 0 : 3));
    }
  p.rect(16, 192, 68, 6, c('wall', 1)).rect(47, 160, 6, 36, c('wall', 1)).disc(50, 196, 9, c('wall', 3)).disc(50, 196, 5, c('mach', 3));
  // the instruments over it (their own cells: rings), the radio and the 8-track in the middle
  p.blit(gauge(k, 0.5, 'MPH'), GAUGE.speedo[0] * 20, GAUGE.speedo[1] * 20);
  p.blit(gauge(k, 0.78, 'CHG'), GAUGE.charge[0] * 20, GAUGE.charge[1] * 20);
  p.blit(tripPic(k, 5), GAUGE.trip[0] * 20, GAUGE.trip[1] * 20);
  radio(k, p, 140, 140);
  p.blit(playPic(k, true), GAUGE.play[0] * 20, GAUGE.play[1] * 20);
  // the door's panel under Teddy
  p.rect(260, 100, 60, 100, c('wall', 1));
  return p;
}

/** Teddy's ring's second frame: a pant, his tongue out where his mouth's line was. */
export function teddyPant(k: Kit, p: Pixels): void {
  const [x, y] = TEDDY_AT;
  p.rect(x + 22, y + 28, 6, 1, k.c('corgi', 3));
  p.rect(x + 24, y + 28, 3, 4, k.c('tongue', 1)).rect(x + 25, y + 31, 2, 1, k.c('tongue', 0));
}
/** Where Teddy's head is drawn in the door window. */
const TEDDY_AT = [266, 60] as const;

/** The exit run's chevrons in a cell at (x, y): dark, or lit amber pointing to the exit. */
export function chevrons(k: Kit, p: Pixels, x: number, y: number, lit: boolean): void {
  const { c } = k;
  for (const dx of [3, 9])
    for (let i = 0; i < 4; i++)
      p.rect(x + dx + i, y + 6 + i, 2, 1, c(lit ? 'glow' : 'mach', lit ? 3 : 1)).rect(x + dx + i, y + 13 - i, 2, 1, c(lit ? 'glow' : 'mach', lit ? 3 : 1));
}

/** The EXIT lamp at (x, y): dark, or lit green and open. */
export function exitLamp(k: Kit, p: Pixels, x: number, y: number, lit: boolean): void {
  const { c } = k;
  p.rect(x + 1, y + 5, 18, 10, lit ? c('green', 2) : c('shade', 0)).frame(x + 1, y + 5, 18, 10, c('mach', 2));
  micro(p, x + 3, y + 7, 'EXIT', lit ? c('paint', 3) : c('wall', 3));
}

/** A lane's control icon at (x, y): three lanes, lane `lane` brighter; `honk` shows a red horn instead. */
export function laneIcon(k: Kit, p: Pixels, x: number, y: number, lane: number, honk: boolean): void {
  const { c } = k;
  p.rect(x + 1, y + 2, 18, 15, c('wall', 1)).frame(x + 1, y + 2, 18, 15, c('wall', 0));
  if (honk) {
    p.rect(x + 5, y + 7, 3, 5, c('red', 3))
      .rect(x + 8, y + 5, 2, 9, c('red', 3))
      .rect(x + 10, y + 4, 2, 11, c('red', 2));
    p.set(x + 14, y + 6, c('paint', 3))
      .set(x + 15, y + 9, c('paint', 3))
      .set(x + 14, y + 12, c('paint', 3));
    return;
  }
  for (const l of [-1, 0, 1]) p.rect(x + 9 + l * 5, y + 5, 2, 9, c('lamp', l === lane ? 4 : 1));
}

/** The AM radio at (x, y), three cells wide: two knobs and the dial between them, its needle on a station. */
function radio(k: Kit, p: Pixels, x: number, y: number): void {
  const { c } = k;
  p.rect(x, y, 60, 20, c('mach', 3)).frame(x, y, 60, 20, c('mach', 0));
  p.disc(x + 7, y + 10, 5, c('mach', 1)).disc(x + 53, y + 10, 5, c('mach', 1));
  p.rect(x + 14, y + 4, 32, 12, c('lamp', 1)).frame(x + 14, y + 4, 32, 12, c('mach', 0));
  for (let i = 0; i < 7; i++) p.rect(x + 16 + i * 5, y + 13, 1, 2, c('ink', 0));
  micro(p, x + 17, y + 6, 'AM', c('ink', 0));
  p.rect(x + 34, y + 5, 1, 10, c('accent', 3));
  // the 8-track under it: its slot with a tape in, and the label
  p.rect(x, y + 20, 40, 20, c('mach', 2)).frame(x, y + 20, 40, 20, c('mach', 0));
  p.rect(x + 4, y + 26, 32, 8, c('shade', 0))
    .rect(x + 8, y + 24, 24, 6, c('ink', 1))
    .rect(x + 12, y + 25, 16, 3, c('red', 2));
}
