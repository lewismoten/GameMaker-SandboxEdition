// LOAF.BBL: every background block, drawn in code, seen from the side at a loaf's height. A
// block's number is the order it was added (by name here); the attributes are the game:
//   - air falls (gravity down); the weave inside a basket is air with no gravity, so the loaf
//     climbs it; warm air over a cooking fire lifts (gravity up): it rises, like dough;
//   - ledges (roof edges, fig branches, basket rims) hold you up and let you rise through them;
//   - chaff in the bottom of the baskets gives way: touch it and it is weave;
//   - crumbs are points; holy crumbs (golden) are counter 20, and the lid of the wicker
//     wasteland only opens for seven; at dusk each empty basket touched is gathered up full
//     (counter 21), and the twelfth basket only takes you when the other eleven are full;
//   - the fish basket gives birth to flying fish, a fire hurts, a jar of water heals, a pot of
//     honey is an extra life, and the door of home takes one holy crumb to open.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import { buildPalette, type Pal } from '../art/pal';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { lewieCameo } from '../../../kit/cameos';
import { BASKETS, BASKETS_NEEDED, CRUMBS, CRUMBS_NEEDED, MON } from '../ids';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, rise up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, down: 4 } as const;
const LIFE = 1;
/** Ticks between flying fish from a fish basket. */
export const FISH_EVERY = 70;

export function buildBlocks(pal: Pal): BlockBook {
  const book = new BlockBook();
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);
  const air = { grav: GRAV.down };

  // ---------- skies and backdrops ----------
  const sky = (seed: number, k = 3) => {
    const p = P().rect(0, 0, 20, 20, c('sky', k));
    const r = rng(seed);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('sky', k + (r() < 0.5 ? 1 : -1)));
    return p;
  };
  book.add('sky', sky(1), air);
  const skyHi = sky(2, 2);
  for (const [x, y] of [
    [4, 6],
    [15, 13],
  ])
    skyHi.set(x, y, c('sky', 5));
  book.add('skyHi', skyHi, air);
  const wisp = sky(3);
  for (let x = 2; x < 18; x++) wisp.set(x, 9 + Math.round(Math.sin(x / 3)), c('sky', 5)).set(x + 1, 10 + Math.round(Math.sin(x / 3)), c('sky', 4));
  book.add('wisp', wisp, air);
  // the far hillside, the five thousand sitting in their groups on the green grass, tiny
  const crowd = (seed: number, sea: boolean) => {
    const p = sky(seed);
    const r = rng(seed);
    for (let x = 0; x < 20; x++) {
      const top = 9 + Math.round(Math.sin((x + seed * 7) / 6) * 1.5);
      if (sea) p.rect(x, 5, 1, 3, c('water', x % 7 === 3 ? 3 : 2)).set(x, 5, c('water', 3));
      for (let y = top; y < 20; y++) p.set(x, y, shadeAt(R('grass'), 1, 3, 0.75 - (y - top) / 26, x, y));
    }
    const robes = ['blue', 'red', 'ochre', 'white', 'purple'];
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(r() * 19);
      const y = 11 + Math.floor(r() * 7);
      p.set(x, y, c(robes[Math.floor(r() * robes.length)], 2))
        .set(x, y + 1, c(robes[Math.floor(r() * robes.length)], 1))
        .set(x, y - 1, c('skin', 2));
    }
    return p;
  };
  book.add('crowd0', crowd(5, false), air);
  book.add('crowd1', crowd(6, false), air);
  book.add('sea', crowd(7, true), air);

  // ---------- the ground ----------
  const earth = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('earth'), 2, 1, seed, 0.3);
    const r = rng(seed + 9);
    for (let i = 0; i < 3; i++) blob(p, 2 + r() * 16, 2 + r() * 16, 1.6, 1.1, R('stone'), 1, 3);
    return p;
  };
  const grassOn = (p: Pixels, seed: number) => {
    const r = rng(seed);
    p.rect(0, 0, 20, 4, c('grass', 2)).rect(0, 0, 20, 1, c('grass', 4)).rect(0, 4, 20, 1, c('grass', 0));
    for (let x = 0; x < 20; x++) if (r() < 0.5) p.set(x, 5, c('grass', 1));
    for (let x = 1; x < 20; x += 3) p.set(x, 0, c('grass', 3)).set(x, -1, c('grass', 3));
    return p;
  };
  book.add('earth', earth(11), { solid: SOLID });
  book.add('grass', grassOn(earth(12), 13), { solid: SOLID });
  const rock = (bg: Pixels, seed: number) => {
    blob(bg, 10, 11, 9.5, 8.6, R('stone'), 0, 4, 1.1);
    const r = rng(seed);
    for (let i = 0; i < 3; i++) bg.line(4 + r() * 12, 5 + r() * 12, 4 + r() * 12, 5 + r() * 12, c('stone', 1));
    return bg;
  };
  book.add('rock', rock(sky(31), 31), { solid: SOLID });
  book.add('rockE', rock(earth(32), 32), { solid: SOLID });
  // a flat stone to stand on
  const slab = sky(33);
  blob(slab, 10, 14, 10, 4.4, R('stone'), 1, 4);
  book.add('slab', slab, { solid: LEDGE, grav: GRAV.down });
  // the sandy road home
  const road = (top: boolean) => {
    const p = speckle(P(), 0, 0, 20, 20, R('sand'), 1, 1, 34, 0.4);
    if (top) p.rect(0, 0, 20, 2, c('sand', 3)).rect(0, 2, 20, 1, c('sand', 0));
    return p;
  };
  book.add('road', road(true), { solid: SOLID });
  book.add('sand', road(false), { solid: SOLID });

  // ---------- the hillside ----------
  // lilies of the field, and a tuft
  const lily = (k: string, seed: number) => {
    const p = sky(seed);
    p.line(10, 19, 10, 9, c('leaf', 1));
    blob(p, 7, 15, 2.6, 1.3, R('leaf'), 1, 3);
    for (let a = 0; a < 6; a++) p.line(10, 8, 10 + Math.cos(a) * 3.4, 8 + Math.sin(a) * 3.4 - 1, c(k, 2 + (a % 2)));
    p.disc(10, 8, 1.2, c('sun', 2));
    return p;
  };
  book.add('lilyW', lily('white', 41), air);
  book.add('lilyP', lily('purple', 42), air);
  const tuft = sky(43);
  for (let x = 1; x < 20; x += 2) tuft.line(x, 19, x + (x % 4 ? 1 : -1), 13 + (x % 3) * 2, c('grass', 2 + (x % 2)));
  book.add('tuft', tuft, air);
  // the fig tree: trunk (scenery) and leafy branches to stand on
  // (its sway repeats every block, so stacked trunks join without a notch)
  const trunkOn = (bg: Pixels) => {
    for (let y = 0; y < 20; y++)
      for (let x = 6; x < 14; x++) bg.set(x + Math.round(Math.sin((y * Math.PI) / 10)), y, shadeAt(R('wood'), 0, 3, (x - 6) / 8, x, y));
    return bg;
  };
  book.add('trunk', trunkOn(sky(44)), air);
  const canopy = (bg: Pixels, seed: number, ledge: boolean) => {
    const r = rng(seed);
    for (let i = 0; i < 7; i++) blob(bg, r() * 20, 4 + r() * 12, 4 + r() * 3, 3 + r() * 2, R('leaf'), 0, 3);
    if (ledge) bg.rect(0, 2, 20, 2, c('wood', 1)).rect(0, 2, 20, 1, c('wood', 2));
    if (seed % 2) bg.disc(6, 13, 2, c('purple', 1)).set(5, 12, c('purple', 2));
    return bg;
  };
  book.add('fig', canopy(sky(45), 45, true), { solid: LEDGE, grav: GRAV.down });
  book.add('leaves', canopy(sky(46), 46, false), air);
  // the shade under the fig tree
  const shade = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) shade.set(x, y, shadeAt(R('olive'), 0, 2, 0.42, x, y));
  {
    const r = rng(46);
    for (let i = 0; i < 7; i++) shade.set(Math.floor(r() * 20), Math.floor(r() * 20), c('leaf', 1));
  }
  book.add('shade', shade, air);
  const shadeCopy = P();
  shadeCopy.px.set(shade.px);
  // the wicker basket Loaf #13 was left in (an open top to climb out of, its sides, its rim)
  const weave = (bg: Pixels, dense = 1) => {
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const row = Math.floor(y / 4);
        const over = (Math.floor((x + row * 3) / 5) + row) % 2;
        const edge = y % 4 === 0;
        if (dense || (x + y) % 9 > 1) bg.set(x, y, c('wicker', edge ? 0 : over ? 3 : 2) + 0);
      }
    for (let x = 4; x < 20; x += 10) bg.rect(x, 0, 2, 20, c('wicker', 1)).rect(x, 0, 1, 20, c('wicker', 0));
    return bg;
  };
  book.add('wicker', weave(P()), { solid: SOLID });
  const rim = weave(P());
  rim.rect(0, 0, 20, 5, c('wicker', 4)).rect(0, 4, 20, 1, c('wicker', 0));
  for (let x = 0; x < 20; x += 4) rim.line(x, 0, x + 3, 4, c('wicker', 2));
  book.add('rim', rim, { solid: SOLID });
  const rimLedge = sky(47);
  rimLedge.rect(0, 2, 20, 5, c('wicker', 4)).rect(0, 6, 20, 1, c('wicker', 0));
  for (let x = 0; x < 20; x += 4) rimLedge.line(x, 2, x + 3, 6, c('wicker', 2));
  book.add('rimLedge', rimLedge, { solid: LEDGE, grav: GRAV.down });
  // the basket's dark inside (in the shade)
  const inside = shade.crop(0, 0, 20, 20);
  inside.map((x, y, v) => ((x + y * 3) % 7 === 0 ? c('wicker', 1) : v));
  book.add('basketIn', inside, air);
  // a fish basket: it gives birth to flying fish
  const fishBasket = weave(P());
  fishBasket.rect(0, 0, 20, 6, c('sky', 3));
  for (const [x, y] of [
    [5, 5],
    [10, 3],
    [15, 5],
  ])
    blob(fishBasket, x, y, 3.4, 1.6, R('fish'), 1, 3);
  fishBasket.rect(0, 6, 20, 2, c('wicker', 4));
  book.add('fishBasket', fishBasket, { solid: SOLID, birthMon: MON.fishR, birthTime: FISH_EVERY });
  const fishBasketL = fishBasket.flipX();
  book.add('fishBasketL', fishBasketL, { solid: SOLID, birthMon: MON.fishL, birthTime: FISH_EVERY + 17 });
  // a cooking fire, and the warm air over it that lifts a loaf (it rises)
  const fire = (f: number) => {
    const p = sky(48);
    for (const [x, y] of [
      [4, 17],
      [10, 18],
      [16, 17],
    ])
      blob(p, x, y, 3.6, 2, R('stone'), 1, 3);
    p.rect(3, 15, 14, 2, c('wood', 1));
    for (let k = 0; k < 5; k++) {
      const x = 5 + k * 2.5;
      const h = 6 + ((k * 3 + f * 2) % 5);
      for (let y = 0; y < h; y++) p.set(x + Math.round(Math.sin((y + f * 3) / 2)), 15 - y, c('fire', 3 - Math.floor((y / h) * 3)));
    }
    return p;
  };
  book.add('fire0', fire(0), { hp: -6, grav: GRAV.up, next: 'fire1', ntime: 4 });
  book.add('fire1', fire(1), { hp: -6, grav: GRAV.up, next: 'fire0', ntime: 4 });
  const warm = (f: number) => {
    const p = sky(49);
    for (let k = 0; k < 3; k++) {
      const x = 4 + k * 6;
      for (let y = 0; y < 20; y++) if ((y + f * 5 + k * 4) % 10 < 4) p.set(x + Math.round(Math.sin((y + k) / 3) * 1.5), y, c('sky', 5));
    }
    return p;
  };
  book.add('warm0', warm(0), { grav: GRAV.up, next: 'warm1', ntime: 5 });
  book.add('warm1', warm(1), { grav: GRAV.up, next: 'warm0', ntime: 5 });

  // ---------- things to find ----------
  const crumb = (bg: () => Pixels, seed: number) => {
    const p = bg();
    const r = rng(seed);
    for (let i = 0; i < 3; i++) {
      const x = 5 + r() * 10;
      const y = 8 + r() * 6;
      blob(p, x, y, 2.4, 1.9, R('crumb'), 0, 2);
      p.set(x + 1, y + 1, c('crust', 2));
    }
    return p;
  };
  // crumbs: points
  book.add(
    'crumb',
    crumb(() => sky(51), 51),
    { score: 10, touch: 'sky' },
  );
  const holy = (bg: () => Pixels, f: number) => {
    const p = bg();
    const s = f ? 5 : 4;
    p.line(10 - s, 11, 10 + s, 11, c('gold', 1)).line(10, 11 - s, 10, 11 + s, c('gold', 1));
    blob(p, 10, 11, 2.8, 2.4, R('crust'), 3, 5, 1.2);
    p.set(9, 10, c('gold', 3)).set(10, 10, c('gold', 3));
    return p;
  };
  // holy crumbs: counter 20
  book.add(
    'holy0',
    holy(() => sky(53), 0),
    { effect: CRUMBS, eamt: 1, score: 25, touch: 'sky', next: 'holy1', ntime: 7 },
  );
  book.add(
    'holy1',
    holy(() => sky(53), 1),
    { effect: CRUMBS, eamt: 1, score: 25, touch: 'sky', next: 'holy0', ntime: 5 },
  );
  // a jar of water: health
  const jar = (bg: Pixels) => {
    blob(bg, 10, 13, 5.4, 6, R('earth'), 1, 4);
    bg.rect(8, 4, 5, 3, c('earth', 2)).rect(7, 4, 7, 1, c('earth', 3));
    bg.line(5, 12, 15, 12, c('earth', 1));
    bg.set(10, 3, c('water', 3)).set(9, 2, c('water', 2));
    return bg;
  };
  // a sip out in the open mends a little; the jars down in the wicker mend more
  book.add('jar', jar(sky(55)), { hp: 10, score: 10, touch: 'sky' });
  // a pot of honey: an extra life
  const honey = (bg: Pixels) => {
    blob(bg, 10, 13, 6, 5.6, R('ochre'), 1, 3);
    bg.rect(6, 6, 9, 2, c('wood', 2)).line(14, 6, 18, 2, c('wood', 1));
    bg.line(7, 9, 7, 13, c('gold', 3)).line(8, 9, 8, 11, c('gold', 2));
    micro(bg, 7, 12, '+1', c('white', 2));
    return bg;
  };
  book.add('honey', honey(sky(57)), { effect: LIFE, eamt: 1, score: 100, touch: 'sky' });

  // ---------- the wicker wasteland (inside the stack of baskets) ----------
  const gloom = (seed: number) => {
    const p = P().rect(0, 0, 20, 20, c('sky', 1));
    const r = rng(seed);
    for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('sky', 2));
    return p;
  };
  book.add('gloom', gloom(61), air);
  // the weave seen from inside: climb it (no gravity)
  const weaveIn = (seed: number) => {
    const p = gloom(seed);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 6 < 2 || (x - y + 40) % 6 < 2) p.set(x, y, c('wicker', (x + y) % 6 === 0 ? 2 : 1));
    return p;
  };
  book.add('weave', weaveIn(62), { grav: GRAV.none });
  // light through the gaps (scenery)
  const shaft = gloom(63);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + Math.floor(y / 2)) % 10 < 3) shaft.set(x, y, shadeAt(R('sky'), 2, 5, 0.5, x, y));
  book.add('shaft', shaft, air);
  // a basket's bottom to stand on (hop up through it)
  const bottom = gloom(64);
  bottom.rect(0, 2, 20, 4, c('wicker', 3)).rect(0, 2, 20, 1, c('wicker', 4)).rect(0, 5, 20, 1, c('wicker', 0));
  for (let x = 0; x < 20; x += 3) bottom.set(x, 3, c('wicker', 1));
  book.add('bottom', bottom, { solid: LEDGE, grav: GRAV.down });
  // chaff and straw: gives way when you touch it
  const chaff = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('sand'), 1, 1, seed, 0.5);
    const r = rng(seed);
    for (let i = 0; i < 14; i++) {
      const x = r() * 20;
      const y = r() * 20;
      p.line(x, y, x + (r() - 0.5) * 8, y + (r() - 0.5) * 3, c('wicker', 3 + (i % 2)));
    }
    return p;
  };
  book.add('chaff', chaff(65), { solid: SOLID, touch: 'weave' });
  book.add(
    'crumbG',
    crumb(() => gloom(66), 66),
    { score: 10, touch: 'gloom' },
  );
  book.add(
    'holyG0',
    holy(() => gloom(67), 0),
    { effect: CRUMBS, eamt: 1, score: 25, touch: 'gloom', next: 'holyG1', ntime: 7 },
  );
  book.add(
    'holyG1',
    holy(() => gloom(67), 1),
    { effect: CRUMBS, eamt: 1, score: 25, touch: 'gloom', next: 'holyG0', ntime: 5 },
  );
  book.add(
    'holyW',
    holy(() => weaveIn(68), 0),
    { effect: CRUMBS, eamt: 1, score: 25, touch: 'weave', grav: GRAV.none },
  );
  book.add('jarG', jar(gloom(69)), { hp: 25, score: 10, touch: 'gloom' });
  // the lid on the top basket: seven holy crumbs open it, and the light comes in
  const lid = (open: boolean) => {
    const p = open ? sky(71, 4) : weave(P());
    if (open) {
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 7 < 3) p.set(x, y, c('sun', 2 + ((x + y) % 2)));
    } else {
      p.rect(0, 14, 20, 6, c('wicker', 4)).rect(0, 19, 20, 1, c('wicker', 0));
      p.disc(10, 8, 4, c('wicker', 0)).disc(10, 8, 2.6, c('wicker', 4));
      micro(p, 3, 15, String(CRUMBS_NEEDED), c('gold', 3));
    }
    return p;
  };
  book.add('lid', lid(false), { solid: SOLID, effect: CRUMBS, eamt: -CRUMBS_NEEDED, score: 500, touch: 'lidOpen' });
  book.add('lidOpen', lid(true), { grav: GRAV.none });

  // ---------- twelve baskets full (dusk) ----------
  const basket = (full: boolean, n?: number) => {
    const p = sky(73);
    for (let y = 6; y < 20; y++) {
      const w = 7 + Math.round((y - 6) * 0.15);
      for (let x = 10 - w; x < 10 + w; x++) {
        const row = Math.floor(y / 3);
        p.set(x, y, c('wicker', y === 6 ? 4 : (Math.floor((x + row * 2) / 3) + row) % 2 ? 3 : 1));
      }
    }
    p.rect(2, 6, 16, 2, c('wicker', 4)).rect(2, 8, 16, 1, c('wicker', 0));
    p.line(3, 6, 6, 1, c('wicker', 2)).line(6, 1, 14, 1, c('wicker', 2)).line(14, 1, 17, 6, c('wicker', 2));
    if (full) {
      for (const [x, y, rx] of [
        [6, 5, 3.4],
        [10, 4, 3.6],
        [14, 5, 3.4],
        [8, 6, 2.4],
        [12, 6, 2.4],
      ] as const)
        blob(p, x, y, rx, 2.2, R('crust'), 1, 5);
      p.set(10, 3, c('crumb', 2));
    }
    if (n !== undefined) micro(p, 7, 12, String(n), c(full ? 'gold' : 'ink', full ? 3 : 0));
    return p;
  };
  book.add('basketE', basket(false), { solid: SOLID, effect: BASKETS, eamt: 1, score: 100, touch: 'basketF' });
  book.add('basketF', basket(true), { solid: SOLID });
  // the twelfth basket: it takes you in when the other eleven are full
  const twelve = basket(false, 12);
  for (let x = 4; x < 17; x += 4) twelve.set(x, 0, c('gold', 3));
  book.add('twelve', twelve, { solid: SOLID, effect: BASKETS, eamt: -BASKETS_NEEDED, score: 1000, touch: 'twelveIn' });
  const twelveIn = basket(true, 12);
  for (let y = 0; y < 6; y++) for (let x = 0; x < 20; x++) if ((x + y) % 5 === 0) twelveIn.set(x, y, c('gold', 2));
  book.add('twelveIn', twelveIn, { grav: GRAV.none });
  // an olive tree (scenery), stones
  const olive = sky(75);
  olive.rect(9, 12, 3, 8, c('wood', 1)).line(10, 12, 5, 7, c('wood', 1)).line(11, 12, 15, 6, c('wood', 1));
  for (const [x, y] of [
    [5, 6],
    [10, 4],
    [15, 6],
    [8, 8],
    [13, 8],
  ])
    blob(olive, x, y, 3.6, 2.4, R('olive'), 0, 3);
  book.add('olive', olive, air);

  // ---------- the way home (night) ----------
  const brick = (top: boolean, seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('earth'), 2, 1, seed, 0.25);
    for (let row = 0; row < 4; row++) {
      p.rect(0, row * 5 + 4, 20, 1, c('earth', 1));
      for (let k = 0; k < 3; k++) p.rect(((row % 2) * 4 + k * 8) % 20, row * 5, 1, 4, c('earth', 1));
    }
    if (top) p.rect(0, 0, 20, 3, c('wood', 2)).rect(0, 3, 20, 1, c('wood', 0));
    return p;
  };
  book.add('wall', brick(false, 81), { solid: SOLID });
  // a house front behind the street (scenery: you roll past it)
  book.add('house', brick(false, 80), air);
  book.add('wallTop', brick(true, 82), { solid: SOLID });
  // a flat roof's edge on beams: stand on it, rise through it
  const roof = sky(83);
  roof.rect(0, 2, 20, 3, c('earth', 3)).rect(0, 5, 20, 2, c('wood', 1));
  for (let x = 2; x < 20; x += 6) roof.rect(x, 7, 2, 2, c('wood', 0));
  book.add('roof', roof, { solid: LEDGE, grav: GRAV.down });
  // a lit window and a dark doorway in a wall (scenery: walk past them)
  const window = brick(false, 84);
  window.rect(6, 5, 8, 9, c('lamp', 1)).rect(7, 6, 6, 7, c('lamp', 2)).rect(9, 5, 1, 9, c('wood', 0)).rect(6, 9, 8, 1, c('wood', 0));
  book.add('window', window, air);
  const doorway = brick(false, 85);
  doorway.rect(4, 2, 12, 18, c('ink', 0)).rect(4, 2, 12, 2, c('wood', 1));
  book.add('doorway', doorway, air);
  // a lamp on a post (scenery), and stars
  const lamp = sky(86);
  lamp.rect(9, 8, 2, 12, c('wood', 1));
  blob(lamp, 10, 5, 3.4, 3, R('lamp'), 1, 2);
  lamp.disc(10, 4, 1.4, c('lamp', 2)).set(10, 0, c('lamp', 0));
  for (const [x, y] of [
    [3, 3],
    [17, 4],
    [5, 9],
    [15, 10],
  ])
    lamp.set(x, y, c('lamp', 0));
  book.add('lamp', lamp, air);
  const stars = sky(87, 2);
  for (const [x, y] of [
    [3, 4],
    [12, 2],
    [16, 11],
    [7, 15],
  ])
    stars.set(x, y, c('sun', 3));
  stars.set(12, 1, c('sun', 1)).set(11, 2, c('sun', 1)).set(13, 2, c('sun', 1)).set(12, 3, c('sun', 1));
  book.add('stars', stars, air);
  // a palm (scenery: trunk and crown)
  const palmT = sky(88);
  for (let y = 0; y < 20; y++) palmT.rect(9 + Math.round(Math.sin(y / 6) * 1.5), y, 3, 1, c('wood', y % 3 ? 1 : 2));
  book.add('palmT', palmT, air);
  const palmC = sky(89);
  for (let a = 0; a < 7; a++)
    for (let t = 0; t < 10; t++) palmC.set(10 + Math.cos(a * 0.9 + 0.2) * t, 12 - Math.sin(a * 0.9 + 0.2) * t * 0.7 + (t * t) / 16, c('leaf', 1 + (t % 2)));
  palmC.rect(9, 12, 3, 8, c('wood', 1));
  book.add('palmC', palmC, air);
  // the well: stone, solid, with a jar on it
  const well = speckle(P(), 0, 6, 20, 14, R('stone'), 2, 1, 90, 0.4);
  for (let y = 0; y < 6; y++) well.rect(0, y, 20, 1, c('sky', 3));
  well.rect(0, 6, 20, 2, c('stone', 4)).rect(2, 0, 2, 6, c('wood', 1)).rect(16, 0, 2, 6, c('wood', 1)).rect(2, 0, 16, 2, c('wood', 2));
  book.add('well', well, { solid: SOLID });
  // the brook and its stepping stones (the water bites)
  const brook = (f: number) => {
    const p = sky(91);
    for (let y = 8; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('water', y === 8 ? 3 : (x + y * 2 + f * 3) % 9 === 0 ? 3 : 1));
    return p;
  };
  book.add('brook0', brook(0), { hp: -2, grav: GRAV.down, next: 'brook1', ntime: 6 });
  book.add('brook1', brook(1), { hp: -2, grav: GRAV.down, next: 'brook0', ntime: 6 });
  const stone = brook(0);
  blob(stone, 10, 9, 8, 4, R('stone'), 1, 4);
  book.add('step', stone, { solid: SOLID });
  // holy crumbs and crumbs on the way home
  book.add(
    'holyN0',
    holy(() => sky(93), 0),
    { effect: CRUMBS, eamt: 1, score: 25, touch: 'sky', next: 'holyN1', ntime: 7 },
  );
  book.add(
    'holyN1',
    holy(() => sky(93), 1),
    { effect: CRUMBS, eamt: 1, score: 25, touch: 'sky', next: 'holyN0', ntime: 5 },
  );
  // home: its door takes one holy crumb, a gift for Mama, and opens on the lamplight
  const door = (open: boolean) => {
    const p = brick(false, 95);
    if (open) {
      p.rect(3, 1, 14, 19, c('lamp', 1)).rect(5, 3, 10, 17, c('lamp', 2));
      p.rect(9, 6, 3, 3, c('skin', 2)).rect(8, 9, 5, 9, c('blue', 2));
    } else {
      p.rect(3, 1, 14, 19, c('wood', 1));
      for (let x = 5; x < 17; x += 4) p.rect(x, 1, 1, 19, c('wood', 0));
      p.rect(3, 1, 14, 2, c('wood', 2)).disc(14, 11, 1.2, c('gold', 2));
      micro(p, 5, 5, 'HOME', c('lamp', 2));
    }
    return p;
  };
  book.add('door', door(false), { solid: SOLID, effect: CRUMBS, eamt: -1, score: 1000, touch: 'doorOpen' });
  book.add('doorOpen', door(true), { grav: GRAV.none });
  // (last, so every other block keeps its number) the trunk standing in its own shade
  book.add('trunkShade', trunkOn(shadeCopy), air);
  // inside home (after these, too): lamplit plaster over a board floor, an oil lamp hanging from
  // a beam, and Mama waiting at the far end (scenery: roll on in)
  const room = (seed: number, floor = false) => {
    const p = P().rect(0, 0, 20, 20, c('sand', 2));
    const r = rng(seed);
    for (let i = 0; i < 14; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c(r() < 0.5 ? 'lamp' : 'sand', 1));
    if (floor) p.rect(0, 17, 20, 3, c('wood', 2)).rect(0, 17, 20, 1, c('wood', 0)).rect(7, 18, 1, 2, c('wood', 1));
    return p;
  };
  book.add('room', room(101), air);
  book.add('roomFloor', room(105, true), air);
  const roomLamp = room(102);
  roomLamp.rect(9, 0, 2, 4, c('wood', 1)).rect(8, 4, 4, 1, c('wood', 0));
  blob(roomLamp, 10, 7, 3.2, 2.4, R('lamp'), 1, 2);
  roomLamp.disc(10, 6, 1.2, c('sun', 3));
  book.add('roomLamp', roomLamp, air);
  const mamaTop = room(103);
  mamaTop.rect(7, 4, 6, 7, c('hair', 1)).rect(8, 6, 4, 5, c('skin', 2)).set(9, 8, c('ink', 0)).set(11, 8, c('ink', 0));
  mamaTop.rect(6, 13, 8, 7, c('red', 2)).rect(4, 15, 3, 3, c('skin', 2)).rect(13, 15, 3, 3, c('skin', 2)).rect(9, 11, 2, 2, c('skin', 1));
  book.add('mamaTop', mamaTop, air);
  const mamaLow = room(104, true);
  mamaLow
    .rect(5, 0, 10, 17, c('red', 2))
    .rect(5, 0, 2, 17, c('red', 1))
    .rect(8, 4, 1, 12, c('red', 1))
    .rect(6, 17, 3, 2, c('wood', 0))
    .rect(11, 17, 3, 2, c('wood', 0));
  book.add('mamaLow', mamaLow, air);
  // (after these, too) friends from the other games: the tin heart up in the second basket's far
  // corner (in the gloom of the wicker wasteland), a painted Easter egg in the far crowd at dusk (points only, no sounds of their own), and Teenage Lewie from
  // Snowbound, shovel and all, out in the village at night
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(
      `tinHeart${k || ''}`,
      drawTinHeart(
        book.pics.get('gloom')!.crop(0, 0, 20, 20),
        { ink: c('ink', 0), tin: [c('grey', 1), c('grey', 2), c('grey', 3)], white: c('white', 2), dark: c('grey', 0) },
        k,
      ),
      {
        score: 100,
        touch: 'gloom',
        grav: GRAV.down,
        next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
        ntime: k ? 2 : 50,
      },
    );
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    book.add(
      `egg${k || ''}`,
      drawEasterEgg(
        book.pics.get('crowd1')!.crop(0, 0, 20, 20),
        { ink: c('ink', 0), shell: [c('red', 1), c('red', 2), c('red', 3)], paint: [c('gold', 1), c('gold', 2)], accent: c('white', 2), white: c('white', 2) },
        'bands',
        k,
      ),
      {
        score: 50,
        touch: 'crowd1',
        grav: GRAV.down,
        next: `egg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
        ntime: k ? 3 : 60,
      },
    );
  // Lewie, recolored from the unlit palette so the block is the same in every light
  const lewie = sky(1);
  const kid = lewieCameo(buildPalette('plain').pal, 'down0');
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (kid.get(x, y) !== 255) lewie.set(x, y, kid.get(x, y));
  book.add('lewie', lewie, air);
  return book;
}
