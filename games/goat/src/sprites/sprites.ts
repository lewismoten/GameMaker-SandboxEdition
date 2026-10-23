// GOAT.CBL and GOAT.MBL: the goat (walking three ways, chewing, screaming, bleating, hurt
// and fainting stiff with her legs in the air) and everything else that moves: lambs, the
// fainting cousins, pigeons, camels (two blocks each), spit, the crowd in Bethlehem, the
// wise men, the donkey and the ox, the line at the manger, and a scream you can see.
// Every sprite is drawn from shapes and given a dark outline, a 3/4 view like the blocks.
import { Pixels } from '../../../kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import type { Pal } from '../art/pal';

/** Gives every drawn pixel's empty neighbors the outline color. */
function outline(p: Pixels, ink: number): Pixels {
  const src = p.px.slice();
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (src[y * p.w + x] !== T) continue;
      const near = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => {
        const xx = x + dx;
        const yy = y + dy;
        return xx >= 0 && yy >= 0 && xx < p.w && yy < p.h && src[yy * p.w + xx] !== T && src[yy * p.w + xx] !== ink;
      });
      if (near) p.px[y * p.w + x] = ink;
    }
  return p;
}

interface Coat {
  /** Fur ramp and the shades used for shadow, body and highlight. */
  fur: string;
  lo: number;
  hi: number;
  /** Patch color (fainting goats are often patched black), or none. */
  patch?: number;
  horns: boolean;
  beard: boolean;
  scale?: number;
}

export function goatArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  const fur = (k: Coat) => pal.r(k.fur);

  /** Side view facing right. legs: 0 stand, 1 and 2 stride; mouth: open to scream or bleat. */
  const side = (k: Coat, legs: number, mouth = 0, chew = 0): Pixels => {
    const p = new Pixels(20, 20, T);
    const s = k.scale ?? 1;
    const oy = Math.round((1 - s) * 12);
    const leg = (x: number, dx: number) => {
      p.line(x, 14 + oy * 0.4, x + dx, 18, c(k.fur, k.lo));
      p.set(x + dx, 19, ink);
    };
    const swing = legs === 0 ? [0, 0, 0, 0] : legs === 1 ? [1, -1, -1, 1] : [-1, 1, 1, -1];
    leg(4, swing[0]);
    leg(6, swing[1]);
    leg(11, swing[2]);
    leg(13, swing[3]);
    blob(p, 8.5, 11 + oy * 0.5, 6.5 * s, 4 * s, fur(k), k.lo, k.hi, 1.1);
    if (k.patch !== undefined) blob(p, 6, 10 + oy * 0.5, 2.5 * s, 2 * s, [k.patch], 0, 0);
    p.set(2, 8 + oy * 0.5, c(k.fur, k.hi)).set(1, 7 + oy * 0.5, c(k.fur, k.hi - 1));
    // neck and head
    p.rect(12, 6 + oy, 3, 5, c(k.fur, k.hi - 1));
    blob(p, 15, 6 + oy, 3.4 * s, 2.7 * s, fur(k), k.lo, k.hi, 1.1);
    p.rect(16, 6 + oy + chew, 3, 2, c(k.fur, k.hi - 1));
    if (k.horns) p.line(13, 4 + oy, 12, 2 + oy, c('horn', 1)).line(14, 4 + oy, 13, 1 + oy, c('horn', 2)).set(11, 3 + oy, c('horn', 1));
    p.line(13, 6 + oy, 11, 8 + oy, c(k.fur, k.lo)); // the ear, hanging back
    p.set(16, 5 + oy, ink);
    p.set(18, 6 + oy + chew, c('pink', 1));
    if (mouth) p.rect(16, 8 + oy, 3, mouth, ink).set(17, 8 + oy, c('pink', 2));
    if (k.beard) p.line(16, 8 + oy + mouth, 16, 10 + oy + mouth, c(k.fur, k.hi));
    return outline(p, ink);
  };

  /** Facing you. */
  const front = (k: Coat, legs: number, blink = false): Pixels => {
    const p = new Pixels(20, 20, T);
    const sw = legs === 0 ? 0 : legs === 1 ? 1 : -1;
    for (const [x, d] of [
      [6, sw],
      [8, -sw],
      [12, sw],
      [14, -sw],
    ]) {
      p.rect(x, 15 + (d > 0 ? 1 : 0), 1, 4 - (d > 0 ? 1 : 0), c(k.fur, k.lo));
      p.set(x, 19, ink);
    }
    blob(p, 10, 13, 5.5, 4, fur(k), k.lo, k.hi, 1.1);
    blob(p, 10, 7, 4, 3.6, fur(k), k.lo + 1, k.hi, 1.1);
    p.line(6, 6, 3, 8, c(k.fur, k.lo)).line(14, 6, 17, 8, c(k.fur, k.lo));
    if (k.horns) p.line(8, 4, 6, 1, c('horn', 2)).line(12, 4, 14, 1, c('horn', 2)).set(6, 2, c('horn', 1)).set(14, 2, c('horn', 1));
    if (blink) p.rect(8, 6, 1, 1, c(k.fur, k.lo)).rect(11, 6, 1, 1, c(k.fur, k.lo));
    else p.set(8, 6, ink).set(11, 6, ink);
    p.rect(9, 9, 2, 1, c('pink', 1));
    if (k.beard) p.rect(9, 11, 2, 2, c(k.fur, k.hi));
    return outline(p, ink);
  };

  /** From behind. */
  const back = (k: Coat, legs: number): Pixels => {
    const p = new Pixels(20, 20, T);
    const sw = legs === 0 ? 0 : legs === 1 ? 1 : -1;
    for (const [x, d] of [
      [6, sw],
      [8, -sw],
      [12, -sw],
      [14, sw],
    ]) {
      p.rect(x, 15 + (d > 0 ? 1 : 0), 1, 4 - (d > 0 ? 1 : 0), c(k.fur, k.lo));
      p.set(x, 19, ink);
    }
    blob(p, 10, 12, 5.5, 4.5, fur(k), k.lo, k.hi, 1.1);
    blob(p, 10, 6, 3.6, 3.2, fur(k), k.lo, k.hi - 1, 1.1);
    p.line(7, 6, 4, 8, c(k.fur, k.lo)).line(13, 6, 16, 8, c(k.fur, k.lo));
    if (k.horns) p.line(8, 4, 6, 1, c('horn', 2)).line(12, 4, 14, 1, c('horn', 2));
    p.set(10, 16, c(k.fur, k.hi)).set(10, 15, c(k.fur, k.hi));
    return outline(p, ink);
  };

  /** Keeled over stiff: on her side, legs straight out. tilt 0 going over, 1 down. */
  const faint = (k: Coat, tilt: number): Pixels => {
    const p = new Pixels(20, 20, T);
    if (tilt === 0) {
      for (const x of [5, 7, 11, 13]) p.line(x, 13, x - 3, 17, c(k.fur, k.lo));
      blob(p, 9, 11, 6.5, 4, fur(k), k.lo, k.hi, 1.1);
      blob(p, 15, 9, 3.2, 2.6, fur(k), k.lo, k.hi, 1.1);
      p.set(16, 8, ink);
    } else {
      for (const x of [5, 7, 11, 13]) p.line(x, 11, x, 4, c(k.fur, k.lo)).set(x, 3, ink);
      blob(p, 9, 14, 7, 3.8, fur(k), k.lo, k.hi, 1.1);
      blob(p, 16, 16, 3.2, 2.6, fur(k), k.lo, k.hi, 1.1);
      // X eyes
      p.set(16, 15, ink).set(17, 16, ink).set(17, 15, ink).set(16, 16, ink);
    }
    if (k.horns) p.line(14, 13, 13, 11, c('horn', 2));
    return outline(p, ink);
  };
  return { side, front, back, faint };
}

/** The goat herself: grey and white like the cover, with a beard and curled horns. */
export const HERO = { fur: 'goat', lo: 1, hi: 5, horns: true, beard: true } as const;

export function buildCharBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const g = goatArt(pal);
  const c = pal.c;
  book.add('side0', g.side(HERO, 0));
  book.add('side1', g.side(HERO, 1));
  book.add('side2', g.side(HERO, 2));
  book.add('down0', g.front(HERO, 0));
  book.add('down1', g.front(HERO, 1));
  book.add('down2', g.front(HERO, 2));
  book.add('blink', g.front(HERO, 0, true));
  book.add('up0', g.back(HERO, 0));
  book.add('up1', g.back(HERO, 1));
  book.add('up2', g.back(HERO, 2));
  book.add('chew0', g.side(HERO, 0, 0, 0));
  book.add('chew1', g.side(HERO, 0, 0, 1));
  book.add('scream0', g.side(HERO, 0, 2));
  book.add('scream1', g.side(HERO, 0, 3));
  book.add('bleat', g.side(HERO, 0, 1));
  const hurt = g.side(HERO, 0, 2);
  hurt.px.forEach((v, i) => v !== T && v !== c('ink', 0) && (hurt.px[i] = c('red', 3)));
  book.add('hurt', hurt);
  book.add('faint0', g.faint(HERO, 0));
  book.add('faint1', g.faint(HERO, 1));
  return book;
}

export function buildMonsterBlocks(pal: Pal) {
  const book = makeBook('mbl');
  const g = goatArt(pal);
  const c = pal.c;
  const ink = c('ink', 0);
  const hurt = (hp: number) => ({ chHitPt: hp });
  const solid = { solid: 15 };

  // The scream: "AAAH" in rings of sound.
  const wave = (f: number) => {
    const p = new Pixels(20, 20, T);
    for (let r = 4 + f * 2; r < 10; r += 3)
      for (let a = -0.9; a <= 0.9; a += 0.08) p.set(10 + Math.cos(a) * r - 4, 10 + Math.sin(a) * r, c('star', 2 - ((r + f) % 2)));
    micro(p, 2, 7, 'AH', c('gold', 3));
    return p;
  };
  book.add('wave0', wave(0));
  book.add('wave1', wave(1));
  const echo = new Pixels(20, 20, T);
  for (let a = 0; a < 6.28; a += 0.2) echo.set(10 + Math.cos(a) * 8, 10 + Math.sin(a) * 8, c('star', 1));
  book.add('echo', echo);

  // Lambs: fluffy, and every one you bump gives you a little wool.
  const lamb = (legs: number, shorn: boolean) => {
    const p = new Pixels(20, 20, T);
    const sw = legs ? 1 : -1;
    for (const [x, d] of [
      [6, sw],
      [8, -sw],
      [12, sw],
      [14, -sw],
    ])
      p.line(x, 14, x + d, 18, c('ink', 1)).set(x + d, 19, ink);
    const body = shorn ? pal.r('pink') : pal.r('wool');
    blob(p, 9, 12, shorn ? 5 : 6.5, shorn ? 3.2 : 4.5, body, 0, shorn ? 2 : 3, 1.1);
    if (!shorn) for (const [x, y] of [[5, 9], [8, 8], [11, 8], [13, 10], [6, 14]]) blob(p, x, y, 2, 2, pal.r('wool'), 1, 3, 1.2);
    blob(p, 15, 9, 2.6, 2.3, pal.r('ink'), 1, 1);
    p.set(16, 8, c('cloth', 3)).line(14, 8, 12, 10, c('ink', 1));
    return outline(p, ink);
  };
  book.add('lamb0', lamb(0, false), { effect: 20, eamt: 1, scorePts: 10 });
  book.add('lamb1', lamb(1, false), { effect: 20, eamt: 1, scorePts: 10 });
  book.add('shorn0', lamb(0, true));
  book.add('shorn1', lamb(1, true));

  // The fainting cousins: black and white, solid as a wall until a scream knocks them stiff.
  const cousin = { fur: 'goat', lo: 0, hi: 4, horns: false, beard: false, patch: c('goat', 0) };
  book.add('goat0', g.front(cousin, 0), solid);
  book.add('goat1', g.front(cousin, 0, true), solid);
  book.add('goatSide0', g.side(cousin, 0, 0, 0), solid);
  book.add('goatSide1', g.side(cousin, 0, 0, 1), solid);
  book.add('goatFaint0', g.faint(cousin, 1));
  const twitch = g.faint(cousin, 1);
  twitch.rect(4, 2, 2, 1, c('star', 2));
  book.add('goatFaint1', twitch);
  // a brown cousin who wanders and keels over too
  const brown = { fur: 'camel', lo: 0, hi: 3, horns: true, beard: true };
  book.add('brown0', g.side(brown, 1));
  book.add('brown1', g.side(brown, 2));
  book.add('brownFaint', g.faint(brown, 1));

  // Pigeons ("even pigeons got hymns"): they peck.
  const pigeon = (up: boolean) => {
    const p = new Pixels(20, 20, T);
    blob(p, 10, 12, 5, 3.5, pal.r('stone'), 1, 3, 1.1);
    blob(p, 14, 9, 2.4, 2.2, pal.r('stone'), 1, 2, 1.1);
    p.rect(13, 10, 2, 1, c('purple', 3)).set(15, 8, ink).set(17, 9, c('gold', 1));
    if (up) p.line(9, 11, 5, 4, c('stone', 2)).line(10, 11, 7, 3, c('stone', 3));
    else p.line(8, 12, 3, 13, c('stone', 2));
    p.line(6, 13, 3, 15, c('stone', 1));
    p.set(10, 16, c('red', 2)).set(12, 16, c('red', 2));
    return outline(p, ink);
  };
  book.add('pigeon0', pigeon(true), hurt(-3));
  book.add('pigeon1', pigeon(false), hurt(-3));
  const feathers = (f: number) => {
    const p = new Pixels(20, 20, T);
    for (let k = 0; k < 6; k++) {
      const a = k + f * 0.5;
      const x = 10 + Math.cos(a) * (3 + f * 3);
      const y = 10 + Math.sin(a) * (3 + f * 3);
      p.line(x, y, x + 2, y + 1, c('stone', 3));
    }
    return p;
  };
  book.add('feathers0', feathers(0));
  book.add('feathers1', feathers(1));

  // Camels: two blocks (rear and head) struttin'. Solid, and they bump hard.
  const camel = (part: 'rear' | 'front', f: number) => {
    const p = new Pixels(20, 20, T);
    const sw = f ? 1 : -1;
    if (part === 'rear') {
      for (const x of [4, 8]) p.line(x, 12, x + (x === 4 ? sw : -sw), 19, c('camel', 0));
      blob(p, 11, 9, 10, 5, pal.r('camel'), 0, 3, 1.1);
      blob(p, 12, 4, 5, 3, pal.r('camel'), 1, 3, 1.1);
      p.rect(9, 7, 12, 3, c('red', 2)).rect(9, 7, 12, 1, c('gold', 3));
      for (let x = 10; x < 20; x += 3) p.set(x, 10, c('gold', 2));
      p.line(1, 7, 0, 11, c('camel', 1));
    } else {
      for (const x of [3, 7]) p.line(x, 12, x + (x === 3 ? -sw : sw), 19, c('camel', 0));
      blob(p, 4, 9, 7, 5, pal.r('camel'), 0, 3, 1.1);
      p.rect(0, 7, 6, 3, c('red', 2)).rect(0, 7, 6, 1, c('gold', 3));
      p.line(9, 8, 13, 3, c('camel', 2)).line(10, 9, 14, 4, c('camel', 2)).line(10, 8, 14, 3, c('camel', 3));
      blob(p, 16, 3, 3.5, 2.3, pal.r('camel'), 1, 3, 1.1);
      p.set(16, 2, ink).set(19, 4, c('ink', 1)).set(15, 1, c('camel', 0));
    }
    return outline(p, ink);
  };
  for (const part of ['rear', 'front'] as const) for (const f of [0, 1]) book.add(`${part}${f}`, camel(part, f), { ...solid, ...hurt(-6) });
  const spit = (f: number) => {
    const p = new Pixels(20, 20, T);
    blob(p, 10, 10, 3, 2.4, pal.r('cloth'), 1, 3, 1.2);
    for (let k = 0; k < 3; k++) p.set(13 + k * 2, 9 + ((k + f) % 2), c('cloth', 2));
    return p;
  };
  book.add('spit0', spit(0), hurt(-4));
  book.add('spit1', spit(1), hurt(-4));
  const splat = new Pixels(20, 20, T);
  for (let a = 0; a < 6.28; a += 0.7) splat.line(10, 12, 10 + Math.cos(a) * 5, 12 + Math.sin(a) * 3, c('cloth', 2));
  book.add('splat', splat);

  // Bethlehem's crowd, everybody home to be counted: robes and head cloths. They shove.
  const walker = (robe: string, head: string, f: number) => {
    const p = new Pixels(20, 20, T);
    const sw = f ? 1 : -1;
    p.rect(7 + sw, 16, 2, 3, c('skin', 0)).rect(11 - sw, 16, 2, 3, c('skin', 0));
    p.set(7 + sw, 19, ink).set(12 - sw, 19, ink);
    blob(p, 10, 12, 4.5, 5.5, pal.r(robe), 0, 3, 1.1);
    p.rect(5, 9, 2, 5, c(robe, 1)).rect(13, 9, 2, 5, c(robe, 1));
    p.disc(10, 5, 3, c('skin', 1));
    p.rect(6, 1, 9, 3, c(head, 3)).rect(6, 3, 2, 6, c(head, 2)).rect(13, 3, 2, 6, c(head, 2));
    p.set(9, 5, ink).set(11, 5, ink);
    return outline(p, ink);
  };
  book.add('walkA0', walker('red', 'cloth', 0), solid);
  book.add('walkA1', walker('red', 'cloth', 1), solid);
  book.add('walkB0', walker('blue', 'dirt', 0), solid);
  book.add('walkB1', walker('blue', 'dirt', 1), solid);
  // a wise man, crowned and strutting
  const wise = (f: number) => {
    const p = walker('purple', 'gold', f);
    p.rect(6, 0, 9, 2, c('gold', 3)).set(7, 0, c('red', 3)).set(10, 0, c('blue', 3)).set(13, 0, c('red', 3));
    p.rect(4, 11, 3, 3, c('gold', 3));
    return outline(p, ink);
  };
  book.add('wise0', wise(0), solid);
  book.add('wise1', wise(1), solid);

  // The donkey (in all the paintings) and the ox (who gets the praise).
  const beast = (fur: string, kind: 'donkey' | 'ox', f: number) => {
    const p = new Pixels(20, 20, T);
    for (const x of [4, 6, 12, 14]) p.rect(x, 14, 2, 5, c(fur, 0)).set(x, 19, ink).set(x + 1, 19, ink);
    blob(p, 9, 10, 8, 5, pal.r(fur), 0, 3, 1.1);
    blob(p, 16, 7 - f, 3.5, 3, pal.r(fur), 1, 3, 1.1);
    p.set(17, 6 - f, ink);
    if (kind === 'donkey') p.line(15, 4 - f, 14, 0, c(fur, 2)).line(16, 4 - f, 16, 0, c(fur, 2)).rect(17, 8 - f, 3, 2, c('cloth', 2));
    else p.line(14, 4 - f, 12, 1, c('horn', 2)).line(17, 4 - f, 19, 1, c('horn', 2)).rect(17, 8 - f, 3, 2, c('pink', 1));
    p.line(1, 7, 0, 12, c(fur, 1));
    return outline(p, ink);
  };
  book.add('donkey0', beast('donkey', 'donkey', 0), { ...solid, ...hurt(-5) });
  book.add('donkey1', beast('donkey', 'donkey', 1), { ...solid, ...hurt(-5) });
  book.add('ox0', beast('ox', 'ox', 0), solid);
  book.add('ox1', beast('ox', 'ox', 1), solid);

  // The line at the manger, all facing Him: goats and lambs, still.
  book.add('lineGoat', g.back({ fur: 'goat', lo: 0, hi: 4, horns: true, beard: false }, 0), solid);
  book.add('lineBrown', g.back({ fur: 'camel', lo: 0, hi: 3, horns: true, beard: false }, 0), solid);
  const lineLamb = new Pixels(20, 20, T);
  for (const x of [7, 12]) lineLamb.rect(x, 15, 1, 4, c('ink', 1));
  blob(lineLamb, 10, 12, 5, 4.5, pal.r('wool'), 0, 3, 1.1);
  blob(lineLamb, 10, 6, 3, 2.6, pal.r('ink'), 1, 1);
  book.add('lineLamb', outline(lineLamb, ink), solid);

  // The Bard of Bizarre's rooster, spectacles and all, out for a stroll.
  const rooster = (f: number) => {
    const p = new Pixels(20, 20, T);
    p.line(9, 15, 9 - f, 19, c('gold', 1)).line(12, 15, 12 + f, 19, c('gold', 1));
    blob(p, 10, 11, 5, 4.5, pal.r('cloth'), 1, 3, 1.1);
    p.line(4, 8, 3, 4, c('red', 2)).line(5, 8, 4, 5, c('blue', 2)).line(6, 8, 6, 5, c('red', 1));
    blob(p, 14, 6, 3, 3, pal.r('cloth'), 1, 3, 1.1);
    p.rect(13, 1, 4, 2, c('red', 2)).set(14, 0, c('red', 2)).set(16, 0, c('red', 2));
    p.frame(12, 4, 3, 3, c('blue', 2)).frame(15, 4, 3, 3, c('blue', 2));
    p.set(18, 7, c('gold', 3)).set(19, 7, c('gold', 2)).rect(15, 9, 2, 2, c('red', 2));
    return outline(p, ink);
  };
  book.add('rooster0', rooster(0));
  book.add('rooster1', rooster(1));
  return book;
}
