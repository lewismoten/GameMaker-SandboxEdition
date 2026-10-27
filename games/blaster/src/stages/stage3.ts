// Stage 3: THE SOUND CARD. 3-A "The Big Name" flies up the card's face, where it prints SOUND
// BOASTER (stages/boaster.ts); 3-B "The Waveform" flies right through the song; 3-C "The
// Woofer" flies back down past the speakers that thump the ship on (turned on a map of its
// own, stages/turned.ts); 3-D "The Mixer" flies left with note-heads in conga lines and wasps
// (in the waveform's map); 3-E "The Score" cuts corner to corner. Then the Feedback Howler.
import { HOP, HOVER_DROP, S_CURVE, SWEEP, diver, heavy, mine, mite, swooper } from '../characters/enemies';
import { strip, type Grid } from './mapkit';
import { buildPalette } from '../art/pal';
import { soundArt, soundEgg, soundTiles, soundVirus } from '../blocks/sound3';
import { kit, type Leg, type Stage } from './stage';
import { bossHowler } from '../bosses/boss3';
import { bigName } from './boaster';
import { scoreLeg } from './score';
import { waveKit, waveLeg, mixerBand } from './wave';
import { downLeg, leftLeg, stampNames, stripMeter } from './turned';

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
  swooper(b, 'noteD', HOVER_DROP(8), { pic: 'noteG', score: 150 });
  // the sound card's own move: note-heads hopping along a staff
  swooper(b, 'noteHL', HOP(-1, 5), { pic: 'note', score: 160 });
  swooper(b, 'noteHR', HOP(1, 5), { pic: 'note', score: 160 });
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
  g.pickup(3, 49, 'bit').pickup(12, 49, 'bit').pickup(8, 50, 'bit');
  g.stamp(1, 52, 'spk', 4, 4).stamp(11, 52, 'spk', 4, 4);
  g.turret(7, 54, 'flak').turret(8, 57, 'sweep');
  conga(g, 8, 59, 5, 'noteHR');
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
    (bs) => soundEgg(bs, art),
  );
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
  // the painted Easter egg, tucked against the right-hand edge halfway up The Woofer
  const [ec, ed] = (
    [
      [14, 60],
      [14, 59],
      [14, 61],
    ] as [number, number][]
  ).find(([c, d]) => /^floor0$/.test(b.get(c, d)))!;
  b.set(ec, ed, 'easterEgg');
  b.cardAt = 26;
  const big = bigName(pal);
  const woofer: Leg = { file: 's3b', kitFile: 's3', title: 'The Woofer', kind: 'scroll', grid: b, kit: ks, card: [] };
  const wave = waveLeg();
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
      big,
      wave,
      // its own map: the card's face beside it has a block set of its own, whose virus numbers stop short of the Woofer's
      downLeg('own', woofer, {
        file: 's3v',
        kitFile: 's3v',
        title: 'The Woofer',
        card: ['Back DOWN the card. When a', 'speaker thumps, its middle', 'kicks you on down.', 'Ride the beat!'],
        left: 2,
        meter: stripMeter(art),
        // printing, meters and the egg stay upright; the speakers and the board turn
        spec: {
          upright: ['floor3', ...[0, 1, 2, 3, 4, 5].map((k) => `vu${k}`), 'jackG', 'jackP', 'jackB', 'easterEgg', 'easterEgg1', 'easterEgg2', 'easterEgg3'],
          stamps: [stampNames('fm', 3, 3), stampNames('knob', 2, 2)],
        },
      }),
      leftLeg(wave, mixerBand(), {
        file: 's3l',
        title: 'The Mixer',
        card: ['Flying LEFT across the mix.', 'Note-heads dance in conga', 'lines, Wasps dive fast.', 'Records spin: shoot far!'],
        top: 20,
        art: waveKit().art,
      }),
      scoreLeg(),
      bossHowler(art),
    ],
  };
}
