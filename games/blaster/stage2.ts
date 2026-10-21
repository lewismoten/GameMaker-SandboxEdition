// Stage 2: MEMORY LANE. Leg A "The Address Bus" brings the data streams (gravity blocks
// that shove the ship sideways) and the slugs that never stop coming; leg B "The Cache"
// runs between rows of chips. Then the Memory Leech.
import { HOVER_DROP, S_CURVE, SWEEP, ZIGZAG, diver, heavy, mine, mite, stalker, swooper } from './enemies';
import { strip, type Grid } from './mapkit';
import { buildPalette } from './pal';
import { ramArt, ramTiles, ramVirus } from './ram';
import { kit, type Stage } from './stage';
import { bossLeech } from './boss2';

function virus2(b: Parameters<typeof ramVirus>[0], p: Parameters<typeof ramVirus>[1]): void {
  ramVirus(b, p);
  mite(b, 'mite', [
    [-2, 2, 4],
    [3, 3, 4],
    [-3, 3, 4],
    [1, 12, 5],
  ]);
  diver(b, 'bat', { score: 120, speed: 4, dive: 6 });
  swooper(b, 'eyeL', S_CURVE(-1, 5), { pic: 'eye', score: 120 });
  swooper(b, 'eyeR', S_CURVE(1, 5), { pic: 'eye', score: 120 });
  swooper(b, 'eyeSL', SWEEP(-1, 6), { pic: 'eye', score: 120 });
  swooper(b, 'eyeSR', SWEEP(1, 6), { pic: 'eye', score: 120 });
  swooper(b, 'eyeZ', ZIGZAG(1, 4), { pic: 'eye', score: 120 });
  swooper(b, 'eyeD', HOVER_DROP(7), { pic: 'eye', score: 120 });
  stalker(b, 'slug', { hp: 3, speed: 1, score: 300 });
  heavy(b, 'crawler', { hp: 4, score: 350, speed: 2 });
  heavy(b, 'crawlerL', { hp: 4, score: 350, speed: 2, dx: -8, pic: 'crawler' });
  heavy(b, 'crawlerR', { hp: 4, score: 350, speed: 2, dx: 8, pic: 'crawler' });
  mine(b, 'cluster', { hp: 2 });
}

const conga = (g: Grid, c: number, d: number, n: number, name: string) => {
  for (let i = 0; i < n; i++) g.mon(c, d + i, name);
};

function dram(g: Grid, c: number, d: number, kind: 'A' | 'B' = 'A'): void {
  g.stamp(c, d, `dram${kind}`, 2, 3);
}

/** A data stream: the address comb on one side, the current across. */
function stream(g: Grid, c0: number, c1: number, d: number, dir: 'L' | 'R'): void {
  g.current(c0, c1, d, d, dir);
  if (dir === 'R' && c0 > 1) g.set(c0 - 1, d, 'combEnd');
  if (dir === 'L' && c1 < 14) g.set(c1 + 1, d, 'combEndR');
}

function legA(g: Grid): void {
  dram(g, 1, 2);
  dram(g, 13, 4, 'B');
  for (let c = 4; c < 12; c++) g.set(c, 6, `ref${c % 4}`);
  conga(g, 8, 10, 4, 'eyeR');
  g.pickup(8, 15, 'bit').pickup(7, 15, 'bit');
  stream(g, 2, 9, 18, 'R');
  g.mon(5, 22, 'bat').mon(11, 22, 'bat');
  stream(g, 6, 13, 26, 'L');
  g.mon(8, 30, 'slug');
  g.turret(3, 31, 'down').turret(12, 31, 'down');
  dram(g, 1, 33);
  dram(g, 13, 33, 'B');
  conga(g, 7, 36, 5, 'eyeL');
  g.pickup(8, 42, 'nova');
  stream(g, 1, 7, 44, 'R');
  stream(g, 8, 14, 45, 'L');
  g.mon(4, 47, 'cluster').mon(11, 48, 'cluster').mon(7, 50, 'cluster');
  g.stamp(6, 52, 'cache', 4, 2);
  g.turret(2, 55, 'flak').turret(13, 55, 'flak');
  g.mon(8, 58, 'crawler');
  g.mon(5, 61, 'slug').mon(11, 63, 'slug');
  for (let c = 3; c < 13; c++) g.set(c, 66, `ref${c % 4}`);
  g.pickup(12, 67, 'repair');
  stream(g, 3, 12, 69, 'R');
  conga(g, 8, 72, 4, 'eyeSL');
  conga(g, 7, 72, 4, 'eyeSR');
  g.hatch(4, 76).hatch(11, 77);
  g.mon(5, 80, 'bat').mon(8, 81, 'bat').mon(11, 80, 'bat');
  stream(g, 1, 14, 84, 'L');
}

function legB(g: Grid): void {
  // the cache: two rows of chips make a lane up the middle, with turrets in the gaps
  for (let d = 2; d < 30; d += 4) {
    dram(g, 1, d, d % 8 ? 'A' : 'B');
    dram(g, 13, d + 1, d % 8 ? 'B' : 'A');
  }
  g.turret(3, 8, 'sweep').turret(12, 12, 'sweep');
  conga(g, 8, 6, 5, 'eyeZ');
  g.mon(6, 14, 'slug').mon(9, 16, 'slug');
  g.turret(3, 20, 'seeker').turret(12, 24, 'seeker');
  g.pickup(7, 21, 'nova').pickup(8, 27, 'repair');
  stream(g, 3, 12, 31, 'R');
  g.mon(7, 34, 'crawlerL').mon(9, 34, 'crawlerR');
  g.stamp(1, 37, 'cache', 4, 2).stamp(11, 37, 'cache', 4, 2);
  g.hatch(7, 38).hatch(8, 40);
  conga(g, 8, 43, 5, 'eyeD');
  g.fence(1, 14, 48, 'A');
  for (const [c, d] of [
    [3, 50],
    [6, 52],
    [9, 51],
    [12, 53],
  ])
    g.mon(c, d, 'cluster');
  stream(g, 1, 7, 55, 'L');
  stream(g, 8, 14, 55, 'R');
  g.turret(7, 58, 'flak').turret(4, 60, 'sweep').turret(11, 60, 'sweep');
  g.mon(8, 62, 'slug');
  g.pickup(2, 63, 'bit').pickup(13, 63, 'bit').pickup(8, 64, 'life');
  for (let d = 66; d < 82; d += 4) {
    dram(g, 1, d);
    dram(g, 13, d + 2, 'B');
  }
  conga(g, 7, 67, 4, 'eyeR');
  conga(g, 9, 67, 4, 'eyeL');
  g.mon(8, 72, 'crawler');
  g.turret(4, 75, 'seeker').turret(11, 76, 'seeker');
  g.mon(5, 79, 'bat').mon(10, 80, 'bat').mon(7, 82, 'bat');
  g.fence(1, 14, 85, 'B');
}

export function stage2(): Stage {
  const pal = buildPalette('ram');
  const art = ramArt(pal);
  const ks = kit(
    art,
    (bs) => ramTiles(bs, art),
    (b) => virus2(b, pal),
    { mite: 'mite', turretEvery: 12, seekerEvery: 45, flakEvery: 34, hatchShut: 45, hatchOpen: 30, hatchEvery: 8, fenceOn: 28, fenceOff: 28 },
  );
  const a = strip(ks.bs, ks.beasts, art, 201);
  legA(a);
  a.sprinkle([['dramA', 2, 3], ['dramB', 2, 3], ['comb', 1, 1], ['ref0', 1, 1], ['ref2', 1, 1]], 14);
  a.cardAt = 44;
  const b = strip(ks.bs, ks.beasts, art, 202);
  legB(b);
  b.sprinkle([['dramA', 2, 3], ['dramB', 2, 3], ['comb', 1, 1], ['ref0', 1, 1], ['ref2', 1, 1]], 14);
  b.cardAt = 14;
  return {
    n: 2,
    id: 'ram',
    title: 'Memory Lane',
    theme: 'ram',
    pal,
    art,
    song: 'ram.cmf',
    bossSong: 'boss.cmf',
    legs: [
      {
        file: 's2a',
        kitFile: 's2',
        title: 'The Address Bus',
        kind: 'scroll',
        grid: a,
        kit: ks,
        card: ['Data streams shove you', 'sideways. Leak Slugs never', 'stop coming: shoot them!'],
      },
      {
        file: 's2b',
        kitFile: 's2',
        title: 'The Cache',
        kind: 'scroll',
        grid: b,
        kit: ks,
        card: ['A lane between the chips.', 'Mind the crawlers that cut', 'across it.'],
      },
      bossLeech(art),
    ],
  };
}
