// The back lot's background blocks, the Tri-County Fair at noon before the gates open, on a
// windy day: the Fair's ride truck (Gwinn rode in on it), Juggles practicing by the Klown
// Klub's trailer, the costume line and the big fan drying it (a breeze: air whose gravity
// points right, two pictures taking turns), the bandstand where the dog show signs dogs up
// (its stage too high to hop onto), Professor Pratfall's pie target under it, the exhibit
// hall and the poultry barn (fronts to walk past, roofs to walk on), the creek between them
// with a fan on its bank (its current carries a swimmer back to the near bank) and a
// catwalk over it, a fan lying face up (an updraft), and the gusts over the roofs, which
// come and go (air that blows right, then goes calm, then stirs: three pictures in a ring,
// the windsocks on the vents with them).
import { Pixels } from '../../../kit/pixels';
import { blob, klubArt, micro } from '../art/draw';
import { GRAV, Tiles } from './level';
import { c, canvas, cloud, copy, cut, dirt, grassTop, hedge, planks, r, sky, tuft } from '../blocks/tiles';
import { sign, water, wideSign } from './common';
import { farmTiles } from './level5Tiles';
import { KLUB } from '../sprites/klubfolk';
import { juggler } from '../sprites/folks';
import { halves } from '../sprites/people';

export const G = 40;
export const bandRow = (y: number) => (y <= 30 ? 0 : y <= 33 ? 1 : y <= 36 ? 2 : 3);
export const skyAt = (y: number) => `sky${bandRow(y)}`;

/** How long each part of a gust lasts, in ticks: blowing, calm, then stirring again. */
export const GUST = { on: 28, off: 26, warn: 12 };

/** Streaks of wind over a copy of `base`, blowing `dir`; `faint` draws only a few wisps. */
function streaks(base: Pixels, dir: 'left' | 'right' | 'up', ph: number, faint = false): Pixels {
  const p = copy(base);
  const lines = faint
    ? [[3, 8]]
    : [
        [2, 0],
        [8, 9],
        [14, 4],
      ];
  for (const [at, off] of lines) {
    const s = (off + ph * 7) % 20;
    for (let k = 0; k < (faint ? 3 : 7); k++) {
      const head = k === (dir === 'left' ? 0 : 6);
      const col = head ? c('cloud', 2) : c('cloud', faint ? 0 : 1);
      if (dir === 'up') p.set(at + 1, (40 - s - k) % 20, col);
      else p.set((dir === 'right' ? s + k : 40 - s - k) % 20, at + 2, col);
    }
  }
  // a leaf or a bit of confetti riding along
  if (!faint) {
    const s = (ph * 9 + 5) % 20;
    if (dir === 'up') p.set(13, 19 - s, c('red', 3));
    else p.set(dir === 'right' ? s : 19 - s, 15, c('yellow', 3));
  }
  return p;
}

/** A fan's round cage and blades over a copy of `base`, centred at (cx, cy). */
function fanFace(p: Pixels, cx: number, cy: number, rad: number, ph: number): void {
  p.disc(cx, cy, rad, c('metal', 1));
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + (ph * Math.PI) / 4;
    for (let d = 1; d < rad; d++) p.set(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), c('blue', 3));
  }
  p.ring(cx, cy, rad, c('metal', 3));
  p.disc(cx, cy, 1, c('red', 2));
}

export function lotTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(0, part, 29));
  t.wall('grass', grassTop(6));
  t.wall('dirt', dirt(8));
  t.wall('deep', dirt(9, true));
  t.air('tuft', tuft(sky(3), 15));
  t.air('flower', tuft(sky(3), 16, 'pink'));
  t.air('hedgeTop', hedge(true, 23, sky(bandRow(29))));
  t.wall('hedgeWall', hedge(false, 27));

  // The Fair's ride truck, parked where it unloaded (the same truck as on the farm).
  const farm = farmTiles();
  t.ledge('flatbed', farm.pic('flatbed'));
  for (const n of ['cab00', 'cab10', 'cab01', 'cab11', 'carL0', 'carR0', 'gondola', 'carR1']) t.air(n, farm.pic(n));
  t.air('signFolks', sign(sky(3), 'SHOW\nFOLKS'));

  // Juggles, practicing (two pictures taking turns), and the Klown Klub's trailer.
  for (const ph of [0, 1]) {
    const [a, b] = halves(juggler(ph), sky(3), sky(3));
    t.air(`juggles${ph}Top`, a, { next: `juggles${1 - ph}Top`, ntime: 7 });
    t.air(`juggles${ph}Bot`, b, { next: `juggles${1 - ph}Bot`, ntime: 7 });
  }
  const trailer = canvas(4, 2, () => sky(3));
  trailer.rect(2, 6, 76, 28, c('paint', 3)).frame(2, 6, 76, 28, c('ink', 1));
  trailer.rect(2, 6, 76, 4, c('red', 2));
  for (let x = 8; x < 76; x += 12)
    for (const y of [14, 24]) trailer.disc(x + (y === 24 ? 6 : 0), y, 2, c(['blue', 'yellow', 'green', 'pink'][((x / 12) % 4) | 0], 2));
  trailer.rect(56, 12, 12, 22, c('wood', 2)).rect(58, 14, 8, 8, c('sky', 6));
  micro(trailer, 10, 28, klubArt('KLOWN KLUB'), c('red', 1));
  trailer.disc(20, 35, 4, c('ink', 0)).ring(20, 35, 1, c('metal', 3));
  trailer.disc(46, 35, 4, c('ink', 0)).ring(46, 35, 1, c('metal', 3));
  const tc = cut(trailer);
  for (let bx = 0; bx < 4; bx++) for (let by = 0; by < 2; by++) t.air(`trailer${bx}${by}`, tc[by][bx]);

  // The costume line: two posts, a line, polka-dot pants and ruffles flapping off to the
  // right in the big fan's breeze.
  const post = (base: Pixels) => {
    const p = copy(base);
    p.rect(9, 0, 2, 20, c('wood', 1));
    return p;
  };
  t.air(
    'linePostTop',
    (() => {
      const p = post(sky(2));
      p.rect(5, 0, 10, 2, c('wood', 2));
      return p;
    })(),
  );
  t.air('linePostLow', post(sky(3)));
  const wash = canvas(8, 1, () => sky(2));
  wash.rect(0, 1, 160, 1, c('ink', 1));
  const clothes = ['red', 'blue', 'yellow', 'green', 'purple', 'pink', 'red', 'blue'];
  clothes.forEach((col, i) => {
    const x = i * 20 + 3;
    if (i % 2) {
      // a ruffled collar, streaming out sideways
      for (let k = 0; k < 5; k++) wash.rect(x + k * 2, 2 + k, 8, 2, c(col, 2 + (k % 2)));
    } else {
      // baggy pants with dots, legs blown out to the right
      wash.rect(x, 2, 10, 6, c(col, 2));
      wash.rect(x + 2, 8, 12, 5, c(col, 2)).rect(x + 6, 13, 10, 4, c(col, 2));
      wash
        .set(x + 3, 4, c('paint', 3))
        .set(x + 7, 9, c('paint', 3))
        .set(x + 11, 14, c('paint', 3));
    }
    wash.rect(x + 1, 0, 1, 3, c('wood', 3)).rect(x + 7, 0, 1, 3, c('wood', 3));
  });
  const wc = cut(wash);
  for (let bx = 0; bx < 8; bx++) t.air(`wash${bx}`, wc[0][bx]);
  // the big fan at the foot of the line, and its breeze
  for (const ph of [0, 1]) {
    t.air(
      `fanTop${ph}`,
      (() => {
        const p = post(sky(3));
        fanFace(p, 10, 13, 7, ph);
        return p;
      })(),
      { next: `fanTop${1 - ph}`, ntime: 2 },
    );
    t.air(
      `fanBot${ph}`,
      (() => {
        const p = post(sky(3));
        p.rect(4, 16, 12, 4, c('metal', 2)).rect(4, 16, 12, 1, c('metal', 3));
        return p;
      })(),
      { next: `fanBot${1 - ph}`, ntime: 2 },
    );
    t.air(`breeze${ph}`, streaks(sky(3), 'right', ph), { grav: GRAV.right, next: `breeze${1 - ph}`, ntime: 3 });
  }

  // Professor Pratfall's pie practice: a target board, well splatted.
  const target = canvas(1, 2, () => sky(3));
  target.rect(9, 20, 2, 20, c('wood', 1));
  target.rect(2, 4, 16, 18, c('wood', 3)).frame(2, 4, 16, 18, c('wood', 0));
  target.ring(10, 13, 6, c('red', 2)).ring(10, 13, 3, c('red', 2)).disc(10, 13, 1, c('red', 2));
  blob(target, 6, 9, 3, 2, r('paint'), 2, 3);
  blob(target, 14, 17, 3, 2, r('paint'), 2, 3);
  const tg = cut(target);
  t.air('targetTop', tg[0][0]);
  t.air('targetBot', tg[1][0]);
  const [pieL, pieR] = wideSign(sky(3), 'PIE\nPRACTICE');
  t.air('signPieL', pieL);
  t.air('signPieR', pieR);
  const [pt, pb] = halves(KLUB.pratfall, sky(3), sky(3));
  t.air('pratfallTop', pt);
  t.air('pratfallBot', pb);

  // The creek: too wide to hop, and its current runs back toward the near bank. The fan on
  // the bank blows a breeze across it (two blocks tall, on a stand).
  for (const ph of [0, 1]) {
    t.air(`creek${ph}`, water(true, ph, sky(3)), { grav: GRAV.left, next: `creek${1 - ph}`, ntime: 6 });
    t.air(`creekDeep${ph}`, water(false, ph), { grav: GRAV.left | GRAV.up, next: `creekDeep${1 - ph}`, ntime: 6 });
    t.air(
      `bigFanTop${ph}`,
      (() => {
        const p = copy(sky(3));
        fanFace(p, 9, 11, 8, ph);
        return p;
      })(),
      { next: `bigFanTop${1 - ph}`, ntime: 2 },
    );
  }
  t.air(
    'bigFanBot',
    (() => {
      const p = copy(sky(3));
      p.rect(8, 0, 3, 20, c('metal', 1)).rect(3, 17, 14, 3, c('metal', 2));
      return p;
    })(),
  );
  const [brL, brR] = wideSign(planks(41, 'paint', 2), 'HOP INTO\nTHE BREEZE');
  t.air('signBreezeL', brL);
  t.air('signBreezeR', brR);
  t.air(
    'reeds',
    (() => {
      const p = tuft(sky(3), 18);
      for (const x of [3, 7, 15]) p.rect(x, 8, 1, 12, c('green', 1)).rect(x, 6, 1, 3, c('wood', 1));
      return p;
    })(),
  );

  // The fan lying face up past the poultry barn, and its updraft up to the roofs.
  for (const ph of [0, 1]) {
    t.air(
      `upFan${ph}`,
      (() => {
        const p = copy(sky(3));
        p.rect(1, 12, 18, 8, c('metal', 1)).rect(1, 12, 18, 1, c('metal', 3));
        for (let x = 2 + ph * 2; x < 18; x += 4) p.rect(x, 13, 2, 6, c('blue', 3));
        return p;
      })(),
      { grav: GRAV.up, next: `upFan${1 - ph}`, ntime: 2 },
    );
    for (let k = 0; k < 4; k++) t.air(`updraft${k}_${ph}`, streaks(sky(k), 'up', ph), { grav: GRAV.up, next: `updraft${k}_${1 - ph}`, ntime: 3 });
  }
  t.air('signUp', sign(sky(3), 'UP', 'up'));

  // The exhibit hall and the poultry barn: fronts to walk past (white siding, windows full of
  // prize quilts, doors), flat roofs to walk on, and a plank catwalk between them over the creek.
  const siding = () => planks(41, 'paint', 2);
  t.air('hall', siding());
  t.air(
    'hallWin',
    (() => {
      const p = siding();
      p.rect(2, 3, 16, 14, c('ink', 1));
      for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) p.rect(3 + x * 5, 4 + y * 4, 4, 3, c(['red', 'yellow', 'blue'][(x + y) % 3], 2));
      return p;
    })(),
  );
  t.air(
    'hallDoor',
    (() => {
      const p = siding();
      p.rect(3, 2, 14, 18, c('red', 1)).rect(3, 2, 14, 2, c('red', 2));
      p.line(4, 4, 16, 19, c('paint', 3)).line(16, 4, 4, 19, c('paint', 3));
      return p;
    })(),
  );
  t.ledge(
    'hallRoof',
    (() => {
      const p = sky(1);
      p.rect(0, 0, 20, 5, c('stone', 2)).rect(0, 0, 20, 1, c('stone', 4)).rect(0, 5, 20, 1, c('ink', 0));
      p.rect(0, 6, 20, 14, c('paint', 2));
      return p;
    })(),
  );
  for (const [name, words] of [
    ['signHall', 'EXHIBITS'],
    ['signBarn', 'POULTRY'],
  ] as const) {
    const [l, rr] = wideSign(siding(), words);
    t.air(`${name}L`, l);
    t.air(`${name}R`, rr);
  }
  t.ledge(
    'catwalk',
    (() => {
      const p = sky(1);
      p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
      for (const x of [4, 14]) p.rect(x, 5, 2, 15, c('wood', 1));
      return p;
    })(),
  );
  t.air(
    'catwalkLeg',
    (() => {
      const p = sky(2);
      for (const x of [4, 14]) p.rect(x, 0, 2, 20, c('wood', 1));
      return p;
    })(),
  );
  // things on the roofs to duck behind when it gusts: vents, and a loudspeaker on the catwalk
  t.wall(
    'vent',
    (() => {
      const p = sky(1);
      p.rect(2, 6, 16, 14, c('metal', 2)).frame(2, 6, 16, 14, c('metal', 0));
      for (let y = 9; y < 18; y += 3) p.rect(4, y, 12, 1, c('metal', 0));
      return p;
    })(),
  );
  t.wall(
    'speaker',
    (() => {
      const p = sky(1);
      p.rect(3, 4, 14, 16, c('ink', 1)).frame(3, 4, 14, 16, c('metal', 2));
      p.ring(10, 10, 4, c('metal', 2)).disc(10, 10, 2, c('metal', 1));
      p.ring(10, 17, 1, c('metal', 2));
      return p;
    })(),
  );

  // The gusts over the roofs, blowing from the west (gravity right), then calm (falls like
  // any air), then stirring (a few wisps: here it comes again), round and round. The
  // windsocks on the vents go with them.
  const sock = (base: Pixels, mode: 'on' | 'off' | 'warn', pole: boolean) => {
    const p = copy(base);
    p.rect(4, 0, 2, 20, c('metal', 2));
    if (pole) return p;
    const stripes = [c('red', 2), c('paint', 3), c('red', 2), c('paint', 3)];
    if (mode === 'on') stripes.forEach((col, i) => p.rect(6 + i * 3, 4 + (i > 2 ? 1 : 0), 4, 5 - Math.floor(i / 2), col));
    else if (mode === 'warn') stripes.forEach((col, i) => p.rect(6 + i * 2, 4 + i * 2, 3, 4, col));
    else stripes.forEach((col, i) => p.rect(5, 4 + i * 3, 3, 3, col));
    return p;
  };
  const ring = (name: string, pic: (mode: 'on' | 'off' | 'warn') => Pixels) => {
    t.air(`${name}On`, pic('on'), { grav: GRAV.right, next: `${name}Off`, ntime: GUST.on });
    t.air(`${name}Off`, pic('off'), { next: `${name}Warn`, ntime: GUST.off });
    t.air(`${name}Warn`, pic('warn'), { next: `${name}On`, ntime: GUST.warn });
  };
  for (const k of [0, 1]) ring(`gust${k}`, (mode) => (mode === 'off' ? sky(k) : streaks(sky(k), 'right', 0, mode === 'warn')));
  ring('sock', (mode) => sock(mode === 'on' ? streaks(sky(0), 'right', 1) : sky(0), mode, false));
  ring('sockPole', (mode) => sock(mode === 'on' ? streaks(sky(1), 'right', 1) : sky(1), mode, true));

  // The bandstand, where the dog show signs dogs up: a striped awning on two posts, a stage
  // floor (a ledge: too high to hop onto from the ground), bunting under it, and its legs.
  // Honker has the sign-up sheet.
  t.air(
    'awning',
    (() => {
      const p = sky(0);
      for (let x = 0; x < 20; x++) p.rect(x, 6, 1, 10 + (x % 5 === 2 ? 2 : 0), Math.floor(x / 5) % 2 ? c('paint', 3) : c('red', 2));
      p.rect(0, 4, 20, 2, c('red', 1));
      return p;
    })(),
  );
  const standPost = () => {
    const p = sky(1);
    p.rect(8, 0, 4, 20, c('paint', 3)).rect(8, 0, 1, 20, c('paint', 1));
    return p;
  };
  t.air('standPost', standPost());
  // the back of the stage has a rail along it: no hopping off the far end
  t.wall(
    'standRail',
    (() => {
      const p = standPost();
      p.rect(12, 6, 8, 2, c('paint', 3)).rect(12, 13, 8, 2, c('paint', 3));
      return p;
    })(),
  );
  t.ledge(
    'stage',
    (() => {
      const p = sky(1);
      p.rect(0, 0, 20, 6, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 6, 20, 1, c('wood', 0));
      for (let x = 0; x < 20; x += 10) for (let y = 7; y < 14; y++) p.rect(x + 5 - Math.abs(y - 10), y, 1 + 2 * Math.abs(y - 10), 1, c(x ? 'blue' : 'red', 2));
      return p;
    })(),
  );
  t.air(
    'standLeg',
    (() => {
      const p = sky(2);
      p.rect(8, 0, 4, 20, c('wood', 1));
      return p;
    })(),
  );
  t.air(
    'standLegLow',
    (() => {
      const p = sky(3);
      p.rect(8, 0, 4, 20, c('wood', 1));
      return p;
    })(),
  );
  const [ht, hb] = halves(KLUB.honker, sky(1), sky(1));
  t.air('honkerTop', ht);
  t.air('honkerBot', hb);
  t.air(
    'signupTable',
    (() => {
      const p = sky(1);
      p.rect(0, 8, 20, 3, c('paint', 3)).rect(2, 11, 2, 9, c('wood', 1)).rect(16, 11, 2, 9, c('wood', 1));
      for (const x of [3, 9]) p.rect(x, 5, 5, 3, c('paint', 3)).set(x + 2, 6, c('ink', 0));
      return p;
    })(),
  );
  const [sl, sr] = wideSign(sky(1), 'DOG SHOW\nSIGN UP');
  t.air('signSignUpL', sl);
  t.air('signSignUpR', sr);
  return t;
}
