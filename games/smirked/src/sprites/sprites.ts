// SMIRKED.CBL (and SWORD.CBL) and SMIRKED.MBL, seen from above at a slant like the house: you
// (Sir Screams-a-Lot: brown hair, your best red flannel date shirt, khakis, sneakers), walking
// four ways, tackling ("GET DOWN!"), screaming with your hands on your cheeks, asking Lily if
// it's real, hurt, and fainting; on the last level the same poses holding the $12 foam sword
// (SWORD.CBL has the very same block numbers, so the same character file plays it). And
// everything else that moves: the tackle, animatronic zombies, papier-mache witches, Lily (8, a
// lavender unicorn hoodie with a rainbow mane, glitter on her cheeks, a caramel apple as big as
// her head), rubber bats, a bedsheet ghost on its wire, the guy in the werewolf mask, a plastic
// spider, Carl the fly, the mustard seed in red sneakers, the 11-year-old in a cardboard knight
// costume, his helmet, and the third goat from the left under a sheet. Every sprite is drawn from
// shapes and given a dark outline.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import { outline } from '../../../mustard/src/sprites/sprites';
import type { Pal } from '../art/pal';
import { MONEY, SORRY, HELMET } from '../ids';

export { T, outline };

export type Facing = 'down' | 'up' | 'side';

export interface HeroPose {
  facing: Facing;
  /** Walk phase: 0 standing, 1 and 2 the steps. */
  step?: 0 | 1 | 2;
  mood?: 'plain' | 'blink' | 'scream' | 'ouch' | 'faint' | 'brave';
  /** Arms: at the sides, up to the cheeks (screaming), both out in front (the tackle), one palm up (asking). */
  arms?: 'sides' | 'cheeks' | 'tackle' | 'ask';
  /** The $12 foam sword: held at your side, or swung out in front. */
  sword?: 'held' | 'swing';
}

/** Your look, in the pal's ramps. */
export function heroArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);

  const hair = (p: Pixels, cx: number, cy: number, facing: Facing) => {
    // short brown hair, neatly combed for the date (it won't last)
    for (let y = cy - 5; y <= cy + (facing === 'up' ? 3 : 0); y++)
      for (let x = cx - 5; x <= cx + 5; x++) {
        const d = ((x - cx) / 4.7) ** 2 + ((y - cy) / 4.6) ** 2;
        if (d > 1) continue;
        if (facing === 'side' && x > cx + 1 && y > cy - 3) continue;
        if (facing === 'down' && y > cy - 3 && Math.abs(x - cx) < 4) continue;
        p.set(x, y, c('hair', y < cy - 3 ? 1 : 0));
      }
    if (facing !== 'up') p.set(cx + 1, cy - 4, c('hair', 2)).set(cx + 2, cy - 4, c('hair', 2));
  };

  const body = (o: HeroPose): Pixels => {
    const p = P();
    const step = o.step ?? 0;
    const arms = o.arms ?? 'sides';
    const side = o.facing === 'side';
    const cx = 10;
    const hy = 5;
    // sneakers and khakis
    const feet: [number, number][] = side
      ? [
          [cx - 2 + (step === 1 ? 2 : step === 2 ? -2 : 0), 18],
          [cx + 1 - (step === 1 ? 2 : step === 2 ? -2 : 0), 18],
        ]
      : [
          [cx - 3, 18 - (step === 1 ? 1 : 0)],
          [cx + 2, 18 - (step === 2 ? 1 : 0)],
        ];
    for (const [fx, fy] of feet) {
      p.rect(fx - 1, fy - 4, 3, 4, c('khaki', 2)).rect(fx - 1, fy - 4, 1, 4, c('khaki', 1));
      p.rect(fx - 1 + (side ? 1 : 0), fy, 3, 2, c('shoe', 1)).set(fx + (side ? 2 : 1), fy, c('shoe', 0));
    }
    // the flannel shirt: red with navy lines, tucked in, a belt
    const w = side ? 4 : 5;
    for (let y = 8; y <= 13; y++)
      for (let x = cx - w; x < cx + w; x++) {
        const line = (x - cx + 20) % 4 === 0 || y === 10;
        p.set(x, y, line ? c('navy', 1) : c('flannel', x === cx - w || x === cx + w - 1 ? 1 : 2));
      }
    p.rect(cx - w, 13, w * 2, 1, c('board', 0)).set(cx, 13, c('gold', 2));
    if (o.facing === 'down')
      p.rect(cx - 1, 8, 2, 2, c('skin', 2))
        .set(cx - 2, 8, c('flannel', 3))
        .set(cx + 1, 8, c('flannel', 3));
    // arms
    const swing = step === 1 ? 1 : step === 2 ? -1 : 0;
    const sleeve = (x: number, y0: number, y1: number) => {
      p.rect(x, y0, 2, y1 - y0, c('flannel', 1));
      p.rect(x, y1, 2, 2, c('skin', 2));
    };
    let hand: [number, number] = [cx + w, 13];
    if (arms === 'sides') {
      if (side) {
        sleeve(cx - 1 + swing, 9, 13);
        hand = [cx - 1 + swing, 13];
      } else {
        sleeve(cx - w - 2, 8, 12 + swing);
        sleeve(cx + w, 8, 12 - swing);
        hand = [cx + w, 12 - swing];
      }
    } else if (arms === 'cheeks') {
      p.rect(cx - w - 1, 7, 2, 4, c('flannel', 1)).rect(cx + w - 1, 7, 2, 4, c('flannel', 1));
      p.rect(cx - 5, hy + 1, 2, 3, c('skin', 3)).rect(cx + 3, hy + 1, 2, 3, c('skin', 3));
      hand = [cx + 3, hy + 1];
    } else if (arms === 'tackle') {
      // both arms flung out ahead, mid-dive
      p.rect(cx - 6, 7, 3, 2, c('flannel', 1)).rect(cx + 3, 7, 3, 2, c('flannel', 1));
      p.rect(cx - 8, 5, 2, 3, c('skin', 2)).rect(cx + 6, 5, 2, 3, c('skin', 2));
      hand = [cx + 6, 5];
    } else {
      // one palm up: "Is it real?"
      p.rect(cx + 2, 9, 4, 2, c('flannel', 1)).rect(cx + 5, 8, 4, 2, c('skin', 3));
      sleeve(cx - w - 2, 8, 12);
      hand = [cx + 6, 8];
    }
    // the foam sword: grey blade, yellow guard, red grip
    if (o.sword === 'held') {
      const [hx, hy2] = hand;
      p.rect(hx, hy2 - 1, 2, 2, c('red', 1))
        .rect(hx - 1, hy2 - 2, 4, 1, c('yellow', 2))
        .rect(hx, hy2 - 10, 2, 8, c('foam', 2))
        .set(hx, hy2 - 10, c('foam', 1));
    } else if (o.sword === 'swing') {
      p.rect(cx + 2, 9, 3, 2, c('red', 1))
        .rect(cx + 5, 7, 1, 5, c('yellow', 2))
        .rect(cx + 6, 8, 8, 3, c('foam', 2))
        .rect(cx + 6, 10, 8, 1, c('foam', 1));
    }
    // the head
    const face = o.facing !== 'up';
    blob(p, cx + (side ? 1 : 0), hy, 4.2, 4, pal.r('skin'), 1, 3);
    hair(p, cx, hy, o.facing);
    if (face) {
      const eyes: number[] = side ? [cx + 3] : [cx - 2, cx + 2];
      const ey = hy;
      for (const x of eyes) {
        if (o.mood === 'blink' || o.mood === 'faint') p.set(x, ey + 1, ink).set(x + 1, ey + 1, ink);
        else if (o.mood === 'ouch')
          p.set(x, ey, ink)
            .set(x + 1, ey + 1, ink)
            .set(x, ey + 2, ink);
        else if (o.mood === 'scream') p.rect(x, ey - 1, 2, 3, c('white', 2)).set(x, ey, ink);
        else p.set(x, ey, ink).set(x, ey + 1, ink);
        if (o.mood === 'brave') p.set(x - 1, ey - 2, c('hair', 0)).set(x + 1, ey - 1, c('hair', 0));
      }
      if (side) p.set(cx + 5, hy + 1, c('skin', 2));
      const mx = side ? cx + 3 : cx;
      if (o.mood === 'scream') p.rect(mx - 1, hy + 2, 3, 3, ink).set(mx, hy + 3, c('red', 1));
      else if (o.mood === 'ouch' || o.mood === 'faint') p.rect(mx - 1, hy + 3, 3, 1, ink);
      else if (o.mood === 'brave')
        p.rect(mx - 1, hy + 3, 3, 1, c('white', 2))
          .set(mx - 2, hy + 2, ink)
          .set(mx + 2, hy + 2, ink);
      else
        p.set(mx - 1, hy + 3, c('skin', 0))
          .set(mx, hy + 3, c('skin', 0))
          .set(mx + 1, hy + 2, c('skin', 0));
      // a bead of sweat
      if (o.mood !== 'brave') p.set(cx - 4, hy - 1, c('blue', 3)).set(cx - 4, hy, c('blue', 2));
    }
    return outline(p, ink);
  };

  /** Fainting: toppling over backward like a Victorian woman seeing a ghost. */
  const faint = (k: number, sword?: HeroPose['sword']): Pixels => {
    const p = body({ facing: 'down', mood: 'faint', arms: k === 0 ? 'cheeks' : 'sides', sword });
    const out = P();
    // tip over: each frame leans further and sinks
    const lean = [0, 0.35, 0.8, 1.3][k];
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const v = p.get(x, y);
        if (v === T || v < 0) continue;
        const dy = 19 - y;
        const nx = Math.round(10 + (x - 10) * Math.cos(lean) - dy * Math.sin(lean) * 0.8);
        const ny = Math.round(19 - dy * Math.cos(lean) - (x - 10) * Math.sin(lean) * 0.2);
        if (nx >= 0 && ny >= 0 && nx < 20 && ny < 20) out.set(nx, ny, v);
      }
    return out;
  };

  return { body, faint };
}

/** Your character blocks (SMIRKED.CBL; with the sword, SWORD.CBL: the same names in the same order). */
export function buildCharBlocks(pal: Pal, withSword = false) {
  const book = makeBook('cbl');
  const h = heroArt(pal);
  const c = pal.c;
  const sw = withSword ? 'held' : undefined;
  for (const f of ['down', 'up', 'side'] as Facing[]) for (const s of [0, 1, 2] as const) book.add(`${f}${s}`, h.body({ facing: f, step: s, sword: sw }));
  book.add('blink', h.body({ facing: 'down', mood: 'blink', sword: sw }));
  if (withSword) {
    book.add('tackle0', h.body({ facing: 'side', mood: 'brave', sword: 'swing' }));
    book.add('tackle1', h.body({ facing: 'side', mood: 'brave', sword: 'swing', step: 1 }));
  } else {
    book.add('tackle0', h.body({ facing: 'down', mood: 'scream', arms: 'tackle' }));
    book.add('tackle1', h.body({ facing: 'down', mood: 'scream', arms: 'tackle', step: 1 }));
  }
  book.add('scream0', h.body({ facing: 'down', mood: 'scream', arms: 'cheeks' }));
  book.add('scream1', h.body({ facing: 'down', mood: 'scream', arms: 'cheeks', step: 1 }));
  book.add('ask', h.body({ facing: 'side', arms: 'ask', sword: sw }));
  const hurt = h.body({ facing: 'down', mood: 'ouch', sword: sw });
  hurt.px.forEach((v, i) => v !== T && v !== c('ink', 0) && (hurt.px[i] = c('red', 3)));
  book.add('hurt', hurt);
  book.add('ouch', h.body({ facing: 'down', mood: 'ouch', arms: 'cheeks' }));
  for (const k of [0, 1, 2, 3]) book.add(`faint${k}`, h.faint(k, sw));
  book.add('brave', h.body({ facing: 'down', mood: 'brave', sword: sw }));
  return book;
}

/** Lily's look: a lavender unicorn hoodie, pigtails, glitter, and a caramel apple as big as her head. */
export function lilyArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  return (o: { step?: number; mood?: 'plain' | 'smirk' | 'pat' | 'whistle'; apple?: boolean; badge?: boolean } = {}): Pixels => {
    const p = new Pixels(20, 20, T);
    const step = o.step ?? 0;
    // little sneakers, leggings
    for (const [x, d] of [
      [7, step === 1 ? -1 : 0],
      [11, step === 2 ? -1 : 0],
    ] as const)
      p.rect(x, 15 + d, 2, 3, c('purple', 1)).rect(x - 1 + (x > 9 ? 1 : 0), 18 + d, 3, 2, c('white', 2));
    // the hoodie
    for (let y = 9; y <= 15; y++) for (let x = 6; x < 14; x++) p.set(x, y, c('hoodie', x === 6 || x === 13 ? 1 : 2));
    p.rect(9, 9, 2, 6, c('hoodie', 3)).set(9, 12, c('white', 2));
    if (o.badge) p.disc(8, 11, 1.4, c('gold', 2)).set(8, 13, c('red', 2));
    // the hood up over her head: the horn and the rainbow mane
    blob(p, 10, 6, 4.6, 4.4, pal.r('hoodie'), 1, 3);
    p.line(10, 2, 11, -1, c('white', 2)).set(10, 1, c('gold', 2)).set(11, 0, c('white', 1));
    for (let k = 0; k < 6; k++) p.set(14, 3 + k, c('rainbow', k)).set(15, 4 + k, c('rainbow', (k + 2) % 6));
    p.set(7, 2, c('hoodie', 3)).set(13, 2, c('hoodie', 3));
    // her face in the hood, glitter on her cheeks, pigtails peeking out
    blob(p, 10, 7, 2.8, 2.6, pal.r('skin'), 2, 3);
    p.set(6, 8, c('lhair', 1)).set(5, 9, c('lhair', 1)).set(14, 9, c('lhair', 1));
    const look = o.mood === 'smirk' ? 1 : 0;
    p.set(9 + look, 6, ink).set(11 + look, 6, ink);
    if (o.mood === 'smirk') p.set(10, 8, ink).set(11, 8, ink).set(12, 7, ink).set(8, 5, ink).set(9, 5, ink);
    else if (o.mood === 'whistle') p.set(10, 8, ink).set(13, 6, c('white', 2)).set(15, 5, c('white', 1));
    else p.set(10, 8, c('pink', 1)).set(11, 8, c('pink', 1));
    p.set(8, 7, c('gold', 2)).set(12, 8, c('gold', 2));
    // the caramel apple on its stick, as big as her head
    if (o.apple !== false) {
      const ax = o.mood === 'pat' ? 3 : 16;
      blob(p, ax, 11, 3.4, 3.2, pal.r('apple'), 0, 2);
      p.rect(ax - 3, 12, 7, 3, c('caramel', 1))
        .rect(ax - 3, 12, 7, 1, c('caramel', 2))
        .line(ax, 15, ax, 18, c('board', 3));
    }
    // a pat: her hand reaching out (to the right)
    if (o.mood === 'pat') p.rect(13, 9, 4, 2, c('hoodie', 2)).rect(17, 8, 3, 3, c('skin', 3));
    return outline(p, ink);
  };
}

/** Everything else that moves (SMIRKED.MBL). */
export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const c = pal.c;
  const ink = c('ink', 0);
  const P = () => new Pixels(20, 20, T);
  const done = (p: Pixels) => outline(p, ink);
  /**
   * A monster that hurts to touch: its pictures don't, but each also has a stinging copy
   * (name + "!") that its animation shows for one tick in every round. Touching hurts only on
   * that tick, and Lily smirks (a sting is a scare).
   */
  const sting = (name: string, pic: Pixels, hp: number) => {
    book.add(name, pic);
    book.add(`${name}!`, pic, { chHitPt: hp });
  };

  // The tackle: "GET DOWN!" in a burst of dust and flailing.
  const tackle = (f: number) => {
    const p = P();
    for (let a = 0; a < 6.28; a += 0.4) {
      const r0 = 4 + f * 2;
      p.line(10 + Math.cos(a) * r0, 10 + Math.sin(a) * r0, 10 + Math.cos(a) * (r0 + 4), 10 + Math.sin(a) * (r0 + 4), c('yellow', 2 - (((a * 3) | 0) % 2)));
    }
    p.rect(3, 6, 14, 8, c('red', 2));
    micro(p, 4, 7, 'GET', c('white', 2));
    p.rect(16, 6, 2, 5, c('white', 2)).rect(16, 12, 2, 2, c('white', 2));
    return done(p);
  };
  book.add('tackle0', tackle(0));
  book.add('tackle1', tackle(1));
  // The foam sword's swing (the last level's tackle): an arc of grey foam, a squeak of motion lines.
  const swing = (f: number) => {
    const p = P();
    for (let a = -1.2; a < 1.2; a += 0.04)
      for (let r = 6; r < 9; r++) p.set(6 + Math.cos(a + f * 0.4) * r * 1.3, 10 + Math.sin(a + f * 0.4) * r, c('foam', r === 8 ? 1 : 2));
    p.rect(3, 9, 4, 2, c('red', 1)).rect(6, 7, 1, 6, c('yellow', 2));
    for (let k = 0; k < 3; k++) p.line(12 + k * 2, 3 + k * 5, 17 + k, 4 + k * 5, c('white', 1));
    return done(p);
  };
  book.add('swing0', swing(0));
  book.add('swing1', swing(1));
  const dust = (f: number) => {
    const p = P();
    for (const [x, y, r] of [
      [6, 12, 3],
      [12, 10, 3.4],
      [14, 14, 2.6],
      [8, 15, 2.4],
      [10, 12, 3],
    ] as const)
      blob(p, x + (f ? (x - 10) * 0.5 : 0), y + (f ? (y - 12) * 0.5 : 0), r + f, r + f, pal.r('cardboard'), 2, 3);
    return p;
  };
  book.add('dust0', dust(0));
  book.add('dust1', dust(1));

  // An animatronic zombie: grey-green, tattered shirt, foam guts, a plastic axe, a jerky shuffle.
  const zombie = (f: number) => {
    const p = P();
    for (const [x, d] of [
      [7, f ? -1 : 0],
      [11, f ? 0 : -1],
    ] as const)
      p.rect(x, 15 + d, 2, 4, c('navy', 0)).rect(x - 1, 18 + d, 3, 2, c('black', 1));
    for (let y = 8; y <= 15; y++) for (let x = 6; x < 14; x++) p.set(x, y, (x + y) % 5 === 0 ? c('khaki', 0) : c('khaki', 1));
    blob(p, 9, 12, 2.4, 1.8, pal.r('guts'), 0, 2);
    // arms out stiff in front
    p.rect(3, 8 + f, 3, 2, c('zombie', 2)).rect(14, 8 - f, 3, 2, c('zombie', 2));
    // the plastic axe in one hand
    p.rect(16, 2 - f, 1, 8, c('board', 2)).rect(17, 2 - f, 3, 3, c('silver', 2));
    blob(p, 10, 5, 3.8, 3.6, pal.r('zombie'), 1, 3);
    p.set(8, 4, ink).set(12, 5, c('red', 2)).rect(8, 7, 4, 1, ink).set(9, 7, c('white', 2)).set(11, 7, c('white', 2));
    p.set(7, 2, c('zombie', 0)).set(12, 2, c('zombie', 0));
    return done(p);
  };
  sting('zombie0', zombie(0), -4);
  book.add('zombie1', zombie(1));
  // The zombie knocked over: flat on its back, the servo still twitching an arm.
  const zombieDown = (f: number) => {
    const p = P();
    p.rect(3, 9, 12, 6, c('khaki', 1)).rect(14, 10, 3, 4, c('navy', 0));
    blob(p, 3, 12, 3, 3, pal.r('zombie'), 1, 3);
    p.set(2, 11, ink).set(3, 13, ink);
    blob(p, 8, 12, 2, 1.5, pal.r('guts'), 0, 2);
    p.rect(6, 6 - f * 2, 2, 4 + f * 2, c('zombie', 2));
    p.rect(14, 4, 5, 1, c('board', 2)).rect(17, 2, 3, 3, c('silver', 2));
    return done(p);
  };
  book.add('zombieDown0', zombieDown(0), { scorePts: 0 });
  book.add('zombieDown1', zombieDown(1));

  // A papier-mache witch: green face, pointy hat, black dress, a broom, painted-on smile.
  const witch = (f: number) => {
    const p = P();
    for (let y = 9; y <= 18; y++) {
      const w = 3 + (y - 9) * 0.4;
      p.rect(10 - w, y, w * 2, 1, c('black', y % 3 ? 1 : 2));
    }
    p.rect(4, 18, 12, 1, c('cardboard', 0));
    // the broom, leaning
    p.line(15, 3, 17, 17, c('board', 3));
    for (let k = 0; k < 4; k++) p.line(16 + k * 0.5, 15, 15 + k, 19, c('yellow', 1));
    blob(p, 10, 7, 3.2, 3, pal.r('witch'), 1, 2);
    p.set(9, 6, ink).set(11, 6, ink).rect(9, 9, 3, 1, c('red', 2)).set(12, 8, c('witch', 0));
    // the hat (tilted a little more each time something walks past)
    for (let y = 0; y < 6; y++) p.rect(10 - y * 0.7 + f * (5 - y) * 0.2, y, 1 + y * 1.4, 1, c('black', 1));
    p.rect(5, 5, 10, 1, c('black', 2)).rect(8, 4, 5, 1, c('purple', 2));
    return done(p);
  };
  book.add('witch0', witch(0));
  book.add('witch1', witch(1));
  // The witch, tackled flat: cardboard, very petite. Walk over and say sorry (counter 21).
  const flat = (f: number) => {
    const p = P();
    p.rect(2, 11, 14, 5, c('black', 1)).rect(2, 11, 14, 1, c('black', 2));
    blob(p, 16, 13, 2.6, 2.4, pal.r('witch'), 1, 2);
    p.set(16, 12, ink).set(17, 14, ink);
    p.line(4, 8, 17, 10, c('black', 1)).line(5, 7, 15, 9, c('black', 1));
    // the broomstick, snapped in two
    p.line(1, 18, 8, 17, c('board', 3))
      .line(10, 19, 16, 16 + f, c('board', 3))
      .rect(15, 15 + f, 3, 3, c('yellow', 1));
    p.rect(3, 4, 7, 4, c('white', 2));
    micro(p, 4, 3, 'OW', c('red', 1));
    return done(p);
  };
  book.add('flat0', flat(0), { effect: SORRY, eamt: 1, scorePts: 100 });
  book.add('flat1', flat(1), { effect: SORRY, eamt: 1, scorePts: 100 });

  // Lily, strolling ahead, whistling, eating her apple like you're at a big-box store.
  const lily = lilyArt(pal);
  book.add('lily0', lily({ step: 1, mood: 'whistle' }));
  book.add('lily1', lily({ step: 2 }));
  book.add('lilySmirk', lily({ mood: 'smirk' }));
  // her pat: "Then she pats me. Pats me." (a little nerve back)
  book.add('lilyPat', lily({ mood: 'pat' }));
  book.add('lilyPat!', lily({ mood: 'pat' }), { chHitPt: 3 });

  // A rubber bat bobbing on a string.
  const bat = (f: number) => {
    const p = P();
    p.line(10, 0, 10, 6, c('white', 1));
    const lift = f ? -3 : 1;
    // the wings: filled, scalloped along the bottom edge
    for (let x = 1; x < 19; x++) {
      const d = Math.abs(x - 10);
      if (d < 2) continue;
      const top = 8 + lift * (d / 9) - (d > 6 ? (d - 6) * 0.6 : 0);
      const bottom = 11 + lift * (d / 9) - (d % 3 === 0 ? 1.5 : 0);
      for (let y = Math.round(top); y <= Math.round(bottom); y++) p.set(x, y, c('black', y === Math.round(top) ? 2 : 1));
    }
    blob(p, 10, 9, 2.2, 2.6, pal.r('black'), 0, 2);
    p.set(9, 6, c('black', 2)).set(11, 6, c('black', 2));
    p.set(9, 8, c('red', 3)).set(11, 8, c('red', 3)).set(10, 10, c('white', 2));
    return done(p);
  };
  sting('bat0', bat(0), -3);
  book.add('bat1', bat(1));
  // A bedsheet ghost sliding along its wire, eye holes cut out.
  const ghost = (f: number) => {
    const p = P();
    p.line(0, 1, 19, 1, c('silver', 0));
    blob(p, 10, 8, 5.4, 5, pal.r('white'), 1, 2);
    p.rect(5, 8, 11, 7, c('white', 2));
    for (let x = 5; x < 16; x++) p.set(x, 15 + ((x + f) % 3 === 0 ? 1 : 0), c('white', 1));
    p.rect(8, 6, 2, 3, ink).rect(12, 6, 2, 3, ink).rect(10, 11, 2, 2, ink);
    return done(p);
  };
  sting('ghost0', ghost(0), -4);
  book.add('ghost1', ghost(1));
  // The guy in the werewolf mask (and a flannel shirt, like yours; and gloves with plastic claws).
  const wolf = (f: number) => {
    const p = P();
    for (const [x, d] of [
      [7, f ? -1 : 0],
      [11, f ? 0 : -1],
    ] as const)
      p.rect(x, 15 + d, 2, 4, c('navy', 1)).rect(x - 1, 18 + d, 3, 2, c('shoe', 0));
    for (let y = 8; y <= 15; y++) for (let x = 6; x < 14; x++) p.set(x, y, x % 4 === 0 || y === 11 ? c('green', 0) : c('navy', 2));
    p.rect(3, 7 - f, 3, 3, c('fur', 2)).rect(14, 7 + f, 3, 3, c('fur', 2));
    for (const x of [3, 5, 14, 16]) p.set(x, 6 - (x < 10 ? f : -f), c('white', 2));
    blob(p, 10, 5, 4.4, 4, pal.r('fur'), 1, 3);
    p.line(6, 2, 5, -1, c('fur', 1)).line(14, 2, 15, -1, c('fur', 1));
    blob(p, 10, 7, 2.4, 1.6, pal.r('fur'), 2, 3);
    p.set(8, 4, c('yellow', 2)).set(12, 4, c('yellow', 2)).set(10, 6, ink).rect(9, 8, 3, 1, ink).set(9, 9, c('white', 2)).set(11, 9, c('white', 2));
    // the mask's seam at the neck (it's a guy)
    p.rect(7, 9, 6, 1, c('skin', 2));
    return done(p);
  };
  sting('wolf0', wolf(0), -6);
  book.add('wolf1', wolf(1));
  // A plastic spider dropping on its string.
  const spider = (f: number) => {
    const p = P();
    p.line(10, 0, 10, 8, c('web', 2));
    blob(p, 10, 11, 3.4, 3, pal.r('black'), 0, 2);
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) p.line(10 + s * 2, 10 + k, 10 + s * (6 + (k % 2)), 7 + k * 3 + (f ? 1 : -1) * (k % 2), c('black', 1));
    p.set(9, 10, c('red', 3)).set(11, 10, c('red', 3)).set(10, 13, c('orange', 2));
    return done(p);
  };
  sting('spider0', spider(0), -3);
  book.add('spider1', spider(1));
  // Carl, the fly, on a field trip: big red eyes, wings a blur. He's seen things.
  const carl = (f: number) => {
    const p = P();
    blob(p, 10, 11, 3, 4, pal.r('black'), 0, 2);
    blob(p, 8, 7, 1.8, 1.8, pal.r('red'), 1, 3);
    blob(p, 12, 7, 1.8, 1.8, pal.r('red'), 1, 3);
    for (const s of [-1, 1]) blob(p, 10 + s * 5, 10 - f, 3, 2, pal.r('web'), 0, 1);
    return done(p);
  };
  book.add('carl0', carl(0));
  book.add('carl1', carl(1));
  // The mustard seed in red sneakers, on a field trip too.
  const seed = (f: number) => {
    const p = P();
    blob(p, 10, 10 - f, 4.4, 4.2, pal.r('yellow'), 0, 2);
    p.set(9, 9 - f, ink)
      .set(11, 9 - f, ink)
      .set(10, 11 - f, c('orange', 0));
    p.rect(6 - f, 15, 3, 2, c('red', 2))
      .rect(11 + f, 15, 3, 2, c('red', 2))
      .set(7 - f, 15, c('white', 2))
      .set(12 + f, 15, c('white', 2));
    return done(p);
  };
  book.add('seed0', seed(0), { scorePts: 100 });
  book.add('seed1', seed(1), { scorePts: 100 });
  // The 11-year-old in a cardboard knight costume: box armor, a bucket helmet with a slit and a
  // feather, a cardboard sword up. Only your foam sword knocks the helmet off.
  const knight = (f: number, helmet = true) => {
    const p = P();
    for (const [x, d] of [
      [6, f ? -1 : 0],
      [11, f ? 0 : -1],
    ] as const)
      p.rect(x, 15 + d, 3, 3, c('navy', 1)).rect(x - 1, 18 + d, 5, 2, c('shoe', 1));
    // the box armor, a painted crest
    p.rect(5, 9, 10, 7, c('cardboard', 2)).rect(5, 9, 10, 1, c('cardboard', 3)).rect(5, 15, 10, 1, c('cardboard', 0));
    p.rect(9, 10, 2, 4, c('red', 2)).rect(8, 11, 4, 1, c('red', 2));
    // arms, and the cardboard sword waving
    p.rect(3, 10 - f, 2, 4, c('cardboard', 1)).rect(15, 10 + f, 2, 3, c('cardboard', 1));
    p.rect(16, 2 + f * 2, 2, 9, c('cardboard', 3)).rect(14, 10 + f, 6, 1, c('foam', 1));
    blob(p, 10, 6, 3.6, 3.4, pal.r('skin'), 2, 3);
    if (helmet) {
      p.rect(6, 1, 8, 8, c('cardboard', 2)).rect(6, 1, 8, 1, c('cardboard', 3)).rect(7, 5, 6, 1, ink).rect(13, 1, 1, 8, c('cardboard', 0));
      p.line(9, 0, 7, -3, c('red', 2)).line(10, 0, 8, -3, c('red', 3)).set(7, 0, c('red', 2));
    } else {
      p.rect(7, 2, 6, 2, c('hair', 1));
      p.set(8, 6, ink).set(12, 6, ink).rect(9, 8, 3, 1, ink).set(9, 8, c('white', 2)).set(11, 8, c('white', 2));
    }
    return done(p);
  };
  sting('knight0', knight(0), -5);
  book.add('knight1', knight(1));
  book.add('knightRuns0', knight(0, false));
  book.add('knightRuns1', knight(1, false));
  // The cardboard helmet, knocked off and lying there (counter 22).
  const helmet = (f: number) => {
    const p = P();
    p.rect(5, 7 - f, 10, 9, c('cardboard', 2))
      .rect(5, 7 - f, 10, 1, c('cardboard', 3))
      .rect(6, 11 - f, 8, 1, ink)
      .rect(14, 7 - f, 1, 9, c('cardboard', 0));
    p.line(9, 6 - f, 6, 2 - f, c('red', 2)).line(10, 6 - f, 7, 2 - f, c('red', 3));
    micro(p, 7, 13 - f, '12', c('red', 1));
    return done(p);
  };
  book.add('helmet0', helmet(0), { effect: HELMET, eamt: 1, scorePts: 250 });
  book.add('helmet1', helmet(1), { effect: HELMET, eamt: 1, scorePts: 250 });
  // The third goat from the left, under a bedsheet this year: a ghost goat. Harmless, grazing.
  const goat = (f: number) => {
    const p = P();
    blob(p, 9, 12, 6, 4, pal.r('white'), 1, 2);
    blob(p, 15 + f * 0.5, 8 + f, 3, 3, pal.r('white'), 1, 2);
    p.line(14, 5 + f, 13, 2 + f, c('board', 1)).line(16, 5 + f, 17, 2 + f, c('board', 1));
    p.rect(14, 7 + f, 1, 2, ink).rect(16, 7 + f, 1, 2, ink);
    for (const x of [5, 8, 11, 13]) p.rect(x, 16, 1, 3, c('board', 1));
    return done(p);
  };
  book.add('goat0', goat(0));
  book.add('goat1', goat(1));
  // A loose dollar bill blowing through the woods (money).
  const bill = (f: number) => {
    const p = P();
    const tilt = f ? 2 : -2;
    for (let x = 0; x < 12; x++) p.rect(4 + x, 8 + Math.round((x / 12) * tilt), 1, 5, c('money', x === 0 || x === 11 ? 0 : 1));
    p.disc(10, 10, 1.5, c('money', 2));
    return done(p);
  };
  book.add('bill0', bill(0), { effect: MONEY, eamt: 1, scorePts: 5 });
  book.add('bill1', bill(1), { effect: MONEY, eamt: 1, scorePts: 5 });
  return book;
}
