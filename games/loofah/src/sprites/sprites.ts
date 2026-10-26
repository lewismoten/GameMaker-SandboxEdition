// LOOFAH.CBL and LOOFAH.MBL: the man (Doc Leo off duty, out of the shower: shaggy gray bowl cut
// dripping wet, wire glasses, a bath towel round his middle, bare feet) and everything else that
// moves: drips from the cursed shower head, bars of cursed grapefruit and mango soap, the
// screaming towel and its cousins from the linen closet, soap bubbles, wild loofahs off the vine
// in the forest-dark aisle (and tame ones, splashed clean), an owl's eyes, three friends from
// other songs (Carl the fly, Loaf #13 and the mustard seed), Teddy and Gwinn asleep, her snoring,
// Scrubbus Maximus the demon sponge (two blocks tall, coral, horned and smug, four stages of
// being cleansed), its citrus suds, their splats, the brine splash and the pink one, clean
// again. Every sprite is drawn from shapes and given a dark outline.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { outline } from '../../../mustard/src/sprites/sprites';
import type { Pal } from '../art/pal';
import { PINK, SEQ } from '../ids';

export { T, outline };

interface ManPose {
  /** front: to you; side: walking right (mirror for left); back: climbing away from you. */
  face: 'front' | 'side' | 'back';
  /** Walk cycle (0..3); legs apart on 1 and 3. */
  step?: number;
  mood?: 'calm' | 'blink' | 'worry' | 'ouch' | 'shout' | 'swoon' | 'bliss';
  /** Arms: down, up (a hop), forehead (the back of a hand to it), fist (raised), gut (clutching it), throw (back), toss (forward). */
  arms?: 'down' | 'up' | 'forehead' | 'fist' | 'gut' | 'throw' | 'toss';
  /** Crouched (sneaking). */
  crouch?: boolean;
  /** Drops of water. */
  sweat?: number;
  /** Fainted flat on the floor (0 standing .. 1 lying). */
  faint?: number;
}

/** The man's look, in the pal's ramps. */
function manArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  const body = (o: ManPose): Pixels => {
    const p = new Pixels(20, 20, T);
    const side = o.face === 'side';
    const back = o.face === 'back';
    const crouch = o.crouch ? 2 : 0;
    const step = o.step ?? 0;
    const arms = o.arms ?? 'down';
    // bare legs and feet under a bath towel wrapped round his middle
    const legs =
      side && step % 2
        ? [
            [7, -2],
            [12, 2],
          ]
        : [
            [7, 0],
            [12, 0],
          ];
    for (const [lx, d] of legs) {
      for (let y = 16 + crouch; y < 19; y++) p.rect(lx + Math.round(((y - 16) / 3) * d) - 1, y, 2, 1, c('skin', 2));
      p.rect(lx + d - 2, 19, 4 + (side ? 1 : 0), 1, c('skin', 3));
    }
    for (let y = 13 + crouch; y < 17 + crouch; y++) p.rect(5, y, 11, 1, c('towel', y % 2 ? 2 : 1));
    p.rect(5, 13 + crouch, 11, 1, c('towel', 3));
    if (!back) p.set(side ? 14 : 12, 14 + crouch, c('towel', 0)).set(side ? 14 : 12, 15 + crouch, c('towel', 0));
    // the round bare belly (from behind, his bare back)
    blob(p, 10.5, 10.5 + crouch, 4.6, 3.4, pal.r('skin'), 1, 4);
    if (!back) p.set(side ? 12 : 10, 12 + crouch, c('skin', 0));
    // the head: a shaggy gray bowl cut, dripping wet, wire glasses
    const hx = side ? 11 : 10;
    const hy = 5 + crouch;
    blob(p, hx + 0.5, hy, 4.4, 4.2, pal.r('skin'), 1, 4);
    for (let x = hx - 4; x <= hx + 4; x++)
      for (let y = hy - 5; y <= hy - 2 + (x % 3 === 0 ? 1 : 0); y++)
        if ((x - hx - 0.5) ** 2 / 22 + (y - hy + 1) ** 2 / 18 <= 1) p.set(x, y, c('hair', (x + y) % 3 ? 1 : 2));
    if (side) p.rect(hx - 4, hy - 2, 2, 4, c('hair', 1));
    if (back) {
      // the back of his head: the shaggy bowl cut all the way down, ears and his glasses' arms
      for (let x = hx - 4; x <= hx + 4; x++)
        for (let y = hy - 2; y <= hy + 3; y++) if ((x - hx - 0.5) ** 2 / 20 + (y - hy) ** 2 / 17 <= 1) p.set(x, y, c('hair', (x + y) % 3 ? 1 : 2));
      p.set(hx - 4, hy + 1, c('skin', 3)).set(hx + 4, hy + 1, c('skin', 3));
      p.set(hx - 4, hy - 1, c('metal', 2)).set(hx + 4, hy - 1, c('metal', 2));
    }
    const eyes = side ? [hx + 1, hx + 3] : [hx - 2, hx + 2];
    const ey = hy;
    for (const ex of back ? [] : eyes) {
      p.set(ex - 1, ey - 1, c('metal', 2))
        .set(ex + 1, ey - 1, c('metal', 2))
        .set(ex - 1, ey + 1, c('metal', 2))
        .set(ex + 1, ey + 1, c('metal', 2));
      const m = o.mood ?? 'calm';
      if (m === 'blink' || m === 'bliss' || m === 'swoon')
        p.set(ex - 1, ey, ink)
          .set(ex, ey, ink)
          .set(ex + 1, ey, ink);
      else if (m === 'ouch')
        p.set(ex - 1, ey - 1, ink)
          .set(ex, ey, ink)
          .set(ex + 1, ey + 1, ink);
      else p.set(ex, ey, ink).set(ex, ey - 1, m === 'worry' || m === 'shout' ? ink : c('white', 2));
    }
    if (!side && !back)
      p.set(hx - 1, ey - 1, c('metal', 2))
        .set(hx + 1, ey - 1, c('metal', 2))
        .set(hx, ey - 1, c('metal', 2));
    const mx = side ? hx + 2 : hx;
    const mood = o.mood ?? 'calm';
    if (back) {
      // no face from behind
    } else if (mood === 'shout' || mood === 'ouch') p.rect(mx - 1, hy + 2, 3, 2, ink).set(mx, hy + 3, c('red', 2));
    else if (mood === 'worry')
      p.set(mx - 1, hy + 3, ink)
        .set(mx, hy + 2, ink)
        .set(mx + 1, hy + 3, ink);
    else if (mood === 'bliss')
      p.set(mx - 1, hy + 2, ink)
        .set(mx, hy + 3, ink)
        .set(mx + 1, hy + 2, ink)
        .set(mx + 2, hy + 1, c('wax', 2));
    else
      p.set(mx - 1, hy + 2, ink)
        .set(mx, hy + 2, ink)
        .set(mx + 1, hy + 2, ink);
    if (!side && !back) p.set(hx - 4, hy + 1, c('skin', 3)).set(hx + 4, hy + 1, c('skin', 3));
    // arms
    const skin = c('skin', 2);
    const arm = (x0: number, y0: number, x1: number, y1: number) => p.line(x0, y0, x1, y1, skin).line(x0 + 1, y0, x1 + 1, y1, c('skin', 1));
    const sy = 9 + crouch;
    if (arms === 'down') (arm(5, sy, 4, sy + 4), arm(15, sy, 16, sy + 4));
    if (arms === 'up') (arm(5, sy, 2, sy - 6), arm(15, sy, 17, sy - 6));
    if (arms === 'forehead') (arm(5, sy, 4, sy + 4), arm(15, sy, hx + 3, hy - 2));
    if (arms === 'fist') (arm(5, sy, 4, sy + 4), arm(15, sy, 17, sy - 7), p.disc(17, sy - 8, 1.4, skin));
    if (arms === 'gut') (arm(5, sy, 8, sy + 3), arm(15, sy, 12, sy + 3));
    if (arms === 'throw')
      (arm(5, sy, 3, sy + 3),
        arm(15, sy, 13, sy - 6),
        p
          .rect(11, sy - 11, 4, 6, c('rosemary', 1))
          .rect(12, sy - 13, 2, 2, c('wood', 2))
          .set(12, sy - 9, c('suds', 2)));
    if (arms === 'toss') (arm(5, sy, 3, sy + 3), arm(15, sy, 19, sy - 2));
    // drops of water
    for (let k = 0; k < (o.sweat ?? 0); k++) {
      const [x, y] = [
        [3, 3],
        [17, 5],
        [2, 9],
        [18, 1],
      ][k % 4];
      p.set(x, y, c('wet', 1)).set(x, y + 1, c('wet', 0));
    }
    // fainting: tip him over (about his middle), then settle what's left onto the floor
    if (o.faint) {
      const src = p.px.slice();
      p.px.fill(T);
      const a = (o.faint * Math.PI) / 2;
      let low = 0;
      const out: [number, number, number][] = [];
      for (let y = 0; y < 20; y++)
        for (let x = 0; x < 20; x++) {
          const dx = x - 10;
          const dy = y - 10;
          const sx = Math.round(10 + dx * Math.cos(a) + dy * Math.sin(a));
          const sy2 = Math.round(10 - dx * Math.sin(a) + dy * Math.cos(a));
          if (sx < 0 || sy2 < 0 || sx >= 20 || sy2 >= 20) continue;
          const v = src[sy2 * 20 + sx];
          if (v === T) continue;
          out.push([x, y, v]);
          low = Math.max(low, y);
        }
      for (const [x, y, v] of out) p.set(x, y + 19 - low, v);
    }
    return outline(p, ink);
  };
  return { body };
}

/** The man's poses: front, blink, walking, hopping, sneaking, singing, hurt, fainting, throwing the brine. */
export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const a = manArt(pal);
  book.add('front', a.body({ face: 'front' }));
  book.add('blink', a.body({ face: 'front', mood: 'blink' }));
  book.add('worry', a.body({ face: 'front', mood: 'worry', arms: 'gut', sweat: 2 }));
  for (let s = 0; s < 4; s++) book.add(`walk${s}`, a.body({ face: 'side', step: s }));
  book.add('hop', a.body({ face: 'front', arms: 'up', mood: 'worry' }));
  book.add('hopSide', a.body({ face: 'side', arms: 'up', step: 1, mood: 'worry' }));
  book.add('sneak0', a.body({ face: 'side', crouch: true, step: 0, mood: 'worry' }));
  book.add('sneak1', a.body({ face: 'side', crouch: true, step: 1, mood: 'worry' }));
  book.add('sing0', a.body({ face: 'front', arms: 'forehead', mood: 'swoon', sweat: 1 }));
  book.add('sing1', a.body({ face: 'front', arms: 'fist', mood: 'shout', sweat: 3 }));
  book.add('hurt', a.body({ face: 'front', arms: 'gut', mood: 'ouch', sweat: 4 }));
  book.add('faint0', a.body({ face: 'front', arms: 'forehead', mood: 'swoon', sweat: 2, faint: 0.4 }));
  book.add('faint1', a.body({ face: 'front', arms: 'forehead', mood: 'swoon', sweat: 2, faint: 1 }));
  book.add('throw0', a.body({ face: 'side', arms: 'throw', mood: 'shout' }));
  book.add('throw1', a.body({ face: 'side', arms: 'toss', mood: 'shout', sweat: 2 }));
  book.add('bliss', a.body({ face: 'front', mood: 'bliss' }));
  // hopping straight up, and climbing a vine: his back, arms up
  book.add('climb', a.body({ face: 'back', arms: 'up' }));
  return book;
}

/** Everything else that moves. */
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  // Hurting things are solid (they push him away) and cost dignity.
  const hurt = (hp: number, solid = 15) => ({ chHitPt: hp, solid });
  /** Two dot eyes and a mouth on a face at (x, y). */
  const face = (p: Pixels, x: number, y: number, o: { wink?: boolean; grin?: boolean; angry?: boolean; scream?: boolean; smug?: boolean } = {}) => {
    p.set(x - 2, y, ink).set(x + 2, y, o.wink ? c('white', 2) : ink);
    if (o.wink) p.set(x + 1, y, ink).set(x + 3, y, ink);
    if (o.angry)
      p.set(x - 3, y - 2, ink)
        .set(x - 2, y - 1, ink)
        .set(x + 3, y - 2, ink)
        .set(x + 2, y - 1, ink);
    if (o.smug) p.line(x - 3, y - 1, x - 1, y - 1, ink).line(x + 1, y - 1, x + 3, y - 1, ink);
    if (o.scream) p.rect(x - 1, y + 2, 3, 3, ink).set(x, y + 3, c('red', 2));
    else if (o.smug)
      p.set(x - 2, y + 2, ink)
        .set(x - 1, y + 3, ink)
        .set(x, y + 3, ink)
        .set(x + 1, y + 3, ink)
        .set(x + 2, y + 3, ink)
        .set(x + 3, y + 2, ink);
    else if (o.grin)
      p.set(x - 2, y + 2, ink)
        .set(x - 1, y + 3, ink)
        .set(x, y + 3, ink)
        .set(x + 1, y + 3, ink)
        .set(x + 2, y + 2, ink);
    else
      p.set(x - 1, y + 2, ink)
        .set(x, y + 2, ink)
        .set(x + 1, y + 2, ink);
  };
  /** Loofah mesh: a net of darker threads over a blob. */
  const mesh = (p: Pixels, x0: number, y0: number, x1: number, y1: number, col: number, step = 3) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (p.get(x, y) !== T && ((x + y) % step === 0 || (x - y + 40) % step === 0)) p.set(x, y, col);
  };

  // ---- I. the haunted bathroom
  // a drip from the cursed shower head
  const drip = (f: number) => {
    const p = P();
    blob(p, 10, 10 + f, 2.4, 3.4, pal.r('wet'), 0, 1);
    p.set(10, 6 + f, c('wet', 0)).set(9, 9 + f, c('white', 2));
    return done(p);
  };
  book.add('drip0', drip(0), hurt(-4, 0));
  book.add('drip1', drip(1), hurt(-4, 0));
  // bars of cursed soap, sliding: grapefruit (pink-orange) and mango (gold), grinning
  const soap = (ramp: string, f: number) => {
    const p = P();
    const y = f ? 1 : 0;
    p.rect(3, 9 + y, 14, 9, c(ramp, 2))
      .rect(3, 9 + y, 14, 2, c(ramp, 3))
      .rect(3, 16 + y, 14, 2, c(ramp, 1));
    face(p, 10, 13 + y, { angry: true, grin: f === 1 });
    for (const [x, yy] of [
      [4, 5 - f],
      [15, 4 + f],
      [10, 3],
    ])
      p.ring(x, yy, 1.4, c('suds', 2));
    return done(p);
  };
  book.add('grapefruit0', soap('citrus', 0), hurt(-8));
  book.add('grapefruit1', soap('citrus', 1), hurt(-8));
  book.add('mango0', soap('mango', 0), hurt(-8));
  book.add('mango1', soap('mango', 1), hurt(-8));
  // the screaming towel on its bar: it hangs, it opens its mouth, it SCREAMS
  const towel = (f: number) => {
    const p = P();
    for (let y = 4; y < 20; y++) p.rect(4 + (y > 16 && f ? 1 : 0), y, 12, 1, c('towel', y % 4 < 2 ? 2 : 1));
    p.rect(4, 4, 12, 2, c('towel', 3)).rect(4, 17, 12, 1, c('white', 2));
    face(p, 10, 9, { angry: true, scream: f === 1 });
    if (f)
      for (const [x, y] of [
        [1, 6],
        [18, 7],
        [0, 12],
        [19, 12],
      ])
        p.set(x, y, c('white', 2));
    return done(p);
  };
  book.add('towel0', towel(0), hurt(-10));
  book.add('towel1', towel(1), hurt(-10));
  // a soap bubble drifting up
  const bubble = (f: number) => {
    const p = P();
    p.ring(10, 10, 4 + f * 0.5, c('suds', 2))
      .set(8, 8, c('white', 2))
      .set(12, 7, c('pink', 3))
      .set(13, 12, c('towel', 3));
    return p;
  };
  book.add('bubble0', bubble(0));
  book.add('bubble1', bubble(1));
  // Carl the fly (from another song), buzzing round the candles
  const carl = (f: number) => {
    const p = P();
    blob(p, 10, 12, 3.4, 2.6, pal.r('gray'), 0, 2);
    blob(p, 13, 11, 2, 2, pal.r('gray'), 0, 1);
    p.disc(14, 10, 1.2, c('red', 3));
    for (const s of [-1, 1]) blob(p, 9 + s * 2, f ? 7 : 9, 3, 2, pal.r('white'), 1, 2);
    p.line(8, 14, 7, 17, ink).line(11, 14, 12, 17, ink);
    return done(p);
  };
  book.add('carl0', carl(0), { scorePts: 100 });
  book.add('carl1', carl(1), { scorePts: 100 });

  // ---- II. the forest-dark aisle
  // a wild loofah off the vine: a dried gourd, all mesh, angry, hopping
  const feral = (f: number) => {
    const p = P();
    const y = f ? -3 : 0;
    blob(p, 10, 13 + y, 5, 6, pal.r('gourd'), 0, 3);
    mesh(p, 4, 6 + y, 16, 20 + y, c('gourd', 0));
    p.line(10, 6 + y, 12, 3 + y, c('green', 1));
    face(p, 10, 12 + y, { angry: true, grin: true });
    // a pale pink rim outside the ink, so it shows against the dark of the aisle
    return outline(done(p), c('rim', 1));
  };
  book.add('feral0', feral(0), hurt(-8));
  book.add('feral1', feral(1), hurt(-8));
  // a tame one: splashed with brine, a plain clean sponge, smiling (points)
  const tame = (f: number) => {
    const p = P();
    blob(p, 10, 14, 5, 5, pal.r('gourd'), 2, 3);
    mesh(p, 4, 8, 16, 20, c('gourd', 1), 4);
    face(p, 10, 13, { grin: true });
    for (let k = 0; k < 3; k++) p.set(4 + k * 6, 4 + ((k + f) % 2) * 2, c('suds', 2));
    return done(p);
  };
  book.add('tame0', tame(0), { scorePts: 150 });
  book.add('tame1', tame(1), { scorePts: 150 });
  // an owl's eyes in the dark
  const owl = (open: boolean) => {
    const p = P();
    if (open) for (const x of [6, 13]) p.disc(x, 10, 2.4, c('eye', 0)).set(x, 10, ink);
    else for (const x of [6, 13]) p.line(x - 2, 10, x + 2, 10, c('eye', 0));
    return p;
  };
  book.add('owl0', owl(true));
  book.add('owl1', owl(false));
  // Loaf #13, in the day-old bin
  const loaf = (f: number) => {
    const p = P();
    blob(p, 10, 14, 7.6, 5 + f * 0.6, pal.r('crust'), 0, 3, 1.1);
    for (const u of [-3, 0, 3]) p.line(10 + u - 1, 10, 10 + u + 1, 11, c('wax', 2));
    face(p, 10, 14, { grin: true });
    return done(p);
  };
  book.add('loaf0', loaf(0), { scorePts: 250 });
  book.add('loaf1', loaf(1), { scorePts: 250 });
  // the mustard seed in red sneakers, at the spice rack
  const seed = (f: number) => {
    const p = P();
    const y = f ? 10 : 13;
    p.rect(7, y + 5, 3, 2, c('red', 2))
      .rect(11, y + 5, 3, 2, c('red', 2))
      .set(9, y + 5, c('white', 2))
      .set(13, y + 5, c('white', 2));
    blob(p, 10, y, 4, 4.6, pal.r('cheese'), 0, 3, 1.2);
    p.set(9, y - 1, ink)
      .set(12, y - 1, ink)
      .set(10, y + 2, ink)
      .set(11, y + 2, ink);
    p.line(11, y - 5, 12, y - 7, c('green', 2));
    return done(p);
  };
  book.add('seed0', seed(0), { scorePts: 250 });
  book.add('seed1', seed(1), { scorePts: 250 });

  // ---- III. home in the dark
  const dogAsleep = (f: number, fur: string, chest: string, collar?: string) => {
    const p = P();
    blob(p, 10, 15, 8.6, 4 + f * 0.4, pal.r(fur), 0, 3);
    blob(p, 6, 13, 3.4, 2.8, pal.r(fur), 1, 3);
    p.line(4, 10, 3, 7, c(fur, 2)).line(7, 10, 8, 7, c(fur, 2));
    blob(p, 7, 15, 2.2, 1.6, pal.r(chest), 1, 2);
    p.set(4, 13, ink).set(7, 13, ink).set(2, 14, ink);
    if (collar) p.rect(5, 15, 4, 1, c(collar, 2));
    micro(p, 13, 2 - f, 'z', c('white', 2));
    return done(p);
  };
  book.add('teddy0', dogAsleep(0, 'fur', 'white'), hurt(-3));
  book.add('teddy1', dogAsleep(1, 'fur', 'white'), hurt(-3));
  book.add('gwinn0', dogAsleep(0, 'liver', 'liver', 'pink'), hurt(-3));
  book.add('gwinn1', dogAsleep(1, 'liver', 'liver', 'pink'), hurt(-3));
  // a towel from the linen closet, flapping down the hall, screaming
  const flapper = (f: number) => {
    const p = P();
    for (let x = 2; x < 18; x++) {
      const y0 = 6 + Math.round(Math.sin(x / 2.5 + f * 2) * 2);
      p.rect(x, y0, 1, 8, c('pink', (x + f) % 3 ? 2 : 1));
    }
    face(p, 10, 9, { angry: true, scream: true });
    return done(p);
  };
  book.add('flapper0', flapper(0), hurt(-10));
  book.add('flapper1', flapper(1), hurt(-10));
  const zzz = (f: number) => {
    const p = P();
    micro(p, 6 + f, 6, 'Z', c('white', 2), 2);
    return p;
  };
  book.add('zzz0', zzz(0));
  book.add('zzz1', zzz(1));

  // ---- IV. Scrubbus Maximus, the demon sponge: A its horns and smug face, B its mesh body and
  // the loop it hangs by; four stages, each splash of brine washing a little of the coral out
  const sponge = (half: 'A' | 'B', stage: number, f: number) => {
    const p = P();
    const ramp = stage >= 3 ? 'pink' : 'coral';
    const light = stage >= 2 ? 3 : 2;
    if (half === 'A') {
      blob(p, 10, 13, 8, 7, pal.r(ramp), 1, light + 1);
      // the horns (they droop as it's cleansed)
      const droop = stage >= 2 ? 3 : 0;
      p.line(4, 8, 2, 1 + droop, c('demon', 1))
        .line(5, 8, 3, 1 + droop, c('demon', 2))
        .line(16, 8, 18, 1 + droop, c('demon', 1))
        .line(15, 8, 17, 1 + droop, c('demon', 2));
      mesh(p, 2, 6, 19, 20, c(ramp, 0));
      p.set(7, 11, c('eye', stage >= 3 ? 0 : 1)).set(13, 11, c('eye', stage >= 3 ? 0 : 1));
      face(p, 10, 11, { smug: stage < 2, grin: stage >= 2 && f === 0 });
      if (stage >= 1)
        for (const [x, y] of [
          [5, 15],
          [15, 9],
          [9, 17],
        ])
          p.set(x, y, c('suds', 2));
      // a wisp of grapefruit scent
      if (stage < 3) p.set(18, 4 + f, c('citrus', 3)).set(19, 2 + f, c('citrus', 2));
    } else {
      blob(p, 10, 8, 8, 8, pal.r(ramp), 1, light);
      mesh(p, 2, 0, 19, 17, c(ramp, 0));
      // little claws, and the loop of cord
      for (const x of [5, 9, 13]) p.line(x + f, 15, x - 1 + f, 19, c('demon', 1));
      p.ring(17, 15, 2.4, c('wax', 1));
      if (stage >= 1) p.rect(5, 3, 3, 2, c('suds', 2));
      if (stage >= 2) p.rect(12, 9, 3, 3, c('suds', 2));
      if (stage >= 3) p.set(7, 11, c('rosemary', 2)).set(11, 5, c('rosemary', 2));
    }
    return done(p);
  };
  for (const half of ['A', 'B'] as const)
    for (let s = 0; s < 4; s++) {
      book.add(`sponge${half}${s}a`, sponge(half, s, 0), hurt(-12));
      book.add(`sponge${half}${s}b`, sponge(half, s, 1), hurt(-12));
    }
  // a ball of cursed citrus suds, flying, and its splat
  const suds = (f: number) => {
    const p = P();
    blob(p, 10, 10, 5, 5, pal.r('citrus'), 1, 3);
    for (const [x, y] of [
      [6, 7],
      [13, 8],
      [9, 13],
      [12, 12],
    ])
      p.ring(x + f, y, 1.6, c('suds', 2));
    return done(p);
  };
  book.add('suds0', suds(0), hurt(-4, 0));
  book.add('suds1', suds(1), hurt(-4, 0));
  const splat = P();
  blob(splat, 10, 17, 8, 2.6, pal.r('citrus'), 1, 3);
  for (const [x, y] of [
    [3, 12],
    [7, 10],
    [13, 11],
    [17, 13],
  ])
    splat.ring(x, y, 1.2, c('suds', 2));
  book.add('splat', done(splat), hurt(-1, 0));
  // the brine he throws: salt water with a sprig of rosemary in it
  const brine = (f: number) => {
    const p = P();
    blob(p, 10, 10, 6 - f, 4 + f, pal.r('suds'), 0, 2);
    for (const [x, y] of [
      [3, 6 + f],
      [16, 5 - f],
      [4, 15 - f],
      [17, 14 + f],
      [10, 3 + f],
    ])
      p.disc(x, y, 1.2, c('wet', 1));
    p.line(7, 11, 13, 9, c('rosemary', 1)).set(9, 9, c('rosemary', 2)).set(11, 11, c('rosemary', 2));
    return done(p);
  };
  book.add('brine0', brine(0));
  book.add('brine1', brine(1));
  // the pink one, clean again, glowing
  const pink = (f: number) => {
    const p = P();
    for (let k = 0; k < 6; k++) p.set((k * 7 + f * 3) % 20, (k * 5 + f * 7) % 20, c('gold', 2));
    blob(p, 10, 11, 6, 6, pal.r('pink'), 1, 3);
    mesh(p, 4, 5, 17, 18, c('pink', 0));
    p.ring(10, 3, 2, c('wax', 2));
    return done(p);
  };
  book.add('pink0', pink(0), { effect: PINK, eamt: 1, scorePts: 1000 });
  book.add('pink1', pink(1), { effect: PINK, eamt: 1, scorePts: 1000 });
  // steam curling up
  const puff = (f: number) => {
    const p = P();
    blob(p, 9 + f, 13 - f * 2, 5, 3.6, pal.r('steam'), 1, 3);
    blob(p, 12 - f, 7 - f, 3.4, 2.6, pal.r('steam'), 2, 3);
    return p;
  };
  book.add('steam0', puff(0));
  book.add('steam1', puff(1));
  // (last, so every other block keeps its number) the friends flying off: the same pictures,
  // worth nothing, so brushing past them as they go doesn't score every tick
  book.add('carlOff0', carl(0));
  book.add('carlOff1', carl(1));
  book.add('loafOff0', loaf(0));
  book.add('loafOff1', loaf(1));
  book.add('seedOff0', seed(0));
  book.add('seedOff1', seed(1));
  book.add('flapperOff0', flapper(0));
  book.add('flapperOff1', flapper(1));
  // a fresh sprig of rosemary on the pot in the shower: two splashes of brine
  const sprig = P();
  for (const [x, d] of [
    [8, -1],
    [12, 1],
  ]) {
    sprig.line(x, 18, x + d * 3, 6, c('wood', 2));
    for (let y = 7; y < 18; y += 2) sprig.set(x + d * ((18 - y) / 4) - 1, y, c('rosemary', 2)).set(x + d * ((18 - y) / 4) + 1, y + 1, c('rosemary', 1));
  }
  book.add('sprig', done(sprig), { effect: SEQ.throw, eamt: 2 });
  return book;
}
