// REMOTE.CBL and REMOTE.MBL, seen from above at a slant like the room: you (messy hair, a
// maroon terry bathrobe with a green plaid belt over a white undershirt, bare shins and fuzzy
// blue slippers), walking four ways, shouting "WHERE'S THE REMOTE?!" with your hands on your
// cheeks, clicking an empty thumb at the TV, checking your hand, hurt, and flopped; and
// everything else that moves: the shout, dust bunnies, the cat, Teddy the corgi (red-gold, a
// white blaze, the right ear taller than the left), toast and its crumbs, a cockroach, lost
// socks, floating pennies, the tiny raccoon, the mustard seed in its red sneakers, lint, the
// third goat, and the furniture of the living room ride. Every sprite is drawn from shapes and
// given a dark outline.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { outline } from '../../../mustard/src/sprites/sprites';
import type { Pal } from '../art/pal';

export { T, outline };

export type Facing = 'down' | 'up' | 'side';

export interface HeroPose {
  facing: Facing;
  /** Walk phase: 0 standing, 1 and 2 the steps. */
  step?: 0 | 1 | 2;
  mood?: 'plain' | 'blink' | 'shout' | 'ouch' | 'flop' | 'look';
  /** Arms: down at the sides, up to the cheeks (the shout), one out clicking, or a palm up to look at. */
  arms?: 'sides' | 'cheeks' | 'click' | 'palm';
}

/** Your look, in the pal's ramps. */
export function heroArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);

  const hair = (p: Pixels, cx: number, cy: number, facing: Facing) => {
    // a mop of brown hair, a few strands sticking up (it's been a long night on the couch)
    for (let y = cy - 5; y <= cy + (facing === 'up' ? 4 : 1); y++)
      for (let x = cx - 5; x <= cx + 5; x++) {
        const d = ((x - cx) / 4.9) ** 2 + ((y - cy) / 4.7) ** 2;
        if (d > 1) continue;
        if (facing === 'side' && x > cx + 1 && y > cy - 2) continue;
        if (facing === 'down' && y > cy - 2 && Math.abs(x - cx) < 4) continue;
        p.set(x, y, c('hair', (x + y * 2) % 5 === 0 ? 2 : y < cy - 3 ? 1 : 0));
      }
    p.set(cx - 1, cy - 6, c('hair', 1)).set(cx + 2, cy - 6, c('hair', 1)).set(cx + 3, cy - 7, c('hair', 0));
    if (facing === 'down') for (const x of [cx - 3, cx - 1, cx + 2]) p.set(x, cy - 1, c('hair', 1));
  };

  const body = (o: HeroPose): Pixels => {
    const p = P();
    const step = o.step ?? 0;
    const arms = o.arms ?? 'sides';
    const side = o.facing === 'side';
    const cx = 10;
    const hy = o.mood === 'flop' ? 7 : 5;
    // slippers and shins
    const feet: [number, number][] = side ? [[cx - 2 + (step === 1 ? 2 : step === 2 ? -2 : 0), 18], [cx + 1 - (step === 1 ? 2 : step === 2 ? -2 : 0), 18]] : [[cx - 3, 18 - (step === 1 ? 1 : 0)], [cx + 3, 18 - (step === 2 ? 1 : 0)]];
    for (const [fx, fy] of feet) {
      p.rect(fx - 1, fy - 3, 2, 2, c('skin', 2));
      blob(p, fx + (side ? 1 : 0), fy, side ? 2.6 : 2.1, 1.6, pal.r('slipper'), 0, 2);
      p.set(fx - 1 + (side ? 2 : 0), fy - 1, c('white', 2));
    }
    // the robe
    const w = side ? 4 : 5;
    for (let y = 9; y <= 15; y++) {
      const ww = w + (y > 12 ? 1 : 0);
      for (let x = cx - ww; x < cx + ww; x++) p.set(x, y, c('robe', x === cx - ww ? 1 : x === cx + ww - 1 ? 1 : y === 15 ? 1 : 2));
    }
    // the plaid belt, its knot, the undershirt in the V and the lapels
    p.rect(cx - w, 12, w * 2, 1, c('plaid', 1));
    if (!side) {
      p.set(cx + 2, 13, c('plaid', 2)).set(cx + 2, 14, c('plaid', 1)).set(cx + 3, 14, c('plaid', 2));
      if (o.facing === 'down') {
        p.rect(cx - 1, 9, 2, 2, c('white', 2)).set(cx - 1, 11, c('white', 1)).set(cx, 11, c('white', 1));
        p.set(cx - 2, 9, c('plaid', 2)).set(cx - 2, 10, c('plaid', 2)).set(cx + 1, 9, c('plaid', 2)).set(cx + 1, 10, c('plaid', 2));
      }
      for (let y = 13; y <= 15; y++) p.set(cx, y, c('robe', 1));
    } else p.set(cx + 3, 13, c('plaid', 2)).set(cx + 3, 14, c('plaid', 1));
    // terry cloth texture
    for (let y = 9; y <= 15; y++) for (let x = cx - w; x < cx + w; x++) if ((x * 3 + y * 5) % 11 === 0 && p.get(x, y) === c('robe', 2)) p.set(x, y, c('robe', 3));
    // arms
    const swing = step === 1 ? 1 : step === 2 ? -1 : 0;
    const sleeve = (x: number, y0: number, y1: number) => {
      p.rect(x, y0, 2, y1 - y0, c('robe', 1));
      p.rect(x, y1, 2, 2, c('skin', 2));
    };
    if (arms === 'sides') {
      if (side) sleeve(cx - 1 + swing, 10, 14);
      else {
        sleeve(cx - w - 2, 9, 13 + swing);
        sleeve(cx + w, 9, 13 - swing);
      }
    } else if (arms === 'cheeks') {
      // hands up on the cheeks: sleeves angle up beside the head
      p.rect(cx - w - 1, 8, 2, 4, c('robe', 1)).rect(cx + w - 1, 8, 2, 4, c('robe', 1));
      p.rect(cx - 5, hy + 1, 2, 3, c('skin', 3)).rect(cx + 3, hy + 1, 2, 3, c('skin', 3));
    } else if (arms === 'click') {
      // one arm out in front, thumb pressing an imaginary button
      p.rect(cx + 1, 10, 6, 2, c('robe', 1)).rect(cx + 7, 9, 3, 3, c('skin', 2)).set(cx + 8, 8, c('skin', 3));
      sleeve(cx - 2, 10, 14);
    } else {
      // a palm held up in front of the face
      p.rect(cx + 2, 9, 2, 3, c('robe', 1)).rect(cx + 1, 6, 5, 3, c('skin', 3)).rect(cx + 1, 6, 5, 1, c('skin', 2));
      sleeve(cx - w - 2, 9, 13);
    }
    // the head
    const face = o.facing !== 'up';
    blob(p, cx + (side ? 1 : 0), hy, 4.4, 4.2, pal.r('skin'), 1, 3);
    hair(p, cx + (side ? 0 : 0), hy, o.facing);
    if (face) {
      const eyes: number[] = side ? [cx + 3] : [cx - 2, cx + 2];
      const ey = hy + 1;
      for (const x of eyes) {
        if (o.mood === 'blink' || o.mood === 'flop') p.set(x, ey, ink).set(x + 1, ey, ink);
        else if (o.mood === 'ouch') p.set(x, ey - 1, ink).set(x + 1, ey, ink).set(x, ey + 1, ink);
        else if (o.mood === 'look') p.set(x, ey + 1, ink);
        else {
          p.set(x, ey, ink).set(x, ey + 1, ink);
          if (o.mood === 'shout') p.set(x - 1, ey - 1, ink).set(x + 1, ey - 1, ink);
        }
      }
      if (side) p.set(cx + 5, hy + 2, c('skin', 2)).set(cx + 6, hy + 2, c('skin', 2));
      const mx = side ? cx + 3 : cx;
      if (o.mood === 'shout') p.rect(mx - 1, hy + 3, 3, 2, ink).set(mx, hy + 4, c('red', 1));
      else if (o.mood === 'ouch' || o.mood === 'flop') p.rect(mx - 1, hy + 3, 3, 1, ink);
      else p.set(mx - 1, hy + 3, c('skin', 0)).set(mx, hy + 3, c('skin', 0)).set(mx + 1, hy + 2, c('skin', 0));
      // stubble
      if (!side) for (const [x, y] of [[cx - 2, hy + 4], [cx + 2, hy + 4], [cx, hy + 4]]) if (p.get(x, y) === c('skin', 2) || p.get(x, y) === c('skin', 1)) p.set(x, y, c('skin', 1));
    }
    return outline(p, ink);
  };

  /** Flopped back, sinking into nothing (losing a life). */
  const flop = (k: number): Pixels => {
    const p = body({ facing: 'down', mood: 'flop' });
    const out = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (y + k * 5 < 20) out.set(x, y + k * 5, p.get(x, y) === -1 ? T : p.get(x, y));
    return out;
  };

  return { body, flop };
}

/** Your character blocks (REMOTE.CBL). */
export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const h = heroArt(pal);
  const c = pal.c;
  for (const f of ['down', 'up', 'side'] as Facing[]) for (const s of [0, 1, 2] as const) book.add(`${f}${s}`, h.body({ facing: f, step: s }));
  book.add('blink', h.body({ facing: 'down', mood: 'blink' }));
  book.add('shout0', h.body({ facing: 'down', mood: 'shout', arms: 'cheeks' }));
  book.add('shout1', h.body({ facing: 'down', mood: 'shout', arms: 'cheeks', step: 1 }));
  book.add('click', h.body({ facing: 'side', arms: 'click' }));
  book.add('palm', h.body({ facing: 'down', mood: 'look', arms: 'palm' }));
  const hurt = h.body({ facing: 'down', mood: 'ouch' });
  hurt.px.forEach((v, i) => v !== T && v !== c('ink', 0) && (hurt.px[i] = c('red', 3)));
  book.add('hurt', hurt);
  book.add('ouch', h.body({ facing: 'down', mood: 'ouch', arms: 'cheeks' }));
  for (const k of [0, 1, 2, 3]) book.add(`flop${k}`, h.flop(k));
  return book;
}

/** Everything else that moves (REMOTE.MBL). */
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  const hurt = (hp: number) => ({ chHitPt: hp });

  // The shout: "?!" in a burst of sound.
  const shout = (f: number) => {
    const p = P();
    for (let r = 5 + f * 2; r < 10; r += 3) for (let a = 0; a < 6.28; a += 0.12) if (Math.sin(a * 6) > -0.3) p.set(10 + Math.cos(a) * r, 10 + Math.sin(a) * r * 0.8, c('yellow', 2 - ((r + f) % 2)));
    // "?" in white, "!" in red
    p.rect(5, 4, 5, 2, c('white', 2)).rect(8, 6, 2, 2, c('white', 2)).rect(6, 8, 3, 2, c('white', 2)).rect(6, 13, 2, 2, c('white', 2)).set(5, 6, c('white', 2));
    p.rect(12, 4, 2, 8, c('red', 3)).rect(12, 13, 2, 2, c('red', 3));
    return done(p);
  };
  book.add('shout0', shout(0));
  book.add('shout1', shout(1));
  const echo = P();
  for (let a = 0; a < 6.28; a += 0.25) echo.set(10 + Math.cos(a) * 8, 10 + Math.sin(a) * 6, c('yellow', 1));
  micro(echo, 7, 8, '?!', c('white', 1));
  book.add('echo', echo);

  // Dust bunnies: grey fluff with two beady eyes and little ears, hopping.
  const bunny = (f: number) => {
    const p = P();
    const y = 12 - f * 2;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      p.line(10, y, 10 + Math.cos(a) * (5 + (i % 3)), y + Math.sin(a) * (4 + (i % 2)), c('cat', 1 + (i % 2)));
    }
    blob(p, 10, y, 4.4, 3.6, pal.r('cat'), 1, 3);
    p.line(7, y - 4, 6, y - 8, c('cat', 2)).line(12, y - 4, 13, y - 8, c('cat', 2));
    p.set(8, y - 1, ink).set(12, y - 1, ink).set(10, y + 1, c('pink', 1));
    if (!f) p.rect(4, 17, 12, 1, c('cat', 0));
    return done(p);
  };
  book.add('bunny0', bunny(0), hurt(-3));
  book.add('bunny1', bunny(1), hurt(-3));
  const poof = (f: number) => {
    const p = P();
    for (const [x, y, r] of [[6, 10, 3], [12, 8, 3.4], [14, 13, 2.6], [8, 14, 2.4], [10, 11, 3]] as const) blob(p, x + (f ? (x - 10) * 0.4 : 0), y + (f ? (y - 11) * 0.4 : 0), r + f, r + f, pal.r('cat'), 2, 3);
    return p;
  };
  book.add('poof0', poof(0));
  book.add('poof1', poof(1));

  // The cat, from above: a grey tabby padding along, tail up.
  const cat = (f: number) => {
    const p = P();
    blob(p, 9, 12, 6, 3.4, pal.r('cat'), 1, 3);
    for (let x = 5; x < 14; x += 3) p.line(x, 9, x + 1, 15, c('cat', 0));
    blob(p, 15.5, 10.5, 3, 2.8, pal.r('cat'), 1, 3);
    p.set(14, 7, c('cat', 2)).set(14, 8, c('cat', 2)).set(17, 7, c('cat', 2)).set(17, 8, c('cat', 2)).set(15, 8, c('pink', 1)).set(16, 8, c('pink', 1));
    p.set(15, 10, c('green', 2)).set(17, 10, c('green', 2)).set(16, 12, c('pink', 1));
    p.line(3, 12, 1, 7 + f * 2, c('cat', 2)).line(2, 12, 0, 7 + f * 2, c('cat', 1));
    for (const [x, d] of [[6, 1], [8, -1], [11, 1], [13, -1]] as const) p.set(x + (f ? d : -d), 16, c('cat', 3)).set(x + (f ? d : -d), 8, c('cat', 3));
    return done(p);
  };
  book.add('cat0', cat(0), hurt(-6));
  book.add('cat1', cat(1), hurt(-6));

  // Teddy, the corgi: red-gold with a white blaze and chest, the right ear taller than the left, grinning.
  const teddy = (f: number) => {
    const p = P();
    blob(p, 9, 12, 6.2, 3.6, pal.r('fur'), 1, 3);
    p.rect(5, 14, 7, 2, c('white', 2));
    for (const [x, d] of [[5, 1], [8, -1], [11, 1], [13, -1]] as const) p.rect(x + (f ? d : 0), 15, 2, 3, c('white', 2));
    blob(p, 15.5, 9.5, 3.4, 3.2, pal.r('fur'), 1, 3);
    p.line(16, 7, 16, 12, c('white', 2)).rect(15, 11, 3, 2, c('white', 2));
    // ears: the right one taller
    p.line(13, 7, 13, 4, c('fur', 2)).line(14, 7, 14, 5, c('fur', 3)).line(18, 7, 18, 2, c('fur', 2)).line(17, 7, 17, 3, c('fur', 3));
    p.set(15, 9, ink).set(17, 9, ink).set(16, 12, ink).set(16, 13, c('pink', 2));
    p.set(2, 11, c('fur', 2)).set(3, 12, c('white', 2));
    return done(p);
  };
  book.add('teddy0', teddy(0));
  book.add('teddy1', teddy(1));

  // Toast, flipping, and its crumbs.
  const toast = (f: number) => {
    const p = P();
    const w = f ? 4 : 6;
    p.rect(10 - w, 5, w * 2, 10, c('wood', 3)).rect(11 - w, 6, w * 2 - 2, 8, c('fridge', 3));
    p.rect(10 - w, 5, w * 2, 2, c('wood', 2));
    if (!f) p.set(8, 9, c('wood', 2)).set(12, 11, c('wood', 2));
    return done(p);
  };
  book.add('toast0', toast(0), hurt(-4));
  book.add('toast1', toast(1), hurt(-4));
  const crumbs = P();
  for (const [x, y] of [[6, 14], [9, 15], [13, 13], [11, 16], [8, 12]]) crumbs.rect(x, y, 2, 1, c('wood', 3));
  book.add('crumbs', crumbs);

  // A cockroach.
  const roach = (f: number) => {
    const p = P();
    blob(p, 10, 11, 5, 3, pal.r('wood'), 0, 2);
    p.line(10, 8, 10, 14, c('wood', 0));
    for (const [x, d] of [[7, 1], [10, -1], [13, 1]] as const) p.line(x, 9, x - 2 * (f ? d : -d), 6, ink).line(x, 13, x - 2 * (f ? -d : d), 16, ink);
    p.line(15, 10, 19, 7, ink).line(15, 12, 19, 14, ink);
    return done(p);
  };
  book.add('roach0', roach(0), hurt(-2));
  book.add('roach1', roach(1), hurt(-2));

  // A lost sock drifting, argyle.
  const sock = (f: number) => {
    const p = P();
    const tilt = f ? 1 : -1;
    for (let y = 3; y < 13; y++) p.rect(7 + Math.round((y - 3) * 0.1 * tilt), y, 6, 1, c('blue', (y % 4) < 2 ? 2 : 3));
    blob(p, 11 + tilt, 14, 5, 3, pal.r('blue'), 1, 3);
    p.rect(7, 3, 6, 2, c('white', 2));
    for (const [x, y] of [[9, 7], [11, 10]]) p.set(x, y, c('red', 2)).set(x + 1, y + 1, c('red', 2));
    return done(p);
  };
  book.add('sock0', sock(0), hurt(-3));
  book.add('sock1', sock(1), hurt(-3));

  // A penny, turning in the void: money.
  const penny = (f: number) => {
    const p = P();
    const rx = [5, 2.2, 5][f];
    blob(p, 10, 10, rx, 5, pal.r('copper'), 1, 3);
    if (f !== 1) {
      p.ring(10, 10, 3.4, c('copper', 1));
      p.set(10, 9, c('copper', 3)).set(9, 10, c('copper', 0));
    }
    p.set(8, 7, c('gold', 2));
    return done(p);
  };
  book.add('penny0', penny(0), { effect: 3, eamt: 1, scorePts: 5 });
  book.add('penny1', penny(1), { effect: 3, eamt: 1, scorePts: 5 });

  // The tiny raccoon (??): a mask, a ringed tail.
  const raccoon = (f: number, away = false) => {
    const p = P();
    blob(p, 9, 13, 4.6, 3.2, pal.r('cat'), 1, 2);
    blob(p, 13, 10, 3.2, 3, pal.r('cat'), 1, 3);
    p.rect(11, 9, 5, 2, ink).set(12, 9, c('white', 2)).set(14, 9, c('white', 2));
    p.set(11, 7, c('cat', 0)).set(15, 7, c('cat', 0)).set(13, 12, ink);
    for (let k = 0; k < 6; k++) p.rect(4 - k / 2, 13 - k + (f ? 1 : 0), 2, 1, c('cat', k % 2 ? 0 : 2));
    if (away) p.line(17, 6, 19, 4, c('yellow', 2)).line(17, 9, 19, 9, c('yellow', 2));
    return done(p);
  };
  book.add('raccoon0', raccoon(0));
  book.add('raccoon1', raccoon(1));
  book.add('raccoonBye', raccoon(1, true));

  // The mustard seed, lost between the cushions too: round and yellow, red sneakers.
  const seed = (f: number) => {
    const p = P();
    blob(p, 10, 10 - f, 4.4, 4.2, pal.r('yellow'), 0, 2);
    p.set(9, 9 - f, ink).set(11, 9 - f, ink).set(10, 11 - f, c('orange', 0));
    p.rect(6 - f, 15, 3, 2, c('red', 2)).rect(11 + f, 15, 3, 2, c('red', 2)).set(7 - f, 15, c('white', 2)).set(12 + f, 15, c('white', 2));
    return done(p);
  };
  book.add('seed0', seed(0));
  book.add('seed1', seed(1));

  // Lint: a grey wisp with a frown, drifting after you.
  const lint = (f: number) => {
    const p = P();
    for (let i = 0; i < 40; i++) {
      const a = i * 0.7 + f;
      const r = 2 + (i % 7);
      p.set(10 + Math.cos(a) * r * 0.9, 10 + Math.sin(a) * r * 0.7, c('cat', 2 + (i % 2)));
    }
    p.set(8, 9, ink).set(12, 9, ink).line(8, 12, 12, 12, c('cat', 0));
    return p;
  };
  book.add('lint0', lint(0), hurt(-2));
  book.add('lint1', lint(1), hurt(-2));

  // The third goat from the left, grazing on lost socks.
  const goat = (f: number) => {
    const p = P();
    blob(p, 9, 12, 6, 3.6, pal.r('white'), 0, 2);
    blob(p, 15 + f * 0.5, 9 + f, 2.6, 2.6, pal.r('white'), 0, 2);
    p.line(14, 7 + f, 13, 4 + f, c('wood', 1)).line(16, 7 + f, 17, 4 + f, c('wood', 1));
    p.set(16, 9 + f, ink).set(15, 12 + f, c('white', 1)).set(15, 13 + f, c('white', 1));
    for (const x of [5, 8, 11, 13]) p.rect(x, 15, 1, 3, c('wood', 1));
    return done(p);
  };
  book.add('goat0', goat(0));
  book.add('goat1', goat(1));

  // The living room ride: the recliner, the ottoman and the floor lamp, whirling.
  const recliner = (f: number) => {
    const p = P();
    p.rect(3, 3, 14, 6, c('wood', 1)).rect(3, 9, 14, 8, c('wood', 2)).rect(1, 6, 3, 11, c('wood', 1)).rect(16, 6, 3, 11, c('wood', 1));
    p.rect(5, 10, 10, 5, c('wood', 3));
    if (f) p.rect(5, 16, 10, 3, c('wood', 2));
    return done(p);
  };
  book.add('recliner0', recliner(0), { chHitPt: -6, solid: 15 });
  book.add('recliner1', recliner(1), { chHitPt: -6, solid: 15 });
  const ottoman = (f: number) => {
    const p = P();
    blob(p, 10, 10, 7, 6, pal.r('couch'), 1, 4);
    for (let a = 0; a < 6.28; a += 1.05) p.set(10 + Math.cos(a + f * 0.5) * 4, 10 + Math.sin(a + f * 0.5) * 3, c('flora', 2));
    return done(p);
  };
  book.add('ottoman0', ottoman(0), { chHitPt: -4, solid: 15 });
  book.add('ottoman1', ottoman(1), { chHitPt: -4, solid: 15 });
  const lampshade = (f: number) => {
    const p = P();
    for (let y = 3; y < 11; y++) p.rect(10 - 2 - (y - 3) / 2, y, 4 + (y - 3), 1, c('lamp', y % 3 ? 1 : 2));
    p.rect(9, 11, 2, 6, c('silver', 1)).rect(6, 17, 8, 2, c('silver', 0));
    if (f) for (const [x, y] of [[3, 4], [16, 5], [2, 9], [17, 10]]) p.set(x, y, c('lamp', 2));
    return done(p);
  };
  book.add('lampshade0', lampshade(0), { chHitPt: -4, solid: 15 });
  book.add('lampshade1', lampshade(1), { chHitPt: -4, solid: 15 });
  const popcorn = (f: number) => {
    const p = P();
    for (const [x, y] of [[8, 9], [12, 11], [10, 13]] as const) blob(p, x + f, y - f, 2.2, 2, pal.r('white'), 1, 2);
    p.set(11, 12, c('yellow', 1)).set(8, 10, c('yellow', 1));
    return done(p);
  };
  book.add('popcorn0', popcorn(0), hurt(-2));
  book.add('popcorn1', popcorn(1), hurt(-2));
  return book;
}
