// Stage 4: THE HARD DISK. Leg A "The Platter" spins under the ship (rows of data streams
// that shove it left and right); leg B "Bad Sectors" crawls with virus. Then the Head Crash.
import { SPIN, S_CURVE, SWEEP, diver, heavy, mine, mite, stalker, swooper } from '../characters/enemies';
import { strip, type Grid } from './mapkit';
import { buildPalette } from '../art/pal';
import { diskArt, diskTiles, diskVirus } from '../blocks/disk4';
import { kit, type Stage } from './stage';
import { bossCrash } from '../bosses/boss4';

function virus4(b: Parameters<typeof diskVirus>[0], p: Parameters<typeof diskVirus>[1]): void {
  diskVirus(b, p);
  mite(b, 'mite', [
    [-3, 2, 5],
    [5, 3, 5],
    [-5, 3, 5],
    [2, 12, 6],
  ]);
  diver(b, 'skull', { score: 160, speed: 5, dive: 8 });
  swooper(b, 'skullL', S_CURVE(-1, 6), { pic: 'skull', score: 160 });
  swooper(b, 'skullR', S_CURVE(1, 6), { pic: 'skull', score: 160 });
  swooper(b, 'skullSL', SWEEP(-1, 7), { pic: 'skull', score: 160 });
  swooper(b, 'skullSR', SWEEP(1, 7), { pic: 'skull', score: 160 });
  // the hard disk's own move: skulls looping round like the platter
  swooper(b, 'skullO', SPIN(5), { pic: 'skull', score: 170 });
  stalker(b, 'slug', { hp: 4, speed: 1, score: 400 });
  heavy(b, 'tank', { hp: 6, score: 600, speed: 1 });
  heavy(b, 'tankL', { hp: 6, score: 600, speed: 2, dx: -9, pic: 'tank' });
  heavy(b, 'tankR', { hp: 6, score: 600, speed: 2, dx: 9, pic: 'tank' });
  mine(b, 'disc', { hp: 3, score: 150 });
}

const conga = (g: Grid, c: number, d: number, n: number, name: string) => {
  for (let i = 0; i < n; i++) g.mon(c, d + i, name);
};

/** The platter spinning: a band of rows pushing one way. */
function spin(g: Grid, d0: number, d1: number, dir: 'L' | 'R', c0 = 1, c1 = 14): void {
  g.current(c0, c1, d0, d1, dir);
  g.set(c0 - 1 >= 1 ? c0 - 1 : c0, d1 + 1, 'sector');
}

function badPatch(g: Grid, c: number, d: number, w: number, h: number): void {
  g.rect(c, d, w, h, 'bad');
}

function legA(g: Grid): void {
  g.stamp(1, 3, 'hub', 4, 4);
  for (let c = 1; c < 15; c++) g.set(c, 9, 'sector');
  conga(g, 8, 10, 5, 'skullR');
  spin(g, 16, 16, 'R');
  g.mon(5, 19, 'skull').mon(10, 20, 'skull');
  g.turret(13, 22, 'sweep').turret(2, 23, 'sweep');
  spin(g, 26, 26, 'L');
  g.mon(8, 28, 'slug');
  g.pickup(8, 31, 'nova').pickup(4, 31, 'bit').pickup(12, 31, 'bit');
  conga(g, 7, 33, 5, 'skullSL');
  conga(g, 9, 33, 5, 'skullSR');
  spin(g, 40, 41, 'R');
  for (const [c, d] of [
    [3, 43],
    [6, 45],
    [9, 44],
    [12, 46],
  ])
    g.mon(c, d, 'disc');
  g.stamp(11, 48, 'hub', 4, 4);
  g.turret(4, 50, 'flak').turret(8, 52, 'seeker');
  g.mon(6, 55, 'tank');
  spin(g, 58, 58, 'L');
  g.pickup(9, 60, 'repair');
  conga(g, 8, 62, 5, 'skullO');
  g.hatch(3, 66).hatch(12, 67);
  spin(g, 70, 71, 'R', 1, 8);
  spin(g, 70, 71, 'L', 9, 14);
  g.mon(5, 74, 'slug').mon(10, 75, 'slug');
  g.turret(2, 78, 'sweep').turret(13, 78, 'sweep');
  g.mon(4, 82, 'skull').mon(8, 83, 'skull').mon(12, 82, 'skull');
  spin(g, 85, 85, 'L');
}

function legB(g: Grid): void {
  g.stamp(12, 2, 'arm', 2, 5);
  badPatch(g, 2, 4, 3, 2);
  g.hatch(3, 5);
  conga(g, 8, 9, 5, 'skullL');
  g.mon(7, 15, 'tankL').mon(9, 15, 'tankR');
  badPatch(g, 9, 18, 4, 3);
  g.hatch(10, 19).hatch(12, 20);
  g.turret(3, 21, 'seeker');
  g.pickup(6, 24, 'nova');
  spin(g, 26, 26, 'R');
  g.stamp(2, 28, 'arm', 2, 5);
  conga(g, 8, 30, 5, 'skullO');
  g.fence(4, 14, 36, 'A');
  for (const [c, d] of [
    [5, 39],
    [8, 40],
    [11, 39],
  ])
    g.mon(c, d, 'disc');
  badPatch(g, 1, 42, 4, 3);
  badPatch(g, 11, 43, 4, 3);
  g.hatch(2, 43).hatch(13, 44);
  g.mon(8, 46, 'slug');
  g.turret(7, 49, 'flak').turret(4, 51, 'sweep').turret(11, 51, 'sweep');
  g.pickup(8, 53, 'bit').pickup(2, 54, 'bit').pickup(13, 54, 'bit');
  spin(g, 56, 57, 'L');
  g.mon(8, 60, 'tank');
  conga(g, 7, 62, 4, 'skullR');
  conga(g, 9, 62, 4, 'skullL');
  g.stamp(12, 66, 'arm', 2, 5);
  badPatch(g, 2, 68, 5, 2);
  g.hatch(4, 68);
  g.fence(1, 7, 72, 'B').fence(8, 14, 74, 'A');
  g.pickup(8, 76, 'life');
  g.turret(3, 78, 'seeker').turret(12, 78, 'seeker');
  g.mon(5, 81, 'skull').mon(8, 82, 'skull').mon(11, 81, 'skull');
  spin(g, 84, 84, 'R');
}

export function stage4(): Stage {
  const pal = buildPalette('disk');
  const art = diskArt(pal);
  const ks = kit(
    art,
    (bs) => diskTiles(bs, art),
    (b) => virus4(b, pal),
    { mite: 'mite', turretEvery: 10, seekerEvery: 36, flakEvery: 26, hatchShut: 36, hatchOpen: 30, hatchEvery: 7, fenceOn: 24, fenceOff: 24 },
  );
  const a = strip(ks.bs, ks.beasts, art, 401);
  legA(a);
  a.sprinkle(
    [
      ['bad', 1, 1],
      ['sector', 1, 1],
      ['hub', 4, 4],
      ['floor4', 1, 1],
    ],
    14,
  );
  a.cardAt = 42;
  const b = strip(ks.bs, ks.beasts, art, 402);
  legB(b);
  b.sprinkle(
    [
      ['bad', 1, 1],
      ['sector', 1, 1],
      ['hub', 4, 4],
      ['floor4', 1, 1],
    ],
    14,
  );
  b.cardAt = 20;
  return {
    n: 4,
    id: 'disk',
    title: 'The Hard Disk',
    theme: 'disk',
    pal,
    art,
    song: 'disk.cmf',
    bossSong: 'boss.cmf',
    legs: [
      {
        file: 's4a',
        kitFile: 's4',
        title: 'The Platter',
        kind: 'scroll',
        grid: a,
        kit: ks,
        card: ['The platter spins: data', 'streams shove you hard.', 'Steer against them! Skulls', 'loop around with it.'],
      },
      {
        file: 's4b',
        kitFile: 's4',
        title: 'Bad Sectors',
        kind: 'scroll',
        grid: b,
        kit: ks,
        card: ['Bad sectors are crawling', 'with virus. Heavy tanks', 'cut across the lane.'],
      },
      bossCrash(art),
    ],
  };
}
