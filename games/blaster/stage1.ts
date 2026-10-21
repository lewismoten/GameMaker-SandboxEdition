// Stage 1: THE MOTHERBOARD. Leg A "The Data Bus" teaches everything gently; leg B "The
// Chipset" brings sweeping turrets, hatches and firewalls; then the BIOS Bug.
import { boardArt, boardTiles, boardVirus } from './board';
import { HOVER_DROP, S_CURVE, SWEEP, ZIGZAG, diver, heavy, mine, mite, swooper } from './enemies';
import { LENGTH, strip, type Grid } from './mapkit';
import { buildPalette } from './pal';
import { kit, type Stage } from './stage';
import { bossBIOS } from './boss1';

function virus1(b: Parameters<typeof boardVirus>[0], p: Parameters<typeof boardVirus>[1]): void {
  boardVirus(b, p);
  mite(b, 'mite', [
    [1, 2, 3],
    [-2, 3, 3],
    [2, 3, 3],
    [-1, 12, 4],
  ]);
  diver(b, 'biter', { score: 100 });
  swooper(b, 'mothL', S_CURVE(-1), { pic: 'moth' });
  swooper(b, 'mothR', S_CURVE(1), { pic: 'moth' });
  swooper(b, 'mothSL', SWEEP(-1), { pic: 'moth' });
  swooper(b, 'mothSR', SWEEP(1), { pic: 'moth' });
  swooper(b, 'mothZ', ZIGZAG(1), { pic: 'moth' });
  swooper(b, 'mothD', HOVER_DROP(), { pic: 'moth' });
  heavy(b, 'bomb', { hp: 4, score: 400 });
  heavy(b, 'clawL', { score: 100 });
  heavy(b, 'clawR', { score: 100 });
  mine(b, 'cluster');
}

/** A vertical run of the data bus from d0 to d1 at column c (4 lanes). */
function bus(g: Grid, c: number, d0: number, d1: number): void {
  for (let d = d0; d <= d1; d++) g.set(c, d, 'bus_ns');
}

function chip(g: Grid, c: number, d: number, h: number, label = 0): void {
  for (let r = 0; r < h; r++) {
    const pr = r === 0 ? 0 : r === h - 1 ? 2 : 1;
    const dd = d + (h - 1 - r);
    g.set(c, dd, `chip${pr}0`)
      .set(c + 1, dd, pr === 1 && r === 1 ? `chipL${label}` : `chip${pr}1`)
      .set(c + 2, dd, `chip${pr}2`);
  }
}

/** A stack of n identical swoopers in one column: they wake one after another (a conga line). */
function conga(g: Grid, c: number, d: number, n: number, name: string): void {
  for (let i = 0; i < n; i++) g.mon(c, d + i, name);
}

function heavyBomb(g: Grid, c: number, d: number): void {
  g.mon(c - 1, d, 'clawL')
    .mon(c, d, 'bomb')
    .mon(c + 1, d, 'clawR');
}

function legA(g: Grid): void {
  // the bus runs up the middle of the board, branching around the chips
  bus(g, 7, 1, 30);
  g.set(7, 31, 'bus_se');
  g.stamp(1, 4, 'capB', 2, 2).stamp(13, 9, 'capG', 2, 2).set(12, 3, 'ledR').set(3, 14, 'resV').set(12, 15, 'resH');
  conga(g, 8, 12, 4, 'mothR');
  for (const c of [4, 6, 8, 10]) g.pickup(c, 19, 'bit');
  g.mon(4, 24, 'biter').mon(11, 25, 'biter');
  chip(g, 1, 27, 5, 0);
  g.turret(12, 30, 'down');
  g.stamp(10, 33, 'xtal', 2, 1);
  conga(g, 7, 35, 4, 'mothL');
  g.pickup(8, 41, 'nova');
  for (let c = 8; c < 15; c++) g.set(c, 31, c === 14 ? 'tr_nw' : 'bus_ew');
  bus(g, 14, 32, 40);
  g.stamp(2, 44, 'cs', 4, 4);
  g.hatch(7, 46);
  g.set(6, 49, 'ledG').set(1, 50, 'ledR');
  g.mon(5, 52, 'biter').mon(10, 53, 'biter').mon(8, 55, 'biter');
  g.turret(3, 58, 'sweep').turret(12, 59, 'sweep');
  chip(g, 11, 61, 4, 2);
  for (const [c, d] of [
    [3, 63],
    [7, 65],
    [10, 64],
    [5, 68],
  ])
    g.mon(c, d, 'cluster');
  g.pickup(8, 69, 'bit').pickup(9, 69, 'bit');
  heavyBomb(g, 8, 72);
  g.pickup(3, 74, 'repair');
  g.stamp(12, 75, 'capB', 2, 2);
  conga(g, 7, 78, 3, 'mothR');
  conga(g, 9, 79, 3, 'mothL');
  g.mon(4, 83, 'biter').mon(12, 83, 'biter');
  bus(g, 7, 76, LENGTH - 1);
}

function legB(g: Grid): void {
  bus(g, 4, 1, 20);
  bus(g, 11, 1, 20);
  g.stamp(6, 3, 'capG', 2, 2);
  g.turret(8, 9, 'sweep');
  conga(g, 8, 13, 5, 'mothSL');
  g.fence(2, 13, 18, 'A');
  g.pickup(7, 21, 'nova').pickup(8, 21, 'bit');
  chip(g, 1, 23, 6, 1);
  chip(g, 12, 25, 6, 3);
  g.hatch(5, 26).hatch(10, 28);
  g.mon(7, 31, 'biter').mon(9, 32, 'biter');
  g.stamp(6, 35, 'cs', 4, 4);
  g.turret(4, 36, 'sweep').turret(11, 37, 'sweep');
  conga(g, 8, 42, 5, 'mothZ');
  g.fence(1, 7, 47, 'A').fence(8, 14, 49, 'B');
  for (const [c, d] of [
    [4, 52],
    [11, 53],
    [7, 55],
  ])
    g.mon(c, d, 'cluster');
  heavyBomb(g, 8, 57);
  g.pickup(12, 58, 'repair');
  g.turret(2, 61, 'seeker');
  for (let i = 0; i < 4; i++) g.mon(5 + i * 2, 63 + (i % 2), 'mothD');
  g.stamp(12, 64, 'capB', 2, 2).set(1, 65, 'ledG');
  chip(g, 1, 67, 4, 4);
  conga(g, 7, 69, 4, 'mothSR');
  conga(g, 9, 69, 4, 'mothSL');
  g.turret(13, 73, 'sweep').turret(5, 74, 'down');
  g.pickup(9, 76, 'life');
  g.mon(4, 79, 'biter').mon(8, 80, 'biter').mon(12, 79, 'biter');
  g.fence(1, 14, 83, 'B');
  bus(g, 8, 84, LENGTH - 1);
}

export function stage1(): Stage {
  const pal = buildPalette('board');
  const art = boardArt(pal);
  const opts = { mite: 'mite', turretEvery: 14, seekerEvery: 50, hatchShut: 50, hatchOpen: 30, hatchEvery: 10, fenceOn: 30, fenceOff: 30 };
  const scroll = () =>
    kit(
      art,
      (bs) => boardTiles(bs, art),
      (b) => virus1(b, pal),
      opts,
    );
  const ka = scroll();
  const kb = ka;
  const a = strip(ka.bs, ka.beasts, art, 101);
  legA(a);
  a.sprinkle(
    [
      ['capB', 2, 2],
      ['capG', 2, 2],
      ['resH', 1, 1],
      ['resV', 1, 1],
      ['ledR', 1, 1],
      ['ledG', 1, 1],
      ['xtal', 2, 1],
    ],
    14,
  );
  const b = strip(kb.bs, kb.beasts, art, 102);
  legB(b);
  b.sprinkle(
    [
      ['capB', 2, 2],
      ['capG', 2, 2],
      ['resH', 1, 1],
      ['resV', 1, 1],
      ['ledR', 1, 1],
      ['ledG', 1, 1],
      ['xtal', 2, 1],
    ],
    14,
  );
  return {
    n: 1,
    id: 'board',
    title: 'The Motherboard',
    theme: 'board',
    pal,
    art,
    song: 'board.cmf',
    bossSong: 'boss.cmf',
    legs: [
      {
        file: 's1a',
        kitFile: 's1',
        title: 'The Data Bus',
        kind: 'scroll',
        grid: a,
        kit: ka,
        card: ['Follow the data bus north.', 'Every move fires the guns.', 'SPACE: Nova Bomb'],
      },
      {
        file: 's1b',
        kitFile: 's1',
        title: 'The Chipset',
        kind: 'scroll',
        grid: b,
        kit: kb,
        card: ['Turrets sweep, firewalls', 'blink. Shoot the collars', 'off the turrets!'],
      },
      bossBIOS(art),
    ],
  };
}
