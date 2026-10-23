// HOUSE.BBL: inside the house, drawn in code, seen from the side at a fly's eye view (where a
// block is about the length of a hand). Every bit of open air has no gravity: Carl hovers. The
// attributes are the game:
//   - snacks (popcorn, chips, salsa, pizza, candy) are counter 20 and the floor lamp only takes
//     Carl in when he has eaten eight ("on my lamp, on my food");
//   - smiles: a calendar, a clock, a picture or a recipe card on the kitchen wall, landed on, flash
//     a smile (counter 21), and the kitchen door only opens for six;
//   - the bedroom window opens once Carl has buzzed three ears (counter 22, from the monsters);
//   - a soda heals, a donut is an extra life, the stove's burner and a candle burn, the diffuser
//     and the smudge bowl give birth to oil mist and sage smoke, and the aux cord is the end.
import { CLEAR, wattCameo } from '../../../kit/cameos';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { Pixels, rng } from '../../../kit/pixels';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { buildPalette, type Pal } from '../art/pal';
import { EARS, EARS_NEEDED, MON, SMILES, SMILES_NEEDED, SNACKS, SNACKS_NEEDED } from '../ids';
import { AIR, BlockBook, LEDGE, LIFE, SOLID } from './common';

/** Ticks between puffs from the diffuser and the smudge bowl. */
export const MIST_EVERY = 64;
export const SNORE_EVERY = 46;

/** Cuts a big drawing into 20x20 blocks: the block at column i, row j. */
export const cut = (big: Pixels, i: number, j: number) => big.crop(i * 20, j * 20, 20, 20);

export function buildHouse(pal: Pal): BlockBook {
  const book = new BlockBook();
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);

  // ---------- the walls ----------
  /** Mint wallpaper with cream daisies (the pattern repeats every block). */
  const paperAt = (p: Pixels, x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const u = ((x % 20) + 20) % 20;
        const v = ((y % 20) + 20) % 20;
        p.set(x, y, u % 10 === 0 ? c('paper', 3) : c('paper', 2));
        for (const [dx, dy] of [
          [5, 5],
          [15, 15],
        ]) {
          const d = Math.hypot(u - dx, v - dy);
          if (d < 1.2) p.set(x, y, c('daisy', 0));
          else if (d < 3.2 && Math.round(Math.atan2(v - dy, u - dx) * 2.5) % 2 === 0) p.set(x, y, c('daisy', 2));
        }
      }
    return p;
  };
  const paper = () => paperAt(P(), 0, 0, 20, 20);
  /** Wood wainscot boards on the lower wall. */
  const panelAt = (p: Pixels, x0: number, y0: number, w: number, h: number) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        const u = ((x % 20) + 20) % 20;
        p.set(x, y, u % 5 === 0 ? c('panel', 1) : shadeAt(R('panel'), 2, 3, u % 5 === 1 ? 0.9 : 0.3, x, y));
      }
    return p;
  };
  const panel = () => panelAt(P(), 0, 0, 20, 20);
  book.add('paper', paper(), AIR);
  book.add('panel', panel(), AIR);
  const rail = paper();
  panelAt(rail, 0, 12, 20, 8).rect(0, 10, 20, 3, c('panel', 4)).rect(0, 13, 20, 1, c('panel', 0));
  book.add('rail', rail, AIR);
  const ceil = P().rect(0, 0, 20, 20, c('white', 2));
  ceil.rect(0, 13, 20, 3, c('white', 3)).rect(0, 16, 20, 2, c('white', 1)).rect(0, 18, 20, 2, c('grey', 2));
  for (let x = 2; x < 20; x += 5) ceil.set(x, 17, c('white', 3));
  book.add('ceil', ceil, { solid: SOLID });
  const shag = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('shag'), 2, 1, seed, 0.5);
    const r = rng(seed);
    for (let i = 0; i < 26; i++) {
      const x = r() * 20;
      const y = 1 + r() * 18;
      p.line(x, y, x + (r() - 0.5) * 2, y - 2, c('shag', 3));
    }
    p.rect(0, 0, 20, 1, c('shag', 3));
    return p;
  };
  book.add('shag', shag(11), { solid: SOLID });
  // a wet patch on the shag (the floor he keeps mopping)
  const wet = shag(12);
  blob(wet, 10, 4, 9, 2.4, R('water'), 1, 3);
  wet.set(6, 3, c('white', 3)).set(13, 4, c('white', 3));
  book.add('wet', wet, { solid: SOLID });
  // the side walls (solid, plain)
  const side = panel();
  side.rect(0, 0, 20, 20, c('panel', 1));
  for (let y = 0; y < 20; y += 5) side.rect(0, y, 20, 1, c('panel', 0));
  book.add('side', side, { solid: SOLID });

  // a window: four blocks (sky through the glass, curtains), scenery
  const windowArt = (bg: (p: Pixels) => Pixels, night: boolean) => {
    const big = new Pixels(40, 40);
    for (let y = 0; y < 40; y += 20) for (let x = 0; x < 40; x += 20) big.blit(bg(P()), x, y);
    for (let y = 4; y < 34; y++) for (let x = 6; x < 34; x++) big.set(x, y, shadeAt(R('sky'), 1, 5, (y - 4) / 30, x, y));
    if (night) big.disc(25, 12, 4, c('gold', 3)).disc(27, 11, 3.6, c('sky', 1));
    else {
      blob(big, 14, 12, 6, 2.4, R('white'), 2, 3);
      for (let x = 6; x < 34; x++) big.set(x, 30 - Math.round(Math.sin(x / 5) * 1.5), c('leaf', 2)).set(x, 31 - Math.round(Math.sin(x / 5)), c('leaf', 1));
      big.rect(6, 31, 28, 3, c('leaf', 1));
    }
    big.frame(5, 3, 30, 32, c('white', 3)).frame(6, 4, 28, 30, c('white', 1)).rect(19, 4, 2, 30, c('white', 3)).rect(6, 18, 28, 2, c('white', 3));
    big.rect(3, 34, 34, 3, c('white', 3)).rect(3, 37, 34, 1, c('white', 0));
    // curtains, gathered
    for (const [x0, dir] of [
      [2, 1],
      [33, -1],
    ] as const)
      for (let y = 1; y < 38; y++) {
        const w = 4 + Math.round(Math.max(0, 14 - Math.abs(y - 22)) * 0.2);
        for (let k = 0; k < w; k++) big.set(x0 + dir * k + (dir < 0 ? 4 : 0), y, c('couch', (k + Math.floor(y / 3)) % 3 === 0 ? 1 : 3));
      }
    big.rect(0, 0, 40, 2, c('wood', 1));
    return big;
  };
  const day = windowArt(() => paper(), false);
  book.add('winTL', cut(day, 0, 0), AIR);
  book.add('winTR', cut(day, 1, 0), AIR);
  book.add('winBL', cut(day, 0, 1), AIR);
  book.add('winBR', cut(day, 1, 1), AIR);

  // a bookshelf (solid), a framed picture and a plant (scenery)
  const shelf = (top: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('wood', 1));
    const r = rng(top ? 21 : 22);
    for (let y0 = top ? 6 : 1; y0 < 18; y0 += 9) {
      let x = 2;
      while (x < 18) {
        const w = 2 + Math.floor(r() * 2);
        const h = 5 + Math.floor(r() * 3);
        const k = ['red', 'shirt', 'leaf', 'ochre', 'purple'][Math.floor(r() * 5)];
        p.rect(x, y0 + 7 - h, w, h, c(k, 2)).rect(x, y0 + 7 - h, 1, h, c(k, 1));
        x += w;
      }
      p.rect(0, y0 + 7, 20, 2, c('wood', 3));
    }
    if (top) p.rect(0, 0, 20, 3, c('wood', 4)).rect(0, 3, 20, 1, c('wood', 0));
    p.rect(0, 0, 2, 20, c('wood', 2)).rect(18, 0, 2, 20, c('wood', 0));
    return p;
  };
  book.add('shelfTop', shelf(true), { solid: SOLID });
  book.add('shelf', shelf(false), { solid: SOLID });
  const plant = panel();
  plant.rect(6, 12, 9, 8, c('red', 1)).rect(5, 12, 11, 2, c('red', 2));
  for (let a = 0; a < 9; a++) p2(plant, a);
  function p2(p: Pixels, a: number) {
    const ang = -Math.PI / 2 + (a - 4) * 0.33;
    for (let t = 0; t < 12; t++) p.set(10 + Math.cos(ang) * t, 12 + Math.sin(ang) * t + (t * t) / 30, c('leaf', 1 + (t % 3)));
  }
  book.add('plant', plant, AIR);

  // ---------- the couch (burnt-orange corduroy) and the man on it ----------
  const cord = (p: Pixels, x0: number, y0: number, w: number, h: number, lo = 2) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) p.set(x, y, ((x % 20) + 20) % 3 === 0 ? c('couch', lo - 1) : c('couch', lo + ((y - y0) < 2 ? 1 : 0)));
    return p;
  };
  const back = cord(P(), 0, 0, 20, 20);
  back.rect(0, 0, 20, 2, c('couch', 4));
  book.add('couchBack', back, { solid: SOLID });
  const arm = (left: boolean) => {
    const p = panel();
    for (let y = 2; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const nx = left ? x : 19 - x;
        if (y < 8 && (nx - 10) ** 2 / 100 + (y - 8) ** 2 / 36 > 1) continue;
        p.set(x, y, nx % 3 === 0 ? c('couch', 1) : c('couch', y < 5 ? 4 : 2));
      }
    return p;
  };
  book.add('armL', arm(true), { solid: SOLID });
  book.add('armR', arm(false), { solid: SOLID });
  const seat = cord(P(), 0, 0, 20, 20, 3);
  seat.rect(0, 0, 20, 2, c('couch', 4)).rect(0, 12, 20, 1, c('couch', 0));
  seat.rect(19, 0, 1, 12, c('couch', 1));
  book.add('seat', seat, { solid: SOLID });
  const base = panel();
  cord(base, 0, 0, 20, 12, 1);
  base.rect(2, 12, 3, 6, c('wood', 0)).rect(15, 12, 3, 6, c('wood', 0));
  book.add('couchBase', base, { solid: SOLID });

  /** The man on the couch: two blocks wide, head (on the wallpaper), shirt (on the couch back) and lap (on the seat). */
  const manArt = (gloom: boolean) => {
    const big = new Pixels(40, 60);
    big.blit(rail, 0, 0).blit(rail, 20, 0);
    big.blit(back, 0, 20).blit(back, 20, 20);
    big.blit(seat, 0, 40).blit(seat, 20, 40);
    const ink = c('ink', 0);
    // shirt and arms
    blob(big, 20, 34, 15, 12, R('shirt'), 1, 3);
    big.rect(6, 40, 28, 8, c('shirt', 2));
    // jeans on the seat
    big.rect(4, 44, 32, 9, c('shirt', 1)).rect(4, 44, 32, 1, c('shirt', 0)).rect(19, 46, 2, 7, c('shirt', 0));
    // a hand holding the remote
    big.rect(28, 38, 6, 4, c('skin', 2)).rect(31, 33, 3, 7, c('grey', 0)).set(32, 34, c('red', 3));
    // the head: messy hair, tired eyes
    blob(big, 20, 14, 8.5, 9.5, R('skin'), 1, 3);
    blob(big, 20, 6, 9.5, 5, R('hair'), 0, 2);
    for (const x of [12, 15, 19, 24, 27]) big.line(x, 3, x - 2, -1, c('hair', 1));
    big.rect(11, 14, 2, 4, c('skin', 1)).rect(28, 14, 2, 4, c('skin', 1));
    const eyeY = 14;
    big.rect(15, eyeY, 3, 1, ink).rect(22, eyeY, 3, 1, ink);
    if (gloom) big.rect(15, eyeY + 1, 3, 1, c('skin', 0)).rect(22, eyeY + 1, 3, 1, c('skin', 0)).rect(17, 20, 6, 1, ink);
    else big.set(16, eyeY - 1, ink).set(23, eyeY - 1, ink).rect(17, 20, 6, 1, ink).set(23, 19, ink);
    big.rect(14, 11, 4, 1, c('hair', 0)).rect(22, 11, 4, 1, c('hair', 0));
    big.rect(19, 15, 2, 4, c('skin', 1));
    big.rect(13, 23, 14, 3, c('skin', 2)).rect(17, 26, 6, 2, c('skin', 1));
    return big;
  };
  const man = manArt(false);
  book.add('manTL', cut(man, 0, 0), AIR);
  book.add('manTR', cut(man, 1, 0), AIR);
  book.add('manML', cut(man, 0, 1), { solid: SOLID });
  book.add('manMR', cut(man, 1, 1), { solid: SOLID });
  book.add('manBL', cut(man, 0, 2), { solid: SOLID });
  book.add('manBR', cut(man, 1, 2), { solid: SOLID });
  const glum = manArt(true);
  book.add('glumTL', cut(glum, 0, 0), AIR);
  book.add('glumTR', cut(glum, 1, 0), AIR);

  // ---------- the coffee table and the snacks ----------
  const tableTop = panel();
  tableTop.rect(0, 0, 20, 5, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 5, 20, 1, c('wood', 0));
  for (let x = 1; x < 20; x += 7) tableTop.line(x, 2, x + 4, 2, c('wood', 2));
  book.add('tableTop', tableTop, { solid: SOLID });
  const leg = panel();
  leg.rect(3, 0, 3, 20, c('wood', 2)).rect(14, 0, 3, 20, c('wood', 2)).rect(3, 0, 1, 20, c('wood', 3));
  book.add('tableLeg', leg, AIR);

  const bowl = (p: Pixels, ramp: string, striped = false) => {
    for (let y = 12; y < 19; y++) {
      const w = 8 - (y - 12) * 0.6;
      for (let x = Math.round(10 - w); x <= 10 + w; x++) p.set(x, y, striped && Math.floor(x / 3) % 2 ? c('white', 3) : c(ramp, y === 12 ? 3 : 2));
    }
    p.rect(5, 19, 10, 1, c('ink', 1));
    return p;
  };
  const food = (kind: string, bg: () => Pixels): Pixels => {
    const p = bg();
    const r = rng(kind.length * 7 + 3);
    if (kind === 'popcorn') {
      for (let i = 0; i < 9; i++) blob(p, 4 + r() * 12, 6 + r() * 6, 2.2, 1.9, R('white'), 2, 3).set(4 + r() * 12, 8 + r() * 4, c('daisy', 1));
      bowl(p, 'red', true);
    } else if (kind === 'chips') {
      for (let i = 0; i < 7; i++) {
        const x = 4 + r() * 12;
        const y = 7 + r() * 5;
        blob(p, x, y, 2.8, 1.7, R('chip'), 1, 3);
      }
      bowl(p, 'shirt');
    } else if (kind === 'salsa') {
      bowl(p, 'leaf');
      p.rect(4, 11, 13, 2, c('red', 2));
      for (let x = 5; x < 16; x += 3) p.set(x, 11, c('leaf', 3));
      blob(p, 16, 9, 2.6, 1.6, R('chip'), 1, 3);
    } else if (kind === 'pizza') {
      for (let y = 9; y < 18; y++) for (let x = 3 + Math.round((y - 9) * 0.3); x < 17 - (y - 9); x++) p.set(x, y, y < 11 ? c('chip', 1) : c('daisy', 2));
      for (const [x, y] of [[6, 13], [10, 12], [8, 15]]) p.disc(x, y, 1.2, c('red', 1));
      p.rect(2, 18, 16, 2, c('white', 3));
    } else if (kind === 'candy') {
      p.rect(4, 15, 12, 4, c('steel', 1)).rect(3, 14, 14, 1, c('steel', 2));
      for (const [x, y, k] of [[6, 12, 'red'], [10, 11, 'leaf'], [13, 12, 'purple'], [8, 13, 'gold'], [12, 13, 'pink']] as const) p.disc(x, y, 1.6, c(k, 2));
    } else if (kind === 'pie') {
      blob(p, 10, 13, 8, 3.6, R('chip'), 1, 3);
      for (let x = 4; x < 17; x += 3) p.line(x, 11, x + 2, 15, c('chip', 0));
      p.rect(2, 16, 16, 3, c('steel', 2));
    }
    return p;
  };
  const empty = (bg: () => Pixels, plate: boolean): Pixels => {
    const p = bg();
    if (plate) p.rect(2, 18, 16, 2, c('white', 3)).set(7, 17, c('chip', 2)).set(12, 17, c('chip', 1));
    else bowl(p, 'grey').set(8, 11, c('chip', 2)).set(12, 11, c('white', 3));
    return p;
  };
  const snack = { effect: SNACKS, eamt: 1, score: 50 };
  book.add('bowl', empty(panel, false), AIR);
  book.add('plate', empty(panel, true), AIR);
  book.add('popcorn', food('popcorn', panel), { ...snack, touch: 'bowl' });
  book.add('chips', food('chips', panel), { ...snack, touch: 'bowl' });
  book.add('salsa', food('salsa', panel), { ...snack, touch: 'bowl' });
  book.add('pizza', food('pizza', panel), { ...snack, touch: 'plate' });
  book.add('candy', food('candy', panel), { ...snack, touch: 'plate' });
  book.add('plateP', empty(paper, true), AIR);
  book.add('candyP', food('candy', paper), { ...snack, touch: 'plateP' });
  book.add('pizzaP', food('pizza', paper), { ...snack, touch: 'plateP' });
  // crumbs: points
  const crumbs = (bg: () => Pixels, seed: number) => {
    const p = bg();
    const r = rng(seed);
    for (let i = 0; i < 4; i++) blob(p, 5 + r() * 10, 8 + r() * 8, 1.6, 1.3, R('chip'), 1, 3);
    return p;
  };
  book.add('crumbW', crumbs(paper, 31), { score: 10, touch: 'paper' });
  book.add('crumbP', crumbs(panel, 32), { score: 10, touch: 'panel' });
  // a can of soda: health
  const soda = (bg: () => Pixels) => {
    const p = bg();
    p.rect(6, 6, 8, 13, c('red', 2)).rect(6, 6, 2, 13, c('red', 3)).rect(6, 5, 8, 1, c('steel', 2)).rect(6, 19, 8, 1, c('steel', 1));
    p.rect(7, 10, 6, 3, c('white', 3)).line(14, 4, 12, 0, c('white', 3));
    return p;
  };
  book.add('soda', soda(panel), { hp: 30, score: 10, touch: 'panel' });
  book.add('sodaW', soda(paper), { hp: 30, score: 10, touch: 'paper' });
  // a donut: an extra life
  const donut = (bg: () => Pixels) => {
    const p = bg();
    blob(p, 10, 12, 8, 5.5, R('chip'), 1, 3);
    blob(p, 10, 11, 7, 4.2, R('pink'), 1, 2);
    p.disc(10, 11, 2, bg().get(10, 11));
    for (const [x, y, k] of [[6, 10, 'gold'], [13, 9, 'leaf'], [8, 13, 'shirt'], [14, 12, 'white']] as const) p.set(x, y, c(k, 3));
    micro(p, 1, 1, '+1', c('white', 3));
    return p;
  };
  book.add('donut', donut(panel), { effect: LIFE, eamt: 1, score: 100, touch: 'panel' });
  book.add('donutW', donut(paper), { effect: LIFE, eamt: 1, score: 100, touch: 'paper' });

  // ---------- the TV (an old console set on a stand), showing the goat ----------
  const tvArt = (f: number) => {
    const big = new Pixels(40, 40);
    big.rect(0, 0, 40, 40, c('wood', 2)).rect(0, 0, 40, 2, c('wood', 4)).rect(0, 38, 40, 2, c('wood', 0));
    big.rect(3, 3, 34, 22, c('grey', 0));
    for (let y = 5; y < 23; y++) for (let x = 5; x < 35; x++) big.set(x, y, shadeAt(R('screen'), 1, 3, (y - 5) / 18, x, y));
    // the show: the third goat from the left on a hill, chewing
    for (let x = 5; x < 35; x++) for (let y = 18 + Math.round(Math.sin(x / 6)); y < 23; y++) big.set(x, y, c('leaf', 2));
    blob(big, 20, 15, 5, 3, R('white'), 2, 3);
    blob(big, 25, 12 + f, 2.4, 2, R('white'), 2, 3);
    big.set(26, 11 + f, c('ink', 0)).line(24, 9 + f, 23, 7 + f, c('grey', 2));
    for (const x of [17, 19, 21, 23]) big.line(x, 17, x, 19, c('white', 1));
    if (f) big.line(27, 14, 28, 15, c('leaf', 3));
    for (let y = 5; y < 23; y += 2) for (let x = 5; x < 35; x++) if ((x + y + f) % 9 === 0) big.set(x, y, c('screen', 3));
    // the grille and the knobs
    for (let y = 27; y < 37; y += 2) big.rect(4, y, 24, 1, c('wood', 0));
    big.disc(32, 29, 2, c('grey', 2)).disc(32, 35, 2, c('grey', 2)).set(32, 29, c('ink', 0));
    return big;
  };
  const tv0 = tvArt(0);
  const tv1 = tvArt(1);
  book.add('tvTL0', cut(tv0, 0, 0), { solid: SOLID, next: 'tvTL1', ntime: 9 });
  book.add('tvTL1', cut(tv1, 0, 0), { solid: SOLID, next: 'tvTL0', ntime: 9 });
  book.add('tvTR0', cut(tv0, 1, 0), { solid: SOLID, next: 'tvTR1', ntime: 9 });
  book.add('tvTR1', cut(tv1, 1, 0), { solid: SOLID, next: 'tvTR0', ntime: 9 });
  book.add('tvBL', cut(tv0, 0, 1), { solid: SOLID });
  book.add('tvBR', cut(tv0, 1, 1), { solid: SOLID });
  // rabbit ears on top
  const ears = paper();
  ears.line(10, 18, 3, 2, c('steel', 2)).line(10, 18, 17, 3, c('steel', 2)).rect(6, 17, 9, 3, c('grey', 1));
  book.add('rabbitEars', ears, AIR);
  // a side table (solid)
  const side2 = panel();
  side2.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 4, 20, 1, c('wood', 0)).rect(3, 5, 14, 15, c('wood', 1)).rect(8, 10, 4, 2, c('gold', 2));
  book.add('sideTable', side2, { solid: SOLID });

  // ---------- the floor lamp: the shade takes Carl in when he has had eight snacks ----------
  const shadeArt = (lit: boolean) => {
    const p = paper();
    for (let y = 3; y < 18; y++) {
      const w = 5 + (y - 3) * 0.45;
      for (let x = Math.round(10 - w); x <= 10 + w; x++) p.set(x, y, lit ? c('lamp', y > 14 ? 2 : 1) : c('daisy', (x + y) % 5 === 0 ? 1 : 2));
    }
    p.rect(4, 17, 13, 1, c('daisy', 0));
    if (lit) {
      for (let x = 2; x < 19; x += 4) p.line(x, 19, x - 1 + (x - 10) * 0.2, 19, c('lamp', 2));
      // Carl's spot: a tiny lounge chair of light
      p.rect(8, 1, 5, 2, c('lamp', 2));
    } else micro(p, 8, 8, String(SNACKS_NEEDED), c('panel', 1));
    return p;
  };
  book.add('shade', shadeArt(false), { solid: SOLID, effect: SNACKS, eamt: -SNACKS_NEEDED, score: 500, touch: 'shadeOn' });
  book.add('shadeOn', shadeArt(true), AIR);
  const poleOn = (bg: () => Pixels) => {
    const p = bg();
    p.rect(9, 0, 2, 20, c('steel', 1)).rect(9, 0, 1, 20, c('steel', 2));
    return p;
  };
  book.add('pole', poleOn(paper), AIR);
  book.add('poleR', poleOn(() => rail.crop(0, 0, 20, 20)), AIR);
  book.add('poleP', poleOn(panel), AIR);
  const lampBase = poleOn(panel);
  blob(lampBase, 10, 18, 7, 3, R('steel'), 0, 2);
  book.add('lampBase', lampBase, AIR);

  // ---------- the kitchen ----------
  const tilesAt = (p: Pixels, accent = false) => {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, x % 10 === 0 || y % 10 === 0 ? c('tile', 0) : c('tile', (x % 10) + (y % 10) < 4 ? 3 : 2));
    if (accent) p.rect(11, 11, 9, 9, c('shirt', 3)).rect(13, 13, 5, 5, c('white', 3));
    return p;
  };
  const tiles = () => tilesAt(P());
  book.add('tiles', tiles(), AIR);
  book.add('tilesB', tilesAt(P(), true), AIR);
  book.add('crumbT', crumbs(tiles, 33), { score: 10, touch: 'tiles' });
  book.add('sodaT', soda(tiles), { hp: 30, score: 10, touch: 'tiles' });
  book.add('donutT', donut(tiles), { effect: LIFE, eamt: 1, score: 100, touch: 'tiles' });
  const cabinet = (handleY: number) => {
    const p = P().rect(0, 0, 20, 20, c('wood', 3));
    p.frame(1, 1, 18, 18, c('wood', 1)).frame(3, 3, 14, 14, c('wood', 2));
    p.rect(15, handleY, 2, 4, c('steel', 2));
    return p;
  };
  book.add('cabinet', cabinet(12), { solid: SOLID });
  book.add('cabinetLow', cabinet(3), { solid: SOLID });
  const counter = cabinet(8);
  counter.rect(0, 0, 20, 5, c('white', 1)).rect(0, 0, 20, 1, c('white', 3)).rect(0, 5, 20, 1, c('grey', 1));
  for (let x = 2; x < 20; x += 6) counter.set(x, 2, c('grey', 2));
  book.add('counter', counter, { solid: SOLID });
  const fridge = (top: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('white', 2));
    p.rect(0, 0, 1, 20, c('white', 1)).rect(19, 0, 1, 20, c('grey', 2));
    if (top) p.rect(0, 0, 20, 2, c('white', 3)).rect(0, 17, 20, 2, c('grey', 2)).rect(15, 6, 2, 9, c('steel', 1));
    else p.rect(15, 2, 2, 14, c('steel', 1));
    return p;
  };
  book.add('fridgeTop', fridge(true), { solid: SOLID });
  book.add('fridge', fridge(false), { solid: SOLID });
  // fridge magnets: the Bard's own, and a crayon drawing of a fly
  const fridgeArt = fridge(false);
  fridgeArt.rect(3, 4, 7, 9, c('white', 3)).frame(3, 4, 7, 9, c('grey', 2)).disc(6, 8, 1.6, c('ink', 0)).set(5, 7, c('eye', 2)).set(7, 7, c('eye', 2)).line(4, 6, 2, 4, c('wing', 1));
  fridgeArt.disc(6, 3, 1.4, c('red', 2)).disc(11, 15, 1.6, c('gold', 2));
  book.add('fridgeArt', fridgeArt, { solid: SOLID });
  const stove = P().rect(0, 0, 20, 20, c('grey', 3));
  stove.rect(0, 0, 20, 4, c('grey', 1));
  for (const x of [5, 14]) stove.rect(x - 3, 1, 6, 2, c('red', 3)).rect(x - 2, 0, 4, 1, c('gold', 2));
  stove.rect(2, 7, 16, 11, c('grey', 1)).rect(4, 9, 12, 6, c('ink', 1)).rect(4, 6, 12, 1, c('steel', 2));
  book.add('stove', stove, { solid: SOLID, hp: -8 });
  const sink = cabinet(10);
  sink.rect(0, 0, 20, 5, c('white', 1)).rect(3, 0, 14, 3, c('steel', 1)).rect(4, 0, 12, 2, c('steel', 0)).rect(0, 5, 20, 1, c('grey', 1));
  book.add('sink', sink, { solid: SOLID });
  const faucet = tiles();
  faucet.rect(9, 8, 3, 12, c('steel', 2)).rect(9, 8, 8, 3, c('steel', 2)).rect(15, 11, 2, 2, c('steel', 1)).rect(6, 17, 9, 3, c('steel', 1));
  book.add('faucet', faucet, AIR);
  // the spice rack (a ledge to land on)
  const rack = tiles();
  rack.rect(0, 15, 20, 3, c('wood', 2)).rect(0, 18, 20, 1, c('wood', 0));
  for (const [x, k] of [[2, 'red'], [7, 'ochre'], [12, 'leaf'], [16, 'gold']] as const) rack.rect(x, 8, 3, 7, c(k, 2)).rect(x, 7, 3, 1, c('white', 3));
  book.add('rack', rack, { solid: LEDGE });
  // a hook with a dish towel's empty loop (the towel is out flying)
  const breadbox = P().rect(0, 0, 20, 20, c('steel', 1));
  breadbox.rect(0, 0, 20, 6, c('steel', 2)).rect(2, 9, 16, 2, c('red', 2));
  micro(breadbox, 3, 13, 'BREAD', c('white', 3));
  book.add('breadbox', breadbox, { solid: SOLID });

  // smile spots on the kitchen wall: land on one and flash a smile
  const smileMark = (p: Pixels) => {
    p.disc(15, 15, 4, c('gold', 3)).disc(15, 15, 3, c('gold', 2));
    p.set(14, 14, c('ink', 0)).set(16, 14, c('ink', 0)).line(13, 16, 17, 16, c('ink', 0)).set(13, 15, c('ink', 0)).set(17, 15, c('ink', 0));
    for (const [x, y] of [[9, 10], [19, 9], [10, 19]]) p.set(x, y, c('white', 3));
    return p;
  };
  const spot = (kind: string) => {
    const p = tiles();
    if (kind === 'calendar') {
      p.rect(3, 2, 14, 16, c('white', 3)).rect(3, 2, 14, 5, c('red', 2)).set(10, 1, c('ink', 0));
      micro(p, 4, 3, 'JUNE', c('white', 3));
      for (let y = 9; y < 17; y += 3) for (let x = 4; x < 16; x += 3) p.set(x, y, c('grey', 1));
    } else if (kind === 'clock') {
      p.disc(10, 10, 8, c('ink', 0)).disc(10, 10, 7, c('white', 3));
      for (let k = 0; k < 12; k++) p.set(10 + Math.cos((k * Math.PI) / 6) * 6, 10 + Math.sin((k * Math.PI) / 6) * 6, c('grey', 1));
      p.line(10, 10, 10, 5, c('ink', 0)).line(10, 10, 14, 10, c('ink', 0));
    } else if (kind === 'picture') {
      p.rect(2, 3, 16, 14, c('gold', 1)).rect(4, 5, 12, 10, c('sky', 3));
      // a snapshot of Teddy the corgi
      blob(p, 10, 12, 4, 2.6, R('fur'), 1, 3);
      blob(p, 13, 9, 2.4, 2.2, R('fur'), 1, 3);
      p.line(12, 7, 12, 5, c('fur', 2)).line(14, 7, 15, 5, c('fur', 2)).set(15, 9, c('ink', 0)).set(13, 10, c('white', 3));
    } else {
      // a recipe card pinned up: the Bard's crusty bread
      p.rect(2, 5, 16, 11, c('white', 3)).rect(2, 5, 16, 2, c('shirt', 3)).disc(10, 5, 1.2, c('red', 2));
      for (let y = 9; y < 15; y += 2) p.line(4, y, 15, y, c('grey', 2));
    }
    return p;
  };
  for (const kind of ['calendar', 'clock', 'picture', 'recipe']) {
    book.add(`${kind}S`, smileMark(spot(kind)), AIR);
    book.add(kind, spot(kind), { effect: SMILES, eamt: 1, score: 100, touch: `${kind}S` });
  }
  // the kitchen door: opens for six smiles, onto the dark hallway
  const door = (open: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('wood', 1));
    if (open) p.rect(2, 0, 16, 20, c('ink', 0)).rect(2, 0, 2, 20, c('wood', 3));
    else {
      p.rect(2, 0, 16, 20, c('wood', 3)).frame(4, 2, 12, 7, c('wood', 2)).frame(4, 11, 12, 7, c('wood', 2)).disc(15, 10, 1.4, c('gold', 3));
      micro(p, 6, 4, String(SMILES_NEEDED), c('wood', 0));
    }
    return p;
  };
  book.add('door', door(false), { solid: SOLID, effect: SMILES, eamt: -SMILES_NEEDED, score: 500, touch: 'doorOpen' });
  book.add('doorOpen', door(true), AIR);
  book.add('doorFrame', door(true).rect(2, 0, 16, 20, c('wood', 3)).rect(4, 0, 12, 20, c('wood', 2)), { solid: SOLID });

  // ---------- the bedroom (by moonlight: the night palette) ----------
  const headboard = panel();
  headboard.rect(0, 0, 20, 20, c('wood', 1)).rect(2, 2, 16, 16, c('wood', 2)).rect(0, 0, 20, 2, c('wood', 3));
  book.add('headboard', headboard, { solid: SOLID });
  const blanket = (end: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? c('shirt', 2) : c('white', 2));
    p.rect(0, 0, 20, 2, c('white', 3));
    if (end) p.rect(17, 0, 3, 20, c('wood', 2));
    return p;
  };
  book.add('blanket', blanket(false), { solid: SOLID });
  const frame = panel();
  frame.rect(0, 0, 20, 8, c('wood', 2)).rect(0, 0, 20, 1, c('wood', 3)).rect(0, 8, 20, 1, c('wood', 0)).rect(1, 9, 3, 11, c('wood', 1)).rect(16, 9, 3, 11, c('wood', 1));
  book.add('bedFrame', frame, { solid: SOLID });
  book.add('blanketEnd', blanket(true), { solid: SOLID });
  // his head on the pillow, asleep (two blocks; his ear is a monster)
  const sleeper = new Pixels(40, 20);
  panelAt(sleeper, 0, 0, 40, 20);
  blob(sleeper, 20, 15, 18, 6, R('white'), 1, 3);
  blob(sleeper, 22, 9, 8, 7, R('skin'), 1, 3);
  blob(sleeper, 19, 5, 8, 4, R('hair'), 0, 2);
  sleeper.rect(24, 9, 3, 1, c('ink', 0)).rect(25, 13, 3, 1, c('ink', 0));
  sleeper.rect(0, 16, 40, 4, c('shirt', 2));
  book.add('sleepL', cut(sleeper, 0, 0), { solid: SOLID, birthMon: MON.snore, birthTime: SNORE_EVERY });
  book.add('sleepR', cut(sleeper, 1, 0), { solid: SOLID });
  const nightstand = panel();
  nightstand.rect(0, 2, 20, 18, c('wood', 2)).rect(0, 0, 20, 3, c('wood', 3)).rect(3, 8, 14, 1, c('wood', 0)).disc(10, 13, 1.2, c('gold', 2));
  book.add('nightstand', nightstand, { solid: SOLID });
  const alarm = panel();
  alarm.rect(2, 9, 16, 11, c('ink', 1)).rect(2, 9, 16, 1, c('grey', 2));
  micro(alarm, 3, 12, '3:47', c('eye', 2));
  book.add('alarm', alarm, AIR);
  const desk = panel();
  desk.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 4, 20, 1, c('wood', 0)).rect(2, 5, 3, 15, c('wood', 1)).rect(15, 5, 3, 15, c('wood', 1));
  book.add('desk', desk, { solid: SOLID });
  // the laptop, glowing: "Carl watches me work"
  const laptop = panel();
  laptop.rect(3, 3, 14, 12, c('grey', 1)).rect(4, 4, 12, 10, c('screen', 2));
  for (let y = 5; y < 13; y += 2) laptop.line(5, y, 5 + ((y * 7) % 9), y, c('screen', 3));
  laptop.rect(1, 15, 18, 3, c('grey', 2)).rect(1, 18, 18, 1, c('grey', 0));
  book.add('laptop', laptop, AIR);
  // Teddy's dog bed (Teddy curled up in it; his ear is a monster)
  const dogBed = new Pixels(40, 20);
  panelAt(dogBed, 0, 0, 40, 20);
  blob(dogBed, 20, 14, 19, 6, R('red'), 0, 2);
  blob(dogBed, 20, 12, 13, 5, R('fur'), 1, 3);
  blob(dogBed, 28, 10, 5, 4, R('fur'), 1, 3);
  dogBed.rect(26, 13, 6, 2, c('white', 3)).set(31, 10, c('ink', 0)).rect(27, 10, 3, 1, c('ink', 0));
  book.add('dogBedL', cut(dogBed, 0, 0), { solid: SOLID });
  book.add('dogBedR', cut(dogBed, 1, 0), { solid: SOLID });
  // the bedroom window, in the end wall: shut (the upper sash over the lower one, the latch on
  // it), it only opens when he's had enough (three ears buzzed): the lower sash goes up and the
  // night is out there
  const sashArt = (part: 'top' | 'shut' | 'open') => {
    const p = side.crop(0, 0, 20, 20);
    const glassTo = part === 'top' ? 20 : 15;
    for (let y = part === 'top' ? 3 : 0; y < glassTo; y++) for (let x = 6; x < 14; x++) p.set(x, y, part === 'open' ? c('sky', 0) : shadeAt(R('sky'), 0, 2, y / 20, x, y));
    p.rect(5, part === 'top' ? 2 : 0, 1, 20, c('white', 3)).rect(14, part === 'top' ? 2 : 0, 1, 20, c('white', 1));
    if (part === 'top') p.rect(5, 2, 10, 1, c('white', 3)).line(7, 5, 9, 9, c('sky', 3));
    else {
      if (part === 'shut') p.rect(6, 0, 8, 2, c('white', 3)).rect(6, 2, 8, 1, c('white', 1));
      else p.set(9, 4, c('white', 3)).set(12, 9, c('sky', 3));
      p.rect(3, 15, 14, 2, c('white', 3)).rect(3, 17, 14, 1, c('white', 0));
    }
    if (part === 'shut') micro(p, 8, 5, String(EARS_NEEDED), c('gold', 3));
    return p;
  };
  book.add('sashTop', sashArt('top'), { solid: SOLID });
  book.add('sash', sashArt('shut'), { solid: SOLID, effect: EARS, eamt: -EARS_NEEDED, score: 500, touch: 'sashOpen' });
  book.add('sashOpen', sashArt('open'), AIR);
  // the night outside it: stars, and the moon (Carl flies out the open window into it)
  const night = (moon: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('sky', 0));
    const r = rng(moon ? 31 : 32);
    for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('sky', i ? 2 : 3));
    if (moon) p.disc(10, 10, 5, c('gold', 3)).disc(12, 9, 4.4, c('sky', 0));
    return p;
  };
  book.add('night', night(false), { solid: SOLID });
  book.add('nightAir', night(false), AIR);
  book.add('moon', night(true), { solid: SOLID });

  // ---------- the living room in gloom: sage, oils, the mop, and the stereo ----------
  // a smudge bowl of burning sage (gives birth to smoke) and the oil diffuser (gives birth to mist)
  const smudge = panel();
  smudge.rect(3, 14, 14, 5, c('earth', 2)).rect(2, 13, 16, 1, c('earth', 3));
  for (let k = 0; k < 5; k++) smudge.line(6 + k * 2, 13, 8 + k * 2, 7, c('smoke', 1 + (k % 2)));
  smudge.set(9, 7, c('red', 3)).set(11, 7, c('gold', 3));
  book.add('smudge', smudge, { solid: SOLID, birthMon: MON.sage, birthTime: MIST_EVERY });
  const diffuser = panel();
  blob(diffuser, 10, 14, 6, 6, R('white'), 1, 3);
  diffuser.rect(7, 18, 6, 2, c('wood', 1)).rect(8, 7, 4, 2, c('white', 3)).set(10, 15, c('led', 1));
  book.add('diffuser', diffuser, { solid: SOLID, birthMon: MON.mist, birthTime: MIST_EVERY + 23 });
  const candle = panel();
  candle.rect(7, 10, 6, 10, c('white', 3)).rect(7, 10, 2, 10, c('white', 2)).line(10, 9, 10, 7, c('ink', 0));
  blob(candle, 10, 5, 1.8, 3, R('lamp'), 1, 2);
  book.add('candle', candle, { hp: -6 });
  // the stereo: a receiver and a tape deck, speakers, and the aux cord hanging off the back
  const stereo = (deck: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('ink', 1));
    p.rect(0, 0, 20, 2, c('grey', 2)).rect(0, 18, 20, 2, c('grey', 0));
    if (deck) {
      p.rect(2, 5, 7, 6, c('grey', 0)).rect(11, 5, 7, 6, c('grey', 0)).disc(5, 8, 1.4, c('steel', 1)).disc(14, 8, 1.4, c('steel', 1));
      for (let x = 2; x < 18; x += 3) p.rect(x, 14, 2, 2, c('steel', 1));
    } else {
      p.rect(2, 4, 12, 5, c('screen', 1));
      micro(p, 3, 5, 'FM 95', c('led', 1));
      p.disc(16, 12, 2.4, c('steel', 2)).set(16, 10, c('ink', 0));
      for (let x = 2; x < 13; x += 2) p.rect(x, 12, 1, 3 + (x % 3), c('led', 0));
    }
    return p;
  };
  book.add('receiver', stereo(false), { solid: SOLID });
  book.add('deck', stereo(true), { solid: SOLID });
  const speaker = P().rect(0, 0, 20, 20, c('wood', 1));
  speaker.disc(10, 7, 5, c('ink', 0)).disc(10, 7, 2, c('grey', 1)).disc(10, 15, 3, c('ink', 0)).frame(0, 0, 20, 20, c('wood', 0));
  book.add('speaker', speaker, { solid: SOLID });
  // the aux cord: Carl takes it
  const aux = (held: boolean) => {
    const p = panel();
    for (let y = 0; y < 14; y++) p.set(10 + Math.round(Math.sin(y / 3) * 2), y, c('ink', 0)).set(11 + Math.round(Math.sin(y / 3) * 2), y, c('grey', 1));
    p.rect(8, 13, 5, 4, c('grey', 2)).rect(9, 17, 3, 3, c('gold', 3));
    if (held) for (const [x, y] of [[3, 4], [17, 6], [4, 15], [16, 16]]) p.set(x, y, c('gold', 3)).set(x + 1, y, c('gold', 2)).set(x, y + 1, c('gold', 2));
    else micro(p, 1, 2, 'AUX', c('led', 1));
    return p;
  };
  book.add('aux', aux(false), { solid: SOLID, effect: SNACKS, eamt: 1, score: 2000, touch: 'auxHeld' });
  book.add('auxHeld', aux(true), AIR);
  const bucket = panel();
  bucket.rect(4, 8, 12, 12, c('ochre', 2)).rect(3, 7, 14, 2, c('ochre', 3)).line(4, 8, 10, 2, c('grey', 2)).line(16, 8, 10, 2, c('grey', 2));
  bucket.rect(5, 9, 10, 2, c('water', 2));
  book.add('bucket', bucket, { solid: SOLID });

  // ---------- (last, so every other block keeps its number) hidden things and a guest ----------
  // a tin heart under the bedroom desk: a glint crosses it now and then; 100 points (the bedroom's
  // points are the PC speaker's alone, so it never cuts a lyric or a buzz)
  const tin = { ink: c('ink', 0), tin: R('steel'), white: c('white', 3), dark: c('grey', 0) };
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(`tinHeart${k || ''}`, drawTinHeart(panel(), tin, k), { next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`, ntime: k ? 2 : 50, touch: 'panel', score: 100, ...AIR });
  // a dyed Easter egg on the bedroom floor by the nightstand: 50 points
  const egg = { ink: c('ink', 0), shell: R('pink'), paint: R('shirt').slice(1), accent: c('gold', 3), white: c('white', 3) };
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    book.add(`easterEgg${k || ''}`, drawEasterEgg(panel(), egg, 'zigzag', k), { next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`, ntime: k ? 3 : 60, touch: 'panel', score: 50, ...AIR });
  // Watt (Ohm Sweet Ohm), the repair robot, seeing to the stereo's left speaker (scenery)
  const use = ['ink', 'grey', 'steel', 'white', 'gold', 'red', 'led', 'screen', 'shirt', 'chip'].flatMap((n) => R(n));
  book.add('watt', panel().blit(wattCameo(buildPalette('plain').pal, 'side', 0, 'ok', { use }), 0, 0, CLEAR), AIR);
  return book;
}
