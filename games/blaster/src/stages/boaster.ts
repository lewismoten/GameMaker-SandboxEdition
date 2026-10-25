// Stage 3-C: THE BIG NAME. Up the face of the Sound Boaster from its gold edge fingers to the
// top of the card, past SOUND BOASTER in letters two blocks tall. Beepers (PC-speaker
// gremlins) dive, chords of three Note-heads sweep across together, the line-out jacks on the
// bracket roll sound waves across the board along their traces, and the YO MAMA! FM chip
// laughs HAs out of its corners until its collars are shot off.
import { HOP, S_CURVE, SWEEP, diver, heavy, mine, mite, swooper } from '../characters/enemies';
import type { Bestiary } from '../characters/mons';
import type { Pal } from '../art/pal';
import { POWER } from '../ids';
import { boasterArt, boasterTiles, boasterVirus } from '../blocks/boaster3';
import { finePrint, nameTiles } from '../blocks/boasterName';
import { strip, type Grid } from './mapkit';
import { kit, type Leg } from './stage';

function virus(b: Bestiary, p: Pal): void {
  boasterVirus(b, p);
  mite(b, 'mite', [
    [3, 1, 5],
    [-4, 3, 5],
    [4, 3, 5],
    [-2, 12, 6],
  ]);
  diver(b, 'beeper', { score: 150, speed: 4, dive: 6 });
  swooper(b, 'noteL', S_CURVE(-1, 5), { pic: 'note', score: 150 });
  swooper(b, 'noteR', S_CURVE(1, 5), { pic: 'note', score: 150 });
  swooper(b, 'noteHR', HOP(1, 5), { pic: 'note', score: 160 });
  // a chord: three Note-heads side by side on the same sweep
  swooper(b, 'chordL', SWEEP(-1, 5), { pic: 'noteG', score: 120 });
  swooper(b, 'chordR', SWEEP(1, 5), { pic: 'noteG', score: 120 });
  // the FM chip's laugh: HAs drift down and out to its side
  mite(
    b,
    'haL',
    [
      [-2, 2, 3],
      [-2, 3, 3],
      [0, 12, 4],
    ],
    { pic: 'ha', score: 100 },
  );
  mite(
    b,
    'haR',
    [
      [2, 2, 3],
      [2, 3, 3],
      [0, 12, 4],
    ],
    { pic: 'ha', score: 100 },
  );
  // a sound wave rolls right across the lane along its trace; a shot breaks it up
  b.add('wave', {
    power: POWER.bullet,
    end: -1,
    pics: [
      ['wave0', 3],
      ['wave1', 3],
    ],
    path: [[15, 0, 5]],
  });
  heavy(b, 'amp', { hp: 5, score: 500, speed: 1 });
  mine(b, 'disc', { hp: 3, score: 120 });
}

const conga = (g: Grid, c: number, d: number, n: number, name: string) => {
  for (let i = 0; i < n; i++) g.mon(c, d + i, name);
};

const chord = (g: Grid, c: number, d: number, name: string) => {
  for (let k = 0; k < 3; k++) g.mon(c + k, d, name);
};

/** A line-out jack on the bracket and the trace its waves run along. */
function waveLane(g: Grid, d: number): void {
  g.set(0, d, 'jackW');
  for (let c = 1; c < 15; c++) g.set(c, d, 'wTrace');
}

function layout(g: Grid, name: string[][], fine: string[]): void {
  // the edge connector, where the card plugs into the motherboard
  for (let c = 2; c < 14; c++) g.set(c, -2, 'fingTop').set(c, -3, 'fing').set(c, -4, 'fing').set(c, -5, 'fingEnd');
  // the board
  g.set(12, 4, 'xtal').set(3, 5, 'capB').set(4, 5, 'capK');
  g.stamp(2, 8, 'qc', 3, 1);
  g.pickup(8, 7, 'bit');
  g.mon(5, 10, 'beeper').mon(10, 12, 'beeper');
  g.stamp(10, 15, 'dsp', 3, 2);
  conga(g, 5, 15, 5, 'noteR');
  g.set(0, 15, 'jackG').set(0, 16, 'jackP');
  g.pickup(8, 20, 'nova');
  waveLane(g, 22);
  g.mon(3, 25, 'beeper').mon(8, 26, 'beeper').mon(12, 25, 'beeper');
  waveLane(g, 28);
  g.stamp(0, 30, 'wheel', 2, 2);
  chord(g, 5, 32, 'chordL');
  chord(g, 8, 35, 'chordR');
  // the FM chip, and the collars on its laughing corners
  g.stamp(5, 38, 'ym', 5, 2);
  g.mon(5, 38, 'ring3').mon(9, 38, 'ring3');
  g.pickup(2, 41, 'repair');
  // the name, its fine print under it
  fine.forEach((n, k) => g.set(4 + k, 43, n));
  name.forEach((row, r) => row.forEach((n, c) => g.set(1 + c, 48 - r, n)));
  chord(g, 1, 46, 'chordR');
  g.mon(3, 51, 'beeper').mon(12, 51, 'beeper');
  waveLane(g, 54);
  g.stamp(10, 57, 'amp', 3, 1);
  g.mon(4, 58, 'amp');
  waveLane(g, 61);
  g.stamp(0, 63, 'port', 1, 3);
  g.fence(1, 14, 65, 'A');
  g.hatch(4, 68).hatch(11, 68);
  g.turret(3, 71, 'sweep').turret(12, 72, 'flak');
  g.set(6, 70, 'capB').set(9, 70, 'capK');
  conga(g, 8, 74, 5, 'noteHR');
  waveLane(g, 77);
  g.mon(3, 79, 'beeper').mon(6, 80, 'beeper').mon(9, 80, 'beeper').mon(12, 79, 'beeper');
  g.pickup(4, 82, 'bit').pickup(8, 82, 'bit').pickup(11, 82, 'bit');
  g.turret(2, 83, 'seeker');
  conga(g, 9, 83, 3, 'noteL');
  for (const [c, d] of [
    [5, 76],
    [12, 75],
  ])
    g.mon(c, d, 'disc');
  g.fence(1, 14, 86, 'B');
}

export function bigName(pal: Pal): Leg {
  const art = boasterArt(pal);
  let name: string[][] = [];
  let fine: string[] = [];
  const k = kit(
    art,
    (bs) => {
      boasterTiles(bs, art);
      name = nameTiles(bs, art);
      fine = finePrint(bs, art);
    },
    (b) => virus(b, pal),
    { mite: 'mite', turretEvery: 11, seekerEvery: 40, flakEvery: 30, hatchShut: 40, hatchOpen: 30, hatchEvery: 8, fenceOn: 26, fenceOff: 26 },
  );
  const g = strip(k.bs, k.beasts, art, 303);
  layout(g, name, fine);
  g.sprinkle(
    [
      ['capB', 1, 1],
      ['capK', 1, 1],
      ['xtal', 1, 1],
    ],
    10,
  );
  // the card before the leg shows the name
  g.cardAt = 44;
  return {
    file: 's3c',
    kitFile: 'sb',
    title: 'The Big Name',
    kind: 'scroll',
    grid: g,
    kit: k,
    card: ['The card wrote its name big.', 'Beepers dive. Chords sweep.', 'Jacks roll waves across:', 'cross between them!'],
  };
}
