// The Beltway's cab, painted whole (320x200, the one screen) and cut into blocks by beltway.ts,
// seen from the back wall and roof on the passenger side. Fixed scenery: the beige headliner and
// the rear-view mirror, the windshield between the A-pillars (sky, the road bending right, its grass
// shoulders and the one wiper's arm parked at the base), the dash: the lane strip and its control
// row, the speedometer, the charge gauge, the trip meter, the AM radio and the 8-track. The sides,
// wood dash and bench are cabInterior.ts; Doc Leo, the wheel and Teddy are cabPeople.ts. What moves
// (the skyline and the trees, the instruments' needles and lamps) is drawn here too, a frame at a time.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { micro } from '../../../snowbound/src/art/font';
import type { Kit } from '../blocks/common';
import { SHIELD, STRIP } from '../levels/beltwayPlan';
import { bench, dashFace, sides } from './cabInterior';
import { driver, teddy, teddyPant, wheel } from './cabPeople';

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
  // THE CHEZ's red body divider across the top of the glass (a tomato-red header with a rubber seal under it), so the windshield
  // ends at the body rather than running into the roof
  p.rect(x0, 20, x1 - x0, 8, c('red', 2))
    .rect(x0, 20, x1 - x0, 2, c('red', 3))
    .rect(x0, 26, x1 - x0, 2, c('red', 1));
  p.rect(x0, 28, x1 - x0, 1, c('ink', 0));
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
  p.rect(50, 95, 90, 2, c('ink', 0)).rect(50, 97, 90, 1, c('ink', 1)).rect(46, 94, 6, 5, c('metal', 1));
}

/** The far skyline, a 20-pixel strip that repeats (row 2): the hills' haze, a few buildings and a water tower, drifting left. */
export function skylineTile(k: Kit): Pixels {
  const { c, R } = k;
  const p = gradient(new Pixels(20, 20), 0, 0, 20, 20, R('sky'), 4, 6);
  for (let x = 0; x < 20; x++) {
    const hill = 13 + Math.round(2 * Math.sin((x / 20) * Math.PI * 2));
    p.rect(x, hill, 1, 20 - hill, c('pipe', 2));
  }
  // the town: blocks of buildings (one taller), and the water tower on its legs, so the strip has a front and a back
  for (const [x, w, h] of [
    [1, 4, 9],
    [6, 3, 6],
    [15, 4, 7],
  ])
    p.rect(x, 20 - h, w, h, c('pipe', 1)).rect(x + 1, 20 - h + 2, 1, 1, c('pipe', 3));
  p.rect(10, 5, 4, 3, c('pipe', 1)).rect(9, 8, 6, 1, c('pipe', 0)).rect(10, 9, 1, 11, c('pipe', 1)).rect(13, 9, 1, 11, c('pipe', 1));
  return p.rect(0, 19, 20, 1, c('grass', 1));
}

/** The roadside trees, a block that repeats (row 3's shoulders), going by fast. */
export function treeTile(k: Kit): Pixels {
  const { c } = k;
  const p = new Pixels(20, 20, c('grass', 2));
  p.rect(0, 0, 20, 6, c('leaf', 1));
  p.disc(5, 5, 6, c('leaf', 2)).disc(15, 3, 5, c('leaf', 1)).disc(5, 4, 3, c('leaf', 3));
  return p.rect(4, 10, 2, 5, c('wood', 1)).rect(14, 8, 2, 6, c('wood', 1));
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

/**
 * The car's rumble lifts Doc Leo's head and Teddy's: `lift` pixels up on the up beat, everything of the figure above the row
 * `cut` (the rest stays on the seat, the lift's seam hidden in the torso). Only the cells a lift changes become rings.
 */
const BOUNCE = { leo: { lift: 1, cut: 60 }, teddy: { lift: 2, cut: 80 } } as const;

/** The whole driver's seat, with the roadside at `doorPhase` and the car's rumble: `up` lifts the two heads, `pant` puts Teddy's tongue out. */
export function paintCab(k: Kit, doorPhase = 0, up = false, pant = false): Pixels {
  const { c, R } = k;
  const p = new Pixels(320, 200, c('wall', 2));
  // the headliner, the mirror's stem and its glass over three cells (a pale reflection of the road behind)
  gradient(p, 0, 0, 320, 20, R('floor'), 3, 2);
  p.rect(166, 0, 6, 5, c('mach', 1));
  p.rect(141, 4, 58, 14, c('ink', 0)).rect(143, 5, 54, 12, c('sky', 5)).rect(143, 12, 54, 5, c('asphalt', 2)).rect(168, 13, 2, 1, c('paint', 2));
  shield(k, p);
  // the cab's sides, then the A-pillars slanting in toward the top
  sides(k, p, doorPhase);
  for (let y = 20; y < 100; y++) {
    const s = y < 60 ? 6 : 2;
    p.rect(20 + s, y, 20 - s, 1, c('wall', 1)).rect(240, y, 20 - s, 1, c('wall', 1));
    p.set(40 - 1, y, c('ink', 0)).set(240 - s + 19, y, c('ink', 0));
  }
  // the dash: its pad, the wood-grain face and the switches
  dashFace(k, p);
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
  // the wheel and its column, the driver behind it, the bench and Teddy on it (the gauges next, on the dash)
  wheel(k, p);
  // the instruments over it (their own cells: rings), the radio and the 8-track in the middle
  p.blit(gauge(k, 0.5, 'MPH'), GAUGE.speedo[0] * 20, GAUGE.speedo[1] * 20);
  p.blit(gauge(k, 0.78, 'CHG'), GAUGE.charge[0] * 20, GAUGE.charge[1] * 20);
  p.blit(tripPic(k, 5), GAUGE.trip[0] * 20, GAUGE.trip[1] * 20);
  radio(k, p, 140, 140);
  p.blit(playPic(k, true), GAUGE.play[0] * 20, GAUGE.play[1] * 20);
  bench(k, p);
  // the people, each drawn whole on its own layer: the part below `cut` stays put, the part above it lifts (and covers the seam)
  for (const [draw, { lift, cut }] of [
    [(l: Pixels) => (teddy(k, l), pant && teddyPant(k, l)), BOUNCE.teddy],
    [(l: Pixels) => driver(k, l), BOUNCE.leo],
  ] as const) {
    const layer = new Pixels(320, 200, 255);
    draw(layer);
    const dy = up ? lift : 0;
    p.blit(layer.crop(0, cut - dy, 320, 200 - cut + dy), 0, cut - dy, 255);
    p.blit(layer.crop(0, 0, 320, cut), 0, -dy, 255);
  }
  return p;
}

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
