// Level 3's background blocks: Gwinn's night out, the night of the Big Show. Doc Leo's
// backyard in the dark (Teddy asleep in his doghouse), the back gate, the alley, the park
// by lamplight with its pond, a tall playground fence with hard clay at its foot, and the
// park's east gate where the Klown Klub's hay wagon is hitched up for the Fair.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, klubArt, micro, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { boxFace, c, canvas, copy, cut, dirt, grassTop, hedge, leaves, plankFence, r, siding, sky, trunk, tuft, windowOn } from '../blocks/tiles';
import { sign, water } from './common';

export const G = 40;

/** Night sky: dark at the top, the glow of town at the horizon; stars. */
export const nightBand = (y: number) => (y <= 30 ? 0 : y <= 34 ? 1 : y <= 37 ? 2 : 3);
export const nightRow = (y: number) => `sky${nightBand(y)}`;

export function nightTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) {
    const p = sky(k);
    const R = rng(90 + k);
    if (k < 3) for (let i = 0; i < 3 - k; i++) p.set(Math.floor(R() * 20), Math.floor(R() * 20), c('glow', 3));
    t.air(`sky${k}`, p);
  }
  /** The night sky (stars and all) of map row y: what anything standing on that row is drawn over. */
  const skyAt = (y: number) => t.pic(nightRow(y));
  // the moon, 2x2
  const moon = canvas(2, 2, () => sky(0));
  blob(moon, 20, 20, 15, 15, r('glow'), 2, 3);
  blob(moon, 26, 14, 4, 3, r('glow'), 1, 2);
  blob(moon, 14, 26, 3, 3, r('glow'), 1, 2);
  const mc = cut(moon);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) t.air(`moon${bx}${by}`, mc[by][bx]);
  t.wall('grass', grassTop(1));
  t.wall('dirt', dirt(3));
  t.wall('deep', dirt(5, true));
  t.air('tuft', tuft(sky(3), 11));
  t.air('flower', tuft(sky(3), 12, 'purple'));
  t.air('hedgeTop', hedge(true, 21, skyAt(29)));
  t.wall('hedgeWall', hedge(false, 25));
  // the park's trees: leaves and trunks over each sky band they cross
  t.air('leaf1', leaves(7, skyAt(31)));
  t.air('leaf2', leaves(8, skyAt(35)));
  t.air('trunk3', trunk(sky(3)));
  t.air('trunk2', trunk(skyAt(35)));
  t.air('trunk1', trunk(skyAt(31)));
  // the big tree's hollow, two yellow eyes in it: the owl
  t.air(
    'owlHole',
    (() => {
      const p = trunk(skyAt(35));
      blob(p, 10, 10, 4, 5, [c('ink', 0)], 0, 0);
      p.set(8, 9, c('glow', 3)).set(12, 9, c('glow', 3));
      return p;
    })(),
  );

  // Doc Leo's house, dark but for the porch light, and the doggy door Gwinn came out of.
  const side = siding('siding');
  t.wall('house', side);
  t.wall('houseWin', windowOn(side, false, 'blue'));
  t.air(
    'doggyDoor',
    (() => {
      const p = copy(side);
      p.rect(4, 6, 12, 14, c('ink', 0)).rect(5, 7, 10, 13, c('wood', 1)).rect(5, 7, 10, 2, c('wood', 3));
      return p;
    })(),
  );
  // Teddy's doghouse, Teddy fast asleep inside (zzz)
  const dh = canvas(2, 2, (_bx, by) => skyAt(38 + by));
  for (let y = 4; y < 20; y++) dh.rect(20 - (y - 4) - 4, y, (y - 4) * 2 + 8, 1, c('red', 1 + (y % 4 === 0 ? 0 : 1)));
  dh.rect(4, 20, 32, 20, c('wood', 2)).rect(4, 20, 32, 2, c('wood', 4));
  blob(dh, 20, 32, 8, 9, [c('ink', 0)], 0, 0);
  dh.rect(12, 32, 16, 8, c('ink', 0));
  blob(dh, 20, 36, 6, 3, r('corgi'), 2, 4);
  micro(dh, 9, 23, 'TEDDY', c('paint', 3));
  micro(dh, 28, 6, 'Z', c('paint', 3));
  micro(dh, 32, 1, 'Z', c('paint', 3));
  const dc = cut(dh);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) t.add(`dogHouse${bx}${by}`, dc[by][bx], by === 0 ? { solid: 1 } : {});

  // The back fence and its gate (a rope knot holds the gate shut: a monster, chew it).
  t.wall('fence', plankFence(false));
  t.wall('fenceTop', plankFence(true));
  t.air(
    'gate',
    (() => {
      const p = plankFence(false);
      p.rect(0, 0, 2, 20, c('ink', 0)).rect(18, 0, 2, 20, c('ink', 0));
      p.line(2, 18, 18, 2, c('wood', 1));
      return p;
    })(),
  );

  // The alley: trash cans, a raccoon's favorite.
  t.wall(
    'can',
    (() => {
      const p = sky(3);
      p.rect(3, 4, 14, 16, c('metal', 1)).rect(2, 3, 16, 2, c('metal', 2));
      for (let x = 5; x < 17; x += 3) p.rect(x, 6, 1, 13, c('metal', 0));
      return p;
    })(),
  );
  t.air('signSit', sign(sky(3), 'NO DOGS'));

  // The park: lamp posts (glowing at night), benches, the pond.
  for (const [name, top] of [
    ['lampTop', true],
    ['lampPost', false],
  ] as const) {
    const p = copy(skyAt(top ? 38 : 39));
    if (top) blob(p, 10, 6, 9, 7, r('glow'), 0, 2, 0.3);
    p.rect(9, top ? 8 : 0, 2, top ? 12 : 20, c('ink', 1));
    if (top) p.rect(6, 1, 8, 7, c('ink', 1)).rect(7, 2, 6, 5, c('glow', 3));
    else p.rect(7, 16, 6, 4, c('ink', 1));
    t.air(name, p);
  }
  t.air(
    'bench',
    (() => {
      const p = sky(3);
      p.rect(1, 9, 18, 2, c('wood', 3)).rect(1, 4, 18, 2, c('wood', 2));
      p.rect(2, 11, 2, 9, c('ink', 1)).rect(16, 11, 2, 9, c('ink', 1));
      return p;
    })(),
  );
  for (const ph of [0, 1]) {
    t.air(`surface${ph}`, water(true, ph, sky(3)), { grav: GRAV.up, next: `surface${1 - ph}`, ntime: 9 });
    t.air(`pond${ph}`, water(false, ph), { grav: GRAV.up, next: `pond${1 - ph}`, ntime: 9 });
  }
  t.wall(
    'bank',
    (() => {
      const p = dirt(13);
      p.rect(0, 0, 20, 3, c('grass', 2));
      return p;
    })(),
  );
  t.air(
    'reeds',
    (() => {
      const p = sky(3);
      for (const x of [3, 7, 12, 16]) {
        p.rect(x, 6, 1, 14, c('grass', 1));
        p.rect(x - 1, 4, 2, 4, c('dirt', 1));
      }
      return p;
    })(),
  );
  // the playground's tall chain-link fence, and the hard clay at its foot
  for (let k = 1; k < 4; k++)
    t.wall(
      `chain${k}`,
      (() => {
        const p = copy(t.pic(`sky${k}`));
        for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 5 === 0 || (x - y + 40) % 5 === 0) p.set(x, y, c('metal', 2));
        p.rect(0, 0, 2, 20, c('metal', 1));
        return p;
      })(),
    );
  t.wall(
    'chainTop',
    (() => {
      const p = sky(1);
      for (let y = 6; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 5 === 0 || (x - y + 40) % 5 === 0) p.set(x, y, c('metal', 2));
      p.rect(0, 4, 20, 2, c('metal', 3)).rect(0, 0, 2, 20, c('metal', 1));
      return p;
    })(),
  );
  t.air('hole', new Pixels(20, 20, c('dirt', 0)));
  t.air(
    'tunnel',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('dirt'), 0, 1, 61, 0.2);
      return p;
    })(),
  );
  t.wall('clay', (() => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, r('brick'), 1, 1, 62, 0.3);
    return p;
  })());
  // playground things behind the fence: a slide, swings
  const play = canvas(3, 3, (_bx, by) => skyAt(37 + by));
  play.rect(4, 10, 2, 50, c('red', 1)).rect(24, 10, 2, 50, c('red', 1)).rect(4, 10, 22, 2, c('red', 2));
  for (const x of [10, 18]) play.line(x, 12, x, 44, c('metal', 2)).rect(x - 3, 44, 7, 2, c('blue', 2));
  play.rect(36, 20, 4, 40, c('metal', 1)).line(40, 20, 58, 56, c('yellow', 2)).line(41, 20, 59, 56, c('yellow', 3));
  const pc = cut(play);
  for (let by = 0; by < 3; by++) for (let bx = 0; bx < 3; bx++) t.air(`play${bx}${by}`, pc[by][bx]);

  // The Klown Klub's hay wagon, hitched to a pickup at the park gate: hop into the hay.
  const wagon = canvas(4, 2, (_bx, by) => skyAt(38 + by));
  wagon.rect(2, 26, 76, 8, c('wood', 2)).rect(2, 26, 76, 1, c('wood', 4));
  for (let x = 6; x < 78; x += 8) wagon.rect(x, 12, 2, 14, c('wood', 1));
  wagon.rect(2, 12, 76, 2, c('wood', 3));
  for (const [x, y] of [
    [16, 18],
    [34, 16],
    [52, 18],
    [68, 19],
  ])
    blob(wagon, x, y, 9, 6, r('hay'), 1, 3);
  for (const x of [14, 64]) {
    wagon.disc(x, 35, 5, c('ink', 0)).ring(x, 35, 3, c('wood', 2));
  }
  micro(wagon, 8, 28, klubArt('KLOWN KLUB  TO THE FAIR'), c('yellow', 3));
  const wc = cut(wagon);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 4; bx++) t.air(`wagon${bx}${by}`, wc[by][bx]);
  const truck = canvas(2, 2, (_bx, by) => skyAt(38 + by));
  truck.rect(0, 18, 40, 16, c('blue', 2)).rect(18, 6, 18, 14, c('blue', 2)).rect(21, 9, 12, 8, c('sky', 1));
  truck.rect(36, 24, 4, 4, c('glow', 3));
  for (const x of [8, 30]) truck.disc(x, 35, 5, c('ink', 0)).ring(x, 35, 2, c('metal', 3));
  const tc = cut(truck);
  for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) t.air(`pickup${bx}${by}`, tc[by][bx]);
  t.air('signFair', sign(sky(3), 'FAIR', 'right'));
  void boxFace;
  void speckle;
  return t;
}
