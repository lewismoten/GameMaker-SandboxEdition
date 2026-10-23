// MUSTARD.BBL: every background block, drawn in code, seen from the side. A block's number is
// the order it was added (by name here); the attributes are the game:
//   - air falls (gravity down); a root is air with no gravity, so the seed can climb it;
//   - soft dust gives way: touch it and it turns to roots (land on it and you put roots down);
//   - ledges (leaves, branches, clouds) hold you up and let you hop up through them;
//   - dandelion fluff and the evening breeze are air that lifts (gravity up);
//   - raindrops and groundwater are water, glimmers are faith; boulders take a faith each to
//     move, and the sidewalk's crack only opens for five drops of water;
//   - clouds give birth to raindrops, loose scree to rolling pebbles.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import { micro } from '../../../snowbound/src/art/font';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import { drawHand, HAND_H, HAND_W } from '../art/hand';
import type { Pal } from '../art/pal';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { EGG_SHINE_FRAMES, drawEasterEgg } from '../../../kit/easterEgg';
import { FAITH, MON, WATER, WATER_NEEDED } from '../ids';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, hop up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, down: 4 } as const;
const LIFE = 1;
/** Ticks between raindrops from a rain cloud, and between pebbles from the scree. */
export const RAIN_EVERY = 40;
export const SCREE_EVERY = 90;

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
  const cave = (seed: number) => {
    const p = P().rect(0, 0, 20, 20, c('soil', 0));
    const r = rng(seed);
    for (let i = 0; i < 14; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('soil', 1));
    return p;
  };
  book.add('sky', sky(1), air);
  book.add('skyHi', sky(2), air);
  const wisp = sky(3);
  for (let x = 2; x < 18; x++) wisp.set(x, 9 + Math.round(Math.sin(x / 3)), c('sky', 5)).set(x + 1, 10 + Math.round(Math.sin(x / 3)), c('sky', 4));
  book.add('wisp', wisp, air);
  book.add('cave', cave(4), air);

  // ---------- the ground ----------
  const soil = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('soil'), 2, 1, seed, 0.3);
    const r = rng(seed + 9);
    for (let i = 0; i < 4; i++) blob(p, 2 + r() * 16, 2 + r() * 16, 1.4, 1, R('stone'), 1, 3);
    return p;
  };
  const grassOn = (p: Pixels, seed: number) => {
    const r = rng(seed);
    p.rect(0, 0, 20, 4, c('grass', 2)).rect(0, 0, 20, 1, c('grass', 4)).rect(0, 4, 20, 1, c('grass', 0));
    for (let x = 0; x < 20; x++) if (r() < 0.5) p.set(x, 5, c('grass', 1));
    return p;
  };
  book.add('soil', soil(11), { solid: SOLID });
  book.add('grassTop', grassOn(soil(12), 13), { solid: SOLID });
  // The garden's soft dust: it gives way to roots.
  const dust = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('dust'), 1, 1, seed, 0.45);
    const r = rng(seed + 3);
    for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('soil', 2));
    for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('dust', 3));
    return p;
  };
  const rootPic = (seed: number) => {
    const p = cave(seed);
    const r = rng(seed);
    // pale root threads, wandering down
    for (let k = 0; k < 3; k++) {
      let x = 4 + k * 6 + r() * 2;
      for (let y = 0; y < 20; y++) {
        x += (r() - 0.5) * 1.6;
        p.set(Math.round(x), y, c('root', 2 + (y % 3 === 0 ? 1 : 0)));
        if (r() < 0.12) p.line(x, y, x + (r() < 0.5 ? -3 : 3), y + 2, c('root', 1));
      }
    }
    return p;
  };
  book.add('root', rootPic(21), { grav: GRAV.none });
  book.add('dust', dust(22), { solid: SOLID, touch: 'root' });
  const dustTop = dust(23);
  for (let x = 0; x < 20; x += 3) dustTop.line(x, 3, x + 1, 0, c('grass', 3));
  book.add('dustTop', dustTop, { solid: SOLID, touch: 'root' });
  const rock = (bg: Pixels, seed: number) => {
    blob(bg, 10, 10, 9.5, 9, R('stone'), 0, 4, 1.1);
    const r = rng(seed);
    for (let i = 0; i < 3; i++) bg.line(4 + r() * 12, 4 + r() * 12, 4 + r() * 12, 4 + r() * 12, c('stone', 1));
    return bg;
  };
  book.add('rock', rock(soil(31), 31), { solid: SOLID });
  book.add('rockDust', rock(dust(32), 32), { solid: SOLID });

  // ---------- the garden ----------
  const pot = (rim: boolean) => {
    const p = sky(41);
    const r = rng(41);
    for (let y = 0; y < 20; y++) {
      const inset = rim ? 0 : 2;
      for (let x = inset; x < 20 - inset; x++) p.set(x, y, shadeAt(R('clay'), 0, 3, 0.85 - x / 26, x, y));
    }
    if (rim) {
      p.rect(0, 0, 20, 5, c('clay', 2)).rect(0, 0, 20, 1, c('clay', 3)).rect(0, 5, 20, 1, c('clay', 0));
      p.rect(2, 0, 16, 2, c('soil', 1));
      for (let x = 4; x < 16; x += 3) p.line(x, 0, x + 1, -3, c('leaf', 2));
    }
    for (let i = 0; i < 3; i++) p.set(4 + Math.floor(r() * 12), 7 + Math.floor(r() * 12), c('clay', 1));
    return p;
  };
  book.add('potTop', pot(true), { solid: SOLID });
  book.add('pot', pot(false), { solid: SOLID });
  // A big leaf to stand on.
  const leafLedge = (bg: Pixels) => {
    for (let x = 0; x < 20; x++) {
      const h = 3 + Math.round(Math.sin((x / 19) * Math.PI) * 2);
      for (let y = 0; y < h; y++) bg.set(x, 3 + y, c('leaf', y === 0 ? 4 : y === h - 1 ? 0 : 2));
    }
    bg.line(0, 5, 19, 5, c('leaf', 1));
    for (let x = 3; x < 20; x += 5) bg.line(x, 5, x - 2, 3, c('leaf', 1));
    return bg;
  };
  book.add('leaf', leafLedge(sky(43)), { solid: LEDGE, grav: GRAV.down });
  book.add('leafCave', leafLedge(cave(44)), { solid: LEDGE, grav: GRAV.down });
  const brick = (top: boolean) => {
    const p = P().rect(0, 0, 20, 20, c('clay', 0));
    for (let row = 0; row < 4; row++)
      for (let k = -1; k < 3; k++) {
        const x = k * 10 + (row % 2) * 5;
        p.rect(x + 1, row * 5 + 1, 8, 3, c('clay', 2)).rect(x + 1, row * 5 + 1, 8, 1, c('clay', 3));
      }
    if (top) p.rect(0, 0, 20, 3, c('stone', 4)).rect(0, 3, 20, 1, c('stone', 1));
    return p;
  };
  book.add('brick', brick(false), { solid: SOLID });
  book.add('brickTop', brick(true), { solid: SOLID });
  const fence = () => {
    const p = sky(45);
    p.rect(0, 6, 20, 2, c('white', 1)).rect(0, 13, 20, 2, c('white', 1));
    for (const x of [3, 13])
      p.rect(x, 2, 4, 18, c('white', 2))
        .rect(x, 2, 1, 18, c('white', 0))
        .set(x + 1, 1, c('white', 2))
        .set(x + 2, 1, c('white', 2));
    return p;
  };
  book.add('fence', fence(), air);
  // Flowers and tufts in front of the sky (scenery).
  const flower = (k: string, seed: number) => {
    const p = sky(seed);
    p.line(10, 19, 10, 9, c('leaf', 1));
    blob(p, 7, 15, 2.6, 1.4, R('leaf'), 1, 3);
    for (let a = 0; a < 5; a++) p.disc(10 + Math.cos((a * 2 * Math.PI) / 5) * 3, 7 + Math.sin((a * 2 * Math.PI) / 5) * 3, 2, c(k, 2 + (a % 2)));
    p.disc(10, 7, 1.6, c('sun', 2));
    return p;
  };
  book.add('flowerP', flower('pink', 47), air);
  book.add('flowerB', flower('blue', 48), air);
  const tuft = sky(49);
  for (let x = 1; x < 20; x += 2) tuft.line(x, 19, x + (x % 4 ? 1 : -1), 13 + (x % 3) * 2, c('grass', 2 + (x % 2)));
  book.add('tuft', tuft, air);
  // Dandelion fluff: air that lifts.
  const fluff = (f: number) => {
    const p = sky(51);
    const r = rng(51 + f);
    for (let i = 0; i < 4; i++) {
      const x = 2 + r() * 16;
      const y = 2 + r() * 16;
      for (let a = 0; a < 6; a++) p.set(x + Math.cos(a) * 1.5, y + Math.sin(a) * 1.5, c('white', 2));
      p.set(x, y, c('white', 1)).set(x, y + 2, c('white', 0));
    }
    for (let y = 0; y < 20; y += 4) p.set(10 + f * 3 - 2, (y + f * 2) % 20, c('sky', 5));
    return p;
  };
  book.add('fluff0', fluff(0), { grav: GRAV.up, next: 'fluff1', ntime: 5 });
  book.add('fluff1', fluff(1), { grav: GRAV.up, next: 'fluff0', ntime: 5 });
  // A dandelion clock at the bottom of a stretch of fluff.
  const clock = sky(53);
  clock.line(10, 19, 10, 9, c('leaf', 1));
  for (let a = 0; a < 16; a++) clock.line(10, 7, 10 + Math.cos((a / 16) * 6.28) * 5, 7 + Math.sin((a / 16) * 6.28) * 5, c('white', 2));
  clock.disc(10, 7, 1.5, c('white', 1));
  book.add('dandelion', clock, { grav: GRAV.up });
  // Rain clouds: they give birth to raindrops.
  const cloud = (part: number, rain: boolean) => {
    const p = sky(55 + part);
    for (const [x, y, rr] of [
      [part * -20 + 9, 12, 8],
      [part * -20 + 19, 9, 9],
      [part * -20 + 29, 12, 8],
      [part * -20 + 34, 10, 5],
    ])
      blob(p, x, y, rr, rr * 0.75, R(rain ? 'stone' : 'white'), rain ? 2 : 0, rain ? 4 : 2, 1.2);
    p.rect(0, 16, 20, 4, c('sky', 3));
    for (let x = 0; x < 20; x++) if (x % 5 === 2) p.set(x, 17, c('water', 3)).set(x, 18, c('water', 2));
    return p;
  };
  book.add('cloudL', cloud(0, true), { grav: GRAV.down, birthMon: MON.drop, birthTime: RAIN_EVERY });
  book.add('cloudR', cloud(1, true), { grav: GRAV.down, birthMon: MON.drop, birthTime: RAIN_EVERY + 13 });
  // White clouds to stand on, up in the sky.
  const cloudLedge = (part: number) => {
    const p = sky(57 + part);
    for (let x = 0; x < 20; x++) {
      const gx = part * 20 + x;
      const h = 6 + Math.round(Math.sin(gx / 4) * 2);
      for (let y = 0; y < h; y++) p.set(x, 4 + y, shadeAt(R('white'), 0, 2, 1 - y / h, x, y));
    }
    return p;
  };
  book.add('cloudA', cloudLedge(0), { solid: LEDGE, grav: GRAV.down });
  book.add('cloudB', cloudLedge(1), { solid: LEDGE, grav: GRAV.down });

  // ---------- things to catch ----------
  const sparkle = (bg: () => Pixels, f: number, ramp: string) => {
    const p = bg();
    const s = f ? 4 : 3;
    p.line(10 - s, 10, 10 + s, 10, c(ramp, 1)).line(10, 10 - s - 1, 10, 10 + s + 1, c(ramp, 1));
    p.line(10 - s + 2, 10 - s + 2, 10 + s - 2, 10 + s - 2, c(ramp, f ? 0 : 1)).line(10 - s + 2, 10 + s - 2, 10 + s - 2, 10 - s + 2, c(ramp, f ? 0 : 1));
    p.disc(10, 10, 1.5, c(ramp, ramp === 'sun' ? 3 : 2));
    return p;
  };
  // Sunbeams: points.
  book.add(
    'sun0',
    sparkle(() => sky(61), 0, 'sun'),
    { score: 50, touch: 'sky', next: 'sun1', ntime: 6 },
  );
  book.add(
    'sun1',
    sparkle(() => sky(61), 1, 'sun'),
    { score: 50, touch: 'sky', next: 'sun0', ntime: 4 },
  );
  book.add(
    'sunC0',
    sparkle(() => cave(62), 0, 'sun'),
    { score: 50, touch: 'cave', next: 'sunC1', ntime: 6 },
  );
  book.add(
    'sunC1',
    sparkle(() => cave(62), 1, 'sun'),
    { score: 50, touch: 'cave', next: 'sunC0', ntime: 4 },
  );
  // Faith: a golden glimmer, a tiny mustard seed of light.
  const glimmer = (bg: () => Pixels, f: number) => {
    const p = sparkle(bg, f, 'faith');
    blob(p, 10, 10, 2.4, 2.8, R('seed'), 2, 4, 1.3);
    return p;
  };
  book.add(
    'faith0',
    glimmer(() => sky(63), 0),
    { effect: FAITH, eamt: 1, score: 25, touch: 'sky', next: 'faith1', ntime: 7 },
  );
  book.add(
    'faith1',
    glimmer(() => sky(63), 1),
    { effect: FAITH, eamt: 1, score: 25, touch: 'sky', next: 'faith0', ntime: 5 },
  );
  // Groundwater: a drop of water in the dirt.
  const waterDrop = (bg: Pixels) => {
    for (let k = 0; k < 5; k++) bg.rect(10 - Math.floor(k / 2), 4 + k, 1 + Math.floor(k / 2) * 2, 1, c('water', 2));
    blob(bg, 10, 11, 4, 4, R('water'), 1, 3, 1.3);
    bg.set(9, 9, c('white', 2)).set(8, 10, c('white', 1));
    return bg;
  };
  book.add('water', waterDrop(cave(65)), { effect: WATER, eamt: 1, hp: 4, score: 10, touch: 'cave' });
  book.add('waterRoot', waterDrop(rootPic(66)), { effect: WATER, eamt: 1, hp: 4, score: 10, touch: 'root', grav: GRAV.none });
  book.add('waterSky', waterDrop(sky(67)), { effect: WATER, eamt: 1, hp: 4, score: 10, touch: 'sky' });
  // Dew on a blade of grass: health.
  const dew = sky(69);
  dew.line(6, 19, 12, 6, c('grass', 2)).line(7, 19, 13, 7, c('grass', 3));
  blob(dew, 13, 6, 2.6, 2.6, R('water'), 2, 3, 1.4);
  dew.set(12, 5, c('white', 2));
  book.add('dew', dew, { hp: 25, score: 10, touch: 'tuft' });
  // A golden mustard flower: an extra life.
  const golden = (bg: Pixels) => {
    bg.line(10, 19, 10, 10, c('leaf', 2));
    blob(bg, 6, 15, 3, 1.5, R('leaf'), 1, 3);
    for (let a = 0; a < 4; a++) blob(bg, 10 + Math.cos(a * 1.57) * 3, 7 + Math.sin(a * 1.57) * 3, 2.2, 2.2, R('seed'), 2, 4);
    bg.disc(10, 7, 1.6, c('sun', 3));
    return bg;
  };
  book.add('life', golden(sky(71)), { effect: LIFE, eamt: 1, score: 100, touch: 'tuft' });
  book.add('lifeCave', golden(cave(72)), { effect: LIFE, eamt: 1, score: 100, touch: 'cave' });

  // ---------- hazards ----------
  // Thistles prick.
  const thistle = (bg: Pixels) => {
    for (let k = 0; k < 4; k++) bg.line(10, 19, 4 + k * 4, 10 + (k % 2) * 3, c('leaf', 1));
    for (const [x, y] of [
      [5, 9],
      [10, 6],
      [15, 9],
    ]) {
      blob(bg, x, y + 2, 2.6, 2, R('leaf'), 0, 2);
      bg.disc(x, y, 2.2, c('purple', 1)).set(x, y - 1, c('purple', 2));
      bg.set(x - 3, y + 1, c('white', 1)).set(x + 3, y + 1, c('white', 1));
    }
    return bg;
  };
  // A thistle pricks once, then droops (harmless).
  book.add('thistle', thistle(sky(73)), { grav: GRAV.down, hp: -8, touch: 'thistleDown' });
  const drooped = sky(74);
  for (let k = 0; k < 4; k++) drooped.line(10, 19, 2 + k * 5, 15 + (k % 2), c('leaf', 1));
  for (const [x, y] of [
    [4, 14],
    [10, 13],
    [16, 14],
  ])
    drooped.disc(x, y, 2, c('purple', 1));
  book.add('thistleDown', drooped, { grav: GRAV.down });

  // ---------- underground ----------
  // Packed earth with an old tin can, a button, a bottle cap: just soil, but nice to look at.
  const junk = (k: number) => {
    const p = soil(75 + k);
    if (k === 0) p.rect(6, 7, 8, 9, c('stone', 3)).rect(6, 7, 8, 1, c('stone', 5)).rect(7, 9, 6, 1, c('red', 2));
    if (k === 1) p.disc(10, 10, 4, c('blue', 2)).set(9, 9, c('ink', 0)).set(11, 9, c('ink', 0)).set(9, 11, c('ink', 0)).set(11, 11, c('ink', 0));
    if (k === 2) {
      p.disc(10, 10, 4, c('red', 2));
      for (let a = 0; a < 12; a++) p.set(10 + Math.cos(a / 1.9) * 4.5, 10 + Math.sin(a / 1.9) * 4.5, c('red', 1));
      micro(p, 8, 8, 'P', c('white', 2));
    }
    return p;
  };
  book.add('junk0', junk(0), { solid: SOLID });
  book.add('junk1', junk(1), { solid: SOLID });
  book.add('junk2', junk(2), { solid: SOLID });
  // The sidewalk over the far end, and the crack in it that five drops of water open.
  const sidewalk = (crack: 'no' | 'shut' | 'open') => {
    const p = P().rect(0, 0, 20, 20, c('stone', 3));
    const r = rng(81);
    for (let i = 0; i < 30; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('stone', r() < 0.5 ? 2 : 4));
    p.rect(0, 0, 20, 1, c('stone', 5)).rect(0, 19, 20, 1, c('stone', 1));
    if (crack === 'shut') {
      let x = 9;
      for (let y = 0; y < 20; y++) {
        x += Math.round((r() - 0.5) * 2);
        p.set(x, y, c('ink', 0)).set(x + 1, y, c('stone', 1));
      }
      micro(p, 2, 13, String(WATER_NEEDED), c('water', 1));
    }
    if (crack === 'open') {
      for (let y = 0; y < 20; y++) p.rect(6 + Math.round(Math.sin(y / 3)), y, 8, 1, c('soil', 0));
      blob(p, 10, 6, 3, 3, R('sun'), 1, 3);
    }
    return p;
  };
  book.add('sidewalk', sidewalk('no'), { solid: SOLID });
  book.add('crack', sidewalk('shut'), { solid: SOLID, effect: WATER, eamt: -WATER_NEEDED, score: 500, touch: 'crackOpen' });
  book.add('crackOpen', sidewalk('open'), { grav: GRAV.none });

  // ---------- the mountain ----------
  const mountain = (seed: number, face: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('stone'), 1, 3, 0.5 + Math.sin((x + seed) / 3 + y / 5) * 0.3, x, y));
    const r = rng(seed);
    for (let i = 0; i < 3; i++) p.line(r() * 20, r() * 20, r() * 20, r() * 20, c('stone', 0));
    if (face) {
      p.rect(0, 0, 20, 3, c('stone', 4)).rect(0, 3, 20, 1, c('stone', 1));
      for (let x = 1; x < 20; x += 4) p.line(x, 0, x + 1, -2, c('grass', 3));
    }
    return p;
  };
  book.add('crag', mountain(91, false), { solid: SOLID });
  book.add('cragTop', mountain(92, true), { solid: SOLID });
  // A boulder in the way: faith moves it (it crumbles to dust and blows away).
  const boulder = (bg: Pixels, stage: number) => {
    if (stage === 0) {
      blob(bg, 10, 10, 9.6, 9.4, R('stone'), 0, 5, 1.2);
      bg.line(6, 4, 9, 10, c('stone', 0)).line(9, 10, 7, 16, c('stone', 0)).line(9, 10, 14, 12, c('stone', 0));
      micro(bg, 12, 3, '+', c('faith', 2));
    } else {
      const r = rng(stage);
      for (let i = 0; i < (stage === 1 ? 7 : 4); i++) blob(bg, 3 + r() * 14, 6 + r() * 12 + stage * 2, 2.6 - stage * 0.6, 2.2 - stage * 0.5, R('stone'), 1, 4);
      for (let i = 0; i < 10; i++) bg.set(Math.floor(r() * 20), Math.floor(r() * 20), c('dust', 2));
    }
    return bg;
  };
  book.add('boulder', boulder(sky(93), 0), { solid: SOLID, effect: FAITH, eamt: -1, score: 100, touch: 'crumble1' });
  book.add('crumble1', boulder(sky(94), 1), { grav: GRAV.down, next: 'crumble2', ntime: 4 });
  book.add('crumble2', boulder(sky(95), 2), { grav: GRAV.down, next: 'sky', ntime: 4 });
  // Loose scree: pebbles come rolling out of it.
  const scree = mountain(96, true);
  for (const [x, y] of [
    [4, 8],
    [10, 11],
    [15, 7],
    [7, 15],
    [14, 16],
  ])
    blob(scree, x, y, 2.4, 2, R('stone'), 2, 5);
  book.add('scree', scree, { solid: SOLID, birthMon: MON.pebble, birthTime: SCREE_EVERY });
  // A pine, and snow on the peak (scenery).
  const pine = sky(97);
  pine.rect(9, 15, 2, 5, c('bark', 1));
  for (let k = 0; k < 4; k++) for (let x = -2 - k * 2; x <= 2 + k * 2; x++) pine.rect(10 + x, 2 + k * 3, 1, 4, c('leaf', x < 0 ? 0 : 1));
  book.add('pine', pine, air);
  const snow = mountain(98, false);
  snow.rect(0, 0, 20, 6, c('white', 2)).rect(0, 6, 20, 1, c('white', 0));
  for (let x = 0; x < 20; x += 3) snow.rect(x, 6, 2, 2 + (x % 2), c('white', 1));
  book.add('snowTop', snow, { solid: SOLID });

  // ---------- the tall stalk to the sky ----------
  const stalk = (part: 'L' | 'R') => {
    const p = sky(101);
    const x0 = part === 'L' ? 12 : 0;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 8; x++) p.set(x0 + x, y, shadeAt(R('leaf'), 0, 3, part === 'L' ? x / 8 : 1 - x / 8, x, y));
    return p;
  };
  book.add('stalkL', stalk('L'), air);
  book.add('stalkR', stalk('R'), air);
  // A branch of the great plant to stand on, its leaves hanging under it.
  const branch = (bg: Pixels) => {
    bg.rect(0, 4, 20, 4, c('leaf', 1)).rect(0, 4, 20, 1, c('leaf', 3)).rect(0, 7, 20, 1, c('leaf', 0));
    for (const x of [3, 11, 17]) blob(bg, x, 11, 3, 2, R('leaf'), 1, 4);
    return bg;
  };
  book.add('branch', branch(sky(103)), { solid: LEDGE, grav: GRAV.down });
  // The evening breeze: air that lifts, in long gold strokes.
  const breeze = (f: number) => {
    const p = sky(105);
    for (let k = 0; k < 3; k++) {
      const x = 3 + k * 6 + f * 2;
      for (let y = 0; y < 20; y++) if ((y + f * 4 + k * 3) % 9 < 5) p.set(x + Math.round(Math.sin(y / 3) * 1.4), y, c('sun', 2));
    }
    return p;
  };
  book.add('breeze0', breeze(0), { grav: GRAV.up, next: 'breeze1', ntime: 4 });
  book.add('breeze1', breeze(1), { grav: GRAV.up, next: 'breeze0', ntime: 4 });
  // A nest of twigs on a branch (birds come to lodge there).
  const nest = branch(sky(107));
  blob(nest, 10, 3, 7, 3, R('bark'), 1, 3);
  for (let x = 4; x < 17; x += 2) nest.line(x, 1, x + 2, 4, c('bark', 0));
  book.add('nest', nest, { solid: LEDGE, grav: GRAV.down });
  // The palm of God's hand: a great open hand of light at the top of the sky.
  const glow = (k: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('sun'), 1, 3, 0.4 + k * 0.2 + Math.sin((x + y) / 4) * 0.1, x, y));
    return p;
  };
  // rays of light under the hand, lifting
  const rays = sky(109);
  for (let x = 0; x < 20; x++) for (let y = 0; y < 20; y++) if ((x + Math.floor(y / 3)) % 5 < 2) rays.set(x, y, shadeAt(R('sun'), 0, 3, 1 - y / 24, x, y));
  book.add('light', rays, { grav: GRAV.up });
  book.add('palm', glow(2), { grav: GRAV.none });
  // The hand itself, eight blocks by three (art/hand.ts).
  const hand = new Pixels(HAND_W, HAND_H);
  for (let y = 0; y < HAND_H; y++) for (let x = 0; x < HAND_W; x++) hand.set(x, y, c('sky', 3 + ((x * 7 + y * 3) % 11 === 0 ? 1 : 0)));
  drawHand(hand, pal, 0, 0);
  for (let ty = 0; ty < 3; ty++) for (let tx = 0; tx < 8; tx++) book.add(`hand${ty * 8 + tx}`, hand.crop(tx * 20, ty * 20, 20, 20), { grav: GRAV.none });

  // ---------- ways out ----------
  // The sunny patch at the end of the garden: plant yourself here.
  const sunPatch = () => {
    const p = sky(111);
    for (let y = 0; y < 20; y += 2) p.line(4 + y / 2, y, 16 - y / 2 + 6, y, c('sun', 1));
    blob(p, 10, 16, 8, 4, R('dust'), 1, 3);
    micro(p, 4, 4, 'SUN', c('sun', 3));
    return p;
  };
  book.add('sunPatch', sunPatch(), air);
  // The way on over the mountain: a sunrise on the far side.
  const pass = () => {
    const p = sky(113);
    p.disc(10, 14, 7, c('sun', 2)).disc(10, 14, 5, c('sun', 3));
    p.rect(0, 15, 20, 5, c('stone', 2));
    return p;
  };
  book.add('pass', pass(), air);
  // Where a branch crosses the stalk: the stalk carries on behind the branch.
  book.add('branchStalkL', branch(stalk('L')), { solid: LEDGE, grav: GRAV.down });
  book.add('branchStalkR', branch(stalk('R')), { solid: LEDGE, grav: GRAV.down });
  // Daylight over the sidewalk, up through the crack (drawn in the water's blues and the sun's
  // glow, since the dust's palette has no sky), and the sunny spot on the sidewalk: the way on.
  const daylight = (seed: number) => {
    const p = P().rect(0, 0, 20, 20, c('water', 3));
    const r = rng(seed);
    for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 20), Math.floor(r() * 20), c('white', 1));
    return p;
  };
  book.add('daylight', daylight(121), air);
  // just over the crack: no gravity yet, so the sprout can step out onto the sidewalk
  book.add('daylightUp', daylight(121), { grav: GRAV.none });
  const sunSpot = () => {
    const p = daylight(123);
    for (const dx of [-6, -3, 0, 3, 6]) p.line(10, 5, 10 + dx, 19, c('sun', 1));
    p.disc(10, 5, 5, c('sun', 2)).disc(10, 5, 3, c('sun', 3));
    p.rect(3, 18, 14, 2, c('sun', 2)).rect(6, 19, 8, 1, c('sun', 3));
    return p;
  };
  book.add('sunSpot', sunSpot(), air);

  // Keepsakes, added last so every block before keeps its number: a tin heart in a pocket of
  // air down in the dust by the buried junk (a glint crosses it now and then) and a painted Easter
  // egg at the foot of the great plant, far over on the left. Each is air like the cave or sky
  // around it, a few points, gone when touched (that is its touch block), with no sound of its own.
  const tin = { ink: c('ink', 0), tin: [c('grey', 2), c('grey', 3), c('grey', 4)], white: c('white', 2), dark: c('grey', 1) };
  for (let k = 0; k < SHINE_FRAMES; k++)
    book.add(`tinHeart${k || ''}`, drawTinHeart(cave(4), tin, k), {
      ...air,
      next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 50,
      touch: 'cave',
      score: 100,
    });
  const egg = { ink: c('ink', 0), shell: R('blue'), paint: [c('red', 2), c('red', 3)], accent: c('sun', 3), white: c('white', 2) };
  for (let k = 0; k < EGG_SHINE_FRAMES; k++)
    book.add(`easterEgg${k || ''}`, drawEasterEgg(sky(1), egg, 'stars', k), {
      ...air,
      next: `easterEgg${(k + 1) % EGG_SHINE_FRAMES || ''}`,
      ntime: k ? 2 : 60,
      touch: 'sky',
      score: 50,
    });
  return book;
}
