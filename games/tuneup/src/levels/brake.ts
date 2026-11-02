// Level 6, Brake Dance (the lift pit under THE CHEZ, done up as a disco; Teddy). The brake
// lights won't come on: the switch at the pedal has gone stiff. It needs a break, so Teddy
// dances it one. Four stiff brake lamps sit in their housings along the pit (solid, so Teddy
// hops over them), each under a sign of the trick it wants: Z turn, X roll over, C play dead,
// V dance. A trick's sparkle flies into the housing; the right trick (or a stronger one) frees
// the lamp, which floats out to Teddy, and his touch counts it (realMonsters.ts). The floor's
// tiles flash on the beat. Each freed lamp glows with its letter (B, R, A, K); when all four are
// lit, the door at the end opens and its own lamp lights the E.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { text } from '../../../snowbound/src/art/font';
import { POSES } from '../../../teddy2/src/sprites/teddy';
import { AIR, countedDoor, kit, SOLID, type Kit } from '../blocks/common';
import { baseSet } from '../blocks/sets';
import type { Pal } from '../art/palette';
import { CTR, MON } from '../ids';
import { decorate } from './decor';
import { MapBuilder, at, type Level } from './maps';

/** A beat of the breakbeat, in ticks: the floor's tiles step on it. */
export const BRAKE_BEAT = 8;
export const BRAKE = { w: 40, floor: 9, exit: 37 } as const;
/** The housings (level x, on the floor), the trick each wants, its key and the pose on its sign. */
export const HOUSINGS: { x: number; key: string; pose: string }[] = [
  { x: 12, key: 'Z', pose: 'back' },
  { x: 19, key: 'X', pose: 'roll1' },
  { x: 26, key: 'C', pose: 'dead' },
  { x: 33, key: 'V', pose: 'frontBeg' },
];
/** Tires on the floor between them, to hop. */
const TIRES = [16, 23, 30];

export function brakeBlocks(pal: Pal): Kit {
  const k = kit(pal);
  baseSet(k, 'garage');
  const { book, c, P } = k;
  // the underside of THE CHEZ up on the lift: its dark floor pan and the rear axle's drums
  const pan = P(c('shade', 0));
  pan.rect(0, 14, 20, 3, c('mach', 1)).rect(0, 17, 20, 3, c('shade', 1));
  for (let x = 2; x < 20; x += 8) pan.rect(x, 15, 2, 1, c('mach', 4));
  book.add('pan', pan, AIR);
  // the floor: disco tiles stepping through four colors on the beat
  const tile = (f: number) => {
    const p = P(c('floor', 1));
    const cols = [c('pipe', 3), c('accent', 3), c('lamp', 3), c('mach', 4)];
    p.rect(1, 1, 8, 8, cols[f % 4])
      .rect(11, 1, 8, 8, cols[(f + 1) % 4])
      .rect(1, 11, 8, 8, cols[(f + 2) % 4])
      .rect(11, 11, 8, 8, cols[(f + 3) % 4]);
    p.rect(0, 0, 20, 1, c('floor', 4));
    return p;
  };
  for (let f = 0; f < 4; f++) book.add(`tile${f}`, tile(f), { solid: SOLID, ntime: BRAKE_BEAT, next: `tile${(f + 1) % 4}` });
  // a mirror ball hanging from the car, glinting
  for (let f = 0; f < 2; f++) {
    const p = k.pic('wall');
    p.rect(9, 0, 2, 6, c('mach', 2)).disc(10, 12, 7, c('mach', 3));
    for (let y = 6; y < 19; y += 3) for (let x = 4; x < 17; x += 3) if ((x + y + f) % 2) p.set(x, y, c('paint', 3));
    book.add(`ball${f}`, p, { ...AIR, ntime: BRAKE_BEAT, next: `ball${1 - f}` });
  }
  // a brake lamp's housing: solid chrome, a dark socket the stiff lamp sits in
  const housing = P(c('mach', 3));
  housing.frame(0, 0, 20, 20, c('mach', 0)).rect(2, 2, 16, 16, c('shade', 0)).rect(0, 0, 20, 2, c('mach', 6));
  book.add('housing', housing, { solid: SOLID });
  // the signs: the trick's pose in a frame, and its key under it
  HOUSINGS.forEach((h, i) => {
    const sign = k.pic('wall');
    sign.rect(0, 0, 20, 20, c('accent', 0)).frame(0, 0, 20, 20, c('lamp', 3));
    sign.blit(POSES[h.pose], 0, 0, 255);
    book.add(`sign${i}`, sign, AIR);
    const plate = k.pic('wall');
    plate.rect(4, 4, 12, 12, c('lamp', 3)).frame(4, 4, 12, 12, c('ink', 0));
    text(plate, 6, 6, h.key, c('ink', 0));
    book.add(`key${i}`, plate, AIR);
  });
  // the door's own brake lamp lights the E of BRAKE when it opens (the freed lamps are B, R, A, K)
  countedDoor(
    k,
    'door',
    'wall',
    CTR.lamps,
    HOUSINGS.length,
    (p: Pixels) => {
      p.disc(10, 12, 4, c('red', 0)).frame(6, 8, 9, 9, c('ink', 0));
    },
    (p: Pixels) => {
      p.rect(4, 1, 12, 11, c('red', 3)).frame(4, 1, 12, 11, c('ink', 0));
      text(p, 7, 3, 'E', c('paint', 3));
    },
  );
  return k;
}

export function brake(book: Kit['book']): Level {
  const { w, floor } = BRAKE;
  const m = new MapBuilder(book, { '.': 'wall', p: 'pan', t: 'tire' }, 'slab');
  m.fill(0, 0, w, floor, '.').fill(0, 0, w, 2, 'p');
  for (let x = 0; x < w; x++) m.set(x, floor, `tile${x % 4}`);
  for (const x of [8, 20, 31]) m.set(x, 2, 'ball0');
  HOUSINGS.forEach((h, i) => {
    m.set(h.x, floor - 1, 'housing')
      .set(h.x, floor - 3, `sign${i}`)
      .set(h.x, floor - 2, `key${i}`);
    m.mon(MON.lock0 + i, h.x, floor - 1);
  });
  for (const x of TIRES) m.set(x, floor - 1, 't');
  m.set(BRAKE.exit, floor - 2, 'door.top').set(BRAKE.exit, floor - 1, 'door');
  m.fill(w - 1, 0, 1, floor, 'slab');
  m.link(BRAKE.exit + 1, floor - 1);
  m.mon(MON.reggie, 4, floor - 1);
  decorate(m, [
    ['board', 3, 4],
    ['board', 16, 3],
    ['board', 26, 4],
    ['board', 34, 3],
    ['charger', 2, 6],
  ]);
  // variants here and there so the walls and floors don't repeat
  m.vary('wall', ['wall.hook'], 13).vary('slab', ['slab.crack'], 9);
  return { m, start: at(8, 5), size: [w, 10] };
}
