// DESERT.BBL: the desert road at noon. Dunes of sand, sandstone that shelters him when the
// sandstorm blows (gusts are air that pushes left as well as down, coming and going by the
// clock), a slot canyon with eye gates cut in it (one grace each, then on his knees), an oasis
// with palms and a pool, cactus that pricks, dry brush that sends tumbleweeds, two travelers
// and some children to give gold to, and at the end of the road the tailor's tent.
import { dither } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../../../snowbound/src/art/draw';
import type { Pal } from '../art/pal';
import { MON } from '../ids';
import { addGate, addGoodThings, addSoul, GRAV, kit, LEDGE, SOLID, type Kit } from './common';

/** Ticks a sandstorm gust blows, and the calm between. */
export const GUST = 36;
export const CALM = 44;
/** Ticks between tumbleweeds from the dry brush. */
export const TUMBLE_EVERY = 140;

export function desertBlocks(pal: Pal): Kit {
  const k = kit(pal);
  const { book, c, R, P, sky, air } = k;

  // ---------- sky ----------
  book.add('bg', sky(1), air);
  book.add('skyHi', sky(2, 1), air);
  book.add('skyMid', sky(4, 2), air);
  const band = (lo: number) => P().map((x, y) => (dither(x, y, 1 - y / 20) ? c('sky', lo) : c('sky', lo + 1)));
  book.add('band1', band(1), air);
  book.add('band2', band(2), air);
  // the sun, white-hot
  const sun = sky(5, 2);
  sun.disc(10, 10, 7, c('gold', 4)).disc(10, 10, 5, c('white', 2));
  book.add('sun', sun, air);
  // far mesas and dunes in the heat haze (scenery)
  const far = (kind: number) => {
    const p = sky(10 + kind, 3);
    for (let x = 0; x < 20; x++) {
      const top = kind === 0 ? 12 + Math.round(Math.sin(x / 5) * 2) : kind === 1 ? (x > 3 && x < 17 ? 4 : 14) : 16 - Math.round(Math.abs(Math.sin(x / 7)) * 4);
      for (let y = top; y < 20; y++) p.set(x, y, kind === 1 ? shadeAt(R('sand'), 1, 3, 0.4 + (x / 20) * 0.4 + (y % 4 === 0 ? -0.2 : 0), x, y) : shadeAt(R('sand'), 3, 5, 0.3 + (y - top) / 20, x, y));
    }
    return p;
  };
  book.add('far0', far(0), air);
  book.add('far1', far(1), air);
  book.add('far2', far(2), air);

  // ---------- the ground ----------
  const sandFill = (seed: number) => speckle(P(), 0, 0, 20, 20, R('sand'), 3, 1, seed, 0.35);
  const sandTop = (seed: number) => {
    const p = sandFill(seed);
    for (let x = 0; x < 20; x++) {
      const t = Math.round(Math.sin((x + seed) / 3) * 1.2);
      for (let y = 0; y < 2 + t; y++) p.set(x, y, c('sand', 5));
      p.set(x, 5 + Math.round(Math.sin(x / 2 + seed) * 1), c('sand', 2));
    }
    return p;
  };
  book.add('sand', sandTop(1), { solid: SOLID });
  book.add('sandFill', sandFill(2), { solid: SOLID });
  // sandstone: layered, warm
  const rock = (seed: number, top: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('sand'), 0, 2, 0.5 + Math.sin(y / 2.2 + Math.sin((x + seed) / 5)) * 0.35, x, y));
    if (top) p.rect(0, 0, 20, 2, c('sand', 4)).rect(0, 2, 20, 1, c('sand', 1));
    return p;
  };
  book.add('rock', rock(3, false), { solid: SOLID });
  book.add('rockTop', rock(4, true), { solid: SOLID });
  // the canyon's ceiling, low over a passage one block high (its underside in shadow)
  const roofRock = rock(5, false);
  roofRock.rect(0, 17, 20, 3, c('sand', 0));
  book.add('roofRock', roofRock, { solid: SOLID });
  // in the canyon, out of the sun: shade (air)
  const shade = P();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) shade.set(x, y, shadeAt(R('sand'), 1, 2, 0.3 + y / 40, x, y));
  book.add('shade', shade, air);
  // a rock ledge to stand on
  const ledge = sky(7);
  for (let x = 0; x < 20; x++) for (let y = 4; y < 10 - Math.abs(x - 10) / 4; y++) ledge.set(x, y, shadeAt(R('sand'), 0, 3, 1 - (y - 4) / 6, x, y));
  book.add('ledge', ledge, { solid: LEDGE, grav: GRAV.down });

  // ---------- the sandstorm ----------
  // gusts blow left (and down): streaks of sand; between them the calm, a little dust hanging
  const storm = (f: number, blowing: boolean) => {
    const p = sky(20 + f, 3);
    if (blowing)
      for (let i = 0; i < 9; i++) {
        const y = (i * 7 + f * 3) % 20;
        const x0 = (i * 11 + f * 6) % 20;
        for (let x = 0; x < 7; x++) p.set((x0 + x) % 20, y, c('sand', x < 2 ? 5 : 3));
      }
    else for (let i = 0; i < 4; i++) p.set((i * 7 + f * 5) % 20, (i * 9 + f) % 20, c('sand', 4));
    return p;
  };
  const gust = GRAV.down | GRAV.left;
  book.add('gust0', storm(0, true), { grav: gust, next: 'gust1', ntime: GUST / 3 });
  book.add('gust1', storm(1, true), { grav: gust, next: 'gust2', ntime: GUST / 3 });
  book.add('gust2', storm(2, true), { grav: gust, next: 'calm0', ntime: GUST / 3 });
  book.add('calm0', storm(3, false), { grav: GRAV.down, next: 'calm1', ntime: CALM / 2 });
  book.add('calm1', storm(4, false), { grav: GRAV.down, next: 'gust0', ntime: CALM / 2 });
  // a boulder to shelter behind (solid, one block high)
  const boulder = sky(25);
  blob(boulder, 10, 12, 9.4, 8, R('sand'), 0, 3, 1.1);
  boulder.line(5, 9, 9, 14, c('sand', 0));
  book.add('boulder', boulder, { solid: SOLID });

  // ---------- plants and things ----------
  // cactus: solid, and it pricks every time he bumps it
  const cactus = sky(31);
  cactus.rect(8, 2, 5, 18, c('leaf', 2)).rect(8, 2, 1, 18, c('leaf', 1)).rect(11, 2, 1, 18, c('leaf', 3));
  cactus.rect(3, 8, 5, 3, c('leaf', 2)).rect(3, 4, 3, 5, c('leaf', 2)).rect(13, 10, 4, 3, c('leaf', 2)).rect(14, 6, 3, 5, c('leaf', 2));
  for (let y = 3; y < 19; y += 3) cactus.set(7, y, c('white', 2)).set(13, y + 1, c('white', 2));
  cactus.disc(10, 2, 1.4, c('pink', 2));
  book.add('cactus', cactus, { solid: SOLID, hp: -6 });
  // dry brush: tumbleweeds blow out of it
  const brush = sky(33);
  for (let i = 0; i < 16; i++) brush.line(10, 19, 10 + Math.cos(i * 0.4 + 3.4) * 8, 19 + Math.sin(i * 0.4 + 3.4) * 9, c('sand', i % 2 ? 1 : 2));
  book.add('brush', brush, { grav: GRAV.down, birthMon: MON.tumble, birthTime: TUMBLE_EVERY });
  // bones in the sand (scenery)
  const bones = sky(35);
  blob(bones, 6, 15, 4, 3, R('white'), 0, 2);
  bones.set(5, 14, c('ink', 0)).set(7, 14, c('ink', 0));
  for (let x = 10; x < 19; x += 2) bones.line(x, 18, x + 1, 13, c('white', 1));
  book.add('bones', bones, air);
  // palms at the oasis
  const trunk = sky(41);
  for (let y = 0; y < 20; y++) trunk.rect(8 + Math.round(Math.sin(y / 6)), y, 4, 1, c('wood', y % 4 === 0 ? 1 : 2));
  book.add('palm', trunk, air);
  const crown = sky(42);
  for (let a = 0; a < 7; a++) {
    const ang = Math.PI * (1.0 + (a / 6) * 1.0);
    for (let t = 0; t < 10; t++) crown.set(10 + Math.cos(ang) * t, 12 + Math.sin(ang) * t * 0.7 + t * t * 0.04, c('leaf', 1 + (t % 3)));
  }
  crown.rect(9, 12, 3, 8, c('wood', 2));
  book.add('palmTop', crown, air);
  // the oasis pool: one long drink, then it is just a pool (both are water you can stand in)
  const pool = (drunk: boolean) => {
    const p = sky(43);
    for (let x = 0; x < 20; x++) p.rect(x, 12, 1, 8, c('water', (x + (drunk ? 1 : 0)) % 5 === 0 ? 3 : 2));
    p.rect(0, 12, 20, 1, c('water', 3));
    if (!drunk) for (const x of [4, 13]) p.rect(x, 14, 3, 1, c('white', 2));
    blob(p, 2, 11, 3, 2, R('leaf'), 1, 3);
    return p;
  };
  book.add('pool', pool(false), { hp: 40, score: 10, grav: GRAV.down, touch: 'poolDrunk' });
  book.add('poolDrunk', pool(true), { grav: GRAV.down });

  // ---------- the poor, the gates, good things ----------
  addSoul(k, 'nomad', () => sky(51));
  addSoul(k, 'kids', () => sky(52));
  addGate(k, (seed) => rock(seed, false), () => shade.crop(0, 0, 20, 20));
  addGoodThings(k, () => sky(53));
  // and in the canyon's shade
  book.add('bgS', shade.crop(0, 0, 20, 20), air);
  addGoodThings(k, () => shade.crop(0, 0, 20, 20), 'S');
  // a coin glinting in the sand: points
  const glint = sky(55);
  glint.disc(10, 16, 2, c('gold', 3)).set(9, 15, c('gold', 4)).set(13, 11, c('star', 1)).set(7, 12, c('star', 1));
  book.add('glint', glint, { score: 25, touch: 'bg', grav: GRAV.down });

  // ---------- the tailor's tent at the end of the road ----------
  const tent = (part: number) => {
    const p = sky(60 + part, 3);
    const peak = (x: number) => 2 + Math.abs(x - 30) * 0.55;
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const gx = part * 20 + x;
        if (y + (part === 1 ? 0 : 0) < peak(gx) - (part < 3 ? 0 : 0)) continue;
        if (gx < 3 || gx > 57) continue;
        const stripe = Math.floor(gx / 6) % 2 === 0;
        p.set(x, y, stripe ? shadeAt(R('purple'), 1, 3, 0.7 - y / 60, x, y) : shadeAt(R('cloth'), 2, 3, 0.8 - y / 60, x, y));
      }
    return p;
  };
  // three blocks of tent roof over a doorway; the door is the way on
  for (let part = 0; part < 3; part++) book.add(`tent${part}`, tent(part), air);
  const tentWall = (door: boolean, sign: boolean) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, Math.floor(x / 6) % 2 === 0 ? c('purple', 2) : c('cloth', 3));
    if (door) for (let y = 3; y < 20; y++) for (let x = 4; x < 16; x++) p.set(x, y, shadeAt(R('wood'), 0, 2, y / 30, x, y));
    if (sign) {
      // a shop sign: a spool of thread with a needle through it
      p.rect(1, 2, 18, 13, c('cloth', 4)).frame(1, 2, 18, 13, c('wood', 1));
      p.rect(5, 5, 7, 2, c('wood', 2)).rect(5, 11, 7, 2, c('wood', 2)).rect(6, 7, 5, 4, c('red', 2));
      for (let y = 7; y < 11; y++) p.set(6 + (y % 2), y, c('red', 3));
      p.line(15, 4, 12, 13, c('steel', 3)).set(15, 4, c('steel', 1)).line(11, 9, 15, 6, c('red', 1));
    }
    return p;
  };
  book.add('tentWall', tentWall(false, false), air);
  book.add('tentSign', tentWall(false, true), air);
  book.add('tentDoor', tentWall(true, false), air);
  return k;
}
