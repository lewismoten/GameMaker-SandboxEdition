// The ground: falling-snow yards (four frames chained by next/ntime), deep snow that is solid
// and pays a dollar when pushed (its touch swaps in the cleared block), the mall lot that
// dusts over and fills back in on a timer, roads, plow banks that hand out snowballs, ice
// whose gravity slides you the way the chevrons point, and the footbridge. Returns the
// painters other areas reuse.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, shadeAt, speckle } from '../art/draw';
import { THROWSEQ } from '../ids';
import { Ctx, MONEY, SOLID } from './book';

export function addGround(k: Ctx) {
  const { book, R, c, snow, P } = k;
  // ---------- ground ----------
  const yardBase = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, snow, 5, 1, seed, 0.16);
    const r = rng(seed + 9);
    // soft drifts
    for (let k = 0; k < 2; k++) {
      const x0 = Math.floor(r() * 16);
      const y0 = Math.floor(r() * 18);
      for (let x = 0; x < 6; x++) p.set((x0 + x) % 20, y0 + (x > 1 && x < 5 ? 0 : 1), c('snow', 4));
    }
    return p;
  };
  const flakes = (p: Pixels, seed: number, frame: number) => {
    const r = rng(seed);
    for (let k = 0; k < 4; k++) {
      const x = Math.floor(r() * 19);
      const y = (Math.floor(r() * 20) + frame * 5) % 20;
      p.set(x + 1, (y + 1) % 20, c('snow', 3));
      p.set(x, y, c('snow', 6));
      if (k === 0) p.set(x + 1, y, c('snow', 6));
    }
    return p;
  };
  for (const v of ['A', 'B'])
    for (let f = 0; f < 4; f++) {
      const seed = v === 'A' ? 11 : 23;
      book.add(`yard${v}${f}`, flakes(yardBase(seed), seed * 7, f), { next: `yard${v}${(f + 1) % 4}`, ntime: 4 });
    }
  book.add('plain', yardBase(31));

  const mound = (bg: Pixels, seed: number, bright = 0) => {
    const p = blob(bg, 10, 10.5, 10.6, 10, snow, 2 + bright, 6, 1.1);
    const r = rng(seed);
    for (let k = 0; k < 3; k++) p.set(3 + Math.floor(r() * 12), 2 + Math.floor(r() * 8), c('snow', 6));
    // crisp shadow line under the lump
    for (let x = 3; x < 17; x++) if (p.get(x, 19) !== snow[2]) p.set(x, 19, c('snow', 1));
    return p;
  };
  const asphalt = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('asphalt'), 2, 1, seed, 0.3);
    const r = rng(seed);
    for (let k = 0; k < 3; k++) {
      const y = 2 + Math.floor(r() * 16);
      const x = Math.floor(r() * 8);
      for (let i = 0; i < 8; i++) p.set(x + i, y, c('asphalt', 3));
    }
    // snow left at the edges by the shovel
    for (let y = 0; y < 20; y += 3) {
      p.set(0, y + (seed % 2), c('snow', 4));
      p.set(19, y + 1, c('snow', 4));
    }
    return p;
  };
  const sidewalk = (seed: number) => {
    const p = speckle(P(), 0, 0, 20, 20, R('concrete'), 2, 1, seed, 0.2);
    p.rect(0, 0, 20, 1, c('concrete', 0)).rect(0, 0, 1, 20, c('concrete', 0));
    p.rect(0, 10, 20, 1, c('concrete', 1));
    p.set(1, 1, c('snow', 5)).set(2, 1, c('snow', 4)).set(18, 18, c('snow', 5));
    return p;
  };
  const lot = (seed: number) => {
    return speckle(P(), 0, 0, 20, 20, R('asphalt'), 1, 1, seed, 0.3);
  };

  // Shoveling: deep snow is solid; pushing into it scoops it (and pays a dollar).
  book.add('asphalt', asphalt(41));
  book.add('deep', mound(asphalt(41), 5), { solid: SOLID, effect: MONEY, eamt: 1, score: 10, touch: 'asphalt' });
  book.add('walk', sidewalk(43));
  book.add('deepWalk', mound(sidewalk(43), 6), { solid: SOLID, effect: MONEY, eamt: 1, score: 10, touch: 'walk' });
  // The mall lot: a cleared space slowly dusts over and fills back in (a global squall).
  book.add('lot', lot(47), { next: 'lotDust', ntime: 540 });
  const dust = lot(47);
  const rd = rng(5);
  for (let k = 0; k < 90; k++) dust.set(Math.floor(rd() * 20), Math.floor(rd() * 20), c('snow', 4 + (k % 3 === 0 ? 1 : 0)));
  book.add('lotDust', dust, { next: 'lotRefill', ntime: 70 });
  book.add('lotRefill', mound(lot(47), 9, 1), { solid: SOLID, effect: MONEY, eamt: 1, score: 10, touch: 'lotDone', next: 'lot', ntime: 160 });
  book.add('lotDone', lot(47));
  book.add('deepLot', mound(lot(47), 8), { solid: SOLID, effect: MONEY, eamt: 1, score: 10, touch: 'lot' });

  // Roads: two lanes, slushy tire tracks, a yellow center line.
  const road = (line: boolean) => {
    const p = speckle(P(), 0, 0, 20, 20, R('asphalt'), 1, 1, 61, 0.25);
    for (const y of line ? [3, 4] : [14, 15]) for (let x = 0; x < 20; x++) p.set(x, y, shadeAt(R('snow'), 1, 2, ((x * 7) % 5) / 5, x, y));
    if (line) for (let x = 2; x < 14; x++) p.set(x, 18, c('gold', 3)).set(x, 19, c('gold', 2));
    return p;
  };
  book.add('roadA', road(true));
  book.add('roadB', road(false));

  // Plow banks: solid, packed snow; scooping one gives snowballs.
  const bankBg = () => speckle(P(), 0, 0, 20, 20, snow, 3, 1, 71, 0.4);
  const dirty = (p: Pixels, seed: number) => {
    const r = rng(seed);
    for (let k = 0; k < 14; k++) {
      const x = Math.floor(r() * 20);
      const y = Math.floor(r() * 20);
      if (p.get(x, y) !== c('snow', 3)) p.set(x, y, c('asphalt', 3 + (k % 2)));
    }
    return p;
  };
  book.add('bank0', dirty(bankBg(), 3));
  book.add('bank1', dirty(blob(bankBg(), 10, 12, 8, 7, snow, 1, 6), 4), { solid: SOLID, effect: THROWSEQ, eamt: 2, score: 5, touch: 'bank0' });
  const bank2 = blob(bankBg(), 6, 12, 7, 7, snow, 1, 6);
  blob(bank2, 14, 11, 7, 8, snow, 1, 6);
  book.add('bank2', dirty(bank2, 5), { solid: SOLID, effect: THROWSEQ, eamt: 3, score: 5, touch: 'bank1' });

  // Ice: gravity slides you the way the chevrons point.
  const ice = (dir: 'N' | 'E' | 'S' | 'W') => {
    const p = speckle(P(), 0, 0, 20, 20, R('ice'), 3, 1, 81, 0.2);
    for (let k = -20; k < 20; k += 7) for (let i = 0; i < 6; i++) p.set(k + i + 6, 14 - i, c('ice', 4));
    const chev = (x: number, y: number) => {
      for (let i = 0; i < 4; i++) {
        const [a, b] = dir === 'E' ? [x + i, y - 3 + i] : dir === 'W' ? [x - i, y - 3 + i] : dir === 'S' ? [x - 3 + i, y + i] : [x - 3 + i, y - i];
        const [a2, b2] = dir === 'E' ? [x + i, y + 3 - i] : dir === 'W' ? [x - i, y + 3 - i] : dir === 'S' ? [x + 3 - i, y + i] : [x + 3 - i, y - i];
        p.set(a, b, c('ice', 1)).set(a2, b2, c('ice', 1));
      }
    };
    if (dir === 'E' || dir === 'W') chev(dir === 'E' ? 7 : 12, 10);
    else chev(10, dir === 'S' ? 7 : 12);
    return p;
  };
  book.add('iceN', ice('N'), { grav: 1 });
  book.add('iceE', ice('E'), { grav: 2 });
  book.add('iceS', ice('S'), { grav: 4 });
  book.add('iceW', ice('W'), { grav: 8 });

  const bridge = () => {
    const p = P();
    for (let y = 0; y < 20; y++) {
      const plank = Math.floor(y / 4);
      for (let x = 0; x < 20; x++) p.set(x, y, c('wood', y % 4 === 3 ? 0 : 2 + ((plank + (x > 9 ? 1 : 0)) % 2)));
    }
    p.rect(0, 0, 2, 20, c('wood', 0)).rect(18, 0, 2, 20, c('wood', 0));
    for (let y = 1; y < 20; y += 4) p.set(4 + (y % 7), y, c('snow', 5)).set(12, y + 1, c('snow', 4));
    return p;
  };
  book.add('bridge', bridge());
  return { yardBase, sidewalk, lot };
}
