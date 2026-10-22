// Stage 3: THE SOUND CARD. Leg A "The Mixer" brings note-heads in conga lines and wasps;
// leg B "The Woofer" has the speakers that thump the ship forward. Then the Feedback Howler.
import { HOVER_DROP, S_CURVE, SWEEP, ZIGZAG, diver, heavy, mine, mite, swooper } from '../characters/enemies';
import { strip, type Grid } from './mapkit';
import { buildPalette } from '../art/pal';
import { soundArt, soundTiles, soundVirus } from '../blocks/sound3';
import { kit, type Stage } from './stage';
import { bossHowler } from '../bosses/boss3';

function virus3(b: Parameters<typeof soundVirus>[0], p: Parameters<typeof soundVirus>[1]): void {
  soundVirus(b, p);
  mite(b, 'mite', [
    [3, 1, 5],
    [-4, 3, 5],
    [4, 3, 5],
    [-2, 12, 6],
  ]);
  diver(b, 'wasp', { score: 150, speed: 5, dive: 7 });
  swooper(b, 'noteL', S_CURVE(-1, 5), { pic: 'note', score: 150 });
  swooper(b, 'noteR', S_CURVE(1, 5), { pic: 'note', score: 150 });
  swooper(b, 'noteSL', SWEEP(-1, 6), { pic: 'noteG', score: 150 });
  swooper(b, 'noteSR', SWEEP(1, 6), { pic: 'noteG', score: 150 });
  swooper(b, 'noteZ', ZIGZAG(1, 5), { pic: 'note', score: 150 });
  swooper(b, 'noteD', HOVER_DROP(8), { pic: 'noteG', score: 150 });
  heavy(b, 'amp', { hp: 5, score: 500, speed: 1 });
  heavy(b, 'ampL', { hp: 5, score: 500, speed: 1, dx: -6, pic: 'amp' });
  heavy(b, 'ampR', { hp: 5, score: 500, speed: 1, dx: 6, pic: 'amp' });
  mine(b, 'disc', { hp: 3, score: 120 });
  mine(b, 'cluster', { hp: 2 });
}

const conga = (g: Grid, c: number, d: number, n: number, name: string) => {
  for (let i = 0; i < n; i++) g.mon(c, d + i, name);
};

function vuRow(g: Grid, c0: number, c1: number, d: number): void {
  for (let c = c0; c <= c1; c++) g.set(c, d, `vu${(c * 2) % 6}`);
}

function legA(g: Grid): void {
  g.stamp(1, 3, 'knob', 2, 2).stamp(13, 5, 'knob', 2, 2);
  g.set(5, 4, 'jackG').set(6, 4, 'jackP').set(7, 4, 'jackB');
  conga(g, 8, 9, 5, 'noteR');
  conga(g, 7, 15, 5, 'noteL');
  vuRow(g, 2, 13, 21);
  g.mon(4, 24, 'wasp').mon(11, 24, 'wasp').mon(8, 26, 'wasp');
  g.stamp(6, 28, 'fm', 3, 3);
  g.turret(2, 29, 'sweep').turret(13, 30, 'sweep');
  g.pickup(7, 33, 'nova').pickup(8, 33, 'bit');
  conga(g, 8, 36, 5, 'noteSL');
  conga(g, 7, 36, 5, 'noteSR');
  for (const [c, d] of [
    [3, 43],
    [12, 44],
    [6, 46],
    [9, 47],
  ])
    g.mon(c, d, d % 2 ? 'disc' : 'cluster');
  g.fence(1, 14, 50, 'A');
  g.mon(8, 54, 'amp');
  g.hatch(3, 55).hatch(12, 55);
  g.pickup(8, 58, 'repair');
  vuRow(g, 1, 14, 60);
  conga(g, 8, 62, 5, 'noteZ');
  g.turret(5, 66, 'flak').turret(10, 66, 'flak');
  g.mon(3, 70, 'wasp').mon(12, 70, 'wasp');
  g.stamp(1, 72, 'knob', 2, 2);
  conga(g, 7, 74, 4, 'noteD');
  conga(g, 9, 74, 4, 'noteD');
  g.turret(13, 78, 'seeker');
  g.mon(5, 81, 'wasp').mon(8, 82, 'wasp').mon(11, 81, 'wasp');
  g.fence(1, 14, 85, 'B');
}

function legB(g: Grid): void {
  // speakers: their middles thump the ship forward when they push out
  g.stamp(2, 6, 'spk', 4, 4).stamp(10, 10, 'spk', 4, 4);
  conga(g, 8, 8, 5, 'noteL');
  g.turret(8, 14, 'sweep');
  g.mon(5, 18, 'amp').mon(10, 19, 'amp');
  g.pickup(7, 21, 'nova');
  g.stamp(6, 24, 'spk', 4, 4);
  g.turret(2, 25, 'seeker').turret(13, 27, 'seeker');
  conga(g, 8, 31, 5, 'noteSR');
  g.fence(1, 7, 36, 'A').fence(8, 14, 36, 'B');
  g.hatch(4, 39).hatch(11, 40).hatch(7, 42);
  g.mon(7, 45, 'ampL').mon(9, 45, 'ampR');
  vuRow(g, 1, 14, 48);
  g.pickup(3, 49, 'bit').pickup(12, 49, 'bit').pickup(8, 50, 'repair');
  g.stamp(1, 52, 'spk', 4, 4).stamp(11, 52, 'spk', 4, 4);
  g.turret(7, 54, 'flak').turret(8, 57, 'sweep');
  conga(g, 8, 59, 5, 'noteZ');
  for (const [c, d] of [
    [2, 64],
    [5, 65],
    [10, 64],
    [13, 66],
    [7, 67],
  ])
    g.mon(c, d, 'disc');
  g.stamp(6, 69, 'spk', 4, 4);
  g.mon(3, 72, 'wasp').mon(12, 72, 'wasp').mon(5, 74, 'wasp').mon(10, 74, 'wasp');
  g.pickup(8, 76, 'life');
  g.turret(3, 78, 'sweep').turret(12, 78, 'sweep');
  conga(g, 7, 80, 4, 'noteSL');
  conga(g, 9, 80, 4, 'noteSR');
  g.fence(1, 14, 86, 'A');
}

export function stage3(): Stage {
  const pal = buildPalette('sound');
  const art = soundArt(pal);
  const ks = kit(
    art,
    (bs) => soundTiles(bs, art),
    (b) => virus3(b, pal),
    { mite: 'mite', turretEvery: 11, seekerEvery: 40, flakEvery: 30, hatchShut: 40, hatchOpen: 30, hatchEvery: 8, fenceOn: 26, fenceOff: 26 },
  );
  const a = strip(ks.bs, ks.beasts, art, 301);
  legA(a);
  a.sprinkle(
    [
      ['knob', 2, 2],
      ['jackG', 1, 1],
      ['jackP', 1, 1],
      ['jackB', 1, 1],
      ['vu0', 1, 1],
      ['vu3', 1, 1],
    ],
    14,
  );
  a.cardAt = 30;
  const b = strip(ks.bs, ks.beasts, art, 302);
  legB(b);
  b.sprinkle(
    [
      ['knob', 2, 2],
      ['jackG', 1, 1],
      ['jackP', 1, 1],
      ['jackB', 1, 1],
      ['vu0', 1, 1],
      ['vu3', 1, 1],
    ],
    14,
  );
  b.cardAt = 26;
  return {
    n: 3,
    id: 'sound',
    title: 'The Sound Card',
    theme: 'sound',
    pal,
    art,
    song: 'sound.cmf',
    bossSong: 'boss.cmf',
    legs: [
      {
        file: 's3a',
        kitFile: 's3',
        title: 'The Mixer',
        kind: 'scroll',
        grid: a,
        kit: ks,
        card: ['Note-heads dance in conga', 'lines. Wasps dive fast.', 'Records spin: shoot far!'],
      },
      {
        file: 's3b',
        kitFile: 's3',
        title: 'The Woofer',
        kind: 'scroll',
        grid: b,
        kit: ks,
        card: ['When a speaker thumps, its', 'middle kicks you forward.', 'Ride the beat!'],
      },
      bossHowler(art),
    ],
  };
}
