// RECKON.CBL and RECKON.MBL: the man (Doc Leo off duty at 3:17 a.m.: shaggy grey bowl cut,
// wire glasses, shirtless and sweating, striped pajama pants, fuzzy slippers) and everything
// else that moves: Teddy and Gwinn asleep (and later awake, wanting to play), the snoring Zs, the
// dairy in the fridge come to life (a hopping milk carton, a bouncing yogurt, a winking wedge of
// cheddar, an ice cream cone, a stick of butter), three friends from other songs (Carl the fly,
// Loaf #13 and the mustard seed), the Swamp Demon (the gurgle, a green cloud with eyes), the
// Devil in leisure wear (two blocks tall, sipping a milkshake, four stages of being splashed),
// his milkshakes, their splats, the almond milk splash and the Devil's last straw. Every sprite
// is drawn from shapes and given a dark outline.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { outline } from '../../../mustard/src/sprites/sprites';
import type { Pal } from '../art/pal';
import { SEQ, STRAW } from '../ids';

export { T, outline };

export interface ManPose {
  /** front: to you; side: walking right (mirror for left). */
  face: 'front' | 'side';
  /** Walk cycle (0..3); legs apart on 1 and 3. */
  step?: number;
  mood?: 'calm' | 'blink' | 'worry' | 'ouch' | 'shout' | 'swoon' | 'bliss';
  /** Arms: down, up (a hop), forehead (the back of a hand to it), fist (raised), gut (clutching it), throw (back), toss (forward). */
  arms?: 'down' | 'up' | 'forehead' | 'fist' | 'gut' | 'throw' | 'toss';
  /** Crouched (sneaking). */
  crouch?: boolean;
  /** Sweat drops. */
  sweat?: number;
  /** Fainted flat on the floor (0 standing .. 1 lying). */
  faint?: number;
}

/** The man's look, in the pal's ramps. */
export function manArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  const body = (o: ManPose): Pixels => {
    const p = new Pixels(20, 20, T);
    const side = o.face === 'side';
    const crouch = o.crouch ? 2 : 0;
    const step = o.step ?? 0;
    const arms = o.arms ?? 'down';
    // pajama pants (striped) and slippers
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
      for (let y = 14 + crouch; y < 18; y++) p.rect(lx + Math.round(((y - 14) / 4) * d) - 1, y, 3, 1, c('pjs', (lx + y) % 3 ? 2 : 3));
      p.rect(lx + d - 2, 18, 4 + (side ? 1 : 0), 2, c('red', 1)).set(lx + d - 2, 18, c('red', 2));
    }
    p.rect(6, 13 + crouch, 9, 2, c('pjs', 2)).rect(6, 13 + crouch, 9, 1, c('white', 1));
    // the round bare belly
    blob(p, 10.5, 10.5 + crouch, 4.6, 3.4, pal.r('skin'), 1, 4);
    p.set(side ? 12 : 10, 12 + crouch, c('skin', 0));
    // the head: a shaggy grey bowl cut, wire glasses
    const hx = side ? 11 : 10;
    const hy = 5 + crouch;
    blob(p, hx + 0.5, hy, 4.4, 4.2, pal.r('skin'), 1, 4);
    for (let x = hx - 4; x <= hx + 4; x++)
      for (let y = hy - 5; y <= hy - 2 + (x % 3 === 0 ? 1 : 0); y++)
        if ((x - hx - 0.5) ** 2 / 22 + (y - hy + 1) ** 2 / 18 <= 1) p.set(x, y, c('hair', (x + y) % 3 ? 1 : 2));
    if (side) p.rect(hx - 4, hy - 2, 2, 4, c('hair', 1));
    const eyes = side ? [hx + 1, hx + 3] : [hx - 2, hx + 2];
    const ey = hy;
    for (const ex of eyes) {
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
    if (!side)
      p.set(hx - 1, ey - 1, c('metal', 2))
        .set(hx + 1, ey - 1, c('metal', 2))
        .set(hx, ey - 1, c('metal', 2));
    const mx = side ? hx + 2 : hx;
    const mood = o.mood ?? 'calm';
    if (mood === 'shout' || mood === 'ouch') p.rect(mx - 1, hy + 2, 3, 2, ink).set(mx, hy + 3, c('red', 2));
    else if (mood === 'worry')
      p.set(mx - 1, hy + 3, ink)
        .set(mx, hy + 2, ink)
        .set(mx + 1, hy + 3, ink);
    else if (mood === 'bliss')
      p.set(mx - 1, hy + 2, ink)
        .set(mx, hy + 3, ink)
        .set(mx + 1, hy + 2, ink)
        .set(mx + 2, hy + 1, c('cream', 3));
    else
      p.set(mx - 1, hy + 2, ink)
        .set(mx, hy + 2, ink)
        .set(mx + 1, hy + 2, ink);
    if (!side) p.set(hx - 4, hy + 1, c('skin', 3)).set(hx + 4, hy + 1, c('skin', 3));
    // arms
    const skin = c('skin', 2);
    const arm = (x0: number, y0: number, x1: number, y1: number) => p.line(x0, y0, x1, y1, skin).line(x0 + 1, y0, x1 + 1, y1, c('skin', 1));
    const sy = 9 + crouch;
    if (arms === 'down') (arm(5, sy, 4, sy + 4), arm(15, sy, 16, sy + 4));
    if (arms === 'up') (arm(5, sy, 2, sy - 6), arm(15, sy, 17, sy - 6));
    if (arms === 'forehead') (arm(5, sy, 4, sy + 4), arm(15, sy, hx + 3, hy - 2));
    if (arms === 'fist') (arm(5, sy, 4, sy + 4), arm(15, sy, 17, sy - 7), p.disc(17, sy - 8, 1.4, skin));
    if (arms === 'gut') (arm(5, sy, 8, sy + 3), arm(15, sy, 12, sy + 3));
    if (arms === 'throw') (arm(5, sy, 3, sy + 3), arm(15, sy, 13, sy - 6), p.rect(11, sy - 10, 4, 5, c('white', 2)).rect(11, sy - 8, 4, 2, c('crust', 2)));
    if (arms === 'toss') (arm(5, sy, 3, sy + 3), arm(15, sy, 19, sy - 2));
    // sweat
    for (let k = 0; k < (o.sweat ?? 0); k++) {
      const [x, y] = [
        [3, 3],
        [17, 5],
        [2, 9],
        [18, 1],
      ][k % 4];
      p.set(x, y, c('sweat', 1)).set(x, y + 1, c('sweat', 0));
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

/** The man's poses: front, blink, walking, hopping, sneaking, the monologue, hurt, fainting, throwing. */
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
  book.add('speak0', a.body({ face: 'front', arms: 'forehead', mood: 'swoon', sweat: 1 }));
  book.add('speak1', a.body({ face: 'front', arms: 'fist', mood: 'shout', sweat: 3 }));
  book.add('hurt', a.body({ face: 'front', arms: 'gut', mood: 'ouch', sweat: 4 }));
  book.add('faint0', a.body({ face: 'front', arms: 'forehead', mood: 'swoon', sweat: 2, faint: 0.4 }));
  book.add('faint1', a.body({ face: 'front', arms: 'forehead', mood: 'swoon', sweat: 2, faint: 1 }));
  book.add('throw0', a.body({ face: 'side', arms: 'throw', mood: 'shout' }));
  book.add('throw1', a.body({ face: 'side', arms: 'toss', mood: 'shout', sweat: 2 }));
  book.add('bliss', a.body({ face: 'front', mood: 'bliss' }));
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
  const face = (p: Pixels, x: number, y: number, o: { wink?: boolean; grin?: boolean; angry?: boolean } = {}) => {
    p.set(x - 2, y, ink).set(x + 2, y, o.wink ? c('white', 2) : ink);
    if (o.wink) p.set(x + 1, y, ink).set(x + 3, y, ink);
    if (o.angry)
      p.set(x - 3, y - 2, ink)
        .set(x - 2, y - 1, ink)
        .set(x + 3, y - 2, ink)
        .set(x + 2, y - 1, ink);
    if (o.grin)
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

  // ---- Teddy and Gwinn, asleep (curled up, breathing) and awake (pacing, tails going)
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
  const dogAwake = (f: number, fur: string, chest: string, collar?: string, tall = false) => {
    const p = P();
    for (const [x, d] of [
      [5, 1],
      [8, -1],
      [12, 1],
      [15, -1],
    ])
      p.line(x, 15, x + (f ? d : 0), 19, c(fur, 0));
    blob(p, 9, 12, 7, 3.6, pal.r(fur), 0, 3);
    blob(p, 15, 8 + f, 3.4, 3, pal.r(fur), 0, 3);
    p.line(13, 5 + f, 13, tall ? 0 : 2, c(fur, 2)).line(17, 5 + f, 18, tall ? 1 : 3, c(fur, 2));
    blob(p, 15, 11, 2.2, 1.6, pal.r(chest), 1, 2);
    p.set(16, 7 + f, ink)
      .set(19, 9 + f, ink)
      .set(18, 11 + f, c('pink', 2));
    p.line(2, 10, 0, 6 + f * 3, c(fur, 1));
    if (collar) p.rect(13, 11, 4, 1, c(collar, 2));
    return done(p);
  };
  book.add('teddyUp0', dogAwake(0, 'fur', 'white', undefined, true), hurt(-2));
  book.add('teddyUp1', dogAwake(1, 'fur', 'white', undefined, true), hurt(-2));
  book.add('gwinnUp0', dogAwake(0, 'liver', 'liver', 'pink'), hurt(-2));
  book.add('gwinnUp1', dogAwake(1, 'liver', 'liver', 'pink'), hurt(-2));
  // her snoring: a Z drifting up
  const zzz = (f: number) => {
    const p = P();
    micro(p, 6 + f, 6, 'Z', c('white', 2), 2);
    return p;
  };
  book.add('zzz0', zzz(0));
  book.add('zzz1', zzz(1));

  // ---- the dairy, come to life
  const milk = (f: number) => {
    const p = P();
    const y = f ? 0 : 3;
    p.rect(5, 5 + y, 10, 12, c('white', 2)).rect(5, 9 + y, 10, 4, c('pjs', 2));
    for (let k = 0; k < 4; k++) p.rect(5 + k, 4 + y - k, 10 - k * 2, 1, c('white', 1));
    micro(p, 6, 10 + y, 'MLK', c('white', 2));
    face(p, 10, 7 + y, { grin: true });
    p.line(7, 17 + y, 6 - f, 19, ink).line(12, 17 + y, 13 + f, 19, ink);
    return done(p);
  };
  book.add('milk0', milk(0), hurt(-8));
  book.add('milk1', milk(1), hurt(-8));
  const yogurt = (f: number) => {
    const p = P();
    const y = f ? -3 : 0;
    for (let yy = 8; yy < 19; yy++) p.rect(5 + Math.floor((yy - 8) / 4), yy + y, 10 - Math.floor((yy - 8) / 2), 1, c('pink', yy < 10 ? 2 : 1));
    p.rect(4, 7 + y, 12, 2, c('metal', 3));
    face(p, 10, 12 + y, { grin: f === 1 });
    return done(p);
  };
  book.add('yogurt0', yogurt(0), hurt(-8));
  book.add('yogurt1', yogurt(1), hurt(-8));
  const cheese = (f: number) => {
    const p = P();
    for (let y = 6; y < 18; y++) p.rect(3, y, Math.round(2 + (y - 6) * 1.2), 1, c('cheese', y === 6 ? 3 : 2));
    p.rect(3, 17, 16, 2, c('cheese', 1));
    for (const [x, y] of [
      [6, 14],
      [11, 15],
      [8, 10],
    ])
      p.disc(x, y, 1, c('cheese', 0));
    face(p, 8, 12, { wink: f === 1, grin: true });
    return done(p);
  };
  book.add('cheese0', cheese(0), hurt(-8));
  book.add('cheese1', cheese(1), hurt(-8));
  const cream = (f: number) => {
    const p = P();
    for (let y = 10; y < 20; y++) p.rect(10 - Math.round((20 - y) / 2.5) + f, y, Math.round((20 - y) / 1.25) || 1, 1, c('crust', (y % 3) + 1));
    blob(p, 10 + f, 7, 5, 4, pal.r('cream'), 1, 3);
    blob(p, 10 + f, 3, 3.4, 2.6, pal.r('berry'), 1, 3);
    face(p, 10 + f, 7, { grin: true });
    return done(p);
  };
  book.add('cream0', cream(0), hurt(-8));
  book.add('cream1', cream(-1), hurt(-8));
  const butter = (f: number) => {
    const p = P();
    p.rect(2, 11, 16, 7, c('cheese', 3)).rect(2, 11, 16, 2, c('white', 2)).rect(2, 13, 4, 5, c('white', 1));
    face(p, 12, 14, { grin: f === 1 });
    for (let k = 0; k < 3; k++) p.set(0, 13 + k * 2, c('cheese', 2 - f));
    return done(p);
  };
  book.add('butter0', butter(0), hurt(-6));
  book.add('butter1', butter(1), hurt(-6));

  // ---- friends from other songs
  // Carl the fly, buzzing round the kitchen
  const carl = (f: number) => {
    const p = P();
    blob(p, 10, 12, 3.4, 2.6, pal.r('grey'), 0, 2);
    blob(p, 13, 11, 2, 2, pal.r('grey'), 0, 1);
    p.disc(14, 10, 1.2, c('red', 3));
    for (const s of [-1, 1]) blob(p, 9 + s * 2, f ? 7 : 9, 3, 2, pal.r('white'), 1, 2);
    p.line(8, 14, 7, 17, ink).line(11, 14, 12, 17, ink);
    return done(p);
  };
  book.add('carl0', carl(0), { scorePts: 100 });
  book.add('carl1', carl(1), { scorePts: 100 });
  // Loaf #13, peeking out of the bread box
  const loaf = (f: number) => {
    const p = P();
    blob(p, 10, 14, 7.6, 5 + f * 0.6, pal.r('crust'), 0, 3, 1.1);
    for (const u of [-3, 0, 3]) p.line(10 + u - 1, 10, 10 + u + 1, 11, c('cream', 2));
    face(p, 10, 14, { grin: true });
    return done(p);
  };
  book.add('loaf0', loaf(0), { scorePts: 250 });
  book.add('loaf1', loaf(1), { scorePts: 250 });
  // the mustard seed in red sneakers, by the mustard
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
    p.line(11, y - 5, 12, y - 7, c('celery', 2));
    return done(p);
  };
  book.add('seed0', seed(0), { scorePts: 250 });
  book.add('seed1', seed(1), { scorePts: 250 });

  // ---- the Swamp Demon: the gurgle, a green cloud with eyes and bubbles
  const gurgle = (f: number) => {
    const p = P();
    for (const [x, y, rx, ry] of [
      [7, 12, 5, 4],
      [13, 11, 5, 4.4],
      [10, 7, 4.4, 3.4],
      [10, 15, 7, 3],
    ])
      blob(p, x + (f ? 1 : 0), y - f, rx, ry, pal.r('green'), 0, 3);
    face(p, 10 + f, 10 - f, { angry: true, grin: true });
    for (const [x, y] of [
      [3, 5 + f * 2],
      [16, 3 + f],
      [17, 15 - f],
    ])
      p.ring(x, y, 1.2, c('green', 4));
    return done(p);
  };
  book.add('gurgle0', gurgle(0), hurt(-2, 0));
  book.add('gurgle1', gurgle(1), hurt(-2, 0));

  // ---- the Devil in leisure wear (A: horns, slick hair, a grin and the milkshake; B: the leisure suit)
  const devilA = (stage: number, f: number) => {
    const p = P();
    // the milkshake in his hand (he sips; it empties as he's splashed)
    const sx = 15;
    p.rect(sx, 10, 4, 9, c('berry', 2)).rect(sx, 10, 4, 1, c('white', 2));
    if (stage < 3) p.rect(sx, 10 + stage * 2, 4, 2, c('cream', 3));
    p.line(sx + 1, 10, sx + (f ? 0 : 2), 4 + f, c('red', 3));
    // collar of the leisure suit, the gold chain
    p.rect(4, 16, 10, 4, c('suit', 2)).rect(7, 16, 4, 4, c('devil', 2));
    p.line(6, 17, 12, 17, c('gold', 2)).set(9, 18, c('gold', 3));
    // the head
    blob(p, 9, 10, 5.4, 5.4, pal.r('devil'), 1, 4);
    p.rect(4, 4, 10, 3, c('ink', 1)).rect(4, 4, 10, 1, c('grey', 3));
    // horns (bent once he's splashed)
    const bend = stage >= 2 ? 2 : 0;
    p.line(5, 5, 3 + bend, 0 + bend, c('cream', 2)).line(13, 5, 15 - bend, 0 + bend, c('cream', 2));
    p.set(7, 9, c('eye', 1)).set(11, 9, c('eye', 1)).line(6, 8, 8, 8, ink).line(10, 8, 12, 8, ink);
    if (stage >= 1) p.rect(6, 7, 3, 1, c('white', 2)).set(12, 11, c('white', 2)).set(5, 12, c('white', 2));
    if (stage >= 3) p.set(6, 9, ink).set(8, 9, ink).set(10, 9, ink).set(12, 9, ink);
    // the grin (a sneer, then a grimace)
    if (stage < 2) p.line(6, 13, 12, 13, ink).set(7, 14, c('white', 2)).set(11, 14, c('white', 2)).set(13, 12, ink);
    else p.line(6, 14, 8, 13, ink).line(8, 13, 10, 14, ink).line(10, 14, 12, 13, ink);
    // the goatee
    p.line(9, 15, 9, 17, ink);
    return done(p);
  };
  const devilB = (stage: number, f: number) => {
    const p = P();
    // the leisure suit: wide lapels, a white belt, flares, white loafers; a pointed tail
    p.rect(4, 0, 12, 9, c('suit', 2)).rect(4, 0, 3, 9, c('suit', 1)).rect(13, 0, 3, 9, c('suit', 3));
    p.line(7, 0, 9, 6, c('suit', 0)).line(12, 0, 10, 6, c('suit', 0)).rect(9, 0, 2, 4, c('devil', 2));
    p.rect(4, 9, 12, 2, c('white', 2)).set(10, 9, c('gold', 3));
    const swing = f ? 1 : -1;
    for (const [x, d] of [
      [5, -swing],
      [11, swing],
    ]) {
      for (let y = 11; y < 18; y++) p.rect(x + Math.round(((y - 11) / 7) * d) - (y > 15 ? 1 : 0), y, 4 + (y > 15 ? 2 : 0), 1, c('suit', 2));
      p.rect(x + d - 1, 18, 6, 2, c('white', 2));
    }
    p.line(4, 10, 1, 13, c('devil', 2)).line(1, 13, 2, 16, c('devil', 2)).set(1, 17, c('devil', 3)).set(2, 17, c('devil', 3)).set(0, 16, c('devil', 3));
    // almond milk splashed on him
    if (stage >= 1) p.rect(5, 2, 3, 2, c('white', 2)).set(14, 6, c('white', 2));
    if (stage >= 2) p.rect(12, 12, 3, 3, c('white', 2)).set(6, 14, c('white', 2));
    if (stage >= 3) p.rect(7, 7, 6, 2, c('berry', 2)).set(5, 16, c('berry', 2));
    return done(p);
  };
  for (let s = 0; s < 4; s++) {
    book.add(`devilA${s}a`, devilA(s, 0), hurt(-12));
    book.add(`devilA${s}b`, devilA(s, 1), hurt(-12));
  }
  for (let s = 0; s < 4; s++) {
    book.add(`devilB${s}a`, devilB(s, 0), hurt(-12));
    book.add(`devilB${s}b`, devilB(s, 1), hurt(-12));
  }
  // a milkshake flying (tumbling), and its splat
  const shake = (f: number) => {
    const p = P();
    const t = f ? 1 : 0;
    for (let y = 6; y < 17; y++) p.rect(6 + Math.floor((y - 6) / 5) + t, y, 8 - Math.floor((y - 6) / 3), 1, c('berry', y < 9 ? 3 : 2));
    blob(p, 10 + t, 5, 4.4, 2.4, pal.r('cream'), 1, 3);
    p.disc(10 + t, 2, 1.4, c('red', 3));
    p.line(12 + t, 4, 15 - t * 2, 0, c('white', 2));
    // a white rim outside the ink, so it reads against hell's reds
    return outline(done(p), c('white', 2));
  };
  book.add('shake0', shake(0), hurt(-5, 0));
  book.add('shake1', shake(1), hurt(-5, 0));
  const splat = P();
  blob(splat, 10, 17, 8, 2.6, pal.r('berry'), 1, 3);
  for (const [x, y] of [
    [3, 12],
    [7, 10],
    [13, 11],
    [17, 13],
  ])
    splat.disc(x, y, 1, c('pink', 2));
  book.add('splat', done(splat), hurt(-1, 0));
  // the almond milk splash he throws
  const splash = (f: number) => {
    const p = P();
    blob(p, 10, 10, 6 - f, 4 + f, pal.r('white'), 1, 2);
    for (const [x, y] of [
      [3, 6 + f],
      [16, 5 - f],
      [4, 15 - f],
      [17, 14 + f],
      [10, 3 + f],
    ])
      p.disc(x, y, 1.2, c('white', 2));
    p.set(8, 9, c('crust', 3)).set(11, 11, c('crust', 3));
    return done(p);
  };
  book.add('splash0', splash(0));
  book.add('splash1', splash(1));
  // the Devil's last straw, glowing
  const straw = (f: number) => {
    const p = P();
    for (let k = 0; k < 6; k++) p.set((k * 7 + f * 3) % 20, (k * 5 + f * 7) % 20, c('aura', 2));
    p.line(5, 18, 12, 6, c('red', 3)).line(6, 18, 13, 6, c('white', 2)).line(12, 6, 15, 2, c('red', 3)).line(13, 6, 16, 2, c('white', 2));
    return done(p);
  };
  book.add('straw0', straw(0), { effect: STRAW, eamt: 1, scorePts: 1000 });
  book.add('straw1', straw(1), { effect: STRAW, eamt: 1, scorePts: 1000 });
  // smoke curling up
  const puff = (f: number) => {
    const p = P();
    blob(p, 9 + f, 13 - f * 2, 5, 3.6, pal.r('smoke'), 0, 3);
    blob(p, 12 - f, 7 - f, 3.4, 2.6, pal.r('smoke'), 1, 3);
    return p;
  };
  book.add('smoke0', puff(0));
  book.add('smoke1', puff(1));
  // (last, so every other block keeps its number) the friends flying off: the same pictures,
  // worth nothing, so brushing past them as they go doesn't score every tick
  book.add('carlOff0', carl(0));
  book.add('carlOff1', carl(1));
  book.add('loafOff0', loaf(0));
  book.add('loafOff1', loaf(1));
  book.add('seedOff0', seed(0));
  book.add('seedOff1', seed(1));
  // a carton of almond milk, set out on the crate in hell: two splashes
  const carton = P();
  carton.rect(5, 6, 10, 13, c('white', 2)).rect(5, 10, 10, 5, c('crust', 2));
  for (let y = 2; y < 6; y++) carton.rect(5 + (6 - y), y, 10 - (6 - y) * 2, 1, c('white', 1));
  book.add('carton', done(carton), { effect: SEQ.throw, eamt: 2 });
  return book;
}
