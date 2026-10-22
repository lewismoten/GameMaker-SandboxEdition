// RECKON.BBL: every background block, drawn in code, seen from the side at a man's height. A
// block's number is the order it was added (by name here); the attributes are the game:
//   - air falls (gravity down); the floors, the furniture and the fridge's walls are solid;
//     shelves, bed tops, counters' edges and the floating tiles of the reckoning are ledges
//     (stand on them, hop up through them);
//   - the noisy things on the floor (a creaky board, a squeaky toy, the Lego) are air that costs
//     dignity (hit points) when you step into them: hop over;
//   - celery is willpower (counter 20), and the cheesecake only lets you near with seven, and
//     takes all seven; rolls of toilet paper are counter 21, and the bathroom door takes three;
//   - in the reckoning, almond milk and oat milk refill the splash (the Space sequence's own
//     counter) and grow back, Lactaid mends dignity, the soda fountain behind the Devil gives
//     birth to milkshakes, and the porcelain throne takes the Devil's last straw (counter 22);
//   - coins are points, a glass of water mends dignity, the TV remote under the couch cushion is
//     an extra life.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import { micro, text } from '../../../snowbound/src/art/font';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import type { Pal } from '../art/pal';
import { MILK_CARTON, MON, ROLLS, ROLLS_NEEDED, SEQ, STRAW, WILL, WILL_NEEDED } from '../ids';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, hop up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, down: 4 } as const;
const LIFE = 1;
/** Ticks between milkshakes from the soda fountain. */
export const SHAKE_EVERY = 46;
/** Ticks before an almond milk carton is back on its tile. */
export const MILK_REGROW = 160;

export function buildBlocks(pal: Pal): BlockBook {
  const book = new BlockBook();
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);
  const air = { grav: GRAV.down };

  // ---------- backdrops ----------
  /** The bedroom's and the hall's wallpaper: soft stripes with a little fleur. */
  const wall = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('wall', x % 10 < 5 ? 1 : 2));
    const r = rng(seed);
    for (let x = 2; x < 20; x += 10) p.set(x, 6, c('paper', 1)).set(x + 1, 7, c('paper', 1)).set(x - 1, 7, c('paper', 1)).set(x, 8, c('paper', 1));
    for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('wall', 0));
    return p;
  };
  book.add('wall', wall(1), air);
  // the crown molding along the ceiling
  const crown = wall(2);
  crown.rect(0, 0, 20, 5, c('white', 0)).rect(0, 5, 20, 1, c('wood', 1)).rect(0, 3, 20, 1, c('white', 1));
  book.add('crown', crown, air);
  // the baseboard behind the man's feet
  const base = wall(3);
  base.rect(0, 15, 20, 5, c('white', 0)).rect(0, 15, 20, 1, c('white', 1));
  book.add('base', base, air);
  /** The dark (the kitchen's far wall, the hallway's ceiling, the void): the backdrop ramp. */
  const dark = (seed: number, k = 2) => {
    const p = P().rect(0, 0, 20, 20, c('sky', k));
    const r = rng(seed);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('sky', k + (r() < 0.5 ? 1 : -1)));
    return p;
  };
  book.add('dark', dark(4), air);

  // ---------- floors ----------
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
  book.add('floor', boards(true, 11), { solid: SOLID });
  book.add('under', boards(false, 12), { solid: SOLID });
  // the hall runner
  const runner = boards(false, 13);
  runner.rect(0, 0, 20, 3, c('rug', 2)).rect(0, 0, 20, 1, c('rug', 3)).rect(0, 3, 20, 1, c('rug', 0));
  for (let x = 1; x < 20; x += 4) runner.set(x, 1, c('rug', 1));
  book.add('runner', runner, { solid: SOLID });

  // ---------- the bedroom ----------
  // the bed: the headboard, the quilt top (a ledge: he starts in bed), its side and foot
  const quilt = (bg: Pixels, top: boolean) => {
    for (let y = top ? 8 : 0; y < 20; y++) for (let x = 0; x < 20; x++) bg.set(x, y, c('quilt', (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? 2 : 1));
    if (top) bg.rect(0, 8, 20, 2, c('quilt', 3));
    for (let x = 2; x < 20; x += 5) bg.set(x, top ? 14 : 4, c('white', 1));
    return bg;
  };
  book.add('bedTop', quilt(wall(21), true), { solid: LEDGE, grav: GRAV.down });
  book.add('bedSide', quilt(P(), false), { solid: SOLID });
  const head = wall(22);
  head.rect(2, 0, 16, 20, c('wood', 1)).rect(4, 2, 12, 16, c('wood', 2)).rect(2, 0, 16, 2, c('wood', 3));
  book.add('headboard', head, air);
  // her pillow and the top of her head (the quilt pulled up): a Z of snoring drifts off it
  const wife = quilt(wall(23), true);
  blob(wife, 7, 9, 6, 3, R('white'), 1, 2);
  blob(wife, 8, 9, 3.6, 2.6, R('hair'), 0, 2);
  wife.rect(10, 9, 9, 3, c('quilt', 3));
  book.add('wife', wife, { solid: LEDGE, grav: GRAV.down, birthMon: MON.zzz, birthTime: 52 });
  // his pillow (he was here a moment ago)
  const pillow = quilt(wall(24), true);
  blob(pillow, 8, 9, 6, 3, R('white'), 1, 2);
  pillow.line(5, 9, 11, 9, c('white', 0));
  book.add('pillow', pillow, { solid: LEDGE, grav: GRAV.down });
  // the night stand (a ledge) and the alarm clock: 3:17, its colon blinking
  const stand = wall(25);
  stand.rect(2, 4, 16, 16, c('wood', 2)).rect(2, 4, 16, 2, c('wood', 4)).rect(4, 10, 12, 1, c('wood', 0)).disc(10, 14, 1, c('metal', 3));
  book.add('stand', stand, { solid: LEDGE, grav: GRAV.down });
  const clock = (on: boolean) => {
    const p = wall(26);
    p.rect(1, 9, 18, 11, c('ink', 1)).rect(2, 10, 16, 9, c('ink', 0));
    micro(p, 3, 12, on ? '3:17' : '3 17', c('digit', 1));
    p.rect(3, 18, 3, 1, c('digit', 0));
    return p;
  };
  book.add('clock0', clock(true), { ...air, next: 'clock1', ntime: 9 });
  book.add('clock1', clock(false), { ...air, next: 'clock0', ntime: 9 });
  // the window: the moon through the blinds
  const blinds = (moon: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('wood', 3));
    p.rect(2, 2, 16, 16, c('night', 1));
    if (moon) p.disc(12, 8, 4, c('moon', 1)).disc(11, 7, 2, c('moon', 2));
    for (let y = 3; y < 18; y += 3) p.rect(2, y, 16, 1, c('white', 0));
    return p;
  };
  book.add('window', blinds(true), air);
  book.add('windowB', blinds(false), air);
  // the dresser: solid, hop over it (coins on top)
  const dresser = wall(27);
  dresser.rect(0, 0, 20, 20, c('wood', 1)).rect(0, 0, 20, 2, c('wood', 3));
  for (const y of [4, 11]) dresser.rect(2, y, 16, 6, c('wood', 2)).disc(7, y + 3, 1, c('gold', 2)).disc(13, y + 3, 1, c('gold', 2));
  book.add('dresser', dresser, { solid: SOLID });
  // a doorway (scenery: walk through it)
  const doorway = wall(28);
  doorway.rect(2, 0, 16, 20, c('night', 0)).rect(2, 0, 2, 20, c('wood', 2)).rect(16, 0, 2, 20, c('wood', 2));
  book.add('doorway', doorway, air);
  const doorTop = wall(29);
  doorTop.rect(2, 4, 16, 16, c('night', 0)).rect(2, 2, 16, 2, c('wood', 2)).rect(2, 4, 2, 16, c('wood', 2)).rect(16, 4, 2, 16, c('wood', 2));
  book.add('doorTop', doorTop, air);

  // ---------- noisy things on the floor: air that costs dignity (hop over) ----------
  const creak = base.crop(0, 0, 20, 20);
  creak.rect(0, 15, 20, 5, c('wood', 3)).rect(0, 15, 20, 1, c('wood', 4)).line(1, 15, 19, 13, c('wood', 2)).line(1, 16, 19, 14, c('wood', 1));
  micro(creak, 5, 5, '!', c('white', 2));
  book.add('creak', creak, { ...air, hp: -8, touch: 'creaked' });
  // once it has creaked it is quiet (a hurt holds him still, so a floor that always hurt would hold him there)
  book.add('creaked', base.crop(0, 0, 20, 20).rect(0, 17, 20, 3, c('wood', 2)).rect(0, 17, 20, 1, c('wood', 3)), air);
  const lego = (bg: Pixels, seed: number) => {
    const r = rng(seed);
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(r() * 14);
      const col = ['red', 'pjs', 'cheese', 'green'][i];
      bg.rect(x, 16, 4, 4, c(col, 2)).rect(x, 16, 4, 1, c(col, 3)).set(x + 1, 15, c(col, 3)).set(x + 3, 15, c(col, 3));
    }
    return bg;
  };
  book.add('lego', lego(base.crop(0, 0, 20, 20), 31), { ...air, hp: -10, touch: 'legoKicked' });
  // kicked aside to the corners
  book.add('legoKicked', base.crop(0, 0, 20, 20).rect(0, 17, 3, 3, c('red', 2)).rect(17, 18, 3, 2, c('cheese', 2)), air);
  const squeak = base.crop(0, 0, 20, 20);
  blob(squeak, 10, 16, 6, 3.4, R('pink'), 0, 2);
  squeak.set(14, 15, c('ink', 0)).line(4, 14, 2, 12, c('pink', 1)).set(6, 14, c('pink', 2));
  book.add('squeak', squeak, { ...air, hp: -6, touch: 'squeaked' });
  const squeaked = base.crop(0, 0, 20, 20);
  blob(squeaked, 10, 18, 6, 1.8, R('pink'), 0, 2);
  book.add('squeaked', squeaked, air);

  // ---------- the hall ----------
  // the photos on the wall: the third goat from the left (a painting), Brother Camel, Doc Leo
  const photo = (seed: number, draw: (p: Pixels) => void) => {
    const p = wall(seed);
    p.rect(2, 3, 16, 13, c('wood', 3)).rect(3, 4, 14, 11, c('wood', 0)).rect(4, 5, 12, 9, c('night', 2));
    draw(p);
    return p;
  };
  book.add(
    'goatPic',
    photo(41, (p) => {
      for (const x of [6, 10, 14]) blob(p, x, 11, 1.8, 1.2, R('white'), 1, 2);
      p.set(15, 9, c('white', 2)).rect(4, 13, 12, 1, c('green', 1));
    }),
    air,
  );
  book.add(
    'camelPic',
    photo(42, (p) => {
      p.rect(4, 11, 12, 3, c('cheese', 1));
      blob(p, 9, 10, 3, 1.6, R('crust'), 1, 3);
      p.line(12, 10, 14, 7, c('crust', 2)).set(14, 7, c('crust', 3));
      p.set(13, 5, c('moon', 1));
    }),
    air,
  );
  book.add(
    'leoPic',
    photo(43, (p) => {
      p.rect(7, 6, 6, 2, c('ink', 0)).rect(6, 8, 8, 1, c('ink', 0));
      blob(p, 10, 11, 2.6, 2.4, R('skin'), 2, 4);
      p.set(10, 11, c('red', 3)).set(9, 13, c('white', 2)).set(11, 13, c('white', 2));
    }),
    air,
  );
  // a night light in the outlet (it glows)
  const nightLight = base.crop(0, 0, 20, 20);
  nightLight.rect(8, 8, 4, 6, c('white', 1)).disc(10, 10, 2, c('moon', 2));
  for (const [x, y] of [[6, 7], [14, 7], [10, 5], [6, 13], [14, 13]]) nightLight.set(x, y, c('moon', 0));
  book.add('nightLight', nightLight, air);
  // the laundry basket: solid
  const basket = base.crop(0, 0, 20, 20);
  for (let y = 6; y < 20; y++) for (let x = 2; x < 18; x++) basket.set(x, y, c('white', (x + y) % 4 < 2 ? 1 : 0));
  basket.rect(2, 6, 16, 2, c('white', 2));
  blob(basket, 8, 5, 4, 2, R('pjs'), 1, 3);
  blob(basket, 13, 5, 3.4, 1.8, R('red'), 1, 3);
  book.add('basket', basket, { solid: SOLID });
  // coins on the dresser and under the couch (points) and a glass of water (dignity back)
  const coins = (bg: Pixels) => {
    for (const [x, y] of [[6, 15], [11, 16], [14, 14]]) bg.disc(x, y, 2, c('gold', 2)).set(x - 1, y - 1, c('gold', 3)).set(x + 1, y + 1, c('gold', 0));
    return bg;
  };
  book.add('coins', coins(wall(51)), { score: 25, touch: 'wall' });
  book.add('coinsB', coins(base.crop(0, 0, 20, 20)), { score: 25, touch: 'base' });
  const glass = (bg: Pixels) => {
    bg.rect(6, 6, 8, 13, c('white', 0)).rect(7, 7, 6, 11, c('fridge', 0)).rect(7, 7, 6, 3, c('fridge', 2)).rect(6, 18, 8, 1, c('white', 2));
    return bg;
  };
  book.add('water', glass(wall(52)), { hp: 20, score: 10, touch: 'wall' });
  book.add('waterB', glass(base.crop(0, 0, 20, 20)), { hp: 20, score: 10, touch: 'base' });

  // ---------- the living room ----------
  const couch = (part: 'seat' | 'back' | 'arm', seed: number) => {
    const p = part === 'back' ? wall(seed) : base.crop(0, 0, 20, 20);
    if (part === 'back') p.rect(0, 6, 20, 14, c('green', 1)).rect(0, 6, 20, 3, c('green', 2)).rect(0, 6, 20, 1, c('green', 3));
    else if (part === 'arm') blob(p.rect(2, 4, 16, 16, c('green', 1)), 10, 6, 8, 4, R('green'), 1, 3);
    else p.rect(0, 6, 20, 14, c('green', 1)).rect(0, 6, 20, 4, c('green', 3)).rect(0, 10, 20, 1, c('green', 0)).rect(9, 6, 1, 4, c('green', 0));
    return p;
  };
  book.add('couchBack', couch('back', 61), { solid: LEDGE, grav: GRAV.down });
  book.add('couchArm', couch('arm', 62), { solid: SOLID });
  book.add('couch', couch('seat', 63), { solid: SOLID });
  // the TV remote, lost down the side of the couch (from another song): an extra life
  const remote = base.crop(0, 0, 20, 20);
  remote.rect(3, 13, 14, 4, c('ink', 1)).rect(3, 13, 14, 1, c('grey', 1)).set(5, 15, c('red', 3)).set(8, 15, c('white', 1)).set(11, 15, c('white', 1)).set(14, 15, c('white', 1));
  micro(remote, 4, 6, '?!', c('cheese', 3));
  book.add('remote', remote, { ...air, effect: LIFE, eamt: 1, score: 500, touch: 'base' });
  // the TV, glowing with snow (scenery)
  const tv = (f: number) => {
    const p = wall(65);
    p.rect(1, 3, 18, 15, c('wood', 1)).rect(3, 5, 14, 11, c('grey', 1));
    const r = rng(66 + f);
    for (let y = 5; y < 16; y++) for (let x = 3; x < 17; x++) if (r() < 0.45) p.set(x, y, c('grey', 2 + Math.floor(r() * 2)));
    p.rect(5, 18, 2, 2, c('wood', 0)).rect(13, 18, 2, 2, c('wood', 0));
    return p;
  };
  book.add('tv0', tv(0), { ...air, next: 'tv1', ntime: 3 });
  book.add('tv1', tv(1), { ...air, next: 'tv0', ntime: 3 });
  // a coffee table (a ledge)
  const table = base.crop(0, 0, 20, 20);
  table.rect(0, 8, 20, 3, c('wood', 3)).rect(0, 8, 20, 1, c('wood', 4)).rect(2, 11, 2, 9, c('wood', 1)).rect(16, 11, 2, 9, c('wood', 1));
  book.add('table', table, { solid: LEDGE, grav: GRAV.down });
  // the bookshelf's shelves (ledges) and its books (scenery)
  const shelf = (books: boolean, seed: number) => {
    const p = P().rect(0, 0, 20, 20, c('wood', 0));
    if (books) {
      const r = rng(seed);
      let x = 1;
      while (x < 19) {
        const w = 2 + Math.floor(r() * 2);
        const h = 10 + Math.floor(r() * 7);
        const col = ['red', 'pjs', 'green', 'cheese', 'quilt'][Math.floor(r() * 5)];
        p.rect(x, 20 - h, w, h, c(col, 1 + Math.floor(r() * 2))).rect(x, 20 - h, w, 1, c(col, 3));
        x += w;
      }
    }
    p.rect(0, 0, 20, 3, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4));
    return p;
  };
  book.add('shelf', shelf(false, 67), { solid: LEDGE, grav: GRAV.down });
  book.add('books', shelf(true, 68), air);
  // a floor lamp (scenery)
  const lamp = wall(69);
  lamp.rect(9, 8, 2, 12, c('metal', 1));
  for (let y = 1; y < 8; y++) lamp.rect(10 - y, y, y * 2, 1, c('cheese', y < 3 ? 2 : 1));
  book.add('lamp', lamp, air);
  // the way into the kitchen (the fridge's light spills out of it)
  const kitchen = wall(70);
  kitchen.rect(2, 0, 16, 20, c('fridge', 0)).rect(2, 0, 2, 20, c('wood', 2)).rect(16, 0, 2, 20, c('wood', 2));
  for (let y = 0; y < 20; y++) for (let x = 4; x < 16; x++) if ((x + y) % 3 === 0) kitchen.set(x, y, c('fridge', 1));
  book.add('kitchen', kitchen, air);

  // ---------- the kitchen ----------
  const tileWall = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, x % 10 === 0 || y % 10 === 0 ? c('tile', 0) : c('tile', 1));
    const r = rng(seed);
    for (let i = 0; i < 3; i++) p.set(1 + Math.floor(r() * 18), 1 + Math.floor(r() * 18), c('tile', 2));
    return p;
  };
  book.add('backsplash', tileWall(71), air);
  const checker = (top: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? c('white', 2) : c('ink', 1));
    if (top) p.rect(0, 0, 20, 1, c('white', 1));
    return p;
  };
  book.add('linoleum', checker(true), { solid: SOLID });
  const counter = (top: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('wood', 2));
    p.rect(2, 4, 16, 14, c('wood', 1)).disc(15, 11, 1, c('metal', 3));
    if (top) p.rect(0, 0, 20, 4, c('grey', 3)).rect(0, 0, 20, 1, c('grey', 1)).rect(0, 4, 20, 1, c('grey', 0));
    return p;
  };
  book.add('counter', counter(true), { solid: SOLID });
  book.add('cabinet', counter(false), { solid: SOLID });
  // the upper cabinets (their bottoms are ledges)
  const upper = P().rect(0, 0, 20, 20, c('wood', 2));
  upper.rect(2, 2, 16, 14, c('wood', 1)).disc(15, 13, 1, c('metal', 3)).rect(0, 17, 20, 3, c('wood', 3)).rect(0, 17, 20, 1, c('wood', 4));
  book.add('upper', upper, { solid: LEDGE, grav: GRAV.down });
  // the bread box on the counter (Loaf #13 lives in it)
  const breadbox = tileWall(72);
  breadbox.rect(1, 6, 18, 14, c('metal', 1)).rect(1, 6, 18, 3, c('metal', 3)).rect(3, 11, 14, 8, c('ink', 1));
  micro(breadbox, 0, 1, 'BREAD', c('crust', 3));
  book.add('breadbox', breadbox, air);
  // the sink and its faucet (scenery)
  const sink = tileWall(73);
  sink.rect(9, 4, 2, 10, c('metal', 2)).rect(9, 4, 6, 2, c('metal', 3)).set(14, 7, c('fridge', 2)).set(14, 10, c('fridge', 1));
  book.add('sink', sink, air);
  // the fridge: its side walls (solid), the cold glowing inside, glass shelves (ledges), the crisper
  const inside = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('fridge'), 0, 2, 0.5 + Math.sin((x + seed) / 7) * 0.2, x, y));
    return p;
  };
  book.add('cold', inside(0), air);
  const bulb = inside(3);
  bulb.disc(10, 4, 4, c('fridge', 3)).rect(8, 0, 4, 2, c('metal', 2));
  for (let k = 0; k < 8; k++) bulb.line(10, 4, 10 + Math.cos(k * 0.8) * 9, 4 + Math.sin(k * 0.8) * 9, c('fridge', 3));
  book.add('bulb', bulb, air);
  const fridgeWall = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) fridgeWall.set(x, y, shadeAt(R('white'), 0, 2, 0.35 + x / 30, x, y));
  fridgeWall.rect(17, 0, 3, 20, c('grey', 2));
  book.add('fridgeWall', fridgeWall, { solid: SOLID });
  const fridgeTop = fridgeWall.crop(0, 0, 20, 20);
  fridgeTop.rect(0, 0, 20, 3, c('white', 2)).rect(0, 3, 20, 1, c('grey', 2));
  book.add('fridgeTop', fridgeTop, { solid: SOLID });
  const glassShelf = inside(5);
  glassShelf.rect(0, 2, 20, 3, c('white', 2)).rect(0, 2, 20, 1, c('fridge', 3)).rect(0, 5, 20, 1, c('metal', 1));
  book.add('glassShelf', glassShelf, { solid: LEDGE, grav: GRAV.down });
  const crisper = inside(6);
  crisper.rect(0, 2, 20, 18, c('white', 1)).rect(1, 4, 18, 14, c('celery', 0)).rect(0, 2, 20, 2, c('white', 2));
  for (let x = 3; x < 18; x += 4) crisper.line(x, 6, x + 1, 16, c('celery', 2));
  book.add('crisper', crisper, { solid: SOLID });
  // the door's shelves (on the right, swung open): the mustard and the ketchup
  const door = (jar: 'mustard' | 'ketchup' | 'none') => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('white'), 0, 2, 0.6 - x / 40, x, y));
    p.rect(0, 15, 14, 5, c('white', 2)).rect(0, 15, 14, 1, c('fridge', 3));
    if (jar === 'mustard') p.rect(4, 4, 6, 11, c('cheese', 2)).rect(5, 2, 4, 2, c('red', 2)).rect(4, 7, 6, 3, c('white', 2));
    if (jar === 'ketchup') p.rect(4, 3, 6, 12, c('red', 2)).rect(6, 1, 2, 2, c('white', 2)).rect(4, 8, 6, 2, c('white', 2));
    return p;
  };
  book.add('doorShelf', door('none'), { solid: LEDGE, grav: GRAV.down });
  book.add('mustard', door('mustard'), { solid: LEDGE, grav: GRAV.down });
  book.add('ketchup', door('ketchup'), { solid: LEDGE, grav: GRAV.down });
  // the freezer, frosty (the ice cream floats out of it)
  const freezer = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) freezer.set(x, y, (x * 3 + y * 7) % 11 === 0 ? c('white', 2) : c('fridge', 1));
  book.add('freezer', freezer, air);
  // celery: willpower (counter 20)
  const celery = (bg: Pixels) => {
    for (const [x, d] of [[7, -1], [10, 0], [13, 1]]) {
      bg.line(x, 18, x + d * 2, 6, c('celery', 1)).line(x + 1, 18, x + 1 + d * 2, 6, c('celery', 2));
      blob(bg, x + d * 2, 5, 2.4, 2, R('green'), 2, 4);
    }
    return bg;
  };
  book.add('celery', celery(inside(7)), { effect: WILL, eamt: 1, score: 25, touch: 'cold' });
  book.add('celeryK', celery(tileWall(74)), { effect: WILL, eamt: 1, score: 25, touch: 'backsplash' });
  // a sticky note on the fridge's side: DON'T
  const note = fridgeWall.crop(0, 0, 20, 20);
  note.rect(3, 4, 14, 12, c('cheese', 3)).rect(3, 4, 14, 2, c('cheese', 2));
  micro(note, 5, 9, 'NO!', c('ink', 0));
  book.add('note', note, { solid: SOLID });
  // the cheesecake, on a porcelain plate on the top shelf, like a cursed artifact: it takes every
  // bit of willpower (seven) to face it, and then he eats it
  const cake = (f: number, eaten: boolean) => {
    const p = inside(8);
    // the aura
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + f * 0.26;
      const len = 7 + ((k + f) % 3) * 2;
      for (let t = 6; t < len; t++) p.set(10 + Math.cos(a) * t, 11 + Math.sin(a) * t * 0.8, c('aura', k % 2 ? 1 : 2));
    }
    // the plate
    p.rect(1, 16, 18, 2, c('white', 2)).rect(3, 18, 14, 1, c('white', 0));
    if (eaten) {
      for (const [x, y] of [[6, 15], [9, 14], [13, 15]]) p.set(x, y, c('crust', 2));
      p.rect(12, 15, 3, 1, c('cream', 2));
      return p;
    }
    // a wedge, side on: the graham crust, the cream, the strawberry on top
    for (let y = 8; y < 16; y++) {
      const w = Math.round(3 + (y - 8) * 1.6);
      for (let x = 10 - w; x < 10 + w; x++) p.set(x, y, y >= 14 ? c('crust', 2 + ((x + y) % 2)) : shadeAt(R('cream'), 1, 3, 0.8 - (x - 10 + w) / (w * 3), x, y));
    }
    p.line(4, 15, 16, 15, c('crust', 1));
    p.disc(10, 6, 2.2, c('berry', 2)).set(9, 5, c('berry', 3)).set(10, 3, c('celery', 1));
    if (f % 2) p.set(6, 9, c('aura', 3)).set(5, 9, c('aura', 2)).set(7, 9, c('aura', 2)).set(6, 8, c('aura', 2)).set(6, 10, c('aura', 2));
    return p;
  };
  book.add('cake0', cake(0, false), { solid: SOLID, effect: WILL, eamt: -WILL_NEEDED, score: 1000, touch: 'cakeEaten', next: 'cake1', ntime: 4 });
  book.add('cake1', cake(1, false), { solid: SOLID, effect: WILL, eamt: -WILL_NEEDED, score: 1000, touch: 'cakeEaten', next: 'cake2', ntime: 4 });
  book.add('cake2', cake(2, false), { solid: SOLID, effect: WILL, eamt: -WILL_NEEDED, score: 1000, touch: 'cakeEaten', next: 'cake0', ntime: 4 });
  book.add('cakeEaten', cake(0, true), { grav: GRAV.none });
  // the aura round it (scenery)
  const glow = (f: number) => {
    const p = inside(9);
    for (let k = 0; k < 9; k++) p.set((k * 7 + f * 5) % 20, (k * 11 + f * 3) % 20, c('aura', (k + f) % 3));
    return p;
  };
  book.add('glow0', glow(0), { ...air, next: 'glow1', ntime: 5 });
  book.add('glow1', glow(1), { ...air, next: 'glow0', ntime: 5 });

  // ---------- the dash: the hall in the dark, the lights flickering ----------
  const ceilingLight = (on: boolean) => {
    const p = crown.crop(0, 0, 20, 20);
    p.rect(6, 5, 8, 3, c('metal', 1));
    p.disc(10, 9, 3.4, on ? c('moon', 2) : c('grey', 1));
    if (on) for (const [x, y] of [[4, 12], [16, 12], [10, 15], [6, 15], [14, 15]]) p.set(x, y, c('moon', 0));
    return p;
  };
  book.add('light0', ceilingLight(true), { ...air, next: 'light1', ntime: 23 });
  book.add('light1', ceilingLight(false), { ...air, next: 'light2', ntime: 2 });
  book.add('light2', ceilingLight(true), { ...air, next: 'light3', ntime: 3 });
  book.add('light3', ceilingLight(false), { ...air, next: 'light0', ntime: 6 });
  // a kitchen chair (solid: hop over)
  const chair = base.crop(0, 0, 20, 20);
  chair.rect(14, 0, 3, 20, c('wood', 2)).rect(3, 9, 14, 3, c('wood', 3)).rect(3, 12, 2, 8, c('wood', 1)).rect(14, 12, 2, 8, c('wood', 1));
  book.add('chair', chair, { solid: SOLID });
  // the linen closet's shelf (a ledge) and towels (scenery)
  const towels = shelf(false, 81);
  for (const [x, col] of [[1, 'pink'], [7, 'pjs'], [13, 'white']] as const) towels.rect(x, 10, 6, 10, c(col, 1)).rect(x, 10, 6, 2, c(col, 2));
  book.add('towels', towels, { solid: LEDGE, grav: GRAV.down });
  // a roll of toilet paper: counter 21 (never go in without three)
  const roll = (bg: Pixels) => {
    blob(bg, 10, 12, 6, 5, R('white'), 1, 2);
    bg.disc(13, 12, 2, c('grey', 1)).disc(13, 12, 1, c('grey', 0));
    bg.rect(4, 15, 6, 4, c('white', 2));
    return bg;
  };
  book.add('roll', roll(wall(82)), { effect: ROLLS, eamt: 1, score: 50, touch: 'wall' });
  book.add('rollB', roll(base.crop(0, 0, 20, 20)), { effect: ROLLS, eamt: 1, score: 50, touch: 'base' });
  // the bathroom door: it only opens for three rolls, and slams behind him
  const bathDoor = (open: boolean) => {
    const p = wall(83);
    if (open) {
      p.rect(2, 0, 16, 20, c('tile', 1));
      for (let y = 0; y < 20; y += 5) p.rect(2, y, 16, 1, c('tile', 0));
      p.rect(2, 0, 2, 20, c('wood', 2)).rect(16, 0, 2, 20, c('wood', 2));
      return p;
    }
    p.rect(2, 0, 16, 20, c('wood', 3)).rect(4, 2, 12, 7, c('wood', 2)).rect(4, 11, 12, 7, c('wood', 2)).disc(14, 10, 1.2, c('gold', 2));
    micro(p, 5, 4, String(ROLLS_NEEDED), c('ink', 0));
    return p;
  };
  book.add('bathDoor', bathDoor(false), { solid: SOLID, effect: ROLLS, eamt: -ROLLS_NEEDED, score: 1000, touch: 'bathOpen' });
  book.add('bathOpen', bathDoor(true), { grav: GRAV.none });
  const bathTop = wall(84);
  bathTop.rect(2, 2, 16, 18, c('wood', 3)).rect(2, 2, 16, 2, c('wood', 1)).rect(4, 6, 12, 12, c('wood', 2));
  text(bathTop, 6, 8, 'WC', c('cheese', 3));
  book.add('bathTop', bathTop, air);

  // ---------- the reckoning (the bathroom, in hell) ----------
  const voidAir = (seed: number) => {
    const p = dark(seed, 2);
    const r = rng(seed + 1);
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(r() * 18);
      const y = Math.floor(r() * 18);
      p.set(x, y, c('fire', 1)).set(x + 1, y, c('sky', 4));
    }
    return p;
  };
  book.add('void', voidAir(91), air);
  // flames licking up at the bottom of the void (they burn)
  const flames = (f: number) => {
    const p = voidAir(92);
    for (let k = 0; k < 6; k++) {
      const x = 2 + k * 3;
      const h = 8 + ((k * 5 + f * 3) % 9);
      for (let y = 0; y < h; y++) p.set(x + Math.round(Math.sin((y + f * 2 + k) / 2)), 19 - y, c('fire', 3 - Math.floor((y / h) * 4)));
    }
    return p;
  };
  book.add('flames0', flames(0), { hp: -8, grav: GRAV.down, next: 'flames1', ntime: 4 });
  book.add('flames1', flames(1), { hp: -8, grav: GRAV.down, next: 'flames0', ntime: 4 });
  // the bathroom's black and white tiles, floating: the floor (solid) and tiles (ledges)
  const hellTile = (ledge: boolean) => {
    const p = ledge ? voidAir(93) : P();
    for (let y = ledge ? 2 : 0; y < (ledge ? 8 : 20); y++) for (let x = 0; x < 20; x++) p.set(x, y, (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? c('tile', 2) : c('ink', 1));
    if (ledge) p.rect(0, 8, 20, 1, c('ink', 0)).rect(2, 9, 16, 1, c('fire', 0));
    return p;
  };
  book.add('hellFloor', hellTile(false), { solid: SOLID });
  book.add('hellTile', hellTile(true), { solid: LEDGE, grav: GRAV.down });
  // smoke seeping (scenery)
  const smoke = (f: number) => {
    const p = voidAir(94);
    for (let k = 0; k < 3; k++) blob(p, 4 + k * 6 + f, 16 - k * 4 - f, 3.4, 2.4, R('smoke'), 0, 2);
    return p;
  };
  book.add('smoke0', smoke(0), { ...air, next: 'smoke1', ntime: 8 });
  book.add('smoke1', smoke(1), { ...air, next: 'smoke0', ntime: 8 });
  // the soda fountain behind the Devil: it gives birth to milkshakes
  const fountain = (f: number) => {
    const p = voidAir(95);
    p.rect(3, 6, 14, 14, c('metal', 2)).rect(3, 6, 14, 2, c('metal', 3)).rect(5, 10, 10, 6, c('berry', 1));
    micro(p, 5, 11, 'MOO', c('white', 2));
    p.rect(1, 2, 3, 6, c('metal', 1)).rect(1, 2, 7, 2, c('metal', 1)).set(2, 9 + f, c('berry', 3));
    return p;
  };
  book.add('fountain', fountain(0), { solid: SOLID, birthMon: MON.shake, birthTime: SHAKE_EVERY });
  // almond milk and oat milk: splashes for the throw (the Space sequence's own counter); they grow back
  const carton = (bg: Pixels, label: string, col: string) => {
    bg.rect(5, 6, 10, 13, c('white', 2)).rect(5, 6, 10, 1, c('white', 1));
    for (let y = 2; y < 6; y++) bg.rect(5 + (6 - y), y, 10 - (6 - y) * 2, 1, c('white', 1));
    bg.rect(5, 10, 10, 5, c(col, 2));
    micro(bg, 6, 11, label, c('white', 2));
    return bg;
  };
  book.add('almond', carton(voidAir(98), 'ALM', 'crust'), { ...air, effect: SEQ.speak, eamt: MILK_CARTON, score: 50, touch: 'almondGone' });
  book.add('almondGone', voidAir(98), { ...air, next: 'almond', ntime: MILK_REGROW });
  book.add('oat', carton(voidAir(99), 'OAT', 'cheese'), { ...air, effect: SEQ.speak, eamt: MILK_CARTON, score: 50, touch: 'oatGone' });
  book.add('oatGone', voidAir(99), { ...air, next: 'oat', ntime: MILK_REGROW });
  // Lactaid caplets: dignity back
  const lactaid = voidAir(96);
  lactaid.rect(4, 7, 12, 10, c('white', 2)).rect(4, 7, 12, 3, c('pjs', 2));
  micro(lactaid, 5, 11, 'LAC', c('pjs', 1));
  book.add('lactaid', lactaid, { hp: 30, score: 100, touch: 'void' });
  // the porcelain throne: it takes the Devil's last straw, and flushes
  const throne = (open: boolean) => {
    const p = voidAir(97);
    blob(p, 10, 16, 8, 4, R('tile'), 0, 2);
    p.rect(4, 3, 12, 8, c('tile', 2)).rect(4, 3, 12, 1, c('tile', 1)).rect(6, 11, 8, 5, c('tile', 1));
    if (open) for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y) % 5 === 0) p.set(x, y, c('aura', 2));
    else micro(p, 6, 5, '1', c('gold', 1));
    return p;
  };
  book.add('throne', throne(false), { solid: SOLID, effect: STRAW, eamt: -1, score: 5000, touch: 'throneOpen' });
  book.add('throneOpen', throne(true), { grav: GRAV.none });
  return book;
}
