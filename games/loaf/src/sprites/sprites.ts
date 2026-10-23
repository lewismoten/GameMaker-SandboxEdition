// LOAF.CBL and LOAF.MBL: Loaf #13 (a round crusty boule with three score marks on top, a face and
// floury cheeks, that rolls: its face goes round with it) and, for the way home, the loaf wrapped
// in the child's red cloth with the knot tied on top; and everything else that moves: hungry
// hands reaching down, flying fish, a fish's flop, brother loaves passed hand to hand overhead,
// gulls, the sandaled feet of a hungry man stomping by (to a loaf, people are mostly feet), the
// third goat, weevils and a mouse in the wicker, a tiny mustard seed in red sneakers, a fox and
// an owl at dusk, a village dog, a moth, Brother Camel kneeling (two blocks wide) and the child
// waiting at her door (two blocks tall). Every sprite is drawn from shapes and given a dark outline
// (the critters that hide in the wicker and the dusk a pale one).
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { outline } from '../../../mustard/src/sprites/sprites';
import type { Pal } from '../art/pal';

export { T, outline };

export type Form = 'loaf' | 'bundle';

export interface LoafPose {
  /** front: face to you; side: face to the right (mirror for left), turned `turn` quarter turns as it rolls. */
  face: 'front' | 'side' | 'none';
  /** Quarter turns (0..3, fractions allowed) the loaf has rolled: the face and score marks go round. */
  turn?: number;
  mood?: 'smile' | 'joy' | 'ouch' | 'sad' | 'sing' | 'blink';
  /** Puffed up (risen): taller. Negative squashes it down. */
  rise?: number;
  /** A bite out of the crust (hurt). */
  bite?: boolean;
  /** Crumbling apart (0 whole .. 1 crumbs). */
  crumble?: number;
  /** Wrapped in the child's cloth. */
  wrapped?: boolean;
  /** Lean (pixels) as the bundle waddles. */
  lean?: number;
  /** Little steam wisps (a fresh loaf, singing). */
  steam?: boolean;
}

/** The loaf's look, in the pal's ramps (crust, crumb, cloth). */
export function loafArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);

  const body = (o: LoafPose): Pixels => {
    const p = new Pixels(20, 20, T);
    const rise = o.rise ?? 0;
    const rx = 8.6 - rise * 0.5 + (o.wrapped ? 0.4 : 0);
    const ry = 6.2 + rise * 1.6;
    const cx = 10 + (o.lean ?? 0) * 0.5;
    const cy = 19 - ry;
    const turn = ((o.turn ?? 0) * Math.PI) / 2;
    // a point on the loaf (local units: -1..1 of the radii), rolled round by the turn
    const at = (u: number, v: number): [number, number] => {
      const ru = u * Math.cos(turn) - v * Math.sin(turn);
      const rv = u * Math.sin(turn) + v * Math.cos(turn);
      return [cx + ru * rx, cy + rv * ry];
    };
    const inside = (x: number, y: number) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 0.92;
    const dot = (u: number, v: number, col: number, w = 1) => {
      const [x, y] = at(u, v);
      for (let dy = 0; dy < w; dy++) for (let dx = 0; dx < w; dx++) if (inside(x + dx, y + dy)) p.set(x + dx, y + dy, col);
    };
    // the crust
    blob(p, cx, cy, rx, ry, pal.r('crust'), 0, 5, 1.1);
    if (o.wrapped) {
      // the cloth: red and white checks over the bottom and sides, tied in a knot on top
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const nx = (x + 0.5 - cx) / (rx + 0.6);
          const ny = (y + 0.5 - cy) / (ry + 0.6);
          if (nx * nx + ny * ny > 1) continue;
          const face = o.face !== 'none' && Math.abs(nx - (o.face === 'side' ? 0.35 : 0)) < 0.5 && ny > -0.55 && ny < 0.35;
          if (face) continue;
          const check = (Math.floor((x + (o.lean ?? 0)) / 3) + Math.floor(y / 3)) % 2;
          p.set(x, y, check ? c('cloth', ny < -0.3 ? 2 : 1) : c('white', ny < -0.3 ? 2 : 1));
        }
      // the knot and its two ears
      const kx = Math.round(cx + (o.lean ?? 0) * 0.4);
      const ky = Math.round(cy - ry - 1);
      p.disc(kx, ky + 1, 1.6, c('cloth', 0));
      p.line(kx - 1, ky, kx - 4, ky - 3, c('cloth', 1)).line(kx - 2, ky, kx - 4, ky - 2, c('cloth', 2));
      p.line(kx + 1, ky, kx + 4, ky - 3, c('cloth', 1)).line(kx + 2, ky, kx + 4, ky - 2, c('cloth', 2));
    } else {
      // three score marks across the top (lighter crumb showing through), floured
      for (const u of [-0.45, 0, 0.45])
        for (let k = -3; k <= 3; k++) {
          dot(u + k * 0.05, -0.72 + k * 0.06, c('crumb', 1));
          if (k > -3) dot(u + k * 0.05 + 0.04, -0.72 + k * 0.06 + 0.05, c('crust', 2));
        }
      // flour dust
      for (const [u, v] of [
        [-0.6, -0.3],
        [0.7, -0.4],
        [-0.2, -0.5],
      ])
        dot(u, v, c('crumb', 2));
    }
    // the face
    if (o.face !== 'none') {
      const fu = o.face === 'side' ? 0.38 : 0;
      const eyes: [number, number][] =
        o.face === 'side'
          ? [
              [fu - 0.05, -0.12],
              [fu + 0.35, -0.12],
            ]
          : [
              [-0.32, -0.12],
              [0.32, -0.12],
            ];
      for (const [u, v] of eyes) {
        if (o.mood === 'blink' || o.mood === 'joy' || o.mood === 'sing') {
          dot(u - 0.08, v + 0.05, ink);
          dot(u + 0.06, v + 0.05, ink);
        } else if (o.mood === 'ouch' || o.mood === 'sad') {
          dot(u - 0.08, v, ink);
          dot(u + 0.08, v + 0.12, ink);
          dot(u, v + 0.06, ink);
        } else {
          dot(u, v - 0.08, ink);
          dot(u, v + 0.08, ink);
          dot(u - 0.1, v - 0.14, c('white', 2));
        }
      }
      const mu = o.face === 'side' ? fu + 0.2 : 0;
      if (o.mood === 'sing' || o.mood === 'joy') {
        for (const [du, dv] of [
          [-0.1, 0.26],
          [0, 0.26],
          [0.1, 0.26],
          [-0.05, 0.36],
          [0.05, 0.36],
          [0, 0.42],
        ])
          dot(mu + du, dv, o.mood === 'sing' ? ink : c('red', 1));
      } else if (o.mood === 'ouch' || o.mood === 'sad') {
        dot(mu - 0.12, 0.38, ink);
        dot(mu, 0.32, ink);
        dot(mu + 0.12, 0.38, ink);
      } else {
        dot(mu - 0.14, 0.26, ink);
        dot(mu - 0.05, 0.33, ink);
        dot(mu + 0.05, 0.33, ink);
        dot(mu + 0.14, 0.26, ink);
      }
      // floury cheeks
      if (o.mood !== 'sad') for (const u of o.face === 'side' ? [fu + 0.5] : [-0.55, 0.55]) dot(u, 0.16, c('crumb', 2));
    }
    // a bite out of the crust: a crescent of crumb with tooth marks
    if (o.bite) {
      const bx = cx + rx * 0.62;
      const by = cy - ry * 0.4;
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const d = Math.hypot(x - bx, y - by);
          if (d < 3.4) p.set(x, y, T);
          else if (d < 4.6 && p.get(x, y) !== T) p.set(x, y, c('crumb', 1));
        }
    }
    // crumbling: the loaf breaks into falling crumbs
    if (o.crumble) {
      const k = o.crumble;
      const src = p.px.slice();
      p.px.fill(T);
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const v = src[y * 20 + x];
          if (v === T) continue;
          const cell = ((x >> 2) * 7 + (y >> 2) * 13) % 5;
          const drop = Math.round(k * (6 + cell * 2));
          const spread = Math.round(k * ((x >> 2) - 2) * 1.2);
          if ((x + y + cell) % 3 === 0 && k > 0.5) continue;
          p.set(x + spread, Math.min(19, y + drop), v);
        }
    }
    if (o.steam)
      for (const [x, y] of [
        [5, 4],
        [10, 2],
        [15, 4],
      ])
        p.set(x, y, c('white', 1))
          .set(x + 1, y - 1, c('white', 0))
          .set(x, y - 2, c('white', 1));
    if (o.mood === 'ouch') p.px.forEach((v, i) => v !== T && v !== ink && v !== c('white', 2) && (p.px[i] = c('red', 3)));
    return outline(p, ink);
  };

  return { body };
}

/** The loaf's poses for one form: front, blink, roll (four quarter turns), rise, rise sideways, hunker, bread (singing), hurt, crumbling. */
export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const a = loafArt(pal);
  for (const form of ['loaf', 'bundle'] as Form[]) {
    const wrapped = form === 'bundle';
    const k = (name: string) => `${form}.${name}`;
    book.add(k('front'), a.body({ face: 'front', wrapped }));
    book.add(k('blink'), a.body({ face: 'front', wrapped, mood: 'blink' }));
    // rolling: the loaf turns over (its face goes round); the bundle waddles instead
    for (let t = 0; t < 4; t++)
      book.add(k(`roll${t}`), wrapped ? a.body({ face: 'side', wrapped, lean: [0, 2, 0, -2][t] }) : a.body({ face: 'side', turn: t }));
    book.add(k('rise'), a.body({ face: 'front', wrapped, mood: 'joy', rise: 1.6 }));
    book.add(k('riseSide'), a.body({ face: 'side', wrapped, mood: 'joy', rise: 1.4 }));
    book.add(k('hunker'), a.body({ face: 'front', wrapped, mood: 'blink', rise: -1.4 }));
    book.add(k('bread0'), a.body({ face: 'front', wrapped, mood: 'sing', rise: 2.2, steam: true }));
    book.add(k('bread1'), a.body({ face: 'front', wrapped, mood: 'joy', rise: 2.8, steam: true }));
    book.add(k('hurt'), a.body({ face: 'front', wrapped, mood: 'ouch', bite: true }));
    book.add(k('crumble0'), a.body({ face: 'front', wrapped, mood: 'sad', crumble: 0.35 }));
    book.add(k('crumble1'), a.body({ face: 'front', wrapped, mood: 'sad', crumble: 1 }));
  }
  return book;
}

/** Everything else that moves. */
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  // A pale outline instead of the dark one (the same pixels, so the same reach), so a critter
  // reads on the dark wicker and against the dusk.
  const lit = (p: Pixels) => outline(p, c('crumb', 0));
  // Big hungry things are solid (they push the loaf away) and take a bite.
  const hurt = (hp: number) => ({ chHitPt: Math.round(hp / 2), solid: 15 });

  // A hungry hand reaching down from above, fingers open, then closing.
  const hand = (f: number) => {
    const p = P();
    // the sleeve
    p.rect(6, 0, 9, 5, c('ochre', 1)).rect(6, 0, 2, 5, c('ochre', 0)).rect(6, 4, 9, 1, c('ochre', 2));
    blob(p, 10.5, 9, 4.6, 4, pal.r('skin'), 0, 3);
    const spread = f ? 0.5 : 1.4;
    for (let k = 0; k < 4; k++) {
      const x = 7 + k * 2.4;
      p.line(x, 11, x + (k - 1.5) * spread, 17 - Math.abs(k - 1.5) * (f ? 0 : 1), c('skin', k % 2 ? 2 : 1));
    }
    p.line(14, 9, 17 + (f ? -1 : 1), 12, c('skin', 2));
    return done(p);
  };
  book.add('hand0', hand(0), hurt(-8));
  book.add('hand1', hand(1), hurt(-8));
  // Winding up: drawn back into a fist, shaking (shake lines on alternate sides).
  const fist = (f: number) => {
    const p = P();
    const dx = f ? 1 : -1;
    p.rect(6 + dx, 0, 9, 5, c('ochre', 1))
      .rect(6 + dx, 0, 2, 5, c('ochre', 0))
      .rect(6 + dx, 4, 9, 1, c('ochre', 2));
    blob(p, 10.5 + dx, 8.5, 4.6, 3.6, pal.r('skin'), 0, 3);
    for (let k = 0; k < 4; k++) p.rect(7 + dx + k * 2.3, 11, 2, 2, c('skin', k % 2 ? 2 : 1));
    p.line(14 + dx, 8, 15 + dx, 10, c('skin', 2));
    const side = f ? 18 : 1;
    p.line(side, 5, side, 9, c('white', 2)).line(side + (f ? -1 : 1), 11, side + (f ? -1 : 1), 13, c('white', 2));
    return done(p);
  };
  book.add('fist0', fist(0), hurt(-8));
  book.add('fist1', fist(1), hurt(-8));
  // A fish flying like a prayer.
  const fish = (f: number) => {
    const p = P();
    blob(p, 10, 10, 7, 3.6, pal.r('fish'), 0, 3, 1.2);
    p.line(3, 10, 0, 6 + f * 2, c('fish', 1))
      .line(3, 10, 0, 14 - f * 2, c('fish', 1))
      .line(1, 7 + f * 2, 1, 13 - f * 2, c('fish', 0));
    p.set(14, 9, ink).set(15, 8, c('white', 2)).line(16, 11, 17, 11, ink);
    p.line(8, 7, 11, 5 + f, c('fish', 2)).line(7, 13, 9, 15, c('fish', 1));
    return done(p);
  };
  book.add('fish0', fish(0), hurt(-6));
  book.add('fish1', fish(1), hurt(-6));
  const flop = P();
  blob(flop, 10, 16, 7, 2.4, pal.r('fish'), 0, 3);
  for (const [x, y] of [
    [4, 11],
    [8, 9],
    [13, 10],
    [16, 12],
  ])
    flop.set(x, y, c('water', 3)).set(x, y + 1, c('water', 2));
  book.add('flop', done(flop));
  // A brother loaf, passed hand to hand overhead, spinning.
  const art = loafArt(pal);
  const brother = (t: number) => {
    const p = art.body({ face: 'side', turn: t, mood: t === 0 ? 'joy' : 'smile' });
    return p;
  };
  book.add('brother0', brother(0), { scorePts: 100 });
  book.add('brother1', brother(1), { scorePts: 100 });
  book.add('brotherOff0', brother(2));
  book.add('brotherOff1', brother(3));
  // A gull off the Sea of Galilee.
  const gull = (f: number) => {
    const p = P();
    blob(p, 10, 11, 5, 2.6, pal.r('white'), 0, 2);
    blob(p, 15, 9, 2.4, 2.2, pal.r('white'), 0, 2);
    p.rect(17, 9, 3, 1, c('ochre', 3)).set(16, 8, ink);
    p.line(4, 11, 1, 12, c('grey', 2));
    if (f) for (let k = 0; k < 7; k++) p.line(6 + k, 10, 3 + k, 2 + k / 3, c('grey', k > 4 ? 1 : 3));
    else for (let k = 0; k < 7; k++) p.line(6 + k, 12, 4 + k, 18 - k / 3, c('grey', k > 4 ? 1 : 3));
    return done(p);
  };
  book.add('gull0', gull(0), hurt(-5));
  book.add('gull1', gull(1), hurt(-5));
  // A hungry man stomping by: to a loaf, a hem of robe and two big sandaled feet.
  const feet = (f: number) => {
    const p = P();
    p.rect(1, 0, 18, 8, c('blue', 1)).rect(1, 0, 18, 1, c('blue', 2));
    for (let x = 2; x < 19; x += 4) p.line(x, 1, x, 7, c('blue', 0));
    p.rect(1, 7, 18, 1, c('blue', 0));
    const foot = (x: number, lift: number) => {
      p.rect(x + 2, 8 - lift, 4, 6, c('skin', 2)).rect(x + 2, 8 - lift, 1, 6, c('skin', 1));
      p.rect(x, 14 - lift, 9, 4, c('skin', 2)).rect(x, 17 - lift, 9, 1, c('skin', 1));
      p.rect(x, 18 - lift, 9, 2, c('wood', 1)).rect(x + 3, 14 - lift, 1, 4, c('wood', 0));
      p.line(x + 3, 12 - lift, x + 6, 15 - lift, c('wood', 0));
    };
    foot(1, f === 1 ? 3 : 0);
    foot(10, f === 0 ? 3 : 0);
    return done(p);
  };
  book.add('feet0', feet(0), hurt(-6));
  book.add('feet1', feet(1), hurt(-6));
  // standing still, both feet planted, before he turns round
  book.add('feetStand', feet(2), hurt(-6));
  // The third goat from the left, grazing her way across the hillside. Friendly.
  const goat = (f: number) => {
    const p = P();
    const leg = (x: number, dx: number) => p.line(x, 14, x + dx, 18, c('white', 0));
    leg(5, f ? 1 : 0);
    leg(8, f ? -1 : 0);
    leg(12, f ? 1 : 0);
    leg(15, f ? -1 : 0);
    blob(p, 10, 11, 7, 4, pal.r('white'), 0, 2);
    const hy = f ? 12 : 7;
    blob(p, 16, hy, 3, 2.6, pal.r('white'), 0, 2);
    p.line(15, hy - 3, 13, hy - 6, c('stone', 2)).line(17, hy - 3, 16, hy - 6, c('stone', 2));
    p.set(17, hy, ink).line(17, hy + 3, 17, hy + 5, c('white', 0));
    if (f) p.line(18, 17, 19, 15, c('grass', 3)).line(19, 17, 19, 14, c('grass', 2));
    return done(p);
  };
  book.add('goat0', goat(0));
  book.add('goat1', goat(1));
  // A weevil: the bread's own pest, snout first.
  const weevil = (f: number, stop = false) => {
    const p = P();
    for (let k = 0; k < 3; k++) p.line(6 + k * 3, 15, 5 + k * 3 + (stop ? 0 : f ? 2 : -1), 18, ink);
    blob(p, 9, 13, 5, 3.4, pal.r('earth'), 0, 2);
    blob(p, 14, 12, 2.4, 2.2, pal.r('earth'), 0, 3);
    p.line(16, 12, 19, 14, c('earth', 0)).set(14, 11, c('white', 2));
    if (stop) p.line(15, 10, 15, 4, ink).line(16, 10, 18, 5, ink);
    else p.line(15, 10, 17, 7 + f, ink);
    return lit(p);
  };
  book.add('weevil0', weevil(0), hurt(-4));
  book.add('weevil1', weevil(1), hurt(-4));
  // stopped, feelers up, before it turns round
  book.add('weevilStop', weevil(0, true), hurt(-4));
  // A mouse in the wicker, nose twitching.
  const mouse = (f: number) => {
    const p = P();
    p.line(2, 15, 6, 13 + f, c('grey', 2)).line(1, 13 - f, 2, 15, c('grey', 2));
    blob(p, 10, 13, 5.5, 4, pal.r('grey'), 1, 3);
    blob(p, 15, 12, 3, 2.6, pal.r('grey'), 1, 3);
    p.disc(13, 9, 1.8, c('red', 3))
      .set(18, 12 + f, c('red', 2))
      .set(15, 11, ink);
    p.line(17, 13, 19, 12 - f, c('white', 1)).line(17, 13, 19, 14 + f, c('white', 1));
    p.line(8, 17, 7 + f, 18, c('grey', 1)).line(12, 17, 13 - f, 18, c('grey', 1));
    return lit(p);
  };
  book.add('mouse0', mouse(0), hurt(-6));
  book.add('mouse1', mouse(1), hurt(-6));
  // sitting up on its haunches, whiskers going, before it turns round
  const sit = P();
  sit.line(4, 18, 1, 15, c('grey', 2));
  blob(sit, 9, 13, 4, 5, pal.r('grey'), 1, 3);
  blob(sit, 11, 7, 3, 2.8, pal.r('grey'), 1, 3);
  sit.disc(9, 4, 1.6, c('red', 3)).disc(13, 4, 1.6, c('red', 3)).set(12, 6, ink).set(14, 8, c('red', 2));
  sit.line(14, 8, 17, 6, c('white', 1)).line(14, 9, 17, 10, c('white', 1)).line(11, 11, 13, 12, c('grey', 1));
  sit.line(7, 18, 12, 18, c('grey', 1));
  book.add('mouseSit', lit(sit), hurt(-6));
  // A tiny mustard seed in tiny red sneakers, hopping along (from another song). Say hello.
  const seed = (f: number) => {
    const p = P();
    const y = f ? 10 : 13;
    p.rect(7, y + 5, 3, 2, c('red', 2))
      .rect(11, y + 5, 3, 2, c('red', 2))
      .set(9, y + 5, c('white', 2))
      .set(13, y + 5, c('white', 2));
    blob(p, 10, y, 4, 4.6, pal.r('gold'), 0, 3, 1.2);
    p.set(9, y - 1, ink)
      .set(12, y - 1, ink)
      .set(10, y + 2, ink)
      .set(11, y + 2, ink);
    p.line(11, y - 5, 12, y - 7, c('leaf', 2));
    return done(p);
  };
  book.add('seed0', seed(0), { scorePts: 250 });
  book.add('seed1', seed(1), { scorePts: 250 });
  // A fox at dusk, low and quick.
  const fox = (f: number, sniff = false) => {
    const p = P();
    // sniffing: the tail up like a flag, the nose down to the grass
    if (sniff) for (let k = 0; k < 6; k++) blob(p, 4 - k * 0.3, 10 - k * 0.8, 2.2 - k * 0.15, 1.5, pal.r('fur'), 1, 3);
    else for (let k = 0; k < 6; k++) blob(p, 3 + k * 0.6, 10 + k * 0.5 - f, 2.4 - k * 0.2, 1.6, pal.r('fur'), 1, 3);
    if (sniff) p.set(3, 5, c('white', 2)).set(2, 5, c('white', 2));
    else p.set(1, 9 - f, c('white', 2));
    blob(p, 10, 12, 5, 3.2, pal.r('fur'), 1, 3);
    const hy = sniff ? 14 : 10;
    blob(p, 15, hy, 2.8, 2.4, pal.r('fur'), 1, 3);
    p.line(14, hy - 3, 14, hy - 5, c('fur', 0))
      .line(16, hy - 3, 17, hy - 5, c('fur', 0))
      .rect(17, hy + 1, 3, 1, c('fur', 2))
      .set(19, hy + 1, ink)
      .set(16, hy - 1, ink);
    if (sniff) p.set(19, hy - 1, c('white', 2)).set(18, hy - 2, c('white', 2));
    blob(p, 11, 14, 3, 1.4, pal.r('white'), 1, 2);
    p.line(7, 15, 6 + f * 2, 19, ink).line(13, 15, 14 - f * 2, 19, ink);
    return lit(p);
  };
  book.add('fox0', fox(0), hurt(-8));
  book.add('fox1', fox(1), hurt(-8));
  book.add('foxSniff', fox(0, true), hurt(-8));
  // An owl, swooping.
  const owl = (f: number) => {
    const p = P();
    blob(p, 10, 11, 5, 5.5, pal.r('wood'), 0, 3);
    p.disc(8, 9, 1.8, c('white', 2)).disc(12, 9, 1.8, c('white', 2)).set(8, 9, ink).set(12, 9, ink).set(10, 11, c('ochre', 2));
    p.line(7, 5, 6, 3, c('wood', 1)).line(13, 5, 14, 3, c('wood', 1));
    if (f) (p.line(5, 9, 0, 3, c('wood', 1)), p.line(15, 9, 19, 3, c('wood', 1)));
    else (p.line(5, 11, 0, 15, c('wood', 1)), p.line(15, 11, 19, 15, c('wood', 1)));
    return done(p);
  };
  book.add('owl0', owl(0), hurt(-6));
  book.add('owl1', owl(1), hurt(-6));
  // A village dog, sniffing for supper.
  const dog = (f: number, sniff = false) => {
    const p = P();
    p.line(3, 9, 1, sniff ? 3 : 6 - f, c('sand', 1));
    blob(p, 9, 11, 6, 3.4, pal.r('sand'), 0, 3);
    const hy = sniff ? 13 : 9 + f;
    blob(p, 15, hy, 3, 2.6, pal.r('sand'), 0, 3);
    p.rect(17, hy + 1, 3, 2, c('sand', 2))
      .set(19, hy + 1, ink)
      .set(15, hy - 1, ink)
      .line(13, hy - 2, 12, hy + 1, c('sand', 0));
    if (sniff) p.set(19, hy - 1, c('white', 2)).set(18, hy - 2, c('white', 2));
    for (const [x, d] of [
      [5, 1],
      [8, -1],
      [11, 1],
      [13, -1],
    ])
      p.line(x, 14, x + (f ? d : 0), 18, c('sand', 0));
    return done(p);
  };
  book.add('dog0', dog(0), hurt(-7));
  book.add('dog1', dog(1), hurt(-7));
  book.add('dogSniff', dog(0, true), hurt(-7));
  // A moth round the lamps.
  const moth = (f: number) => {
    const p = P();
    blob(p, 10, 10, 1.4, 3, pal.r('earth'), 1, 3);
    for (const s of [-1, 1]) blob(p, 10 + s * (f ? 4 : 3), f ? 8 : 10, f ? 3.6 : 2.6, f ? 3 : 4, pal.r('sand'), 0, 3);
    return lit(p);
  };
  book.add('moth0', moth(0), hurt(-2));
  book.add('moth1', moth(1), hurt(-2));
  // Brother Camel, kneeling by the well, humps down (two blocks: A his humps, B his neck and head).
  const camelA = (f: number) => {
    const p = P();
    blob(p, 11, 14, 9, 4.6, pal.r('ochre'), 0, 3);
    blob(p, 8, 9 + f * 0.3, 4, 3.4, pal.r('ochre'), 0, 3);
    blob(p, 15, 10 - f * 0.3, 3.6, 3, pal.r('ochre'), 0, 3);
    p.line(2, 13, 0, 16 + f, c('ochre', 0)).rect(3, 18, 16, 2, c('ochre', 0));
    return done(p);
  };
  const camelB = (f: number) => {
    const p = P();
    p.rect(0, 13, 8, 5, c('ochre', 2)).line(0, 18, 8, 18, c('ochre', 0));
    for (let k = 0; k < 8; k++) p.rect(4 + k, 12 - k * 1.2 + (f ? 1 : 0), 3, 4, c('ochre', 2));
    blob(p, 13, 3 + f, 4, 2.6, pal.r('ochre'), 0, 3);
    p.set(14, 2 + f, ink)
      .set(17, 4 + f, ink)
      .line(12, 0 + f, 11, -1, c('ochre', 0));
    p.line(15, 5 + f, 17, 5 + f, c('ochre', 0));
    if (f) micro(p, 2, 1, 'Z', c('white', 2));
    return done(p);
  };
  book.add('camelA0', camelA(0));
  book.add('camelA1', camelA(1));
  book.add('camelB0', camelB(0));
  book.add('camelB1', camelB(1));
  // The child, waiting at her door (two blocks: A her head and shawl, B her robe and feet).
  const girlA = (f: number) => {
    const p = P();
    blob(p, 10, 13, 5, 6, pal.r('purple'), 0, 2);
    blob(p, 11, 13, 3.2, 3.6, pal.r('skin'), 1, 3);
    p.set(12, 12, ink).set(13, 15, c('red', 2)).set(9, 12, c('hair', 1)).rect(7, 19, 7, 1, c('purple', 1));
    if (f) p.set(14, 12, ink);
    return done(p);
  };
  const girlB = (f: number) => {
    const p = P();
    for (let y = 0; y < 16; y++) p.rect(10 - 3 - Math.floor(y / 4), y, 7 + Math.floor(y / 2), 1, c('red', y % 5 === 0 ? 1 : 2));
    p.rect(13, 3, 5, 3, c('skin', 2)).set(18, 4, c('cloth', 1));
    p.line(8, 16, 7 + f * 2, 19, c('skin', 1)).line(12, 16, 13 - f * 2, 19, c('skin', 1));
    return done(p);
  };
  book.add('girlA0', girlA(0));
  book.add('girlA1', girlA(1));
  book.add('girlB0', girlB(0));
  book.add('girlB1', girlB(1));
  return book;
}
