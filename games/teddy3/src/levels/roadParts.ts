// The blocks every road trip shares (THE CHEZ's levels): the road and the upper road of a
// hill, the charger posts, the hills that take a charge, potholes, and the signs.
//
// Charge is counter 22. A charger's light pulses: it is a block that turns into its dim
// picture and back by itself (all chargers together), and only the one-tick "pulse"
// picture gives charge, so a car parked at a charger gets one charge a pulse, and one
// driving past mostly gets none. A hill's foot is a wall that takes one charge to open
// (like the sequel's car door taking a keepsake); open, it is a slope of up-gravity air that
// carries the car up a block onto the upper road. With no charge, the wall stays shut, and
// the sign beside it says to plug in.
import { Pixels } from '../../../kit/pixels';
import { speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { c, copy, r } from '../blocks/tiles';
import { road, sign, wideSign } from './common';
import { CTR } from '../ids';

/** Ticks between a charger's pulses (each pulse is one charge for a car parked there). */
export const PULSE = 15;

/** Asphalt with a dashed line, its top edge lit (the road the car drives on). */
export function roadTop(seed: number, dashes = true): Pixels {
  const p = road(dashes, seed);
  p.rect(0, 0, 20, 2, c('asphalt', 3)).rect(0, 2, 20, 1, c('asphalt', 0));
  return p;
}

/** Earth under a hill's upper road. */
export function hillFill(seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('grass'), 1, 1, seed, 0.25);
  for (let x = 0; x < 20; x += 5) p.set(x + (seed % 5), (x * 7) % 20, c('grass', 3));
  return p;
}

/** The slope up a hill: road climbing from the bottom left to the top right over `base`. */
export function slope(base: Pixels, glow: boolean): Pixels {
  const p = copy(base);
  for (let x = 0; x < 20; x++) {
    const top = 19 - x;
    for (let y = top; y < 20; y++) p.set(x, y, y - top < 3 ? c('asphalt', y - top < 1 ? 3 : 2) : c('grass', 1));
  }
  if (glow) for (let k = 0; k < 3; k++) p.set(6 + k * 5, 14 - k * 5, c('yellow', 3));
  return p;
}

/** A lightning bolt (the sign of a charge) drawn at (x, y), 5 wide and 9 high. */
export function bolt(p: Pixels, x: number, y: number, col = c('yellow', 3)): Pixels {
  for (const [dx, dy] of [
    [3, 0],
    [2, 1],
    [3, 1],
    [1, 2],
    [2, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [2, 4],
    [3, 4],
    [1, 5],
    [2, 5],
    [1, 6],
    [0, 7],
    [1, 7],
    [0, 8],
  ])
    p.set(x + dx, y + dy, col);
  return p;
}

/** A charger post over `base`, its light lit (the pulse) or dim. */
export function chargerPic(base: Pixels, lit: boolean): Pixels {
  const p = copy(base);
  p.rect(8, 3, 5, 17, c('metal', 1)).rect(8, 3, 1, 17, c('metal', 3));
  p.rect(5, 2, 11, 9, c('paint', 3)).frame(5, 2, 11, 9, c('ink', 0));
  bolt(p, 8, 2, lit ? c('yellow', 3) : c('green', 1));
  if (lit) p.set(4, 1, c('yellow', 3)).set(17, 1, c('yellow', 3)).set(3, 6, c('yellow', 2)).set(18, 6, c('yellow', 2));
  // the cord, coiled on its hook
  p.rect(13, 11, 3, 4, c('ink', 0)).rect(14, 12, 1, 2, c('metal', 3));
  return p;
}

/**
 * Adds the shared road blocks over the level's air `sky` (for the row the road runs on) and
 * `skyHi` (one row higher, for the upper road's level).
 */
export function roadBlocks(t: Tiles, skyLow: Pixels, skyHi: Pixels): void {
  t.wall('road', roadTop(3));
  t.wall('roadPlain', roadTop(5, false));
  t.wall('roadHi', roadTop(7));
  t.wall('hill', hillFill(11));
  // the chargers: a pulse of one tick, then dim (every charger together)
  for (const [name, base] of [
    ['charger', skyLow],
    ['chargerHi', skyHi],
  ] as const) {
    t.air(name, chargerPic(base, true), { effect: CTR.charge, eamt: 1, next: `${name}Dim`, ntime: 1 });
    t.air(`${name}Dim`, chargerPic(base, false), { next: name, ntime: PULSE });
  }
  // the hills: the foot (a striped barrier with a bolt: one charge) and the open slope
  for (const [name, base] of [
    ['hillFoot', skyLow],
    ['hillFootHi', skyHi],
  ] as const) {
    t.air(`${name}Open`, slope(base, true), { grav: GRAV.up });
    const shut = slope(base, false);
    for (let y = 4; y < 20; y++) shut.rect(2, y, 3, 1, c(Math.floor(y / 3) % 2 ? 'yellow' : 'ink', Math.floor(y / 3) % 2 ? 3 : 0));
    shut.rect(1, 2, 18, 9, c('paint', 3)).frame(1, 2, 18, 9, c('ink', 0));
    bolt(shut, 8, 2, c('orange', 2));
    t.wall(name, shut, { effect: CTR.charge, eamt: -1, touch: `${name}Open`, score: 50 });
  }
  // a pothole: the car drops in and has to bump (Up) its way out
  const hole = new Pixels(20, 20, c('asphalt', 0));
  speckle(hole, 0, 6, 20, 14, r('asphalt'), 0, 1, 13, 0.3);
  hole.rect(0, 0, 2, 20, c('asphalt', 2)).rect(18, 0, 2, 20, c('asphalt', 2));
  t.air('pothole', hole);
  t.wall(
    'potholeFloor',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('dirt'), 1, 1, 17, 0.3);
      p.rect(0, 0, 20, 2, c('asphalt', 0));
      return p;
    })(),
  );
  // the signs
  const plug = copy(skyLow);
  t.air('signPlug', sign(plug, 'STOP', 'down'));
  const hillSign = copy(skyLow);
  hillSign.rect(9, 12, 2, 8, c('wood', 1));
  hillSign.rect(1, 1, 18, 12, c('wood', 3)).frame(1, 1, 18, 12, c('wood', 0));
  bolt(hillSign, 4, 2, c('orange', 2));
  bolt(hillSign, 11, 2, c('orange', 2));
  t.air('signTwo', hillSign);
  const [needL, needR] = wideSign(skyLow, 'NO CHARGE?\nPLUG IN <');
  t.air('signNeedL', needL);
  t.air('signNeedR', needR);
}
