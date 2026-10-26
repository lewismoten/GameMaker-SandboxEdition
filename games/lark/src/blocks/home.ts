// home.bbl: the finale, the Bitmores' Smart Home after the storm, seen from the side (as Ohm Sweet
// Ohm's circuit boards are, from above): green board behind with copper traces where the
// current runs, black chips to stand on and climb over, capacitors (solid on top), a live trace
// an air vent (it fills the heart balloon), Watt's workshop door
// (it opens once the house's Big Grumble is cheered up), the charging socket and Watt. Then the
// friends who come when the tally counter goes gold (the same map, in gold), and the front door.
import { SOLTOP } from '../../../../web/src/formats/blocks';
import { chezPicture } from '../../../kit/chez';
import { carlPic } from '../../../kit/carlCameo';
import { lewieCameo, wattCameo, willCameo } from '../../../kit/cameos';
import { Pixels, rng } from '../../../kit/pixels';
import { bevel, over } from '../art/draw';
import { PAL, c, r } from '../art/pal';
import { AIR_SEQ, PUFF } from '../characters';
import { CTR } from '../ids';
import { bard, goat, gwinnSit } from '../sprites/friends';
import { loaf, seed } from '../sprites/guests';
import { leo, reggie } from '../sprites/people';
import { addKeepsakes } from './keepsakes';
import { BlockSet, GRAV, SOLID } from './sets';
import { on } from './tiles';

const DOWN = GRAV.s;
const O = () => c('ink', 0);

/** The green board behind everything: a fine grid, solder pads, a trace or two. */
function board(seed: number): Pixels {
  const p = new Pixels(20, 20, c('green', 1));
  const R = rng(seed);
  for (let i = 0; i < 20; i += 5) p.rect(i, 0, 1, 20, c('green', 0)).rect(0, i, 20, 1, c('green', 0));
  if (seed % 2) p.rect(0, 10, 20, 2, c('brass', 1)).rect(0, 10, 20, 1, c('brass', 2));
  else p.rect(9, 0, 2, 20, c('brass', 1)).rect(9, 0, 1, 20, c('brass', 2));
  for (let i = 0; i < 2; i++) p.disc(2 + Math.floor(R() * 16), 2 + Math.floor(R() * 16), 1.5, c('stone', 3));
  return p;
}

/** A copper trace with current running along it (two frames, the spark moves). */
function current(frame: number): Pixels {
  const p = board(2);
  p.rect(0, 9, 20, 3, c('brass', 2)).rect(0, 9, 20, 1, c('brass', 3));
  p.rect(frame ? 12 : 3, 9, 4, 3, c('yellow', 3));
  return p;
}

/** A chip: black, its pins along the edges, a silkscreen notch. Solid. */
function chip(seed: number): Pixels {
  const p = new Pixels(20, 20, c('ink', 1));
  bevel(p, 0, 0, 20, 20, r('stone'), 0);
  p.rect(2, 2, 16, 16, c('ink', 0));
  for (let k = 1; k < 20; k += 4) p.rect(k, 0, 2, 1, c('stone', 4)).rect(k, 19, 2, 1, c('stone', 4));
  if (seed % 3 === 0) p.disc(5, 5, 1.5, c('stone', 2));
  return p;
}

/** The board's floor: a thick solder-silver rail. */
function rail(): Pixels {
  const p = new Pixels(20, 20, c('stone', 2));
  bevel(p, 0, 0, 20, 8, r('stone'), 4);
  for (let x = 2; x < 20; x += 6) p.rect(x, 10, 2, 10, c('stone', 1));
  return p;
}

/** A capacitor's top: a can on its side, solid on top. */
function capacitor(): Pixels {
  const p = board(5);
  bevel(p, 0, 0, 20, 7, r('blue'), 3);
  p.rect(0, 2, 20, 1, c('paper', 3));
  for (const x of [4, 15]) p.rect(x, 7, 2, 13, c('stone', 4));
  return p;
}

/** An air vent: warm air puffing up, and a little ribbon tied to it fluttering (it fills the heart balloon). */
function vent(frame: number): Pixels {
  const p = board(9);
  p.rect(3, 16, 14, 4, c('stone', 3));
  for (let x = 4; x < 16; x += 3) p.rect(x, 17, 2, 2, c('ink', 0));
  p.line(10, 15, frame ? 14 : 6, 6, c('red', 3)).line(11, 15, frame ? 15 : 7, 6, c('red', 2));
  return p;
}

/** Watt's workshop door: shut (a grumpy face lit on its panel: the house is in a grump) or open. */
function door(open: boolean): Pixels {
  const p = board(11);
  if (open) {
    p.rect(2, 0, 4, 20, c('stone', 3));
    return p;
  }
  bevel(p, 2, 0, 16, 20, r('stone'), 3);
  p.rect(6, 6, 8, 6, c('ink', 0));
  p.set(8, 8, c('red', 3)).set(11, 8, c('red', 3)).rect(8, 10, 4, 1, c('red', 3)).set(7, 11, c('red', 3)).set(12, 11, c('red', 3));
  return p;
}

/** Watt's charging socket in the wall: his home. */
function socket(): Pixels {
  const p = board(13);
  p.rect(5, 4, 10, 12, c('paper', 3)).frame(5, 4, 10, 12, O());
  p.rect(7, 7, 2, 4, c('ink', 0)).rect(11, 7, 2, 4, c('ink', 0));
  p.disc(10, 13, 1, c('green', 3));
  return p;
}

/** A row of little LEDs, blinking (two frames). */
function leds(frame: number): Pixels {
  const p = board(15);
  ['red', 'yellow', 'green', 'blue'].forEach((col, k) => p.disc(3 + k * 5, 6, 1.5, c(col, (k + frame) % 2 ? 3 : 1)));
  return p;
}

/** The front door of the Smart Home, warm light round its edges: the way out, in the gold. */
function frontDoor(): Pixels {
  const p = board(17);
  p.rect(2, 0, 16, 20, c('window', 1)).rect(4, 2, 12, 18, c('wood', 2)).disc(13, 11, 1, c('brass', 3));
  return p;
}

const CHEZ_INK = () => ({
  body: [c('red', 1), c('red', 2), c('red', 3)] as [number, number, number],
  trim: c('red', 0),
  glass: [c('blue', 1), c('blue', 3)] as [number, number],
  roof: c('ink', 0),
  tire: c('ink', 1),
  hub: c('stone', 4),
  bumper: c('stone', 3),
  lamp: c('yellow', 3),
  tail: c('red', 3),
  stripe: c('stone', 1),
  pin: c('paper', 4),
  rim: c('paper', 4),
});

/**
 * THE CHEZ, facing left (its passenger side), half a block each: Teddy in the front passenger
 * seat looking out of the door window, ears up (both the same), and Doc Leo's fedora beyond him
 * at the wheel.
 */
function chez(half: 0 | 1, ground: Pixels): Pixels {
  const big = new Pixels(40, 20);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 40; x++) big.set(x, y, ground.get(x % 20, y));
  const car = chezPicture(CHEZ_INK(), 'left');
  for (let y = 0; y < car.h; y++)
    for (let x = 0; x < car.w; x++) {
      const v = car.get(x, y);
      if (v >= 0 && v !== 255 && v !== 254) big.set(x, y, v);
    }
  // the door window, facing left: x from 40 - 24.5 to 40 - 12.5, y 2.8..8.3; the front of the car is to the left
  // Doc Leo's fedora at the wheel (the far seat), just showing
  big.rect(23, 3, 4, 2, c('wood', 1)).rect(22, 5, 6, 1, c('wood', 1));
  // Teddy in the front passenger seat, nearer the front: a red-gold head, white blaze, two matching ears
  const tx = 19;
  big.rect(tx, 5, 5, 4, c('wood', 3)).rect(tx + 2, 5, 1, 4, c('paper', 4));
  big
    .set(tx, 4, c('wood', 3))
    .set(tx, 3, c('wood', 3))
    .set(tx + 4, 4, c('wood', 3))
    .set(tx + 4, 3, c('wood', 3));
  big
    .set(tx + 1, 6, O())
    .set(tx + 3, 6, O())
    .set(tx + 2, 8, O());
  return big.crop(half * 20, 0, 20, 20);
}

export function homeSet(): BlockSet {
  const s = new BlockSet(150, false);
  const bd = board(1);
  s.add('board', bd, { grav: DOWN });
  s.add('board2', board(2), { grav: DOWN });
  s.add('board3', board(3), { grav: DOWN });
  s.add('current', current(0), { grav: DOWN, next: 'current2', ntime: 3 });
  s.add('current2', current(1), { grav: DOWN, next: 'current', ntime: 3 });
  s.add('chip', chip(1), { solid: SOLID });
  s.add('chip2', chip(3), { solid: SOLID });
  s.add('rail', rail(), { solid: SOLID });
  s.add('capacitor', capacitor(), { solid: SOLTOP, grav: DOWN });
  s.add('vent', vent(0), { grav: DOWN, effect: AIR_SEQ, eamt: PUFF, next: 'vent2', ntime: 4 });
  s.add('vent2', vent(1), { grav: DOWN, effect: AIR_SEQ, eamt: PUFF, next: 'vent', ntime: 4 });
  s.add('doorOpen', door(true), { grav: DOWN });
  s.add('door', door(false), { solid: SOLID, grav: DOWN, effect: CTR.task, eamt: -1, touch: 'doorOpen' });
  s.add('socket', socket(), { grav: DOWN });
  s.add('leds', leds(0), { grav: DOWN, next: 'leds2', ntime: 9 });
  s.add('leds2', leds(1), { grav: DOWN, next: 'leds', ntime: 9 });
  s.add('frontDoor', frontDoor(), { grav: DOWN });
  s.add('watt', on(bd, wattCameo(PAL.pal, 'side', 0)), { grav: DOWN });
  // the friends, for the gold (scenery: they came to see)
  const friend = (name: string, pic: Pixels) => s.add(name, on(bd, pic), { grav: DOWN });
  friend('fLeo', leo(true, true));
  friend('fReggie', reggie(1));
  friend('fGwinn', gwinnSit());
  friend('fBard', bard(1));
  friend('fGoat', goat(1));
  friend(
    'fCarl',
    carlPic(
      {
        ink: c('ink', 0),
        fly: [c('ink', 1), c('stone', 1), c('stone', 2), c('stone', 3), c('stone', 4)],
        eye: [c('red', 2), c('red', 3), c('red', 4), c('yellow', 3)],
        wing: [c('paper', 2), c('paper', 3), c('paper', 4)],
        white: c('paper', 4),
        red: c('red', 3),
      },
      { view: 'front', wing: 1, mood: 'smug' },
    ),
  );
  friend('fLewie', lewieCameo(PAL.pal, 'down0'));
  friend('fWill', willCameo(PAL.pal, { face: 'front', mood: 'swoon', arms: 'heart' }));
  friend('fLoaf', loaf('joy'));
  friend('fSeed', seed('joy', 'sprout'));
  s.add('chez0', chez(0, bd), { grav: DOWN });
  s.add('chez1', chez(1, bd), { grav: DOWN });
  s.add('wattGlad', on(bd, over(wattCameo(PAL.pal, 'side', 1), goldGlow())), { grav: DOWN });
  addKeepsakes(s, bd, 'board');
  return s;
}

/** A little gold glow by Watt's hand: the light from the hatch he looked into. */
function goldGlow(): Pixels {
  const p = new Pixels(20, 20, 255);
  p.disc(2, 9, 2, c('gold', 3)).set(2, 9, c('gold', 5));
  return p;
}
