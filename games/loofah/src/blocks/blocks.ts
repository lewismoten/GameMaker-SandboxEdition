// LOOFAH.BBL: every background block, drawn in code, seen from the side at a man's height. A
// block's number is the order it was added (by name here); the attributes are the game:
//   - air falls (gravity down); floors, tubs, trees and counters are solid; shelves, the tub's
//     rim, the toilet lid and the shower caddy's tiles are ledges (stand on them, hop up through);
//   - steam from the shower's vents is air that pulls up (it lifts him), and the luffa vines of
//     the forest-dark aisle are air with no gravity (climb them);
//   - the things that hurt on the floor (a cracked tile, a bramble, the creaky board) are air that
//     costs dignity once and then goes quiet (a hurt holds him still, so a floor that always hurt
//     would hold him there); the cursed water in the shower's drain always burns;
//   - bath salt is counter 20 and the mop bucket takes five (the brine); silver coins are counter
//     21 and the checkout takes six (a loofah of his own); a candle lit is counter 22 and the
//     bathroom door only opens with six burning; her silver rack takes the pink one (counter 23);
//   - rosemary is three splashes of brine (the throw sequence's own counter), a dry washcloth
//     mends dignity, a rubber duck is an extra life; the shower head gives birth to drips, the
//     tub to bubbles, the soap dish behind the demon sponge to cursed citrus suds.
import { CLEAR, joeCameo } from '../../../kit/cameos';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { Pixels, rng } from '../../../kit/pixels';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import { micro, microWidth, text } from '../../../snowbound/src/art/font';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import { buildPalette, type Pal } from '../art/pal';
import { CANDLES, CANDLES_NEEDED, COINS, COINS_NEEDED, MON, PINK, SALT, SALT_NEEDED, SEQ, SPRIG } from '../ids';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, hop up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, down: 4 } as const;
const LIFE = 1;
/** Ticks between the cursed citrus suds from the soap dish. */
export const SUDS_EVERY = 44;
/** Ticks between drips from the shower head. */
export const DRIP_EVERY = 30;

/** The messages the mirrors fog up with, four blocks wide each. */
export const MIRROR_WORDS = ['YOU CROSSED A LINE', 'YOU MADE IT WORSE'] as const;

export function buildBlocks(pal: Pal): BlockBook {
  const book = new BlockBook();
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);
  const air = { grav: GRAV.down };

  // ---------- the bathroom's backdrops ----------
  /** Dark tile, black grout, a glint here and there. */
  const tiles = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, x % 10 === 0 || y % 10 === 0 ? c('ink', 1) : c('tile', (x + y) % 9 === 0 ? 2 : 1));
    const r = rng(seed);
    for (let i = 0; i < 3; i++) p.set(1 + Math.floor(r() * 18), 1 + Math.floor(r() * 18), c('tile', 3));
    return p;
  };
  book.add('tiles', tiles(1), air);
  // the ceiling: a band of plum with a gothic trim
  const trim = tiles(2);
  trim.rect(0, 0, 20, 6, c('wall', 0)).rect(0, 6, 20, 1, c('gold', 0));
  for (let x = 2; x < 20; x += 5) trim.rect(x, 7, 1, 2, c('gold', 0)).set(x, 9, c('gold', 0));
  book.add('trim', trim, air);
  // the row he walks along: tile down to the floor
  const baseTile = tiles(3);
  baseTile.rect(0, 17, 20, 3, c('ink', 1)).rect(0, 17, 20, 1, c('tile', 2));
  book.add('baseTile', baseTile, air);
  /** The dark (the void beyond, the forest's depths): the backdrop ramp. */
  const dark = (seed: number, k = 2) => {
    const p = P().rect(0, 0, 20, 20, c('sky', k));
    const r = rng(seed);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('sky', k + (r() < 0.5 ? 1 : -1)));
    return p;
  };
  book.add('dark', dark(4), air);

  // ---------- floors ----------
  const checker = (top: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? c('white', 1) : c('ink', 1));
    if (top) p.rect(0, 0, 20, 1, c('white', 2)).rect(0, 1, 20, 1, c('grey', 1));
    return p;
  };
  book.add('floor', checker(true), { solid: SOLID });
  // outside the rooms: solid dark, the wall's black grout
  const outside = P().rect(0, 0, 20, 20, c('ink', 0));
  for (let y = 0; y < 20; y += 10) for (let x = 0; x < 20; x++) outside.set(x, y, c('ink', 1));
  book.add('outside', outside, { solid: SOLID });
  book.add('under', checker(false), { solid: SOLID });
  // a cracked tile in the floor row: steps on it hurt once, then it's quiet
  const crack = baseTile.crop(0, 0, 20, 20);
  crack.rect(2, 17, 16, 3, c('tile', 0)).line(3, 17, 9, 19, c('ink', 0)).line(9, 19, 16, 17, c('ink', 0));
  micro(crack, 8, 9, '!', c('red', 3));
  book.add('crack', crack, { ...air, hp: -8, touch: 'cracked' });
  book.add('cracked', baseTile.crop(0, 0, 20, 20).line(3, 18, 16, 18, c('ink', 0)), air);

  // ---------- the shower stall ----------
  const glass = (seed: number) => {
    const p = tiles(seed);
    for (let k = 0; k < 3; k++) p.line(3 + k * 6, 0, 1 + k * 6, 19, c('fog', 0));
    return p;
  };
  book.add('stall', glass(11), air);
  // the shower head: it gives birth to drips
  const head = glass(12);
  head.rect(0, 2, 12, 2, c('metal', 2)).rect(10, 2, 2, 6, c('metal', 2)).rect(7, 8, 8, 3, c('metal', 3)).rect(7, 11, 8, 1, c('metal', 1));
  for (const x of [8, 11, 14]) head.set(x, 13, c('wet', 1)).set(x - 1, 15, c('wet', 0));
  book.add('showerHead', head, { ...air, birthMon: MON.drip, birthTime: DRIP_EVERY });
  // steam rising from the vents: air that pulls up (lifts him), curling as it goes
  const steam = (f: number) => {
    const p = glass(13);
    for (let k = 0; k < 4; k++) {
      const y = (k * 6 + f * 3) % 20;
      for (let x = 2; x < 18; x++) if ((x + k) % 3) p.set(x + Math.round(Math.sin((x + f * 3 + k) / 2)), y, c('steam', 2 + (k % 2)));
    }
    return p;
  };
  book.add('steam0', steam(0), { grav: GRAV.up, next: 'steam1', ntime: 4 });
  book.add('steam1', steam(1), { grav: GRAV.up, next: 'steam0', ntime: 4 });
  // the drain grate in the stall's floor (the vents)
  const vent = checker(true);
  vent.rect(4, 0, 12, 3, c('metal', 1));
  for (let x = 5; x < 16; x += 2) vent.set(x, 1, c('ink', 0));
  book.add('vent', vent, { solid: SOLID });
  // the silver rack: chrome bars (a ledge), and on it in the bathroom only a plain sponge
  const rack = (what: 'empty' | 'hers' | 'both') => {
    const p = tiles(14);
    p.rect(1, 6, 18, 2, c('metal', 3)).rect(1, 8, 18, 1, c('metal', 1)).rect(2, 2, 1, 5, c('metal', 2)).rect(17, 2, 1, 5, c('metal', 2));
    for (const x of [6, 13]) p.rect(x, 8, 1, 3, c('metal', 2));
    if (what === 'hers' || what === 'both') {
      blob(p, 6, 14, 4, 4, R('pink'), 1, 3);
      for (let k = 0; k < 6; k++) p.set(4 + ((k * 3) % 5), 11 + ((k * 2) % 6), c('pink', 0));
    }
    if (what === 'both') {
      blob(p, 14, 14, 4, 4, R('ink'), 0, 1);
      for (let k = 0; k < 6; k++) p.set(12 + ((k * 3) % 5), 11 + ((k * 2) % 6), c('grey', 1));
    }
    return p;
  };
  book.add('rack', rack('empty'), { solid: LEDGE, grav: GRAV.down });

  // ---------- the tub ----------
  const tubRim = baseTile.crop(0, 0, 20, 20);
  tubRim.rect(0, 12, 20, 8, c('white', 2)).rect(0, 12, 20, 2, c('white', 1)).rect(0, 14, 20, 1, c('grey', 2));
  book.add('tubRim', tubRim, { solid: LEDGE, grav: GRAV.down });
  const tubSide = P().rect(0, 0, 20, 20, c('white', 1));
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 7 === 0) tubSide.set(x, y, c('white', 2));
  tubSide.rect(0, 16, 20, 4, c('grey', 1));
  book.add('tubSide', tubSide, { solid: SOLID });
  // the claw foot (scenery under the tub's end)
  const claw = baseTile.crop(0, 0, 20, 20);
  claw.rect(0, 0, 20, 10, c('white', 1)).rect(0, 8, 20, 2, c('grey', 1));
  claw.rect(6, 10, 6, 6, c('gold', 1)).rect(4, 16, 10, 2, c('gold', 2)).set(4, 18, c('gold', 1)).set(9, 18, c('gold', 1)).set(13, 18, c('gold', 1));
  book.add('claw', claw, { solid: SOLID });
  // the bathwater: cursed, bubbling (he wades in it, up to his waist); it gives birth to bubbles
  const water = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('tile'), 1, 3, 0.4 + Math.sin((x + seed) / 3) * 0.15 - y / 60, x, y));
    for (let k = 0; k < 4; k++) p.ring(3 + ((k * 7 + seed) % 15), 4 + ((k * 5) % 13), 1.4, c('suds', 1));
    p.rect(0, 0, 20, 2, c('suds', 2));
    return p;
  };
  book.add('bathwater', water(15), { grav: GRAV.down, birthMon: MON.bubble, birthTime: 37 });

  // ---------- the toilet, the sink and the mirror ----------
  const toilet = (part: 'tankTop' | 'tank' | 'lid') => {
    // the tank is two blocks: its lid and lever up top, then the rest of it down to the floor
    const p = part === 'tankTop' ? tiles(26) : baseTile.crop(0, 0, 20, 20);
    if (part === 'tankTop')
      p.rect(2, 4, 16, 2, c('white', 1)).rect(3, 6, 14, 14, c('white', 2)).rect(13, 9, 3, 1, c('metal', 3)).rect(3, 6, 14, 1, c('grey', 2));
    else if (part === 'tank') p.rect(3, 0, 14, 12, c('white', 2)).rect(5, 12, 10, 8, c('white', 1)).rect(3, 11, 14, 1, c('grey', 2));
    else p.rect(1, 6, 18, 3, c('white', 2)).rect(1, 6, 18, 1, c('white', 1)).rect(4, 9, 12, 8, c('white', 1)).rect(6, 17, 8, 3, c('white', 0));
    return p;
  };
  book.add('tankTop', toilet('tankTop'), { solid: SOLID });
  book.add('tank', toilet('tank'), { solid: SOLID });
  book.add('lid', toilet('lid'), { solid: LEDGE, grav: GRAV.down });
  const sink = tiles(21);
  sink
    .rect(0, 6, 20, 4, c('white', 2))
    .rect(0, 6, 20, 1, c('white', 1))
    .rect(4, 10, 12, 4, c('white', 1))
    .rect(9, 0, 2, 6, c('metal', 2))
    .rect(9, 0, 6, 2, c('metal', 3));
  book.add('sink', sink, { solid: LEDGE, grav: GRAV.down });
  const vanity = P().rect(0, 0, 20, 20, c('wood', 1));
  vanity.rect(2, 2, 16, 16, c('wood', 2)).rect(2, 2, 16, 1, c('wood', 3)).disc(15, 10, 1, c('metal', 3));
  book.add('vanity', vanity, { solid: SOLID });
  // the mirrors: four blocks a message; fog creeps over, the words are written in it, they drip
  MIRROR_WORDS.forEach((words, w) => {
    const frames = [0, 1, 2].map((f) => {
      const wide = new Pixels(80, 20);
      wide.rect(0, 0, 80, 20, c('wood', 0)).rect(1, 1, 78, 18, c('metal', 1));
      for (let y = 2; y < 18; y++)
        for (let x = 2; x < 78; x++) if (f > 0 || (x * 7 + y * 3) % 5 === 0) wide.set(x, y, (x + y * 3) % 4 ? c('fog', 0) : c('fog', 1));
      if (f > 0) {
        const x0 = Math.round(40 - microWidth(words) / 2);
        micro(wide, x0, 8, words, c('demon', 3));
        if (f === 2) for (let k = 0; k < 8; k++) wide.rect(x0 + 2 + k * 9, 13, 1, 3 + (k % 3), c('demon', 2));
      }
      return wide;
    });
    for (let q = 0; q < 4; q++)
      frames.forEach((wide, f) =>
        book.add(`mirror${w}${q}${f}`, wide.crop(q * 20, 0, 20, 20), { ...air, next: `mirror${w}${q}${(f + 1) % 3}`, ntime: [28, 22, 14][f] }),
      );
  });
  // the towel bar (the screaming towel hangs on it: a monster)
  const towelBar = tiles(22);
  towelBar.rect(0, 3, 20, 2, c('metal', 3)).rect(0, 5, 20, 1, c('metal', 1));
  book.add('towelBar', towelBar, air);
  // a window: the moon through frosted glass
  const window = P().rect(0, 0, 20, 20, c('wood', 1));
  window.rect(2, 2, 16, 16, c('night', 1)).disc(12, 8, 4, c('moon', 1));
  for (let y = 2; y < 18; y++) for (let x = 2; x < 18; x++) if ((x * 3 + y) % 4 === 0) window.set(x, y, c('fog', 0));
  window.rect(9, 2, 2, 16, c('wood', 2)).rect(2, 9, 16, 2, c('wood', 2));
  book.add('window', window, air);
  // a shelf (a ledge) and a candle on it (scenery: the bathroom's candles burn already)
  const shelf = (bg: () => Pixels) => {
    const p = bg();
    p.rect(0, 0, 20, 3, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(2, 3, 2, 3, c('wood', 1)).rect(16, 3, 2, 3, c('wood', 1));
    return p;
  };
  book.add(
    'shelf',
    shelf(() => tiles(23)),
    { solid: LEDGE, grav: GRAV.down },
  );
  const flame = (p: Pixels, x: number, y: number, f: number) => {
    p.rect(x - 2, y, 4, 8, c('wax', 2))
      .rect(x - 2, y, 4, 1, c('wax', 1))
      .rect(x, y - 1, 1, 1, c('ink', 0));
    blob(p, x + (f ? 0.5 : -0.5), y - 4, 1.6, 2.8 + f * 0.4, R('flame'), 0, 3);
    p.set(x, y - 3, c('flame', 3));
  };
  const candles = (f: number) => {
    const p = tiles(24);
    flame(p, 6, 10, f);
    flame(p, 13, 12, 1 - f);
    for (let k = 0; k < 6; k++) p.set((k * 7 + f * 3) % 20, (k * 5) % 9, c('flame', 0));
    return p;
  };
  book.add('candles0', candles(0), { ...air, next: 'candles1', ntime: 5 });
  book.add('candles1', candles(1), { ...air, next: 'candles0', ntime: 5 });
  // the hamper: solid
  const hamper = baseTile.crop(0, 0, 20, 20);
  for (let y = 4; y < 20; y++) for (let x = 2; x < 18; x++) hamper.set(x, y, c('wood', (x + y) % 4 < 2 ? 2 : 1));
  hamper.rect(1, 3, 18, 2, c('wood', 3));
  blob(hamper, 8, 3, 4, 2, R('towel'), 1, 3);
  book.add('hamper', hamper, { solid: SOLID });
  // the bathroom door (scenery) and the mop bucket by it: five jars of bath salt in it make the brine
  const door = baseTile.crop(0, 0, 20, 20);
  door.rect(2, 0, 16, 20, c('wood', 2)).rect(4, 2, 12, 7, c('wood', 1)).rect(4, 11, 12, 7, c('wood', 1)).disc(14, 10, 1.2, c('gold', 2));
  book.add('door', door, air);
  const doorTop = tiles(25);
  doorTop.rect(2, 4, 16, 16, c('wood', 2)).rect(2, 2, 16, 2, c('wood', 3)).rect(4, 6, 12, 12, c('wood', 1));
  book.add('doorTop', doorTop, air);
  const bucket = (full: boolean) => {
    const p = baseTile.crop(0, 0, 20, 20);
    p.rect(3, 6, 14, 14, c('grey', 2)).rect(3, 6, 14, 2, c('grey', 3)).rect(2, 6, 1, 3, c('grey', 1)).rect(17, 6, 1, 3, c('grey', 1));
    p.line(3, 6, 10, 0, c('metal', 2)).line(10, 0, 17, 6, c('metal', 2));
    if (full) p.rect(4, 8, 12, 3, c('suds', 2)).set(7, 7, c('rosemary', 2)).set(12, 7, c('suds', 1));
    else micro(p, 6, 12, String(SALT_NEEDED), c('ink', 0));
    return p;
  };
  book.add('bucket', bucket(false), { solid: SOLID, effect: SALT, eamt: -SALT_NEEDED, score: 1000, touch: 'brine' });
  book.add('brine', bucket(true), { grav: GRAV.none });

  // ---------- pickups ----------
  /** A jar of bath salt (counter 20): a glass jar of pink crystals, a cork. */
  const salt = (bg: Pixels) => {
    bg.rect(6, 7, 8, 11, c('fog', 0)).rect(7, 9, 6, 8, c('pink', 2)).rect(6, 5, 8, 2, c('wood', 3));
    for (let k = 0; k < 5; k++) bg.set(7 + ((k * 3) % 6), 10 + ((k * 2) % 6), c('white', 2));
    micro(bg, 7, 13, 'S', c('ink', 0));
    return bg;
  };
  book.add('salt', salt(tiles(31)), { effect: SALT, eamt: 1, score: 50, touch: 'tiles' });
  book.add('saltB', salt(baseTile.crop(0, 0, 20, 20)), { effect: SALT, eamt: 1, score: 50, touch: 'baseTile' });
  /** A dry washcloth, folded: dignity back. */
  const cloth = (bg: Pixels) => {
    bg.rect(4, 11, 12, 7, c('towel', 2)).rect(4, 11, 12, 2, c('towel', 3)).rect(4, 15, 12, 1, c('towel', 1));
    return bg;
  };
  book.add('cloth', cloth(tiles(32)), { hp: 25, score: 10, touch: 'tiles' });
  book.add('clothB', cloth(baseTile.crop(0, 0, 20, 20)), { hp: 25, score: 10, touch: 'baseTile' });
  /** The rubber duck: an extra life. */
  const duck = water(33);
  blob(duck, 10, 12, 6, 4, R('mango'), 1, 3);
  blob(duck, 13, 7, 3, 3, R('mango'), 1, 3);
  duck.rect(15, 7, 3, 2, c('citrus', 2)).set(13, 6, c('ink', 0));
  book.add('duck', duck, { grav: GRAV.down, effect: LIFE, eamt: 1, score: 500, touch: 'bathwater' });
  /** A quarter in the soap dish: points. */
  const quarter = tiles(34);
  quarter.rect(3, 13, 14, 3, c('white', 1)).rect(3, 13, 14, 1, c('white', 2)).disc(10, 11, 3, c('metal', 3)).set(9, 10, c('white', 2));
  book.add('quarter', quarter, { score: 100, touch: 'soapDish' });
  book.add('soapDish', tiles(34).rect(3, 13, 14, 3, c('white', 1)).rect(3, 13, 14, 1, c('white', 2)), air);

  // ---------- II. the forest-dark aisle ----------
  /** The store's far wall in the dark, and the forest that has grown out of the aisle. */
  const forest = (seed: number) => {
    const p = dark(seed, 1);
    const r = rng(seed + 1);
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(r() * 18);
      for (let y = 0; y < 20; y++) p.set(x, y, c('bark', 0)).set(x + 1, y, c('sky', 0));
    }
    for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('green', 0));
    return p;
  };
  book.add('forest', forest(41), air);
  // the store's ceiling: a fluorescent tube, flickering far off
  const tube = (on: boolean) => {
    const p = forest(42);
    p.rect(2, 3, 16, 3, on ? c('neon', 1) : c('grey', 0)).rect(2, 2, 16, 1, c('metal', 0));
    if (on) for (const x of [3, 9, 15]) p.set(x, 8, c('neon', 0));
    return p;
  };
  book.add('tube0', tube(true), { ...air, next: 'tube1', ntime: 31 });
  book.add('tube1', tube(false), { ...air, next: 'tube2', ntime: 2 });
  book.add('tube2', tube(true), { ...air, next: 'tube3', ntime: 3 });
  book.add('tube3', tube(false), { ...air, next: 'tube0', ntime: 9 });
  // the aisle's sign
  const sign = forest(43);
  sign.rect(1, 4, 18, 11, c('ink', 0)).frame(1, 4, 18, 11, c('neon', 0));
  micro(sign, 3, 6, 'AISL', c('neon', 1));
  micro(sign, 5, 12 - 2, '13', c('demon', 3));
  book.add('sign', sign, air);
  // the store's floor (linoleum, solid) and the forest floor (moss over linoleum)
  const lino = (moss: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 10) + Math.floor(y / 10)) % 2 ? c('grey', 1) : c('grey', 2));
    p.rect(0, 0, 20, 1, c('grey', 3));
    if (moss) {
      const r = rng(44);
      for (let x = 0; x < 20; x++) {
        const h = 2 + Math.floor(r() * 4);
        p.rect(x, 0, 1, h, c('green', 1 + Math.floor(r() * 2)));
      }
    }
    return p;
  };
  book.add('lino', lino(false), { solid: SOLID });
  book.add('moss', lino(true), { solid: SOLID });
  // store shelving: a metal shelf (a ledge) with products, and its upright
  const product = (p: Pixels, seed: number) => {
    const r = rng(seed);
    let x = 1;
    while (x < 18) {
      const w = 3 + Math.floor(r() * 2);
      const h = 6 + Math.floor(r() * 7);
      const col = ['pink', 'towel', 'mango', 'citrus', 'suds', 'wall'][Math.floor(r() * 6)];
      p.rect(x, 17 - h, w, h, c(col, 1 + Math.floor(r() * 2))).rect(x, 17 - h, w, 1, c(col, 3));
      x += w + 1;
    }
  };
  const storeShelf = (stock: boolean, seed: number) => {
    const p = forest(seed);
    if (stock) product(p, seed);
    p.rect(0, 17, 20, 3, c('metal', 2)).rect(0, 17, 20, 1, c('metal', 3)).rect(0, 19, 20, 1, c('metal', 0));
    return p;
  };
  book.add('storeShelf', storeShelf(true, 45), { solid: LEDGE, grav: GRAV.down });
  book.add('bareShelf', storeShelf(false, 46), { solid: LEDGE, grav: GRAV.down });
  const stock = forest(47);
  product(stock, 47);
  book.add('stock', stock, air);
  // a tree trunk grown up through the aisle (solid), and its crown (scenery)
  const trunk = P();
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++)
      trunk.set(x, y, x < 3 || x > 16 ? c('sky', 1) : shadeAt(R('bark'), 0, 3, 0.3 + Math.abs(Math.sin((x * 1.3 + y * 0.2) / 2)) * 0.5, x, y));
  book.add('trunk', trunk, { solid: SOLID });
  const crown = forest(48);
  for (const [x, y, rx] of [
    [5, 6, 6],
    [14, 9, 6],
    [9, 14, 7],
  ] as const)
    blob(crown, x, y, rx, 4, R('green'), 0, 2);
  book.add('crown', crown, air);
  // a luffa vine: air with no gravity (climb it), heavy with gourds
  const vine = (gourd: boolean) => {
    const p = forest(49);
    for (let y = 0; y < 20; y++) p.set(9 + Math.round(Math.sin(y / 3) * 2), y, c('green', 2)).set(10 + Math.round(Math.sin(y / 3) * 2), y, c('green', 1));
    blob(p, 5, 6, 3, 2, R('green'), 1, 3);
    blob(p, 15, 14, 3, 2, R('green'), 1, 3);
    if (gourd) {
      blob(p, 14, 6, 3, 5, R('gourd'), 0, 3);
      for (let k = 0; k < 5; k++) p.set(13 + (k % 3), 3 + k * 2, c('gourd', 0));
    }
    return p;
  };
  book.add('vine', vine(false), { grav: GRAV.none });
  book.add('vineGourd', vine(true), { grav: GRAV.none });
  // brambles in the aisle (they scratch once, then they're trampled)
  const bramble = (trampled: boolean) => {
    const p = forest(50);
    if (trampled) return p.rect(0, 17, 20, 3, c('bark', 1)).rect(3, 18, 4, 1, c('green', 0)).rect(12, 18, 5, 1, c('green', 0));
    for (let k = 0; k < 5; k++) p.line(2 + k * 4, 19, 6 + k * 3 - (k % 2) * 6, 9 + (k % 3) * 2, c('bark', 2));
    for (let k = 0; k < 9; k++) p.set(2 + ((k * 7) % 17), 10 + ((k * 3) % 9), c('demon', 2));
    return p;
  };
  book.add('bramble', bramble(false), { ...air, hp: -8, touch: 'trampled' });
  book.add('trampled', bramble(true), air);
  // rosemary: three splashes of brine (the throw's own counter)
  const rosemary = (bg: Pixels) => {
    for (const [x, d] of [
      [7, -1],
      [10, 0],
      [13, 1],
    ]) {
      bg.line(x, 18, x + d * 3, 5, c('wood', 2));
      for (let y = 6; y < 18; y += 2) bg.set(x + d * ((18 - y) / 4) - 1, y, c('rosemary', 2)).set(x + d * ((18 - y) / 4) + 1, y + 1, c('rosemary', 1));
    }
    bg.disc(10, 4, 1, c('quilt', 3));
    return bg;
  };
  book.add('rosemary', rosemary(forest(51)), { effect: SEQ.throw, eamt: SPRIG, score: 50, touch: 'forest' });
  book.add('rosemaryT', rosemary(tiles(52)), { effect: SEQ.throw, eamt: SPRIG, score: 50, touch: 'tiles' });
  // a silver coin (counter 21)
  const coin = (bg: Pixels) => {
    bg.disc(10, 11, 4, c('metal', 2)).disc(10, 11, 3, c('metal', 3)).set(9, 9, c('white', 2));
    micro(bg, 9, 9, '$', c('metal', 0));
    return bg;
  };
  book.add('coin', coin(forest(53)), { effect: COINS, eamt: 1, score: 25, touch: 'forest' });
  // the bakery's day-old bin (Loaf #13 waits in it) and the spice rack (the mustard seed)
  const bin = forest(54);
  bin.rect(1, 8, 18, 12, c('wood', 2)).rect(1, 8, 18, 2, c('wood', 3));
  micro(bin, 2, 12, 'DAY-', c('wax', 2));
  book.add('bin', bin, { solid: SOLID });
  const spice = storeShelf(false, 55);
  for (let x = 1; x < 19; x += 4) spice.rect(x, 9, 3, 8, c(['citrus', 'mango', 'rosemary', 'red', 'cheese'][x % 5], 2)).rect(x, 8, 3, 1, c('metal', 3));
  book.add('spice', spice, { solid: LEDGE, grav: GRAV.down });
  // the poster on the end cap: the third goat from the left
  const poster = forest(56);
  poster.rect(2, 2, 16, 16, c('wax', 2)).rect(3, 3, 14, 10, c('night', 2));
  for (const x of [6, 10, 14]) blob(poster, x, 10, 1.8, 1.2, R('white'), 1, 2);
  micro(poster, 3, 14, 'GOAT', c('ink', 0));
  book.add('poster', poster, air);
  // the checkout, and the clerk (a goth teen in black lipstick, unimpressed): six coins buy a
  // loofah of his own (a black one, obviously)
  const register = (paid: boolean) => {
    const p = forest(57);
    p.rect(0, 8, 20, 12, c('ink', 1))
      .rect(0, 8, 20, 2, c('grey', 2))
      .rect(4, 2, 12, 6, c('grey', 1))
      .rect(6, 3, 8, 3, c('neon', paid ? 1 : 0));
    micro(p, 6, 3, paid ? 'OK' : String(COINS_NEEDED), c('ink', 0));
    if (paid) blob(p, 10, 12, 4, 3, R('ink'), 0, 1);
    return p;
  };
  book.add('register', register(false), { solid: SOLID, effect: COINS, eamt: -COINS_NEEDED, score: 1000, touch: 'paid' });
  book.add('paid', register(true), { grav: GRAV.none });
  const clerk = (f: number) => {
    const p = forest(58);
    p.rect(4, 12, 12, 8, c('ink', 0));
    blob(p, 10, 8, 4, 4.4, R('skin'), 3, 4);
    p.rect(5, 2, 10, 4, c('ink', 0)).rect(4, 4, 2, 9, c('ink', 0)).rect(14, 4, 2, 9, c('ink', 0));
    p.set(8, 8, f ? c('skin', 2) : c('ink', 0))
      .set(12, 8, f ? c('skin', 2) : c('ink', 0))
      .rect(9, 11, 3, 1, c('quilt', 0));
    return p;
  };
  book.add('clerk0', clerk(0), { ...air, next: 'clerk1', ntime: 40 });
  book.add('clerk1', clerk(1), { ...air, next: 'clerk0', ntime: 3 });
  // the store's automatic doors (scenery: he came in this way)
  const doors = forest(59);
  doors.rect(1, 0, 18, 20, c('metal', 1)).rect(2, 1, 7, 19, c('night', 2)).rect(11, 1, 7, 19, c('night', 2));
  micro(doors, 3, 3, 'OPEN', c('neon', 1));
  book.add('doors', doors, air);

  // ---------- III. home in the dark ----------
  /** The bedroom's and the hall's wallpaper: damask in the moonlight. */
  const paper = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('wall', x % 10 < 5 ? 1 : 2));
    for (let x = 2; x < 20; x += 10)
      p.set(x, 6, c('paper', 1))
        .set(x + 1, 7, c('paper', 1))
        .set(x - 1, 7, c('paper', 1))
        .set(x, 8, c('paper', 1))
        .set(x, 5, c('paper', 0));
    const r = rng(seed);
    for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('wall', 0));
    return p;
  };
  book.add('paper', paper(61), air);
  const crownMold = paper(62);
  crownMold.rect(0, 0, 20, 5, c('wood', 0)).rect(0, 5, 20, 1, c('gold', 0));
  book.add('crownMold', crownMold, air);
  const base = paper(63);
  base.rect(0, 15, 20, 5, c('wood', 1)).rect(0, 15, 20, 1, c('wood', 3));
  book.add('base', base, air);
  const boards = (top: boolean, seed: number) => {
    const p = P();
    const r = rng(seed);
    for (let row = 0; row < 4; row++) {
      const off = Math.floor(r() * 20);
      for (let y = row * 5; y < row * 5 + 5; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('wood'), 1, 3, 0.4 + ((x + off) % 20) / 60, x, y));
      p.rect(0, row * 5 + 4, 20, 1, c('wood', 0)).rect(off % 20, row * 5, 1, 4, c('wood', 0));
    }
    if (top) p.rect(0, 0, 20, 2, c('wood', 4)).rect(0, 2, 20, 1, c('wood', 2));
    return p;
  };
  book.add('boards', boards(true, 64), { solid: SOLID });
  book.add('joists', boards(false, 65), { solid: SOLID });
  // the bed: the headboard, the quilt (a ledge), its side
  const quilt = (bg: Pixels, top: boolean) => {
    for (let y = top ? 8 : 0; y < 20; y++) for (let x = 0; x < 20; x++) bg.set(x, y, c('quilt', (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? 2 : 1));
    if (top) bg.rect(0, 8, 20, 2, c('quilt', 3));
    return bg;
  };
  book.add('bedTop', quilt(paper(66), true), { solid: LEDGE, grav: GRAV.down });
  book.add('bedSide', quilt(P(), false), { solid: SOLID });
  // the headboard: carved finials on its top block only
  const headboard = (top: boolean) => {
    const p = paper(67);
    p.rect(2, top ? 3 : 0, 16, top ? 17 : 20, c('wood', 0)).rect(4, top ? 5 : 0, 12, top ? 15 : 20, c('wood', 1));
    if (top) for (const x of [3, 10, 16]) p.rect(x - 1, 0, 3, 3, c('wood', 2)).set(x, 0, c('gold', 1));
    return p;
  };
  book.add('headboardTop', headboard(true), air);
  book.add('headboard', headboard(false), air);
  // her, asleep (her snoring drifts up); his pillow with the washcloth of shame on it
  const wife = quilt(paper(68), true);
  blob(wife, 7, 9, 6, 3, R('white'), 1, 2);
  blob(wife, 8, 9, 3.6, 2.6, R('hair'), 0, 2);
  wife.rect(10, 9, 9, 3, c('quilt', 3));
  book.add('wife', wife, { solid: LEDGE, grav: GRAV.down, birthMon: MON.zzz, birthTime: 52 });
  const pillow = quilt(paper(69), true);
  blob(pillow, 8, 9, 6, 3, R('white'), 1, 2);
  pillow.rect(5, 7, 7, 3, c('towel', 1)).rect(5, 7, 7, 1, c('towel', 2));
  book.add('pillow', pillow, { solid: LEDGE, grav: GRAV.down });
  // furniture: a night stand, a dresser, a hall table (ledges and solids)
  const stand = paper(70);
  stand.rect(2, 4, 16, 16, c('wood', 1)).rect(2, 4, 16, 2, c('wood', 3)).rect(4, 10, 12, 1, c('wood', 0)).disc(10, 14, 1, c('metal', 3));
  book.add('stand', stand, { solid: LEDGE, grav: GRAV.down });
  const dresser = paper(71);
  dresser.rect(0, 0, 20, 20, c('wood', 1)).rect(0, 0, 20, 2, c('wood', 3));
  for (const y of [4, 11])
    dresser
      .rect(2, y, 16, 6, c('wood', 2))
      .disc(7, y + 3, 1, c('gold', 2))
      .disc(13, y + 3, 1, c('gold', 2));
  book.add('dresser', dresser, { solid: SOLID });
  const table = base.crop(0, 0, 20, 20);
  table.rect(0, 8, 20, 3, c('wood', 3)).rect(0, 8, 20, 1, c('wood', 4)).rect(2, 11, 2, 9, c('wood', 1)).rect(16, 11, 2, 9, c('wood', 1));
  book.add('table', table, { solid: LEDGE, grav: GRAV.down });
  const wallShelf = paper(72);
  wallShelf.rect(0, 0, 20, 3, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(3, 3, 2, 4, c('wood', 1)).rect(15, 3, 2, 4, c('wood', 1));
  book.add('wallShelf', wallShelf, { solid: LEDGE, grav: GRAV.down });
  // the candles of the cleansing: unlit (a touch lights it: counter 22), then lit and burning
  const candle = (bg: Pixels, f: number) => {
    bg.rect(8, 9, 4, 10, c('wax', 2)).rect(8, 9, 4, 1, c('wax', 1)).rect(6, 18, 8, 2, c('metal', 2)).rect(10, 7, 1, 2, c('ink', 0));
    if (f >= 0) {
      blob(bg, 10 + (f ? 0.5 : -0.5), 4, 1.8, 3 + f * 0.4, R('flame'), 0, 3);
      bg.set(10, 5, c('flame', 3));
      for (let k = 0; k < 5; k++) bg.set((k * 7 + f * 5) % 20, (k * 3 + f) % 10, c('flame', 0));
    }
    return bg;
  };
  for (const [name, bg] of [
    ['', () => paper(73)],
    ['B', () => base.crop(0, 0, 20, 20)],
  ] as const) {
    book.add(`unlit${name}`, candle(bg(), -1), { ...air, effect: CANDLES, eamt: 1, score: 100, touch: `lit${name}0` });
    book.add(`lit${name}0`, candle(bg(), 0), { ...air, next: `lit${name}1`, ntime: 5 });
    book.add(`lit${name}1`, candle(bg(), 1), { ...air, next: `lit${name}0`, ntime: 6 });
  }
  // the creaky board (from another song): it costs dignity once, then it's quiet
  const creak = base.crop(0, 0, 20, 20);
  creak.rect(0, 15, 20, 5, c('wood', 3)).rect(0, 15, 20, 1, c('wood', 4)).line(1, 15, 19, 13, c('wood', 2));
  micro(creak, 5, 5, '!', c('white', 2));
  book.add('creak', creak, { ...air, hp: -8, touch: 'creaked' });
  book.add('creaked', base.crop(0, 0, 20, 20).rect(0, 17, 20, 3, c('wood', 2)), air);
  // the linen closet's shelves (ledges) stacked with towels (the screaming ones come out of it)
  const linen = wallShelf.crop(0, 0, 20, 20);
  for (const [x, col] of [
    [1, 'pink'],
    [7, 'towel'],
    [13, 'white'],
  ] as const)
    linen.rect(x, 10, 6, 10, c(col, 1)).rect(x, 10, 6, 2, c(col, 2));
  book.add('linen', linen, { solid: LEDGE, grav: GRAV.down });
  // a doorway (scenery)
  const doorway = paper(74);
  doorway.rect(2, 0, 16, 20, c('night', 0)).rect(2, 0, 2, 20, c('wood', 2)).rect(16, 0, 2, 20, c('wood', 2));
  book.add('doorway', doorway, air);
  const doorwayTop = paper(75);
  doorwayTop.rect(2, 4, 16, 16, c('night', 0)).rect(2, 2, 16, 2, c('wood', 2)).rect(2, 4, 2, 16, c('wood', 2)).rect(16, 4, 2, 16, c('wood', 2));
  book.add('doorwayTop', doorwayTop, air);
  // the hall's pictures: the Bard's own (Doc Leo) and Loaf #13 in a frame
  const picture = (seed: number, draw: (p: Pixels) => void) => {
    const p = paper(seed);
    p.rect(2, 3, 16, 13, c('gold', 1)).rect(3, 4, 14, 11, c('wood', 0)).rect(4, 5, 12, 9, c('night', 2));
    draw(p);
    return p;
  };
  book.add(
    'leoPic',
    picture(76, (p) => {
      p.rect(7, 6, 6, 2, c('ink', 0)).rect(6, 8, 8, 1, c('ink', 0));
      blob(p, 10, 11, 2.6, 2.4, R('skin'), 2, 4);
      p.set(10, 11, c('red', 3));
    }),
    air,
  );
  book.add(
    'weddingPic',
    picture(77, (p) => {
      blob(p, 8, 11, 2.2, 2.4, R('skin'), 2, 4);
      blob(p, 12, 11, 2.2, 2.4, R('skin'), 2, 4);
      p.rect(11, 8, 3, 2, c('hair', 1)).rect(6, 8, 4, 1, c('hair', 2)).set(10, 13, c('red', 3));
    }),
    air,
  );
  // the bathroom door at home: it opens for six candles burning
  const bathDoor = (open: boolean) => {
    const p = base.crop(0, 0, 20, 20);
    if (open) {
      p.rect(2, 0, 16, 20, c('steam', 2));
      for (let y = 0; y < 20; y += 4) p.rect(2, y, 16, 1, c('steam', 3));
      return p.rect(2, 0, 2, 20, c('wood', 2)).rect(16, 0, 2, 20, c('wood', 2));
    }
    p.rect(2, 0, 16, 20, c('wood', 2)).rect(4, 2, 12, 7, c('wood', 1)).rect(4, 11, 12, 7, c('wood', 1)).disc(14, 10, 1.2, c('gold', 2));
    micro(p, 7, 4, String(CANDLES_NEEDED), c('flame', 2));
    return p;
  };
  book.add('bathDoor', bathDoor(false), { solid: SOLID, effect: CANDLES, eamt: -CANDLES_NEEDED, score: 1000, touch: 'bathOpen' });
  book.add('bathOpen', bathDoor(true), { grav: GRAV.none });
  const bathTop = paper(78);
  bathTop.rect(2, 2, 16, 18, c('wood', 2)).rect(2, 2, 16, 2, c('wood', 0));
  for (let k = 0; k < 6; k++) bathTop.set(4 + k * 2, 1, c('steam', 3));
  text(bathTop, 6, 9, 'WC', c('gold', 2));
  book.add('bathTop', bathTop, air);

  // ---------- IV. Scrubbus Maximus (the shower, at midnight) ----------
  const steamAir = (seed: number) => {
    const p = dark(seed, 2);
    const r = rng(seed + 1);
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(r() * 16);
      const y = Math.floor(r() * 18);
      p.rect(x, y, 4, 1, c('steam', 0));
    }
    return p;
  };
  book.add('steamAir', steamAir(91), air);
  // the cursed water in the drain (it always burns)
  const drain = (f: number) => {
    const p = steamAir(92);
    for (let y = 8; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('demon'), 0, 2, 0.4 + Math.sin((x + f * 3 + y) / 2) * 0.25, x, y));
    for (let k = 0; k < 4; k++) p.ring(3 + ((k * 5 + f * 4) % 15), 10 + ((k * 3) % 8), 1.2, c('citrus', 2));
    return p;
  };
  book.add('drain0', drain(0), { hp: -8, grav: GRAV.down, next: 'drain1', ntime: 4 });
  book.add('drain1', drain(1), { hp: -8, grav: GRAV.down, next: 'drain0', ntime: 4 });
  // the shower's tile floor (solid) and the caddy's shelves (ledges)
  const showerTile = (ledge: boolean) => {
    const p = ledge ? steamAir(93) : P();
    for (let y = ledge ? 2 : 0; y < (ledge ? 8 : 20); y++)
      for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? c('tile', 2) : c('ink', 1));
    if (ledge) p.rect(0, 8, 20, 1, c('metal', 3)).rect(2, 9, 16, 1, c('metal', 1));
    return p;
  };
  book.add('showerFloor', showerTile(false), { solid: SOLID });
  book.add('caddy', showerTile(true), { solid: LEDGE, grav: GRAV.down });
  // steam curling (scenery)
  const curl = (f: number) => {
    const p = steamAir(94);
    for (let k = 0; k < 3; k++) blob(p, 4 + k * 6 + f, 16 - k * 4 - f, 3.4, 2.4, R('steam'), 0, 2);
    return p;
  };
  book.add('curl0', curl(0), { ...air, next: 'curl1', ntime: 8 });
  book.add('curl1', curl(1), { ...air, next: 'curl0', ntime: 8 });
  // the soap dish behind the demon sponge: it gives birth to cursed citrus suds
  const dish = steamAir(95);
  dish.rect(2, 12, 16, 3, c('metal', 3)).rect(3, 15, 14, 2, c('metal', 1));
  blob(dish, 7, 10, 4, 2.4, R('citrus'), 1, 3);
  blob(dish, 13, 10, 4, 2.4, R('mango'), 1, 3);
  book.add('soapDishB', dish, { solid: SOLID, birthMon: MON.suds, birthTime: SUDS_EVERY });
  // a dry washcloth on the caddy (dignity back), rosemary for the brine
  book.add('clothS', cloth(steamAir(96)), { hp: 30, score: 100, touch: 'steamAir' });
  book.add('rosemaryS', rosemary(steamAir(97)), { ...air, effect: SEQ.throw, eamt: SPRIG, score: 50, touch: 'rosemaryGone' });
  book.add('rosemaryGone', steamAir(97), air);
  // her silver rack: it takes the pink one back, clean, beside his own black one
  const herRack = (back: boolean) => {
    const p = rack(back ? 'both' : 'empty');
    if (!back) micro(p, 7, 12, '?', c('pink', 3));
    else for (let k = 0; k < 6; k++) p.set((k * 7) % 20, (k * 5 + 2) % 20, c('gold', 2));
    return p;
  };
  book.add('herRack', herRack(false), { solid: SOLID, effect: PINK, eamt: -1, score: 5000, touch: 'rackBack' });
  book.add('rackBack', herRack(true), { grav: GRAV.none });

  // ---------- (last, so every other block keeps its number) hidden things and a guest ----------
  const pic = (name: string) => book.pics.get(name)!.crop(0, 0, 20, 20);
  // a tin heart on a little wall shelf at home, a hop back from the top of the bookcase: a glint crosses it now and then; 100 points
  const tin = { ink: c('ink', 0), tin: [c('metal', 0), c('metal', 1), c('metal', 3)], white: c('white', 2), dark: c('grey', 0) };
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(`tinHeart${k || ''}`, drawTinHeart(pic('paper'), tin, k), {
      next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 50,
      touch: 'paper',
      score: 100,
      ...air,
    });
  // a dyed Easter egg on the top shelf of the forest-dark aisle's bare shelving: 50 points
  const egg = { ink: c('ink', 0), shell: R('mango'), paint: R('rosemary').slice(1), accent: c('pink', 3), white: c('white', 2) };
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    book.add(`easterEgg${k || ''}`, drawEasterEgg(pic('forest'), egg, 'zigzag', k), {
      next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
      ntime: k ? 3 : 60,
      touch: 'forest',
      score: 50,
      ...air,
    });
  // Mystery Robot Joe (Keep It Brief!), taking stock in the forest-dark aisle at 3 a.m. (scenery)
  const use = ['ink', 'grey', 'metal', 'white', 'gold', 'red', 'skin', 'night', 'steam'].flatMap((n) => R(n));
  book.add('joe', pic('forest').blit(joeCameo(buildPalette('plain').pal, 'side', 0, { use }), 0, 0, CLEAR), air);
  return book;
}
