// Stage 5: THE CPU. Leg A "The Pipeline" throws everything the virus has learned; leg B
// "The Core" is the last run before GLITCH itself.
import { HOVER_DROP, S_CURVE, SWEEP, ZIGZAG, diver, heavy, mine, mite, stalker, swooper } from '../characters/enemies';
import { strip, type Grid } from './mapkit';
import { buildPalette } from '../art/pal';
import { cpuArt, cpuTiles, cpuVirus } from '../blocks/cpu5';
import { kit, type Stage } from './stage';
import { bossGlitch } from '../bosses/boss5';

function virus5(b: Parameters<typeof cpuVirus>[0], p: Parameters<typeof cpuVirus>[1]): void {
  cpuVirus(b, p);
  mite(b, 'mite', [
    [3, 2, 6],
    [-6, 3, 6],
    [6, 3, 6],
    [-3, 12, 7],
  ]);
  diver(b, 'wasp', { score: 180, speed: 6, dive: 9 });
  swooper(b, 'eyeL', S_CURVE(-1, 6), { pic: 'eye', score: 180 });
  swooper(b, 'eyeR', S_CURVE(1, 6), { pic: 'eye', score: 180 });
  swooper(b, 'mothSL', SWEEP(-1, 7), { pic: 'moth', score: 180 });
  swooper(b, 'mothSR', SWEEP(1, 7), { pic: 'moth', score: 180 });
  swooper(b, 'eyeZ', ZIGZAG(1, 6), { pic: 'eye', score: 180 });
  swooper(b, 'mothD', HOVER_DROP(9), { pic: 'moth', score: 180 });
  stalker(b, 'slug', { hp: 4, speed: 2, score: 450 });
  heavy(b, 'bomb', { hp: 7, score: 700, speed: 1 });
  heavy(b, 'clawL', { hp: 2, score: 150 });
  heavy(b, 'clawR', { hp: 2, score: 150 });
  mine(b, 'cluster', { hp: 3 });
}

const conga = (g: Grid, c: number, d: number, n: number, name: string) => {
  for (let i = 0; i < n; i++) g.mon(c, d + i, name);
};

function glitch(g: Grid, c: number, d: number, w: number, h: number): void {
  g.rect(c, d, w, h, (cc, dd) => ((cc + dd) % 2 ? 'floor4' : 'floor0'));
}

function bombRow(g: Grid, c: number, d: number): void {
  g.mon(c - 1, d, 'clawL')
    .mon(c, d, 'bomb')
    .mon(c + 1, d, 'clawR');
}

function legA(g: Grid): void {
  for (let d = 1; d < 88; d++) if (d % 22 < 14) g.set(8, d, `clk${d % 4}`);
  g.stamp(1, 3, 'l1', 3, 3).stamp(12, 4, 'fpu', 3, 2);
  conga(g, 7, 9, 5, 'eyeR');
  conga(g, 9, 9, 5, 'eyeL');
  g.turret(3, 14, 'sweep').turret(12, 15, 'sweep');
  g.mon(5, 18, 'wasp').mon(11, 18, 'wasp');
  g.fence(1, 7, 23, 'A').fence(9, 14, 23, 'B');
  g.pickup(4, 25, 'nova').pickup(11, 25, 'bit');
  g.stamp(5, 27, 'alu', 4, 3);
  g.hatch(3, 28).hatch(12, 29);
  g.mon(8, 32, 'slug');
  conga(g, 8, 34, 5, 'mothSL');
  conga(g, 7, 34, 5, 'mothSR');
  // the registers, named like a 6502's: A, X, Y and the stack pointer
  for (let c = 2; c < 14; c++) if (c !== 8) g.set(c, 41, `reg${c % 4}`);
  g.set(2, 41, 'rnA').set(5, 41, 'rnX').set(9, 41, 'rnY').set(12, 41, 'rnSP');
  for (const [c, d] of [
    [3, 43],
    [6, 44],
    [10, 43],
    [13, 45],
  ])
    g.mon(c, d, 'cluster');
  g.current(1, 7, 47, 47, 'R');
  g.current(9, 14, 47, 47, 'L');
  bombRow(g, 8, 50);
  g.turret(2, 53, 'flak').turret(13, 53, 'flak').turret(5, 55, 'seeker');
  glitch(g, 9, 54, 4, 3);
  g.pickup(8, 58, 'bit').pickup(7, 58, 'bit').pickup(9, 58, 'bit');
  conga(g, 8, 60, 5, 'eyeZ');
  g.mon(4, 66, 'slug').mon(12, 66, 'slug');
  g.stamp(1, 68, 'fpu', 3, 2).stamp(12, 68, 'l1', 3, 3);
  g.fence(1, 14, 71, 'A');
  g.pickup(8, 73, 'repair');
  conga(g, 7, 75, 4, 'mothD');
  conga(g, 9, 75, 4, 'mothD');
  g.turret(4, 80, 'sweep').turret(11, 80, 'sweep');
  g.mon(3, 83, 'wasp').mon(7, 84, 'wasp').mon(12, 83, 'wasp');
}

function legB(g: Grid): void {
  for (let d = 1; d < 88; d++) if (d % 18 < 10) g.set(3, d, `clk${(d + 1) % 4}`).set(12, d, `clk${d % 4}`);
  g.stamp(5, 2, 'alu', 4, 3);
  bombRow(g, 8, 8);
  g.turret(2, 10, 'seeker').turret(13, 10, 'seeker');
  conga(g, 8, 13, 6, 'eyeR');
  glitch(g, 1, 18, 4, 4);
  glitch(g, 11, 20, 4, 4);
  g.hatch(2, 19).hatch(13, 21).hatch(7, 22);
  g.pickup(8, 25, 'nova');
  g.fence(1, 14, 27, 'B');
  g.mon(5, 29, 'slug').mon(10, 30, 'slug');
  conga(g, 7, 32, 5, 'mothSR');
  conga(g, 9, 32, 5, 'mothSL');
  g.stamp(1, 38, 'l1', 3, 3).stamp(12, 38, 'l1', 3, 3);
  g.turret(6, 39, 'sweep').turret(9, 40, 'sweep').turret(8, 43, 'flak');
  g.current(1, 14, 45, 45, 'R');
  g.pickup(3, 47, 'repair').pickup(12, 47, 'bit');
  bombRow(g, 6, 49);
  bombRow(g, 10, 51);
  for (const [c, d] of [
    [2, 54],
    [5, 55],
    [8, 54],
    [11, 56],
    [14, 55],
  ])
    g.mon(c, d, 'cluster');
  g.fence(1, 7, 58, 'A').fence(8, 14, 60, 'B');
  conga(g, 8, 62, 6, 'eyeZ');
  g.mon(4, 69, 'wasp').mon(12, 69, 'wasp').mon(6, 71, 'wasp').mon(10, 71, 'wasp');
  g.pickup(8, 72, 'life');
  g.turret(2, 74, 'seeker').turret(13, 74, 'seeker').turret(5, 76, 'flak').turret(10, 76, 'flak');
  glitch(g, 5, 78, 6, 3);
  g.hatch(6, 79).hatch(9, 79);
  g.mon(8, 82, 'slug');
  g.fence(1, 14, 85, 'A');
}

export function stage5(): Stage {
  const pal = buildPalette('cpu');
  const art = cpuArt(pal);
  const ks = kit(
    art,
    (bs) => cpuTiles(bs, art),
    (b) => virus5(b, pal),
    { mite: 'mite', turretEvery: 9, seekerEvery: 32, flakEvery: 24, hatchShut: 34, hatchOpen: 30, hatchEvery: 7, fenceOn: 24, fenceOff: 22 },
  );
  const a = strip(ks.bs, ks.beasts, art, 501);
  legA(a);
  a.sprinkle(
    [
      ['l1', 3, 3],
      ['fpu', 3, 2],
      ['reg0', 1, 1],
      ['reg2', 1, 1],
      ['floor4', 1, 1],
    ],
    14,
  );
  a.cardAt = 30;
  const b = strip(ks.bs, ks.beasts, art, 502);
  legB(b);
  b.sprinkle(
    [
      ['l1', 3, 3],
      ['fpu', 3, 2],
      ['reg0', 1, 1],
      ['reg2', 1, 1],
      ['floor4', 1, 1],
    ],
    14,
  );
  b.cardAt = 52;
  return {
    n: 5,
    id: 'cpu',
    title: 'The CPU',
    theme: 'cpu',
    pal,
    art,
    song: 'cpu.cmf',
    bossSong: 'glitch.cmf',
    legs: [
      {
        file: 's5a',
        kitFile: 's5',
        title: 'The Pipeline',
        kind: 'scroll',
        grid: a,
        kit: ks,
        card: ['Inside the 486 itself.', 'Everything the virus knows', 'is waiting for you.', 'A, X, Y: just like a 6502!'],
      },
      {
        file: 's5b',
        kitFile: 's5',
        title: 'The Core',
        kind: 'scroll',
        grid: b,
        kit: ks,
        card: ['The last run. GLITCH is', 'waiting at the end.', 'Save a Nova Bomb or two!'],
      },
      bossGlitch(art),
    ],
  };
}
