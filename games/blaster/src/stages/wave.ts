// Stage 3-E, "The Waveform": the sound card's side leg. Side-on through the song as the
// oscilloscope draws it: the ceiling and the floor are the wave, swinging up and down, louder
// toward the end. Note-heads hop, Wasps dive, records spin on the lines, Amps plow through,
// and the beat shoves the ship up and down.
import { soundVirus } from '../blocks/sound3';
import { waveArt, waveBlocks, waveRamps } from '../blocks/wave';
import { HOP, S_CURVE, diver, heavy, mine, swooper } from '../characters/enemies';
import { buildPalette } from '../art/pal';
import { MLEN } from '../../../../web/src/formats/map';
import { GATE, sideLeg, sideMites } from './sideLeg';
import type { Side } from './sideLeg';
import type { Leg } from './stage';

const conga = (s: Side, c: number, r: number, n: number, name: string) => {
  for (let i = 0; i < n; i++) s.mon(c + i, r, name);
};

export function waveLeg(): Leg {
  const pal = buildPalette('sound');
  waveRamps(pal);
  const art = waveArt(pal);
  // the wave: the ceiling and the floor swing together, a little louder as the song goes on
  const ceil: number[] = [];
  const floor: number[] = [];
  for (let c = 0; c < MLEN; c++) {
    const on = c >= 14 && c < GATE - 6;
    const amp = on ? 1 + Math.min(1, (c - 14) / 50) * 0.9 : 0;
    const s = Math.sin(((c - 14) * Math.PI * 2) / 16);
    ceil.push(1 + Math.round(amp * (1 + s)));
    floor.push(1 + Math.round(amp * (1 - s)));
  }
  return sideLeg({
    file: 's3s',
    title: 'The Waveform',
    card: ['Side-on through the song', 'as the scope draws it. Ride', 'the wave up and down, and', 'mind the beat!'],
    seed: 332,
    pal,
    art,
    own: (bs) => waveBlocks(bs, art),
    virus: (b) => {
      // the Note-heads stay upright side-on
      b.upright.add('note').add('noteG');
      soundVirus(b, pal);
      sideMites(b, 'mite', 5);
      diver(b, 'wasp', { score: 150, speed: 5, dive: 7 });
      swooper(b, 'noteL', S_CURVE(-1, 5), { pic: 'note', score: 150 });
      swooper(b, 'noteH', HOP(1, 5), { pic: 'note', score: 160 });
      heavy(b, 'amp', { hp: 5, score: 500, speed: 1 });
      mine(b, 'disc', { hp: 3, score: 120 });
      mine(b, 'cluster', { hp: 2 });
    },
    opts: { turretEvery: 11, seekerEvery: 40, hatchShut: 40, hatchOpen: 28, hatchEvery: 8, fenceOn: 24, fenceOff: 24 },
    ceil,
    floor,
    build: (s) => {
      const mid = (c: number) => (s.top(c) + s.bottom(c)) >> 1;
      s.mon(22, 4, 'wasp').mon(26, 6, 'wasp');
      for (const c of [24, 25, 26]) s.pickup(c, mid(c), 'bit');
      conga(s, 30, mid(30), 3, 'noteH');
      s.turret(36, 'floor');
      s.pickup(39, mid(39), 'nova');
      s.mon(42, mid(42), 'disc');
      s.draft(45, 46, 'U');
      s.draft(48, 49, 'D');
      conga(s, 50, mid(50), 4, 'noteL');
      s.fence(55, 'A');
      s.mon(58, mid(58), 'amp');
      s.turret(61, 'ceil');
      s.pickup(63, mid(63), 'repair');
      s.hatch(66, 'floor');
      s.mon(69, mid(69) - 1, 'cluster').mon(70, mid(70) + 1, 'disc');
      s.draft(72, 73, 'D');
      s.draft(75, 76, 'U');
      conga(s, 76, mid(76), 3, 'noteH');
      s.fence(79, 'B');
      for (const c of [82, 83, 84]) s.pickup(c, mid(c), 'bit');
      s.scatter(
        [
          ['eq2', 1, 2, 'floor'],
          ['eq3', 1, 3, 'floor'],
          ['eq4', 1, 4, 'any'],
        ],
        14,
      );
    },
    cardView: { c: 26, r: 2 },
  });
}
