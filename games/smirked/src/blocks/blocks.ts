// SMIRKED.BBL: every background block, drawn in code, seen from above at a slant (you see the
// floor, the tops of things and their fronts). A block's number is the order it was added (by
// name here); the attributes are the game:
//   - fog machines puff on a timer (next/ntime): step on one while it hisses and you scream
//     (nerve lost) and Lily smirks (counter 23); in between they are just floor;
//   - flashlight batteries count (counter 20); the door to the dark hallway only opens for four;
//   - the STAFF ONLY door opens for five sorries (counter 21, said to the witches you tackled);
//   - fake spiderwebs are curtains you walk through and sneeze (nerve, a smirk), and they tear;
//     fog lights and fake demon feet on the floor trip you once and stay knocked over;
//   - the gift shop's register sells the $12 souvenir sword (money, counter 3) and lets you
//     through to the last hall; the emergency exit only opens for the cardboard knight's helmet (counter 22);
//   - dollars, candy corn, glow sticks, juice boxes and bites of caramel apple lie about.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import { buildPalette, type Pal } from '../art/pal';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { willCameo } from '../../../kit/cameos';
import { BATTERIES, BATTERIES_NEEDED, MONEY, SMIRKS, SORRY, SORRY_NEEDED, SWORD_PRICE, HELMET } from '../ids';

export { BlockBook, SOLID };
/** Ticks a fog machine rests, and puffs. */
export const FOG_REST = 44;
export const FOG_PUFF = 22;

export function buildBlocks(pal: Pal): BlockBook {
  const book = new BlockBook();
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);
  const ink = c('ink', 0);
  const solid = { solid: SOLID };

  /** A big picture cut into blocks, left to right, top to bottom: names[row][col]. */
  const cut = (pic: Pixels, names: (string | null)[][], attrs: (name: string) => Parameters<BlockBook['add']>[2] = () => solid) => {
    names.forEach((row, ry) =>
      row.forEach((name, rx) => {
        if (name) book.add(name, pic.crop(rx * 20, ry * 20, 20, 20), attrs(name));
      }),
    );
  };

  // ---------- floors ----------
  /** Old floorboards, running left to right, a nail here and there. */
  const boards = (seed: number) => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('board'), 1, 3, 0.45 + Math.sin(x * 0.6 + Math.floor(y / 5) * 2.1 + seed) * 0.18, x, y));
    for (const y of [4, 9, 14, 19]) p.rect(0, y, 20, 1, c('board', 0));
    for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 4) * 5 + 2, c('board', 4));
    const seam = Math.floor(r() * 14) + 3;
    p.rect(seam, 0, 1, 4, c('board', 0)).rect((seam + 9) % 20, 10, 1, 4, c('board', 0));
    return p;
  };
  book.add('boards', boards(1));
  book.add('boards2', boards(2));
  /** The red velvet runner down the fog hall. */
  const runner = (() => {
    const p = boards(3);
    p.rect(2, 0, 16, 20, c('velvet', 1)).rect(2, 0, 1, 20, c('gold', 0)).rect(17, 0, 1, 20, c('gold', 0));
    for (let y = 2; y < 20; y += 6)
      p.set(10, y, c('velvet', 2))
        .set(9, y + 1, c('velvet', 2))
        .set(11, y + 1, c('velvet', 2));
    return p;
  })();
  book.add('runner', runner);
  /** Flagstones in the crypt. */
  const flags = (seed: number) => {
    // two quiet tones, so the witches and zombies read against it
    const p = speckle(P(), 0, 0, 20, 20, R('stone'), 1, 1, seed, 0.1).map((_x, _y, v) => (v === c('stone', 0) ? c('stone', 2) : v));
    p.rect(0, 9, 20, 1, c('stone', 0)).rect(0, 19, 20, 1, c('stone', 0));
    p.rect(((seed * 7) % 13) + 3, 0, 1, 9, c('stone', 0)).rect(((seed * 5) % 11) + 5, 10, 1, 9, c('stone', 0));
    return p;
  };
  book.add('flags', flags(4));
  book.add('flags2', flags(5));
  /** The fake woods' path: packed dirt and fallen leaves. */
  const dirt = (seed: number, leaves: number) => {
    // packed dark earth with a few lighter crumbs: two quiet tones under the werewolf
    const p = speckle(P(), 0, 0, 20, 20, R('dirt'), 1, 1, seed, 0.08).map((_x, _y, v) => (v === c('dirt', 0) ? c('dirt', 2) : v));
    const r = rng(seed + 9);
    for (let i = 0; i < leaves; i++) {
      const x = Math.floor(r() * 18) + 1;
      const y = Math.floor(r() * 18) + 1;
      p.set(x, y, c('leaf', 1 + (i % 3)))
        .set(x + 1, y, c('leaf', 2))
        .set(x, y + 1, c('leaf', 0));
    }
    return p;
  };
  book.add('dirt', dirt(6, 3));
  book.add('leaves', dirt(7, 12));
  /** The last hall's carpet: red with a gold diamond (the gift shop's). */
  const carpet = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++)
        p.set(x, y, Math.abs(x - 10) + Math.abs(y - 10) === 7 ? c('gold', 0) : (x * 3 + y * 7 + seed) % 11 === 0 ? c('velvet', 1) : c('velvet', 2));
    return p;
  };
  book.add('carpet', carpet(8));
  book.add('carpet2', carpet(9));

  // ---------- walls ----------
  const wallTop = P().rect(0, 0, 20, 20, c('black', 0));
  wallTop.rect(0, 0, 20, 1, c('black', 1)).rect(0, 19, 20, 1, ink);
  for (let y = 5; y < 20; y += 7) wallTop.rect(0, y, 20, 1, c('black', 1));
  book.add('wallTop', wallTop, solid);
  /** Peeling Victorian wallpaper, damask, and the wainscot. */
  const wallpaper = (seed: number) => {
    const p = P().rect(0, 0, 20, 20, c('paper', 1));
    for (let y = 2; y < 14; y += 6)
      for (let x = 2; x < 20; x += 8)
        p.set(x + 2, y, c('paper', 2))
          .set(x + 1, y + 1, c('paper', 2))
          .set(x + 3, y + 1, c('paper', 2))
          .set(x + 2, y + 2, c('paper', 2));
    const r = rng(seed);
    const peel = Math.floor(r() * 12) + 2;
    p.rect(peel, 3, 4, 3, c('paper', 0)).line(peel, 6, peel + 3, 3, c('paper', 3));
    p.rect(0, 14, 20, 6, c('board', 1)).rect(0, 14, 20, 1, c('board', 3)).rect(0, 19, 20, 1, c('board', 0));
    p.rect(0, 0, 20, 1, c('board', 2));
    return p;
  };
  book.add('paper', wallpaper(10), solid);
  book.add('paper2', wallpaper(11), solid);
  /** A boarded-up window, the full moon peeking between the planks. */
  const window = wallpaper(12);
  window.rect(3, 2, 14, 12, c('sky', 1)).disc(12, 6, 3, c('candle', 2));
  for (const [y, t] of [
    [4, 1],
    [8, -1],
    [11, 1],
  ] as const)
    window.line(2, y - t, 17, y + t, c('board', 3)).line(2, y - t + 1, 17, y + t + 1, c('board', 1));
  book.add('window', window, solid);
  /** The house's friendly portrait: Doc Leo, the Bard himself, in his fedora, smiling and winking at you. */
  const portrait = (look: number) => {
    const p = wallpaper(13);
    p.rect(4, 1, 12, 13, c('gold', 0)).rect(5, 2, 10, 11, c('purple', 1));
    blob(p, 10, 8, 3.4, 3.6, R('skin'), 1, 3);
    p.rect(6, 3, 8, 2, c('black', 0)).rect(7, 1, 6, 3, c('black', 0));
    p.rect(8, 10, 4, 1, c('white', 2)).set(7, 9, c('white', 2)).set(12, 9, c('white', 2)).set(10, 9, c('red', 2));
    // both eyes open, then a wink
    p.set(8, 6, ink).set(8, 7, ink);
    if (look) p.rect(11, 7, 2, 1, ink);
    else p.set(11, 6, ink).set(11, 7, ink);
    return p;
  };
  book.add('portrait', portrait(0), { solid: SOLID, next: 'portrait2', ntime: 40 });
  book.add('portrait2', portrait(1), { solid: SOLID, next: 'portrait', ntime: 40 });
  /** A candelabra on the wall, flickering. */
  const candles = (f: number) => {
    const p = wallpaper(14);
    p.rect(5, 9, 10, 2, c('gold', 0)).rect(9, 9, 2, 5, c('gold', 0));
    for (const x of [5, 9, 13]) {
      p.rect(x, 5, 2, 4, c('white', 2));
      p.set(x + ((x + f) % 2), 3, c('candle', 2))
        .set(x, 4, c('candle', 1))
        .set(x + 1, 4, c('candle', 0));
    }
    return p;
  };
  book.add('candles', candles(0), { solid: SOLID, next: 'candles2', ntime: 5 });
  book.add('candles2', candles(1), { solid: SOLID, next: 'candles', ntime: 6 });
  /** The crypt's stone wall. */
  const crypt = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('stone'), 1, 3, 0.4 + Math.sin(x * 0.9 + y * 0.4 + seed) * 0.15, x, y));
    for (const y of [0, 6, 13]) p.rect(0, y, 20, 1, c('stone', 0));
    for (const [y0, x] of [
      [0, 7],
      [6, 14],
      [13, 4],
    ])
      p.rect(x, y0, 1, 7, c('stone', 0));
    p.rect(0, 19, 20, 1, ink);
    return p;
  };
  book.add('crypt', crypt(15), solid);
  /** The crypt's wall with a party light strung across it (it's a haunted HOUSE). */
  const lights = (f: number) => {
    const p = crypt(16);
    p.line(0, 4, 20, 4, ink);
    for (const x of [2, 8, 14]) p.disc(x + 1, 6, 1.5, c(['purple', 'glow', 'pumpkin'][((x / 6 + f) % 3) | 0], f ? 3 : 2));
    return p;
  };
  book.add('lights', lights(0), { solid: SOLID, next: 'lights2', ntime: 10 });
  book.add('lights2', lights(1), { solid: SOLID, next: 'lights', ntime: 10 });
  /** The fake woods' wall: painted plywood trees and a black curtain behind them. */
  const woods = (seed: number) => {
    const p = P().rect(0, 0, 20, 20, c('black', 0));
    const r = rng(seed);
    for (let k = 0; k < 2; k++) {
      const x = Math.floor(r() * 14) + 2;
      p.rect(x, 0, 4, 20, c('board', 1)).rect(x, 0, 1, 20, c('board', 2));
      p.line(x + 3, 7, x + 8, 3, c('board', 1)).line(x, 11, x - 4, 6, c('board', 1));
    }
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 8), c('leaf', 1));
    p.rect(0, 18, 20, 2, c('grass', 0));
    return p;
  };
  book.add('woods', woods(17), solid);
  book.add('woods2', woods(18), solid);
  /** The last hall: black velvet curtains. */
  const curtain = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('velvet'), 0, 2, 0.5 + Math.sin((x + seed) * 1.1) * 0.35, x, y));
    p.rect(0, 0, 20, 2, c('gold', 0));
    return p;
  };
  book.add('curtain', curtain(0), solid);

  // ---------- the signs ----------
  /** "MILD SCARES FOR ALL AGES", three blocks wide over the fog hall's door. */
  {
    const p = new Pixels(60, 20);
    p.rect(0, 0, 60, 20, c('paper', 1)).rect(2, 2, 56, 15, c('board', 3)).frame(2, 2, 56, 15, c('board', 0));
    micro(p, 8, 4, 'MILD SCARES', c('red', 1));
    micro(p, 6, 11, 'FOR ALL AGES', ink);
    p.rect(0, 17, 60, 3, c('board', 1));
    cut(p, [['mild0', 'mild1', 'mild2']]);
  }
  /** STAFF ONLY: the door out of the crypt; five sorries open it. */
  const staff = (open: boolean) => {
    const p = crypt(19);
    if (!open) {
      p.rect(3, 1, 14, 19, c('board', 2)).rect(3, 1, 14, 1, c('board', 3)).rect(14, 10, 2, 2, c('silver', 2));
      p.rect(4, 3, 12, 6, c('white', 2));
      micro(p, 5, 3, 'STAFF', c('red', 1));
      micro(p, 6, 9, String(SORRY_NEEDED), c('white', 2));
      micro(p, 9, 9, 'SRY', c('white', 1));
    } else p.rect(3, 1, 14, 19, c('black', 0)).rect(3, 1, 2, 19, c('board', 2));
    return p;
  };
  book.add('staffDoor', staff(false), { solid: SOLID, effect: SORRY, eamt: -SORRY_NEEDED, score: 500, touch: 'staffOpen' });
  book.add('staffOpen', staff(true));
  /** The door to the dark hallway: the flashlight needs four batteries. */
  const dark = (open: boolean) => {
    const p = wallpaper(20);
    p.rect(3, 0, 14, 20, c('board', 0));
    if (!open) {
      p.rect(4, 1, 12, 19, c('board', 2))
        .rect(4, 1, 12, 1, c('board', 4))
        .rect(6, 4, 8, 5, c('board', 1))
        .rect(6, 11, 8, 6, c('board', 1))
        .set(14, 11, c('gold', 2));
      micro(p, 7, 5, `${BATTERIES_NEEDED}`, c('gold', 2));
      p.rect(10, 5, 3, 3, c('gold', 1)).rect(11, 4, 1, 1, c('gold', 1));
    } else for (let y = 1; y < 20; y++) p.rect(4, y, 12, 1, c('black', y % 4 ? 0 : 1));
    return p;
  };
  book.add('darkDoor', dark(false), { solid: SOLID, effect: BATTERIES, eamt: -BATTERIES_NEEDED, score: 500, touch: 'darkOpen' });
  book.add('darkOpen', dark(true));
  /** The gift shop: a shelf of $12 foam swords. */
  const shelf = (what: 'swords' | 'plush' | 'mugs') => {
    const p = P().rect(0, 0, 20, 20, c('board', 2));
    p.rect(0, 0, 20, 2, c('board', 4)).rect(0, 9, 20, 2, c('board', 3)).rect(0, 18, 20, 2, c('board', 0));
    if (what === 'swords')
      for (const x of [3, 8, 13])
        p.rect(x, 1, 2, 8, c('foam', 2))
          .rect(x - 1, 7, 4, 1, c('gold', 1))
          .rect(x, 8, 2, 2, c('red', 1))
          .rect(x + 1, 11, 2, 7, c('foam', 1))
          .rect(x, 16, 4, 1, c('gold', 1));
    if (what === 'plush')
      for (const [x, y] of [
        [4, 4],
        [12, 3],
        [7, 13],
        [15, 13],
      ])
        blob(p, x, y, 3, 3, R(['hoodie', 'pumpkin', 'zombie', 'fur'][(x + y) % 4]), 1, 3)
          .set(x - 1, y - 1, ink)
          .set(x + 1, y - 1, ink);
    if (what === 'mugs')
      for (const [x, y] of [
        [3, 3],
        [10, 3],
        [5, 12],
        [13, 12],
      ])
        p.rect(x, y, 5, 5, c('white', 2))
          .rect(x + 5, y + 1, 1, 3, c('white', 1))
          .set(x + 2, y + 2, c('pumpkin', 0));
    return p;
  };
  book.add('swords', shelf('swords'), solid);
  book.add('plush', shelf('plush'), solid);
  book.add('mugs', shelf('mugs'), solid);
  /** The register: "SWORDS $12". Pay, and the clerk lets you through to the last hall. */
  const register = (paid: boolean) => {
    const p = dirt(21, 2);
    if (!paid) {
      p.rect(0, 4, 20, 16, c('board', 2)).rect(0, 4, 20, 2, c('board', 4));
      p.rect(3, 0, 10, 8, c('silver', 1)).rect(4, 1, 8, 3, c('glow', 0));
      micro(p, 5, 1, `$${SWORD_PRICE}`, c('glow', 2));
      micro(p, 2, 12, 'SWORD', c('gold', 2));
    } else {
      p.rect(0, 4, 3, 16, c('board', 2)).rect(17, 4, 3, 16, c('board', 2));
      micro(p, 6, 8, 'THX', c('gold', 2));
    }
    return p;
  };
  book.add('register', register(false), { solid: SOLID, effect: MONEY, eamt: -SWORD_PRICE, score: 1200, touch: 'registerPaid' });
  book.add('registerPaid', register(true));
  /** The emergency exit: the glowing sign, one block, at the top of the exit corridor behind the door, its arrow pointing down the way out; only the knight's helmet opens the door. */
  const exitSign = (lit: boolean) => {
    const p = curtain(1);
    const on = lit ? c('white', 2) : c('exitred', 2);
    p.rect(1, 3, 18, 15, ink).rect(2, 4, 16, 13, lit ? c('exitred', 1) : c('exitred', 0));
    micro(p, 3, 5, 'EXIT', on, 1);
    p.rect(9, 11, 2, 3, on).rect(7, 14, 6, 1, on).rect(8, 15, 4, 1, on);
    if (lit) for (let x = 0; x < 20; x++) if ((x * 7) % 5 === 0) p.set(x, 1, c('exitred', 0)).set(x, 19, c('exitred', 0));
    return p;
  };
  // it buzzes: lit, lit, lit, a flicker
  book.add('exitSign', exitSign(true), { solid: SOLID, next: 'exitSign2', ntime: 60 });
  book.add('exitSign2', exitSign(false), { solid: SOLID, next: 'exitSign', ntime: 2 });
  const exitDoor = (open: boolean) => {
    const p = carpet(22);
    if (!open) {
      p.rect(1, 0, 18, 20, c('silver', 0)).rect(2, 1, 16, 19, c('silver', 1)).rect(2, 9, 16, 2, c('silver', 2)).rect(3, 9, 14, 1, c('red', 1));
      micro(p, 4, 2, 'HELM', c('exitred', 1));
    } else p.rect(1, 0, 18, 20, c('candle', 2)).rect(1, 0, 2, 20, c('silver', 1));
    return p;
  };
  book.add('exitDoor', exitDoor(false), { solid: SOLID, effect: HELMET, eamt: -1, score: 2000, touch: 'exitOpen' });
  book.add('exitOpen', exitDoor(true));
  /** The front desk: a bowl of Bravery Badges and the guy's bell. */
  const desk = (part: 0 | 1) => {
    const p = carpet(23);
    p.rect(0, 4, 20, 16, c('board', 2)).rect(0, 4, 20, 2, c('board', 4)).rect(0, 18, 20, 2, c('board', 0));
    if (part === 0) {
      blob(p, 10, 6, 6, 3, R('silver'), 1, 2);
      for (const [x, y] of [
        [6, 5],
        [10, 6],
        [13, 5],
      ])
        p.disc(x, y, 1.6, c('gold', 2)).set(x, y + 2, c('red', 2));
      micro(p, 2, 12, 'BRAVE', c('gold', 2));
    } else {
      p.disc(10, 5, 3, c('gold', 1)).rect(9, 2, 2, 1, c('gold', 2));
      micro(p, 3, 12, 'DESK', c('white', 1));
    }
    return p;
  };
  book.add('desk0', desk(0), solid);
  book.add('desk1', desk(1), solid);

  // ---------- haunted things (scenery) ----------
  /** A jack-o'-lantern, flickering. */
  const pumpkin = (bg: () => Pixels, f: number) => {
    const p = bg();
    blob(p, 10, 12, 7, 6, R('orange'), 0, 2);
    for (const x of [6, 10, 14]) p.line(x, 7, x, 17, c('orange', 0));
    p.rect(9, 4, 2, 3, c('grass', 1));
    const lit = c('pumpkin', f);
    p.rect(6, 9, 3, 2, lit).rect(11, 9, 3, 2, lit).set(10, 12, lit);
    for (let x = 6; x < 15; x++) p.set(x, 14 + (x % 2 ? 0 : 1), lit);
    return p;
  };
  book.add(
    'pumpkin',
    pumpkin(() => boards(24), 1),
    { solid: SOLID, next: 'pumpkin2', ntime: 7 },
  );
  book.add(
    'pumpkin2',
    pumpkin(() => boards(24), 2),
    { solid: SOLID, next: 'pumpkin', ntime: 5 },
  );
  book.add(
    'pumpkinD',
    pumpkin(() => dirt(25, 6), 1),
    { solid: SOLID, next: 'pumpkinD2', ntime: 6 },
  );
  book.add(
    'pumpkinD2',
    pumpkin(() => dirt(25, 6), 2),
    { solid: SOLID, next: 'pumpkinD', ntime: 8 },
  );
  /** A hay bale. */
  const hay = (bg: () => Pixels) => {
    const p = bg();
    p.rect(1, 4, 18, 14, c('yellow', 1)).rect(1, 4, 18, 3, c('yellow', 2)).rect(1, 16, 18, 2, c('yellow', 0));
    for (let x = 2; x < 19; x += 3) p.line(x, 7, x + 1, 15, c('yellow', 0));
    p.rect(1, 9, 18, 1, c('board', 1)).rect(1, 13, 18, 1, c('board', 1));
    return p;
  };
  book.add(
    'hay',
    hay(() => boards(26)),
    solid,
  );
  book.add(
    'hayD',
    hay(() => dirt(27, 4)),
    solid,
  );
  /** A coffin, lid ajar. */
  const coffin = (bg: () => Pixels) => {
    const p = bg();
    for (let y = 1; y < 19; y++) {
      const w = y < 6 ? 5 + y : 11 - (y - 6) * 0.35;
      p.rect(10 - w / 2, y, w, 1, c('board', 0));
      p.rect(10 - w / 2 + 1, y, w - 2, 1, c('board', y < 10 ? 2 : 1));
    }
    p.line(4, 7, 15, 5, c('black', 0)).rect(8, 8, 4, 1, c('gold', 0)).rect(9, 7, 2, 4, c('gold', 0));
    return p;
  };
  book.add(
    'coffin',
    coffin(() => boards(28)),
    solid,
  );
  book.add(
    'coffinS',
    coffin(() => flags(29)),
    solid,
  );
  /** Tombstones (foam, but still). */
  const tomb = (words: string, seed: number) => {
    const p = flags(seed);
    p.rect(4, 3, 12, 15, c('stone', 2)).disc(10, 5, 6, c('stone', 2)).rect(4, 17, 12, 2, c('stone', 0));
    p.rect(15, 5, 1, 13, c('stone', 1));
    micro(p, 10 - words.length * 2, 7, words, c('stone', 0));
    p.rect(2, 18, 16, 2, c('grass', 0));
    return p;
  };
  book.add('tombRip', tomb('RIP', 30), solid);
  book.add('tombBoo', tomb('BOO', 31), solid);
  book.add('tombLol', tomb('LOL', 32), solid);
  /** A cauldron of green bubbling dry ice. */
  const cauldron = (f: number) => {
    const p = flags(33);
    blob(p, 10, 13, 8, 6, R('black'), 0, 2);
    blob(p, 10, 9, 7, 2.6, R('glow'), 0, 1);
    for (const [x, y] of [
      [6, 8],
      [12, 9],
      [9, 7],
    ])
      p.disc(x + ((f + x) % 2), y - f, 1.2, c('glow', 2));
    p.rect(4, 18, 3, 2, c('black', 1)).rect(13, 18, 3, 2, c('black', 1));
    return p;
  };
  book.add('cauldron', cauldron(0), { solid: SOLID, next: 'cauldron2', ntime: 6 });
  book.add('cauldron2', cauldron(1), { solid: SOLID, next: 'cauldron', ntime: 6 });
  /** An iron fence round the graves. */
  const fence = flags(34);
  fence.rect(0, 6, 20, 2, c('black', 1)).rect(0, 14, 20, 2, c('black', 1));
  for (let x = 1; x < 20; x += 4)
    fence
      .rect(x, 3, 2, 15, c('black', 0))
      .set(x, 2, c('black', 1))
      .set(x + 1, 2, c('black', 1));
  book.add('fence', fence, solid);
  /** A dead (plywood) tree in the fake woods. */
  const tree = (seed: number) => {
    const p = dirt(seed, 5);
    const r = rng(seed);
    // a gnarled trunk, wider at the roots, with a knothole face
    for (let y = 4; y < 20; y++) {
      const w = 5 + (y > 15 ? (y - 15) * 1.2 : 0);
      for (let x = Math.round(10 - w / 2); x < 10 + w / 2; x++) p.set(x, y, c('board', x < 10 - w / 2 + 1.5 ? 4 : x > 10 + w / 2 - 2 ? 1 : 3));
    }
    p.rect(8, 9, 1, 2, ink).rect(11, 9, 1, 2, ink).rect(9, 13, 2, 2, ink);
    // bare branches clawing up and out
    for (const [x0, y0, x1, y1] of [
      [9, 6, 2, 1],
      [11, 6, 18, 2],
      [4, 3, 3, 0],
      [16, 3, 18, 0],
      [10, 5, 9, 0],
      [6, 4, 1, 5],
      [14, 4, 19, 6],
    ]) {
      p.line(x0, y0, x1, y1, c('board', 3)).line(x0, y0 + 1, x1, y1 + 1, c('board', 1));
    }
    for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 18) + 1, Math.floor(r() * 4), c('leaf', 1));
    return p;
  };
  book.add('tree', tree(35), solid);
  book.add('tree2', tree(36), solid);
  /** A painted cardboard bush. */
  const bush = dirt(37, 2);
  blob(bush, 10, 11, 8, 7, R('grass'), 0, 2);
  bush.rect(1, 17, 18, 2, c('cardboard', 1));
  book.add('bush', bush, solid);

  // ---------- hazards ----------
  /** A fog machine in the floor: a grate that rests, then hisses fog (scream; Lily smirks). */
  const vent = (puff: number) => {
    const p = boards(38);
    p.rect(3, 4, 14, 12, c('black', 1)).rect(4, 5, 12, 10, c('black', 0));
    for (let x = 5; x < 16; x += 2) p.rect(x, 5, 1, 10, c('silver', 0));
    if (puff) {
      const r = rng(39 + puff);
      for (let i = 0; i < 70; i++) {
        const a = r() * 6.28;
        const d = r() * (5 + puff * 3);
        p.set(10 + Math.cos(a) * d * 1.2, 10 + Math.sin(a) * d * 0.9 - puff, c('fog', Math.min(3, 1 + Math.floor((9 - d) / 3) + (i % 2))));
      }
    }
    return p;
  };
  const hurt = (hp: number) => ({ hp, effect: SMIRKS, eamt: 1 });
  book.add('vent', vent(0), { next: 'ventPuff', ntime: FOG_REST });
  book.add('ventPuff', vent(1), { ...hurt(-6), touch: 'vent', next: 'ventPuff2', ntime: FOG_PUFF / 2 });
  book.add('ventPuff2', vent(2), { ...hurt(-6), touch: 'vent', next: 'vent', ntime: FOG_PUFF / 2 });
  /** A fake spiderweb hanging across the path: walk through it, sneeze, and it tears. */
  const web = (bg: Pixels, torn: boolean) => {
    const p = bg;
    const strands = torn ? 3 : 8;
    for (let k = 0; k < strands; k++) {
      const a = (k / 8) * Math.PI * 2;
      p.line(10, 10, 10 + Math.cos(a) * 12, 10 + Math.sin(a) * 12, c('web', 1));
    }
    if (!torn) for (const rr of [3, 6, 9]) for (let a = 0; a < 6.28; a += 0.25) p.set(10 + Math.cos(a) * rr, 10 + Math.sin(a) * rr, c('web', 2));
    else p.line(2, 18, 6, 12, c('web', 0)).line(15, 2, 18, 8, c('web', 0));
    return p;
  };
  book.add('web', web(dirt(40, 4), false), { ...hurt(-4), touch: 'webTorn' });
  book.add('webTorn', web(dirt(40, 4), true));
  /** A fog light on the floor (trip; it stays knocked over). */
  const fogLight = (over: boolean) => {
    const p = dirt(41, 3);
    if (!over) {
      p.rect(6, 9, 8, 7, c('black', 1)).rect(7, 9, 6, 2, c('candle', 2)).rect(5, 15, 10, 2, c('black', 0));
      for (let y = 0; y < 9; y++) p.rect(10 - y / 1.5, y, 1 + (y * 4) / 3, 1, c('fog', 0));
    } else p.rect(3, 12, 10, 6, c('black', 1)).rect(13, 13, 2, 4, c('candle', 1)).rect(15, 12, 4, 6, c('fog', 0));
    return p;
  };
  book.add('fogLight', fogLight(false), { ...hurt(-5), touch: 'fogLightOver' });
  book.add('fogLightOver', fogLight(true));
  /** Fake demon feet sticking out from under a bush (trip). */
  const feet = (kicked: boolean) => {
    const p = dirt(42, 3);
    blob(p, 10, 4, 9, 4, R('grass'), 0, 2);
    for (const x of kicked ? [3] : [5, 12]) {
      p.rect(x, 7, 4, 8, c('red', 1)).rect(x - 1, 14, 6, 3, c('red', 2));
      for (let k = 0; k < 3; k++) p.set(x - 1 + k * 2, 17, c('white', 2));
    }
    return p;
  };
  book.add('feet', feet(false), { ...hurt(-5), touch: 'feetKicked' });
  book.add('feetKicked', feet(true));

  // ---------- things to pick up ----------
  type Floor = { name: string; bg: () => Pixels };
  const FLOORS: Floor[] = [
    { name: 'B', bg: () => boards(50) },
    { name: 'S', bg: () => flags(51) },
    { name: 'D', bg: () => dirt(52, 3) },
    { name: 'C', bg: () => carpet(53) },
  ];
  const floorOf: Record<string, string> = { B: 'boards', S: 'flags', D: 'dirt', C: 'carpet' };
  /** One pickup on each floor that wants it: `name` + the floor's letter. */
  const pickup = (name: string, on: string, draw: (p: Pixels) => void, a: Parameters<BlockBook['add']>[2]) => {
    for (const f of FLOORS)
      if (on.includes(f.name)) {
        const p = f.bg();
        draw(p);
        book.add(`${name}${f.name}`, p, { ...a, touch: floorOf[f.name] });
      }
  };
  // a dollar bill
  pickup(
    'dollar',
    'BSDC',
    (p) => {
      p.rect(3, 7, 14, 7, c('money', 1)).frame(3, 7, 14, 7, c('money', 0)).disc(10, 10, 2, c('money', 2));
      p.set(10, 10, c('money', 0)).rect(4, 8, 2, 1, c('money', 2)).rect(14, 12, 2, 1, c('money', 2));
    },
    { effect: MONEY, eamt: 1, score: 5 },
  );
  // candy corn
  pickup(
    'candy',
    'BSDC',
    (p) => {
      for (const [x, y] of [
        [6, 7],
        [12, 9],
        [8, 13],
      ] as const) {
        p.rect(x, y, 3, 1, c('white', 2))
          .rect(x, y + 1, 3, 1, c('orange', 2))
          .rect(x, y + 2, 3, 1, c('yellow', 2))
          .set(x + 1, y - 1, c('white', 2));
      }
    },
    { score: 10 },
  );
  // a juice box (with a bendy straw)
  pickup(
    'juice',
    'BSDC',
    (p) => {
      p.rect(6, 6, 8, 11, c('purple', 2)).rect(6, 6, 8, 2, c('purple', 3)).rect(8, 10, 4, 4, c('apple', 2)).set(9, 11, c('grass', 2));
      p.line(12, 6, 12, 2, c('white', 2)).line(12, 2, 14, 1, c('white', 2));
    },
    { hp: 10, score: 10 },
  );
  // a glow stick
  pickup(
    'glowstick',
    'BS',
    (p) => {
      p.line(5, 15, 15, 5, c('glow', 2)).line(6, 15, 16, 5, c('glow', 1)).line(4, 14, 14, 4, c('glow', 0));
    },
    { score: 25 },
  );
  // a flashlight battery
  pickup(
    'battery',
    'B',
    (p) => {
      p.rect(5, 8, 10, 5, c('black', 1)).rect(5, 8, 4, 5, c('gold', 1)).rect(15, 9, 1, 3, c('silver', 2)).set(11, 10, c('white', 2));
    },
    { effect: BATTERIES, eamt: 1, score: 25 },
  );
  // a bite of Lily's caramel apple she dropped (she has plenty)
  pickup(
    'apple',
    'BD',
    (p) => {
      blob(p, 10, 11, 5, 5, R('apple'), 0, 2);
      p.rect(5, 12, 10, 4, c('caramel', 1)).rect(5, 12, 10, 1, c('caramel', 2)).line(10, 6, 10, 1, c('board', 3));
    },
    { hp: 5, score: 15 },
  );
  // a souvenir in the last hall: Loaf #13 (the Bard's loaf), a lost TV remote, a mustard-seed pin
  pickup(
    'loaf',
    'C',
    (p) => {
      blob(p, 10, 11, 7, 4.6, R('caramel'), 0, 2);
      for (const x of [6, 10, 14]) p.line(x, 8, x + 1, 14, c('caramel', 0));
      micro(p, 7, 15, '13', c('white', 2));
    },
    { score: 130 },
  );
  pickup(
    'remote',
    'C',
    (p) => {
      p.rect(7, 3, 6, 14, c('black', 1)).rect(8, 4, 2, 1, c('red', 2));
      for (let k = 0; k < 6; k++) p.rect(8 + (k % 2) * 3, 7 + Math.floor(k / 2) * 3, 1, 1, c('white', 1));
    },
    { score: 100 },
  );

  // ---------- friends from the other games (scenery and small bonuses) ----------
  // the tin heart: in the crypt's far top corner, behind the start of the parade, a glint crossing it now and then (score only, no sound of its own)
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(
      `tinHeart${k || ''}`,
      drawTinHeart(flags(4), { ink, tin: [c('silver', 0), c('silver', 1), c('silver', 2)], white: c('white', 2), dark: c('black', 1) }, k),
      {
        score: 100,
        touch: 'flags',
        next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
        ntime: k ? 2 : 50,
      },
    );
  // the Easter egg: a painted one dropped in the fake woods' far corner (a few points)
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    book.add(
      `egg${k || ''}`,
      drawEasterEgg(
        dirt(6, 3),
        { ink, shell: [c('purple', 1), c('purple', 2), c('purple', 3)], paint: [c('orange', 1), c('orange', 2)], accent: c('yellow', 2), white: c('white', 2) },
        'zigzag',
        k,
      ),
      {
        score: 50,
        touch: 'dirt',
        next: `egg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
        ntime: k ? 3 : 60,
      },
    );
  // Will, the playwright in sweatpants, peeking out of the last hall's curtains (taking notes on the haunted house)
  {
    const p = curtain(2);
    // recolored from the unlit palette, so the block is the same in every room's light
    const will = willCameo(buildPalette('plain').pal, { face: 'front', mood: 'smug' });
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (will.get(x, y) !== 255) p.set(x, y, will.get(x, y));
    book.add('willCurtain', p, solid);
  }
  return book;
}
