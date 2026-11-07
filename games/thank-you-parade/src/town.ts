// The parade's town blocks: road and sidewalk, shop fronts with awnings, bunting, flagpoles with a waving flag,
// the thank-you card, and the neighbors who sit on lawn chairs along the curb and wave (each has three looks:
// waving, tipping a cap, and smiling with a card in the lap). Everything you walk in front of is air (it pulls down).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob, speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { PULL, SOLID } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';
import type { PBook } from './base';

/** Points for a card caught, and for a neighbor handed one. */
export const CARD_POINTS = 10;
export const VET_POINTS = 50;
/** The counter that carries thank-you cards (counters 20 to 29 are free for a game; 20 to 22 are the band's three things). */
export const CARDS = 23;

const air = { grav: PULL.down };

/** The street: road, sidewalk, shop walls and windows, awnings, shop doors and cornices. */
export function addStreet(book: PBook, pal: Pal): void {
  const { c, r } = pal;
  const S = skyOf(pal);
  const ink = c('ink', 0);
  const sky = () => new Pixels(20, 20, S);

  // ---- road and sidewalk (solid)
  {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, r('stone'), 0, 2, 41, 0.35);
    book.add('road', p, { solid: SOLID });
    const q = new Pixels(20, 20);
    speckle(q, 0, 0, 20, 20, r('stone'), 0, 2, 42, 0.35);
    q.rect(3, 8, 6, 3, c('gold', 3)).rect(12, 8, 6, 3, c('gold', 3)).rect(3, 8, 6, 1, c('gold', 5)).rect(12, 8, 6, 1, c('gold', 5));
    book.add('roadLine', q, { solid: SOLID });
    const w = new Pixels(20, 20, c('stone', 3));
    w.rect(0, 0, 20, 2, c('stone', 4)).rect(0, 2, 20, 1, c('stone', 2)).rect(0, 19, 20, 1, c('stone', 1)).rect(9, 3, 1, 16, c('stone', 2));
    w.rect(0, 0, 20, 1, c('white', 2));
    book.add('walk', w, { solid: SOLID });
  }
  // ---- shop fronts: a wall (two colors), a window, an awning, a shop door, a roof trim
  for (const [name, ramp] of [
    ['wallA', 'parch'],
    ['wallB', 'teal'],
  ] as const) {
    const w = r(ramp);
    const p = new Pixels(20, 20, w[2]);
    for (let y = 4; y < 20; y += 5) p.rect(0, y, 20, 1, w[1]);
    for (let y = 0; y < 20; y += 5) for (let x = (y / 5) % 2 ? 3 : 8; x < 20; x += 10) p.rect(x, y, 1, 5, w[1]);
    p.rect(0, 0, 1, 20, w[3]);
    book.add(name, p, air);
    const win = new Pixels(20, 20, w[2]);
    win.rect(0, 0, 1, 20, w[3]);
    win
      .rect(3, 3, 14, 14, c('ink', 0))
      .rect(4, 4, 12, 12, c('sky', 2))
      .rect(4, 4, 12, 3, c('sky', 4))
      .rect(9, 4, 2, 12, c('ink', 0))
      .rect(4, 10, 12, 1, c('ink', 0));
    win.rect(2, 17, 16, 2, w[4]);
    book.add(`${name}Win`, win, air);
  }
  {
    const p = sky();
    const red = r('red');
    for (let x = 0; x < 20; x++) {
      const stripe = Math.floor(x / 5) % 2 === 0;
      for (let y = 0; y < 10; y++) p.set(x, y, stripe ? red[3] : c('white', 3));
      p.rect(x, 10, 1, 1, stripe ? red[1] : c('white', 1));
    }
    p.rect(0, 0, 20, 1, red[4]);
    for (let x = 0; x < 20; x += 5) p.rect(x, 10, 5, 2, Math.floor(x / 5) % 2 === 0 ? red[2] : c('white', 2));
    book.add('awning', outline(p, ink, { transparent: S }), air);
  }
  {
    const w = r('parch');
    const p = new Pixels(20, 20, w[2]);
    p.rect(3, 0, 14, 20, c('wood', 1)).rect(4, 0, 12, 20, c('wood', 3)).rect(5, 2, 10, 8, c('sky', 3)).rect(5, 2, 10, 2, c('sky', 5));
    p.rect(5, 12, 10, 7, c('wood', 2)).disc(14, 11, 1, c('gold', 4)).rect(3, 0, 1, 20, c('ink', 0)).rect(16, 0, 1, 20, c('ink', 0));
    book.add('shopDoor', p, air);
    const t = new Pixels(20, 20, w[3]);
    t.rect(0, 14, 20, 6, w[2]).rect(0, 12, 20, 2, c('brick', 3)).rect(0, 11, 20, 1, c('brick', 5));
    for (let x = 1; x < 20; x += 4) t.rect(x, 15, 2, 4, w[1]);
    book.add(
      'cornice',
      outline(
        t.map((_x, y, v) => (y < 11 ? S : v)),
        ink,
        { transparent: S },
      ),
      air,
    );
  }
}

/** Bunting and flagpoles with a waving flag. */
export function addFlags(book: PBook, pal: Pal): void {
  const { c, r } = pal;
  const S = skyOf(pal);
  const ink = c('ink', 0);
  const sky = () => new Pixels(20, 20, S);

  // ---- bunting: a string of little flags along the top of a block
  for (const [name, a, b] of [
    ['bunting0', 'red', 'blue'],
    ['bunting1', 'blue', 'red'],
  ] as const) {
    const p = sky();
    p.line(0, 1, 9, 5, ink).line(10, 5, 19, 1, ink);
    for (let k = 0; k < 4; k++) {
      const x = 1 + k * 5;
      const y = Math.round(1 + (k < 2 ? k * 1.7 : (3 - k) * 1.7 + 0.5));
      const col = k % 2 ? r(b)[3] : r(a)[3];
      for (let i = 0; i < 4; i++) p.rect(x + i, y + 1 + i, 4 - i * 1, 1, i === 0 ? col : col).rect(x + i, y + 1 + i, 1, 1, c('white', 2));
    }
    book.add(name, p, air);
  }
  // ---- a flagpole and a flag (two blocks wide, two frames of waving)
  {
    const pole = sky();
    pole.rect(17, 0, 3, 20, c('stone', 3)).rect(17, 0, 1, 20, c('white', 3)).rect(19, 0, 1, 20, c('stone', 1));
    book.add('pole', pole, air);
    const top = sky();
    top.rect(17, 5, 3, 15, c('stone', 3)).rect(17, 5, 1, 15, c('white', 3)).rect(19, 5, 1, 15, c('stone', 1));
    top.disc(18, 3, 2.6, c('gold', 4)).set(17, 2, c('gold', 5));
    book.add('poleTop', top, air);
    const flag = (wave: number): [Pixels, Pixels] => {
      const f = new Pixels(40, 20, S);
      const left = 0; // the flag starts at the pole's edge (the pole is the right edge of the block before)
      for (let x = 0; x < 28; x++) {
        const dy = Math.round(Math.sin((x + wave * 6) / 4.5) * 1.5);
        for (let y = 0; y < 14; y++) {
          const stripe = Math.floor(y / 2) % 2 === 0;
          f.set(left + x, 3 + y + dy, stripe ? c('red', 3) : c('white', 3));
        }
        if (x < 12) for (let y = 0; y < 8; y++) f.set(left + x, 3 + y + dy, c('blue', 2));
        if (x < 12) for (const sx of [2, 5, 8]) for (const sy of [1, 4]) f.set(left + sx + (sy === 4 ? 1 : 0), 3 + sy + dy, c('white', 4));
      }
      const o = outline(f, ink, { transparent: S });
      return [o.crop(0, 0, 20, 20), o.crop(20, 0, 20, 20)];
    };
    const [a0, a1] = flag(0);
    const [b0, b1] = flag(1);
    book.add('flagA0', a0, air);
    book.add('flagA1', a1, air);
    book.add('flagB0', b0, air);
    book.add('flagB1', b1, air);
    book.time('flagA0', 'flagB0', 9).time('flagB0', 'flagA0', 9).time('flagA1', 'flagB1', 9).time('flagB1', 'flagA1', 9);
  }
}

/** The thank-you card on the ground. */
export function addCard(book: PBook, pal: Pal): void {
  const { c } = pal;
  const S = skyOf(pal);
  const sky = () => new Pixels(20, 20, S);

  // ---- the thank-you card: a white card with a red ribbon and a few written lines, on the ground
  {
    const p = sky();
    p.rect(3, 4, 14, 11, c('ink', 0)).rect(4, 5, 12, 9, c('white', 3)).rect(4, 5, 12, 1, c('white', 4));
    p.rect(6, 8, 8, 1, c('blue', 2)).rect(6, 10, 6, 1, c('blue', 2)).rect(6, 12, 7, 1, c('blue', 2));
    p.rect(2, 8, 16, 2, c('red', 3)).rect(2, 8, 16, 1, c('red', 4)); // a red ribbon across
    p.rect(3, 6, 3, 2, c('red', 4)).rect(3, 10, 3, 2, c('red', 2)); // its bow, at one end (never a cross)
    book.add('card', p, { ...air, score: CARD_POINTS, effect: CARDS, eamt: 1, touch: 'sky' });
  }
}

/** The neighbors on lawn chairs: waving a little flag, tipping a cap, and smiling with the card. */
export function addNeighbors(book: PBook, pal: Pal): void {
  const { c, r } = pal;
  const S = skyOf(pal);
  const ink = c('ink', 0);
  const looks: { skin: string; hair: string; coat: string; cap: string }[] = [
    { skin: 'skin', hair: 'white', coat: 'green', cap: 'blue' },
    { skin: 'dirt', hair: 'stone', coat: 'purple', cap: 'wood' },
    { skin: 'skin', hair: 'stone', coat: 'orange', cap: 'teal' },
    { skin: 'dirt', hair: 'white', coat: 'blue', cap: 'brick' },
  ];
  looks.forEach((l, i) => {
    const draw = (state: 'wave' | 'tip' | 'done'): Pixels => {
      const p = new Pixels(20, 20, S);
      const coat = r(l.coat);
      const skin = r(l.skin);
      const hair = r(l.hair);
      // the lawn chair: back, seat and legs
      p.rect(2, 7, 2, 11, c('stone', 2)).rect(2, 15, 12, 2, c('stone', 3)).rect(3, 17, 1, 3, c('stone', 1)).rect(12, 17, 1, 3, c('stone', 1));
      blob(p, 9, 13, 5.2, 5, coat, 0, 4);
      p.rect(5, 17, 9, 2, coat[1]);
      blob(p, 9, 6, 3.8, 4.2, skin, 0, 3);
      blob(p, 9, 3.2, 4.2, 2.4, hair, 0, 2);
      p.set(8, 6, ink).set(11, 6, ink);
      if (state === 'done') {
        p.set(7, 8, ink).set(8, 9, ink).set(9, 9, ink).set(10, 9, ink).set(11, 8, ink);
        p.set(6, 7, c('pink', 2)).set(12, 7, c('pink', 2));
        p.rect(7, 12, 6, 4, c('white', 3)).rect(7, 12, 6, 1, c('red', 3)).rect(8, 14, 4, 1, c('blue', 2));
        p.disc(6, 14, 1.6, skin[2]).disc(13, 14, 1.6, skin[2]);
      } else {
        p.set(8, 8, ink).set(9, 9, ink).set(10, 9, ink).set(11, 8, ink);
        p.set(7, 7, c('pink', 2)).set(12, 7, c('pink', 2));
        p.disc(4, 14, 1.6, skin[2]);
        if (state === 'wave') {
          // the other arm up, a small flag in the fist
          p.line(13, 11, 16, 5, coat[2]).line(14, 11, 17, 5, coat[3]).disc(17, 4, 1.7, skin[2]);
          p.rect(17, 0, 1, 4, c('stone', 3));
          p.rect(18, 0, 2, 1, c('red', 3)).rect(18, 1, 2, 1, c('white', 3)).rect(18, 2, 2, 1, c('red', 3));
        } else {
          // tipping a cap: the cap lifted above the head in a raised hand
          p.line(13, 11, 15, 4, coat[2]).line(14, 11, 16, 4, coat[3]);
          const cap = r(l.cap);
          p.rect(11, 0, 8, 3, cap[3]).rect(11, 0, 8, 1, cap[4]).rect(16, 3, 4, 1, cap[1]).rect(11, 2, 5, 1, cap[2]);
          p.disc(15, 4, 1.6, skin[2]);
        }
      }
      return outline(p, ink, { transparent: S });
    };
    const rules = { ...air, score: VET_POINTS, effect: CARDS, eamt: -1 };
    book.add(`vet${i}`, draw('wave'), { ...rules, touch: `vet${i}Tip` });
    book.add(`vet${i}Tip`, draw('tip'), air);
    book.add(`vet${i}Done`, draw('done'), air);
    book.time(`vet${i}Tip`, `vet${i}Done`, 30);
  });
}
