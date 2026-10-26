// YARD.BBL: out the open window, the backyard, and the wild beyond it where the nature
// documentary is filming. Open sky costs a sugar the first time Carl flies into it (common.ts
// fresh()), the grass gives a lick of sugar now and then, and the gusts blow him to the left
// while they last (next/ntime turns them on and off). The attributes:
//   - pie and lemonade are a snack and a sip; nectar in a flower heals;
//   - the wasp nest gives birth to wasps, the flytrap, the cactus, the spider's web and the pond
//     hurt;
//   - hourglasses are two hours each (counter 23); the documentary's big clock only breaks for
//     twenty-four ("some say flies live 24 hours... Carl has broken time");
//   - the tall grass at the end of the yard is the way into the wild.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import type { Pal } from '../art/pal';
import { HOURS, HOURS_NEEDED, MON, SNACKS } from '../ids';
import { AIR, BlockBook, GRAV, LEDGE, LICK_EVERY, SOLID, SUGAR, SUGAR_CUBE, fresh, sugarCube } from './common';
import { cut } from './house';

/** Ticks between wasps from the nest. */
const WASP_EVERY = 90;
/** Ticks a gust blows, and the calm between gusts. */
const GUST_ON = 8;
const GUST_OFF = 30;

export function buildYard(pal: Pal): BlockBook {
  const book = new BlockBook();
  const { r: R, c } = pal;
  const P = () => new Pixels(20, 20);

  // ---------- sky ----------
  const sky = (seed: number, k = 3) => {
    const p = P().rect(0, 0, 20, 20, c('sky', k));
    const r = rng(seed);
    for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('sky', k + (r() < 0.5 ? 1 : -1)));
    return p;
  };
  book.add('sky', sky(1), fresh('skyFlown'));
  book.add('skyHi', sky(2, 2), fresh('skyHiFlown'));
  const cloud = sky(3);
  blob(cloud, 8, 11, 7, 4, R('white'), 2, 3);
  blob(cloud, 14, 9, 5, 4, R('white'), 2, 3);
  book.add('cloud', cloud, AIR);
  // gusts: wind blowing to the left, then calm (the calm frame looks like plain sky)
  const gust = (f: number) => {
    const p = sky(4);
    if (f)
      for (let k = 0; k < 3; k++)
        for (let x = 0; x < 20; x++) if ((x + k * 7) % 20 < 11) p.set(x, 4 + k * 6 + Math.round(Math.sin((x + k * 3) / 3)), c('white', 2 + (x % 2)));
    return p;
  };
  book.add('calm', gust(0), { grav: GRAV.none, next: 'gust', ntime: GUST_OFF });
  book.add('gust', gust(1), { grav: GRAV.left, next: 'calm', ntime: GUST_ON });

  // ---------- the house, from outside ----------
  const sidingAt = (p: Pixels, x0 = 0, y0 = 0, w = 20, h = 20) => {
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) p.set(x, y, ((y % 20) + 20) % 5 === 4 ? c('white', 0) : shadeAt(R('white'), 1, 2, (((y % 5) + 5) % 5) / 4, x, y));
    return p;
  };
  book.add('siding', sidingAt(P()), AIR);
  // the same, solid: the edges of the yard (Carl can't fly round the house or off into the sky)
  book.add('sidingWall', sidingAt(P()), { solid: SOLID });
  book.add('skyWall', sky(5, 2), { solid: SOLID });
  const eave = P().rect(0, 0, 20, 20, c('grey', 1));
  for (let x = 0; x < 20; x += 5) eave.line(x, 0, x + 4, 10, c('grey', 0));
  eave.rect(0, 12, 20, 5, c('white', 3)).rect(0, 17, 20, 3, c('steel', 1));
  book.add('eave', eave, { solid: SOLID });
  book.add('eaveWall', eave.crop(0, 0, 20, 20), { solid: SOLID });
  // the bedroom window, open, the man leaning out and begging (his hand is a monster)
  const open = new Pixels(40, 40);
  sidingAt(open, 0, 0, 40, 40);
  open.rect(4, 2, 32, 32, c('white', 3)).rect(7, 5, 26, 26, c('ink', 1));
  for (let y = 5; y < 31; y++) for (let x = 7; x < 33; x++) if ((x * 3 + y * 5) % 23 === 0) open.set(x, y, c('ink', 0));
  open.rect(7, 5, 26, 10, c('steel', 0)).rect(7, 14, 26, 1, c('white', 3));
  blob(open, 20, 26, 9, 6, R('shirt'), 1, 3);
  blob(open, 20, 19, 6, 6, R('skin'), 1, 3);
  open.rect(16, 18, 3, 1, c('ink', 0)).rect(22, 18, 3, 1, c('ink', 0)).disc(20, 23, 1.6, c('ink', 0));
  blob(open, 20, 14, 6, 3, R('hair'), 0, 2);
  open.rect(2, 33, 36, 4, c('white', 3)).rect(2, 37, 36, 1, c('grey', 1));
  book.add('owTL', cut(open, 0, 0), AIR);
  book.add('owTR', cut(open, 1, 0), AIR);
  book.add('owBL', cut(open, 0, 1), AIR);
  book.add('owBR', cut(open, 1, 1), AIR);
  // a window box of flowers (solid)
  const box = sidingAt(P());
  box.rect(0, 10, 20, 10, c('wood', 2)).rect(0, 10, 20, 2, c('wood', 3));
  for (let x = 2; x < 20; x += 4)
    box
      .line(x, 10, x, 5, c('leaf', 2))
      .disc(x, 4, 1.6, c(x % 8 === 2 ? 'red' : 'purple', 2))
      .set(x, 4, c('gold', 3));
  book.add('flowerBox', box, { solid: SOLID });
  // the wasp nest under the eave: it gives birth to wasps
  const nest = sidingAt(P());
  blob(nest, 10, 9, 7, 8, R('smoke'), 0, 2);
  for (let y = 3; y < 16; y += 3) nest.line(4, y, 16, y, c('smoke', 0));
  nest.disc(10, 15, 1.6, c('ink', 0));
  book.add('nest', nest, { solid: SOLID, birthMon: MON.wasp, birthTime: WASP_EVERY });

  // ---------- the backyard ----------
  const earth = (seed: number) => speckle(P(), 0, 0, 20, 20, R('earth'), 1, 1, seed, 0.3);
  const grass = (seed: number) => {
    const p = earth(seed);
    p.rect(0, 0, 20, 5, c('grass', 2)).rect(0, 0, 20, 1, c('grass', 3)).rect(0, 5, 20, 1, c('grass', 0));
    for (let x = 1; x < 20; x += 3) p.set(x, 0, c('grass', 3));
    return p;
  };
  book.add('earth', earth(11), { solid: SOLID });
  // dew in the grass: landed on, it gives a lick of sugar, then none for a while
  book.add('grass', grass(12), { solid: SOLID, effect: SUGAR, eamt: 1, next: 'grassLicked', ntime: 1 });
  const fence = sky(13);
  for (let x = 1; x < 20; x += 5) {
    fence
      .rect(x, 4, 4, 16, c('wood', 3))
      .rect(x, 4, 1, 16, c('wood', 4))
      .set(x + 1, 3, c('wood', 3))
      .set(x + 2, 3, c('wood', 3));
  }
  fence.rect(0, 8, 20, 2, c('wood', 1)).rect(0, 15, 20, 2, c('wood', 1));
  book.add('fence', fence, AIR);
  // the clothesline: a post (solid), the line (scenery), and dish towels pegged on it
  const post = sky(14);
  post.rect(8, 0, 4, 20, c('wood', 2)).rect(8, 0, 1, 20, c('wood', 3));
  book.add('post', post, { solid: SOLID });
  const postTop = sky(15);
  postTop.rect(8, 4, 4, 16, c('wood', 2)).rect(2, 3, 16, 3, c('wood', 1));
  book.add('postTop', postTop, { solid: SOLID });
  const line = sky(16);
  line.line(0, 5, 20, 5, c('grey', 1));
  book.add('line', line, AIR);
  const pegged = (k: string) => {
    const p = sky(17);
    p.line(0, 5, 20, 5, c('grey', 1));
    for (let y = 5; y < 19; y++)
      for (let x = 4; x < 16; x++) p.set(x + Math.round(Math.sin(y / 4)), y, (x + Math.floor(y / 3)) % 4 === 0 ? c('white', 3) : c(k, 2));
    p.rect(6, 4, 2, 3, c('wood', 3)).rect(13, 4, 2, 3, c('wood', 3));
    return p;
  };
  book.add('towelR', pegged('red'), AIR);
  book.add('towelB', pegged('shirt'), AIR);
  // a tree to rest in
  const trunk = sky(18);
  // its sway repeats every block, so stacked trunks join without a notch
  for (let y = 0; y < 20; y++) trunk.rect(6 + Math.round(Math.sin((y * Math.PI) / 10)), y, 8, 1, shadeAt(R('wood'), 0, 2, 0.5, 9, y));
  book.add('trunk', trunk, { solid: SOLID });
  const leaves = (seed: number, ledge: boolean) => {
    const p = sky(seed);
    const r = rng(seed);
    for (let i = 0; i < 8; i++) blob(p, r() * 20, 3 + r() * 14, 4 + r() * 3, 3 + r() * 2, R('leaf'), 0, 3);
    if (ledge) p.rect(0, 14, 20, 3, c('wood', 1));
    return p;
  };
  book.add('leaves', leaves(19, false), AIR);
  book.add('branch', leaves(20, true), { solid: LEDGE });
  // the picnic table (top solid) with a pie on it, and a glass of lemonade
  const picnic = sky(21);
  picnic.rect(0, 0, 20, 5, c('wood', 3)).rect(0, 5, 20, 1, c('wood', 0)).line(4, 6, 1, 20, c('wood', 2)).line(16, 6, 19, 20, c('wood', 2));
  book.add('picnic', picnic, { solid: SOLID });
  const legs = sky(22);
  legs.line(4, 0, 0, 20, c('wood', 2)).line(16, 0, 20, 20, c('wood', 2)).rect(0, 8, 20, 2, c('wood', 1));
  book.add('picnicLeg', legs, AIR);
  const pie = (eaten: boolean) => {
    const p = sky(23);
    p.rect(2, 16, 16, 3, c('steel', 2));
    if (eaten) {
      blob(p, 10, 15, 7, 2, R('chip'), 1, 2);
      p.set(7, 13, c('red', 2));
    } else {
      blob(p, 10, 13, 8, 4, R('chip'), 1, 3);
      for (let x = 4; x < 17; x += 3) p.line(x, 11, x + 2, 15, c('chip', 0));
      p.set(9, 10, c('red', 2)).set(13, 11, c('red', 2));
    }
    return p;
  };
  book.add('pieTin', pie(true), AIR);
  book.add('pie', pie(false), { effect: SNACKS, eamt: 1, score: 50, touch: 'pieTin' });
  const lemonade = sky(24);
  lemonade.rect(6, 6, 8, 13, c('daisy', 2)).rect(6, 6, 8, 3, c('white', 3)).rect(6, 6, 1, 13, c('white', 3)).line(11, 2, 13, 8, c('red', 2));
  lemonade.set(12, 12, c('white', 3)).set(9, 14, c('white', 3));
  book.add('lemonade', lemonade, { hp: 30, score: 10, touch: 'skyFlown' });
  const bath = sky(25);
  bath.rect(8, 8, 4, 12, c('grey', 2)).rect(2, 4, 16, 4, c('grey', 3)).rect(3, 4, 14, 2, c('water', 2));
  book.add('birdbath', bath, { solid: SOLID });
  // the tall grass at the end of the yard: in there is the wild
  const tall = (seed: number, wild: boolean) => {
    const p = sky(seed);
    const r = rng(seed);
    for (let i = 0; i < 14; i++) {
      const x = r() * 20;
      p.line(x, 20, x + (r() - 0.5) * 6, 2 + r() * 8, c('grass', 1 + (i % 3)));
    }
    if (wild) micro(p, 2, 2, 'WILD', c('gold', 3));
    return p;
  };
  book.add('tall', tall(26, false), AIR);
  book.add('tallWall', tall(28, false), { solid: SOLID });
  book.add('wild', tall(27, true), { score: 500 });

  // ---------- the wild (the documentary) ----------
  // reeds and grass stems (solid), seed heads on top
  const stem = (top: boolean) => {
    const p = sky(31);
    p.rect(8, 0, 4, 20, c('grass', 2)).rect(8, 0, 1, 20, c('grass', 3)).rect(11, 0, 1, 20, c('grass', 0));
    if (top) {
      p.rect(0, 0, 20, 10, c('sky', 3));
      blob(p, 10, 6, 4, 6, R('ochre'), 0, 2);
      p.rect(8, 10, 4, 10, c('grass', 2));
    }
    return p;
  };
  book.add('stem', stem(false), { solid: SOLID });
  book.add('stemTop', stem(true), { solid: SOLID });
  const pond = (f: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, c('water', y < 2 ? 3 : (x + y * 2 + f * 4) % 11 === 0 ? 3 : 1 + (y < 8 ? 1 : 0)));
    return p;
  };
  book.add('pond0', pond(0), { solid: SOLID, hp: -6, next: 'pond1', ntime: 7 });
  book.add('pond1', pond(1), { solid: SOLID, hp: -6, next: 'pond0', ntime: 7 });
  const lily = sky(32);
  for (let y = 12; y < 20; y++) for (let x = 0; x < 20; x++) lily.set(x, y, c('water', y < 14 ? 3 : 1));
  blob(lily, 10, 13, 9, 2.4, R('leaf'), 1, 3);
  lily.line(10, 13, 16, 11, c('water', 3));
  book.add('lily', lily, { solid: SOLID });
  // a Venus flytrap, snapping (it bites)
  const trap = (shut: boolean) => {
    const p = sky(33);
    p.line(10, 20, 10, 12, c('leaf', 1));
    if (shut) {
      blob(p, 10, 9, 6, 3, R('leaf'), 1, 3);
      for (let x = 5; x < 16; x += 2) p.set(x, 9, c('red', 2));
    } else {
      for (const s of [-1, 1]) for (let k = 0; k < 7; k++) p.line(10, 11, 10 + s * k, 3 + Math.abs(k - 3), c(k < 2 ? 'red' : 'leaf', 2));
      for (let k = 1; k < 7; k += 2) p.set(10 - k, 2 + Math.abs(k - 3), c('white', 3)).set(10 + k, 2 + Math.abs(k - 3), c('white', 3));
    }
    return p;
  };
  book.add('trap0', trap(false), { hp: -12, next: 'trap1', ntime: 16 });
  book.add('trap1', trap(true), { hp: -12, next: 'trap0', ntime: 8 });
  // mushrooms (solid caps) and a log
  const shroom = sky(34);
  blob(shroom, 10, 7, 9, 5, R('red'), 1, 3);
  for (const [x, y] of [
    [6, 5],
    [12, 4],
    [15, 7],
  ])
    shroom.disc(x, y, 1.2, c('white', 3));
  shroom.rect(7, 11, 6, 9, c('white', 2));
  book.add('shroom', shroom, { solid: SOLID });
  const log = P().rect(0, 0, 20, 20, c('wood', 1));
  for (let y = 2; y < 20; y += 4) log.line(0, y, 20, y + 1, c('wood', 0));
  log.rect(0, 0, 20, 2, c('leaf', 2));
  book.add('log', log, { solid: SOLID });
  // a clock melting over a branch (time is broken here)
  const melt = sky(35);
  melt.rect(0, 6, 20, 3, c('wood', 1));
  for (let x = 2; x < 17; x++) {
    const sag = Math.round(Math.max(0, 6 - Math.abs(x - 9)) * 1.2);
    for (let y = 2; y < 9 + sag; y++) melt.set(x, y, y === 8 + sag ? c('gold', 0) : c('white', 3));
  }
  melt.line(9, 5, 9, 9, c('ink', 0)).line(9, 9, 12, 12, c('ink', 0)).rect(2, 2, 15, 1, c('gold', 1));
  book.add('melt', melt, AIR);
  // hourglasses: two hours each
  const glass = (bg: () => Pixels, f: number) => {
    const p = bg();
    p.rect(5, 2, 10, 2, c('wood', 2)).rect(5, 16, 10, 2, c('wood', 2));
    for (let y = 4; y < 16; y++) {
      const w = Math.round(1 + Math.abs(y - 10) * 0.6);
      for (let x = 10 - w; x <= 9 + w; x++) p.set(x, y, y < 10 === (f === 0) && Math.abs(y - 10) > 1 ? c('sand', 2) : c('wing', 2));
    }
    p.set(10, 10, c('sand', 2)).set(9, 11 + f, c('sand', 1));
    if (f) p.set(4, 3, c('gold', 3)).set(16, 15, c('gold', 3));
    return p;
  };
  const hour = { effect: HOURS, eamt: 2, score: 100 };
  book.add(
    'hour0',
    glass(() => sky(36), 0),
    { ...hour, touch: 'skyFlown', next: 'hour1', ntime: 12 },
  );
  book.add(
    'hour1',
    glass(() => sky(36), 1),
    { ...hour, touch: 'skyFlown', next: 'hour0', ntime: 12 },
  );
  // the desert where Brother Camel rests: sand, a cactus (it pricks)
  const sandAt = (top: boolean) => {
    const p = speckle(P(), 0, 0, 20, 20, R('sand'), 1, 1, 37, 0.3);
    if (top) p.rect(0, 0, 20, 2, c('sand', 2)).rect(0, 2, 20, 1, c('sand', 0));
    return p;
  };
  book.add('dune', sandAt(true), { solid: SOLID });
  book.add('sand', sandAt(false), { solid: SOLID });
  // (its trunk runs from the top edge: the desert's cactus is two blocks tall, cactusTop over it)
  const cactus = sky(38);
  cactus
    .rect(8, 0, 5, 20, c('leaf', 2))
    .rect(8, 0, 1, 20, c('leaf', 3))
    .rect(3, 8, 5, 3, c('leaf', 2))
    .rect(3, 4, 3, 5, c('leaf', 2))
    .rect(13, 10, 4, 3, c('leaf', 2))
    .rect(15, 6, 3, 5, c('leaf', 2));
  for (let y = 4; y < 20; y += 3) cactus.set(7, y, c('white', 3)).set(13, y + 1, c('white', 3));
  book.add('cactus', cactus, { solid: SOLID, hp: -6 });
  // a tall cactus's top (over a cactus): its trunk runs on down into the block below
  const cactusTop = sky(40);
  cactusTop.rect(8, 6, 5, 14, c('leaf', 2)).rect(9, 5, 3, 1, c('leaf', 2)).rect(8, 6, 1, 14, c('leaf', 3));
  for (let y = 8; y < 20; y += 3) cactusTop.set(7, y, c('white', 3)).set(13, y + 1, c('white', 3));
  // a spider's web in a corner (it sticks and stings)
  const web = sky(39);
  for (let a = 0; a < 6; a++) web.line(0, 0, Math.cos((a * Math.PI) / 10) * 22, Math.sin((a * Math.PI) / 10) * 22, c('white', 2));
  for (let rr = 5; rr < 22; rr += 5) for (let a = 0; a < Math.PI / 2; a += 0.08) web.set(Math.cos(a) * rr, Math.sin(a) * rr, c('white', 1));
  book.add('web', web, { hp: -4 });
  const rock = sky(40);
  blob(rock, 10, 12, 9.5, 8, R('grey'), 0, 3);
  book.add('rock', rock, { solid: SOLID });
  // a flower: nectar heals
  const flower = sky(41);
  flower.line(10, 20, 10, 9, c('leaf', 1));
  for (let a = 0; a < 6; a++) blob(flower, 10 + Math.cos(a) * 4, 8 + Math.sin(a) * 4, 2.6, 2.6, R('pink'), 1, 2);
  flower.disc(10, 8, 2, c('gold', 3));
  book.add('flower', flower, { hp: 20, score: 10, touch: 'stalk' });
  const stalk = sky(41);
  stalk.line(10, 20, 10, 9, c('leaf', 1));
  book.add('stalk', stalk, AIR);
  // the documentary crew's boom microphone, poking in from above (scenery)
  const boom = sky(42);
  boom.rect(9, 0, 2, 8, c('grey', 1));
  blob(boom, 10, 13, 4, 6, R('grey'), 0, 2);
  for (let y = 8; y < 19; y += 2) boom.line(7, y, 13, y, c('grey', 0));
  book.add('boom', boom, AIR);
  const pole = sky(43);
  pole.rect(9, 0, 2, 20, c('grey', 1));
  book.add('boomPole', pole, AIR);
  // the big clock: it only breaks for twenty-four hours, and time stops here
  const clock = (broken: boolean) => {
    const p = sky(44);
    p.disc(10, 10, 9, c('gold', 0)).disc(10, 10, 8, c('white', 3));
    if (broken) {
      p.line(3, 4, 17, 16, c('ink', 0)).line(15, 3, 6, 17, c('ink', 0)).line(10, 2, 9, 18, c('ink', 1));
      p.line(10, 10, 4, 15, c('ink', 0)).line(10, 10, 16, 14, c('ink', 0));
    } else {
      for (let k = 0; k < 12; k++) p.set(10 + Math.cos((k * Math.PI) / 6) * 7, 10 + Math.sin((k * Math.PI) / 6) * 7, c('ink', 1));
      p.line(10, 10, 10, 4, c('ink', 0)).line(10, 10, 14, 12, c('ink', 0));
      micro(p, 5, 13, String(HOURS_NEEDED), c('red', 2));
    }
    return p;
  };
  book.add('clock', clock(false), { solid: SOLID, effect: HOURS, eamt: -HOURS_NEEDED, score: 1000, touch: 'clockBroken' });
  book.add('clockBroken', clock(true), AIR);
  // (last, so every other block keeps its number)
  book.add('cactusTop', cactusTop, { solid: SOLID, hp: -6 });
  // (last too) the flown twins of fresh sky, the licked grass, and a sugar cube in the air
  book.add('skyFlown', sky(1), AIR);
  book.add('skyHiFlown', sky(2, 2), AIR);
  book.add('grassLicked', grass(12), { solid: SOLID, next: 'grass', ntime: LICK_EVERY });
  book.add('sugarS', sugarCube(sky(1), pal), { effect: SUGAR, eamt: SUGAR_CUBE, touch: 'skyFlown' });
  return book;
}
