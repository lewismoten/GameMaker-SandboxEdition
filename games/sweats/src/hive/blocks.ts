// HIVE.BBL: The Hive, Oakland, a coffee house with a castle for a front (lightly fictionalized
// from Lewis's memories of the Oakland Beehive; drawn here from scratch). Outside: the avenue at
// night, a street lamp, the castle front of grey stone with its battlements, a little turret and
// the arched door. Inside: the counter (the espresso machine steaming, the pastry case, the
// register that sells a cup of coffee for five tips), the little movie theater past the counter
// (seats up the rake, the screen flickering an old film), the stairs, the tall room with its
// windows, tables and couches, and upstairs the seating and the stage: boards, footlights, the
// microphone, the velvet curtain that only lets the poet through with a cup of coffee in hand.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import type { Pal, Ramp } from '../art/pal';
import { AIR, BlockBook, GRAV, LEDGE, SOLID, drawBill, loot } from '../common/blocks';
import { addPicture } from '../common/picture';
import { chezSide } from '../../../kit/chez';
import { COFFEE, COFFEE_PRICE, MONEY } from '../ids';
import { HIVE_MON } from './ids';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { lewieCameo } from '../../../kit/cameos';

export const HIVE_RAMPS: Ramp[] = [
  ['stone', 5, [60, 58, 64], [196, 190, 180], [124, 120, 120]],
  ['brick', 4, [70, 26, 20], [190, 90, 66]],
  ['night', 4, [6, 8, 26], [56, 66, 120]],
  ['lamp', 3, [255, 190, 90], [255, 250, 210], undefined, true],
  ['amber', 4, [120, 60, 10], [255, 214, 110], undefined, true],
  ['plaster', 4, [120, 96, 80], [236, 216, 186]],
  ['chalk', 3, [20, 44, 30], [90, 130, 100]],
  ['screen', 3, [150, 160, 170], [255, 255, 255], undefined, true],
  ['seat', 3, [80, 10, 20], [190, 50, 60]],
  ['glass', 3, [60, 90, 120], [170, 210, 230]],
  ['daylightHive', 2, [110, 150, 200], [190, 215, 245]],
];

export function buildHiveBlocks(book: BlockBook, pal: Pal): void {
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);

  // ---------- outside: the avenue at night ----------
  const night = (seed: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('night', 1));
    const r = rng(seed);
    for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('white', r() < 0.5 ? 1 : 2));
    return p;
  };
  book.add('night', night(1), AIR);
  book.add('night2', night(2), AIR);
  // the city behind: dark buildings with a few lit windows
  const city = (seed: number, top: number) => {
    const p = night(seed + 10);
    p.rect(0, top, 20, 20 - top, c('night', 0));
    const r = rng(seed);
    for (let y = top + 2; y < 19; y += 4) for (let x = 1; x < 19; x += 4) if (r() < 0.35) p.rect(x, y, 2, 2, c('amber', r() < 0.5 ? 1 : 2));
    return p;
  };
  book.add('city', city(3, 6), AIR);
  book.add('city2', city(4, 12), AIR);
  book.add('cityLow', city(5, 0), AIR);
  // the sidewalk and the curb
  const sidewalk = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) sidewalk.set(x, y, shadeAt(R('stone'), 1, 2, 0.6 - y / 40, x, y));
  sidewalk.rect(0, 0, 20, 2, c('stone', 3)).rect(19, 0, 1, 20, c('stone', 0));
  book.add('sidewalk', sidewalk, { solid: SOLID });
  // THE CHEZ, Lewis's red CitiCar, parked at the curb (scenery)
  {
    const car = new Pixels(40, 20, 255);
    chezSide(
      car,
      0,
      1,
      {
        body: [c('red', 1), c('red', 2), c('red', 3)],
        trim: c('red', 0),
        glass: [c('night', 0), c('glass', 2)],
        roof: c('ink', 0),
        tire: c('ink', 0),
        hub: c('grey', 3),
        stripe: c('grey', 0),
        pin: c('white', 2),
        rim: c('white', 2),
        bumper: c('ink', 1),
        lamp: c('lamp', 2),
        tail: c('red', 3),
        outline: c('ink', 0),
      },
      'right',
    );
    addPicture(book, 'chez', car, book.pics.get('cityLow')!, () => AIR);
  }
  // the street lamp: its post and its glowing lantern
  const post = night(6);
  post.rect(9, 0, 3, 20, c('ink', 1)).rect(10, 0, 1, 20, c('grey', 1));
  book.add('post', post, AIR);
  const lantern = night(7);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x - 10) ** 2 + (y - 10) ** 2 < 90 && (x + y) % 2 === 0) lantern.set(x, y, c('lamp', 0));
  lantern
    .rect(6, 4, 9, 10, c('ink', 1))
    .rect(7, 5, 7, 8, c('lamp', 1))
    .rect(9, 6, 3, 6, c('lamp', 2))
    .rect(5, 3, 11, 2, c('ink', 1))
    .rect(9, 14, 3, 6, c('ink', 1));
  book.add('lantern', lantern, AIR);
  // a bench (a ledge) and a newspaper box (solid)
  const bench = night(8);
  bench
    .rect(1, 10, 18, 3, c('wood', 2))
    .rect(1, 10, 18, 1, c('wood', 4))
    .rect(2, 13, 2, 7, c('ink', 1))
    .rect(16, 13, 2, 7, c('ink', 1))
    .rect(1, 4, 18, 2, c('wood', 2));
  book.add('bench', bench, { solid: LEDGE, grav: GRAV.down });
  const news = night(9);
  news.rect(2, 4, 16, 16, c('red', 1)).rect(4, 5, 12, 6, c('glass', 1)).rect(5, 6, 10, 4, c('white', 1));
  micro(news, 3, 13, 'NEWS', c('white', 2));
  book.add('news', news, { solid: SOLID });

  // ---------- the castle front ----------
  /** Grey stone in courses, each block of stone its own shade. */
  const stone = (seed: number) => {
    const p = P();
    const r = rng(seed);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 0 : 7;
      for (let x0 = -off; x0 < 20; x0 += 14) {
        const k = 1 + Math.floor(r() * 3);
        for (let y = row * 5; y < row * 5 + 5; y++)
          for (let x = Math.max(0, x0); x < Math.min(20, x0 + 14); x++) p.set(x, y, shadeAt(R('stone'), k - 1, k, 0.7 - (y - row * 5) / 10, x, y));
        p.rect(Math.max(0, x0), row * 5, 1, 5, c('stone', 0));
      }
      p.rect(0, row * 5 + 4, 20, 1, c('stone', 0));
    }
    return p;
  };
  book.add('stone', stone(21), { solid: SOLID });
  book.add('stone2', stone(22), { solid: SOLID });
  // the battlements: merlons against the night sky
  const merlon = night(23);
  merlon.blit(stone(24).crop(0, 0, 20, 20), 0, 0);
  merlon
    .rect(0, 0, 4, 8, c('night', 1))
    .rect(12, 0, 8, 8, c('night', 1))
    .rect(4, 0, 8, 1, c('stone', 4))
    .rect(0, 8, 4, 1, c('stone', 4))
    .rect(12, 8, 8, 1, c('stone', 4));
  book.add('merlon', merlon, { solid: SOLID });
  // an arrow-slit window with warm light inside
  const slit = stone(25);
  slit.rect(8, 3, 4, 13, c('stone', 0)).rect(9, 4, 2, 11, c('amber', 2)).rect(7, 8, 6, 2, c('stone', 0)).rect(8, 8, 4, 1, c('amber', 1));
  book.add('slit', slit, { solid: SOLID });
  // the same stone as the castle's front wall seen from the avenue (scenery: walk along it)
  book.add('stoneBack', stone(29), AIR);
  book.add('stoneBack2', stone(30), AIR);
  const lit = stone(31);
  for (let y = 3; y < 18; y++) for (let x = 5; x < 15; x++) if ((x - 10) ** 2 / 25 + (y - 8) ** 2 / 36 <= 1 || y > 8) lit.set(x, y, c('amber', y < 8 ? 1 : 2));
  lit.rect(9, 3, 2, 15, c('stone', 0)).rect(5, 11, 10, 1, c('stone', 0)).rect(4, 17, 12, 2, c('stone', 4));
  book.add('castleWindow', lit, AIR);
  const merlonBack = night(32);
  merlonBack.blit(stone(33).crop(0, 0, 20, 20), 0, 8);
  merlonBack.rect(0, 8, 4, 8, c('night', 1)).rect(12, 8, 8, 8, c('night', 1)).rect(4, 8, 8, 1, c('stone', 4));
  book.add('merlonBack', merlonBack, AIR);
  // the turret: a round tower with a pointed slate cap and a pennant
  const turret = (part: 'cap' | 'top' | 'body') => {
    const p = night(26);
    if (part === 'cap') {
      for (let y = 4; y < 20; y++) {
        const half = (y - 4) * 0.55;
        for (let x = Math.round(10 - half); x <= 10 + half; x++) p.set(x, y, shadeAt(R('night'), 1, 3, (x - 10 + half) / (2 * half + 1), x, y));
      }
      p.rect(10, 0, 1, 5, c('ink', 1)).rect(11, 0, 5, 3, c('velvet', 3)).set(15, 1, c('velvet', 2));
    } else {
      for (let y = 0; y < 20; y++) for (let x = 2; x < 18; x++) p.set(x, y, shadeAt(R('stone'), 1, 4, 1 - Math.abs(x - 7) / 9, x, y));
      for (let y = 4; y < 20; y += 5) p.rect(2, y, 16, 1, c('stone', 0));
      if (part === 'top') p.rect(1, 0, 18, 3, c('stone', 3)).rect(1, 3, 18, 1, c('stone', 0));
      else p.rect(8, 7, 3, 8, c('amber', 2)).rect(8, 7, 3, 1, c('stone', 0));
    }
    return p;
  };
  book.add('turretCap', turret('cap'), AIR);
  book.add('turretTop', turret('top'), AIR);
  book.add('turret', turret('body'), AIR);
  // the arched door, standing open onto the warm light inside
  const arch = (top: boolean) => {
    const p = stone(27);
    for (let y = 0; y < 20; y++)
      for (let x = 2; x < 18; x++) {
        const inside = top ? (x - 10) ** 2 / 64 + (y - 20) ** 2 / 196 <= 1 : true;
        if (inside) p.set(x, y, c('amber', y < 6 && top ? 1 : 2));
      }
    if (top) for (let a = 0; a < Math.PI; a += 0.05) p.set(10 + Math.cos(a) * 9, 20 - Math.sin(a) * 15, c('stone', 4));
    else p.rect(2, 0, 1, 20, c('stone', 4)).rect(17, 0, 1, 20, c('stone', 4)).rect(3, 0, 2, 20, c('wood', 1));
    return p;
  };
  book.add('archTop', arch(true), { solid: SOLID });
  book.add('arch', arch(false), AIR);
  // the sign over the door: a hexagon of honeycomb and the name
  {
    const sign = new Pixels(40, 20, 255);
    sign.rect(2, 2, 36, 16, c('wood', 1)).rect(3, 3, 34, 14, c('amber', 1)).frame(2, 2, 36, 16, c('ink', 0));
    for (const [hx, hy] of [
      [8, 7],
      [12, 10],
      [8, 13],
    ])
      for (let k = 0; k < 6; k++)
        sign.line(
          hx + Math.cos((k * Math.PI) / 3) * 2.5,
          hy + Math.sin((k * Math.PI) / 3) * 2.5,
          hx + Math.cos(((k + 1) * Math.PI) / 3) * 2.5,
          hy + Math.sin(((k + 1) * Math.PI) / 3) * 2.5,
          c('amber', 3),
        );
    micro(sign, 17, 5, 'THE', c('ink', 0));
    micro(sign, 17, 11, 'HIVE', c('ink', 0));
    addPicture(book, 'sign', sign, stone(28), () => ({ solid: SOLID }));
  }

  // ---------- inside ----------
  /** Warm plaster walls with a wainscot at the bottom. */
  const wall = (seed: number, wainscot = true) => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('plaster', r() < 0.08 ? 1 : 2));
    if (wainscot) p.rect(0, 12, 20, 8, c('wood', 1)).rect(0, 12, 20, 1, c('wood', 3)).rect(9, 13, 1, 7, c('wood', 0));
    return p;
  };
  book.add('wall', wall(31), AIR);
  book.add('wallHi', wall(32, false), AIR);
  // the exposed brick of the old building
  const brick = (seed: number) => {
    const p = P();
    const r = rng(seed);
    for (let row = 0; row < 5; row++)
      for (let x0 = row % 2 ? -5 : 0; x0 < 20; x0 += 10) {
        const k = 1 + Math.floor(r() * 2);
        p.rect(Math.max(0, x0), row * 4, Math.min(9, 9 + x0), 3, c('brick', k));
        p.rect(Math.max(0, x0), row * 4 + 3, 10, 1, c('plaster', 0));
      }
    return p;
  };
  book.add('brickWall', brick(33), AIR);
  book.add('brick', brick(34), { solid: SOLID });
  // the floors: wide old boards; the ceiling beams
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
  book.add('floor', boards(true, 35), { solid: SOLID });
  book.add('under', boards(false, 36), { solid: SOLID });
  const beam = boards(false, 37);
  beam.rect(0, 16, 20, 4, c('wood', 0));
  book.add('beam', beam, { solid: SOLID });
  // a hanging lamp (amber glass), and a framed poster
  const pendant = wall(38, false);
  pendant.rect(9, 0, 1, 8, c('ink', 1));
  blob(pendant, 9.5, 11, 5, 3.5, R('amber'), 1, 3);
  pendant.rect(4, 11, 12, 1, c('amber', 0));
  for (let y = 15; y < 20; y++) for (let x = 3; x < 17; x++) if ((x + y) % 3 === 0) pendant.set(x, y, c('amber', 3));
  book.add('pendant', pendant, AIR);
  const poster = (seed: number, title: string) => {
    const p = wall(seed);
    p.rect(3, 1, 14, 18, c('ink', 1)).rect(4, 2, 12, 16, c('velvet', 1));
    blob(p, 10, 8, 3, 3, R('spot'), 0, 2);
    micro(p, 10 - Math.floor((title.length * 4 - 1) / 2), 13, title, c('gold', 3));
    return p;
  };
  book.add('poster', poster(39, 'POEMS'), AIR);
  book.add('poster2', poster(40, 'FILM'), AIR);
  // tall windows of the front room, the night outside and the avenue's lights
  const window = (top: boolean) => {
    const p = wall(41, !top);
    p.rect(2, top ? 2 : 0, 16, top ? 18 : 12, c('wood', 2)).rect(4, top ? 4 : 0, 12, top ? 16 : 10, c('night', 1));
    p.rect(9, top ? 4 : 0, 2, top ? 16 : 10, c('wood', 2));
    if (top) p.disc(7, 8, 1, c('lamp', 1)).disc(13, 12, 1, c('amber', 2));
    return p;
  };
  book.add('windowTop', window(true), AIR);
  book.add('window', window(false), AIR);

  // ---------- the counter ----------
  // the counter's front (scenery behind the walkway: the barista works behind it)
  const counterFront = wall(42);
  counterFront.rect(0, 6, 20, 14, c('wood', 2)).rect(0, 6, 20, 2, c('wood', 4)).rect(0, 8, 20, 1, c('wood', 0));
  for (let x = 3; x < 20; x += 6) counterFront.rect(x, 10, 3, 8, c('wood', 1));
  book.add('counter', counterFront, AIR);
  // the espresso machine (chrome, two blocks wide), steaming by turns
  for (const f of [0, 1]) {
    const pic = new Pixels(40, 20, 255);
    pic.rect(4, 6, 32, 14, c('metal', 1)).rect(5, 7, 30, 4, c('metal', 2)).rect(4, 6, 32, 1, c('metal', 2));
    for (const x of [10, 26])
      pic
        .rect(x, 11, 4, 3, c('ink', 1))
        .rect(x, 16, 4, 3, c('white', 2))
        .rect(x + 1, 16, 2, 1, c('coffee', 2));
    pic.disc(20, 9, 2, c('red', 2)).rect(18, 12, 4, 2, c('gold', 2));
    for (let k = 0; k < 4; k++) pic.set(36 + (k % 2) + f, 5 - k * 1 - f, c('white', 1)).set(37 - (k % 2) + f, 3 - k - f, c('white', 0));
    addPicture(book, `espresso${f}`, pic, counterFront, (col) => ({ ...AIR, next: `espresso${1 - f}.${col}.0`, ntime: 8 }));
  }
  // the pastry case: pies, a cheesecake, scones
  const pastry = counterFront.crop(0, 0, 20, 20);
  pastry.rect(1, 2, 18, 10, c('glass', 2)).frame(1, 2, 18, 10, c('metal', 1));
  blob(pastry, 6, 9, 3.5, 2, R('coffee'), 2, 3);
  pastry.rect(11, 7, 6, 3, c('white', 2)).rect(11, 7, 6, 1, c('red', 2));
  pastry.rect(1, 6, 18, 1, c('metal', 2));
  book.add('pastry', pastry, AIR);
  // the register: walk into it with five tips and it rings up a cup; walk into the cup to take it
  const register = (state: 'ready' | 'cup' | 'done') => {
    const p = counterFront.crop(0, 0, 20, 20);
    p.rect(3, 1, 14, 9, c('grey', 1)).rect(4, 2, 12, 3, c('chalk', 1)).rect(3, 9, 14, 2, c('grey', 0));
    micro(p, 5, 3, state === 'ready' ? '$5' : 'TY', c('lamp', 1));
    if (state === 'cup') {
      p.rect(6, 12, 8, 8, c('white', 1)).rect(7, 12, 6, 7, c('white', 2)).rect(7, 12, 6, 1, c('coffee', 2)).rect(7, 15, 6, 2, c('coffee', 1));
      p.set(8, 10, c('white', 0)).set(9, 9, c('white', 0)).set(11, 10, c('white', 0));
    }
    return p;
  };
  book.add('registerDone', register('done'), AIR);
  book.add('cup', register('cup'), { ...AIR, effect: COFFEE, eamt: 1, score: 10, touch: 'registerDone' });
  book.add('register', register('ready'), { solid: SOLID, effect: MONEY, eamt: -COFFEE_PRICE, touch: 'cup' });
  // the tip jar on the counter: a dollar for the poet who reads it right (once a visit)
  const jar = counterFront.crop(0, 0, 20, 20);
  jar.rect(6, 0, 8, 7, c('glass', 1)).rect(7, 1, 6, 5, c('glass', 2)).rect(7, 3, 3, 2, c('green', 2)).set(11, 4, c('gold', 3));
  micro(jar, 7, 9, 'TIP', c('wood', 4));
  book.add('jarDone', jar.crop(0, 0, 20, 20).rect(7, 3, 6, 2, c('glass', 2)), AIR);
  book.add('jar', jar, { ...AIR, effect: MONEY, eamt: 2, score: 10, touch: 'jarDone' });
  // the chalkboard menu over the counter
  const menu = wall(43, false);
  menu.rect(1, 2, 18, 16, c('wood', 1)).rect(2, 3, 16, 14, c('chalk', 0));
  micro(menu, 3, 4, 'JAVA', c('white', 1));
  micro(menu, 3, 10, 'BREW', c('white', 0));
  book.add('menu', menu, AIR);
  const menu2 = wall(44, false);
  menu2.rect(1, 2, 18, 16, c('wood', 1)).rect(2, 3, 16, 14, c('chalk', 0));
  micro(menu2, 3, 4, 'CHAI', c('white', 1));
  micro(menu2, 3, 10, 'PIE', c('pink', 2));
  book.add('menu2', menu2, AIR);

  // ---------- the little movie theater ----------
  const dark = (seed: number) => {
    const p = P();
    const r = rng(seed);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('night', r() < 0.1 ? 1 : 0));
    return p;
  };
  book.add('dark', dark(51), AIR);
  // the screen: three blocks wide, two high, an old film flickering (two pictures by turns)
  for (const f of [0, 1]) {
    const pic = new Pixels(60, 40, 255);
    pic.rect(2, 2, 56, 36, c('screen', 1));
    const r = rng(52 + f);
    for (let i = 0; i < 40; i++) pic.set(2 + Math.floor(r() * 56), 2 + Math.floor(r() * 36), c('screen', 0));
    // the film: a goat on a hill under the moon, then the goat turning to look at you
    pic.disc(46, 10, 4, c('screen', 2));
    pic.rect(2, 30, 56, 8, c('screen', 0));
    blob(pic, 24, 26, 7, 4, R('grey'), 1, 2);
    blob(pic, f ? 30 : 16, 22, 3, 3, R('grey'), 1, 2);
    pic.set(f ? 30 : 15, 21, c('ink', 0));
    for (const x of [19, 22, 26, 29]) pic.rect(x, 29, 1, 4, c('grey', 0));
    pic.frame(1, 1, 58, 38, c('ink', 1));
    addPicture(book, `film${f}`, pic, dark(54), (col, row) => ({ ...AIR, next: `film${1 - f}.${col}.${row}`, ntime: 14 }));
  }
  // the projector's beam (scenery) and the seats up the rake (ledges)
  const beamLight = dark(55);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y * 2) % 5 === 0 && y > x / 2 - 4) beamLight.set(x, y, c('screen', 0));
  book.add('projBeam', beamLight, AIR);
  const seat = dark(56);
  seat
    .rect(2, 6, 16, 8, c('seat', 1))
    .rect(2, 6, 16, 2, c('seat', 2))
    .rect(2, 14, 3, 6, c('ink', 1))
    .rect(15, 14, 3, 6, c('ink', 1))
    .rect(2, 12, 16, 2, c('seat', 0));
  book.add('seat', seat, { solid: LEDGE, grav: GRAV.down });
  // a moviegoer's seat: every so often a "SHHH!" rises out of it
  book.add('seatShush', seat.crop(0, 0, 20, 20).rect(8, 2, 4, 4, c('skin', 1)).rect(7, 1, 6, 2, c('hair', 1)), {
    solid: LEDGE,
    grav: GRAV.down,
    birthMon: HIVE_MON.shush,
    birthTime: 64,
  });
  const riser = dark(57);
  riser.rect(0, 0, 20, 3, c('seat', 0)).rect(0, 3, 20, 17, c('night', 1));
  book.add('riser', riser, { solid: SOLID });
  // the theater's door frame (scenery)
  const doorway = wall(58);
  doorway.rect(3, 0, 14, 20, c('night', 0)).rect(2, 0, 2, 20, c('wood', 3)).rect(16, 0, 2, 20, c('wood', 3));
  book.add('doorway', doorway, AIR);
  const doorTop = wall(59, false);
  doorTop.rect(2, 8, 16, 12, c('night', 0)).rect(2, 6, 16, 2, c('wood', 3)).rect(2, 8, 2, 12, c('wood', 3)).rect(16, 8, 2, 12, c('wood', 3));
  micro(doorTop, 4, 1, 'FILM', c('red', 3));
  book.add('doorTop', doorTop, AIR);

  // ---------- the front room ----------
  // a cafe table (a ledge) and a stool; a couch; a bookshelf
  const table = wall(61);
  table.rect(1, 8, 18, 2, c('wood', 4)).rect(9, 10, 2, 10, c('ink', 1)).rect(5, 18, 10, 2, c('ink', 1));
  table.rect(4, 4, 4, 4, c('white', 2)).rect(4, 4, 4, 1, c('coffee', 2));
  book.add('table', table, { solid: LEDGE, grav: GRAV.down });
  const couch = (part: 'seat' | 'arm') => {
    const p = wall(62);
    if (part === 'arm') blob(p.rect(2, 6, 16, 14, c('velvet', 1)), 10, 7, 8, 3, R('velvet'), 1, 3);
    else p.rect(0, 4, 20, 16, c('velvet', 1)).rect(0, 10, 20, 4, c('velvet', 3)).rect(0, 4, 20, 2, c('velvet', 2)).rect(9, 10, 1, 4, c('velvet', 0));
    return p;
  };
  book.add('couchArm', couch('arm'), { solid: SOLID });
  book.add('couch', couch('seat'), { solid: LEDGE, grav: GRAV.down });
  const shelf = (seed: number) => {
    const p = wall(seed, false);
    p.rect(1, 0, 18, 20, c('wood', 1));
    const r = rng(seed);
    for (const y of [1, 11]) {
      for (let x = 2; x < 18; x += 2) p.rect(x, y, 2, 8, c(['red', 'navy', 'green', 'gold', 'velvet', 'teal'][Math.floor(r() * 6)], 1 + Math.floor(r() * 2)));
      p.rect(1, y + 8, 18, 1, c('wood', 3));
    }
    return p;
  };
  book.add('books', shelf(63), AIR);
  book.add('books2', shelf(64), AIR);
  // a potted fern on the floor, a painting of goats (the third from the left is missing), a playbill for the open mic
  const plant = wall(67);
  plant.rect(6, 13, 8, 7, c('red', 1)).rect(5, 12, 10, 2, c('red', 2));
  for (let k = 0; k < 9; k++) plant.line(10, 13, 10 + Math.cos(-0.3 - k * 0.32) * 9, 13 + Math.sin(-0.3 - k * 0.32) * 10, c('green', 1 + (k % 3)));
  book.add('fern', plant, AIR);
  const goats = wall(68, false);
  goats.rect(1, 4, 18, 12, c('gold', 1)).rect(2, 5, 16, 10, c('green', 1)).rect(2, 5, 16, 5, c('daylightHive', 1));
  for (const x of [4, 8, 16]) blob(goats, x, 11, 1.6, 1.2, R('white'), 1, 2);
  book.add('goatArt', goats, AIR);
  const bill = wall(69, false);
  bill.rect(3, 1, 14, 18, c('white', 2)).rect(3, 1, 14, 4, c('velvet', 2));
  micro(bill, 4, 2, 'OPEN', c('gold', 3));
  micro(bill, 4, 8, 'MIC', c('ink', 0));
  micro(bill, 4, 13, 'TUES', c('velvet', 1));
  book.add('playbill', bill, AIR);
  // the stairs: open treads on a stringer (ledges), one up per column
  const stair = wall(65, false);
  stair.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
  stair.line(0, 19, 19, 0, c('wood', 1)).line(1, 19, 19, 1, c('wood', 1)).line(2, 19, 19, 2, c('wood', 0));
  book.add('stair', stair, { solid: LEDGE, grav: GRAV.down });
  // the banister post at the top
  const newel = wall(66, false);
  newel.rect(8, 2, 4, 18, c('wood', 3)).rect(7, 0, 6, 3, c('wood', 4));
  book.add('newel', newel, AIR);

  // ---------- upstairs: the stage ----------
  // the stage's boards (solid), with the footlights' glow
  const boardsTop = boards(true, 71);
  boardsTop.rect(0, 0, 20, 2, c('wood', 4));
  book.add('stage', boardsTop, { solid: SOLID });
  // the back wall: dark velvet drapes, folds catching the light
  const drape = (seed: number, lit: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('velvet'), 0, lit ? 3 : 2, 0.5 + 0.5 * Math.sin((x + seed) / 2.2), x, y));
    return p;
  };
  book.add('drape', drape(0, false), AIR);
  book.add('drapeLit', drape(3, true), AIR);
  // the open-mic sign-up sheet on its easel; the "OPEN MIC" chalkboard
  const easel = drape(5, false);
  easel.line(5, 19, 9, 2, c('wood', 3)).line(15, 19, 11, 2, c('wood', 3)).rect(4, 4, 12, 10, c('white', 2));
  for (let y = 6; y < 13; y += 2) easel.rect(6, y, 8, 1, c('ink', 1));
  book.add('easel', easel, AIR);
  const board = drape(6, false);
  board.rect(1, 3, 18, 14, c('wood', 1)).rect(2, 4, 16, 12, c('chalk', 0));
  micro(board, 3, 5, 'OPEN', c('white', 2));
  micro(board, 3, 11, 'MIC!', c('pink', 2));
  book.add('openMic', board, AIR);
  // the microphone on its stand in the spotlight; the spotlights up in the rafters
  const mic = drape(7, true);
  for (let y = 0; y < 20; y++) {
    const half = 2 + y * 0.4;
    for (let x = Math.round(10 - half); x <= 10 + half; x++) if ((x + y) % 2 === 0) mic.set(x, y, c('spot', 0));
  }
  mic.rect(9, 7, 2, 12, c('ink', 1)).rect(6, 18, 8, 2, c('ink', 1)).rect(8, 3, 4, 5, c('metal', 2)).rect(9, 4, 2, 3, c('metal', 1));
  book.add('mic', mic, AIR);
  const can = beam.crop(0, 0, 20, 20);
  can.rect(5, 10, 10, 8, c('ink', 1)).rect(6, 17, 8, 3, c('spot', 2));
  book.add('spotCan', can, { solid: SOLID });
  // the curtain: it takes a cup of coffee and opens (the scene's link is behind it)
  const curtain = (open: boolean) => {
    const p = drape(9, true);
    if (open) {
      p.rect(5, 0, 10, 20, c('night', 0));
      for (let y = 0; y < 20; y++) p.rect(0, y, 5 - Math.floor(y / 6), 1, c('velvet', 3)).rect(15 + Math.floor(y / 6), y, 5, 1, c('velvet', 3));
      p.rect(8, 8, 4, 4, c('spot', 2));
    } else {
      p.rect(0, 0, 20, 2, c('gold', 2)).rect(0, 18, 20, 2, c('gold', 1));
      p.rect(7, 8, 6, 6, c('white', 2)).rect(8, 8, 4, 1, c('coffee', 2)).rect(13, 9, 1, 3, c('white', 1));
    }
    return p;
  };
  book.add('curtainOpen', curtain(true), { grav: GRAV.none });
  book.add('curtain', curtain(false), { solid: SOLID, effect: COFFEE, eamt: -1, score: 100, touch: 'curtainOpen' });
  // the footlights along the stage's edge
  const foot = boards(true, 72);
  foot.rect(0, 0, 20, 3, c('ink', 1));
  for (const x of [3, 10, 17]) foot.disc(x, 1, 1.4, c('spot', 2));
  book.add('footlights', foot, { solid: SOLID });

  // ---------- the tips about the place ----------
  for (const bg of ['night', 'wall', 'wallHi', 'dark', 'drape', 'brickWall']) loot(book, pal, bg);
  book.add('bill@stoneBack2', drawBill(book.pics.get('stoneBack2')!.crop(0, 0, 20, 20), pal), {
    ...AIR,
    effect: MONEY,
    eamt: 5,
    score: 50,
    touch: 'stoneBack2',
  });

  // ---------- friends from the other games (added last, so every other block keeps its number) ----------
  // the tin heart, tucked on the bottom shelf of the bookcase in the front room (points: the
  // crowd's cheer, never a line of a monologue)
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(
      `tinHeart${k || ''}`,
      drawTinHeart(
        book.pics.get('books2')!.crop(0, 0, 20, 20),
        { ink: c('ink', 0), tin: [c('metal', 0), c('metal', 1), c('metal', 2)], white: c('white', 2), dark: c('grey', 0) },
        k,
      ),
      {
        ...AIR,
        score: 100,
        touch: 'books2',
        next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
        ntime: k ? 2 : 50,
      },
    );
  // Teenage Lewie from Snowbound in the audience upstairs, red knit hat and all (scenery)
  const lewie = book.pics.get('wallHi')!.crop(0, 0, 20, 20);
  const kid = lewieCameo(pal.pal, 'down0');
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (kid.get(x, y) !== 255) lewie.set(x, y, kid.get(x, y));
  book.add('lewie', lewie, AIR);
}
