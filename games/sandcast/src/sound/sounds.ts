// sandcast.snd: every effect is a hand-made PC speaker tune of 36 steps (1/145.6 s each,
// about a quarter second). No Sound Blaster samples: this game is for the beeper.
import { newSoundSet, serializeSoundSet } from '../../../../web/src/formats/sound';
import { rng } from '../../../kit/pixels';
import { speaker } from '../../../kit/sound';
import { SND } from '../rules';

const NOTE: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
/** "E5" -> Hz. */
const hz = (n: string) => {
  const m = /^([A-G]#?)(\d)$/.exec(n)!;
  return 440 * 2 ** ((NOTE[m[1]] + (Number(m[2]) + 1) * 12 - 69) / 12);
};

/** Notes as [name or 0 for rest, steps]; a little vibrato keeps the beeper from sounding flat. */
function tune(notes: [string | 0, number][], vibrato = 0): Uint16Array {
  const seq: number[] = [];
  for (const [n, len] of notes) for (let i = 0; i < len; i++) seq.push(n ? hz(n) * (1 + Math.sin(seq.length * 1.9) * vibrato) : 0);
  return speaker((i) => seq[i] ?? 0);
}

/** Fast alternation between notes (a chord the beeper can play). */
function arp(chords: [string[], number][], rate = 1): Uint16Array {
  const seq: number[] = [];
  for (const [notes, len] of chords) for (let i = 0; i < len; i++) seq.push(hz(notes[Math.floor(i / rate) % notes.length]));
  return speaker((i) => seq[i] ?? 0);
}

export function buildSounds(): Uint8Array {
  const s = newSoundSet();
  const put = (n: number, f: Uint16Array) => (s.freqs[n] = f);
  const r = rng(77);

  // Hit points up: a sweet rising major arpeggio with a shimmer on top.
  put(
    SND.help,
    arp([
      [['C5', 'E5', 'G5'], 12],
      [['E5', 'G5', 'C6'], 12],
      [['G5', 'C6', 'E6'], 12],
    ]),
  );
  // A monster beaten: a pop of noise that drops into a chirp.
  put(
    SND.kill,
    speaker((i) => (i < 8 ? 300 + r() * 2600 : i < 24 ? 1800 * 0.86 ** (i - 8) + (i % 2) * 90 : 0)),
  );
  // Scooping sand: a soft gritty shff and a quick blip, kept short (half the old length)
  // because it plays on every scoop.
  put(
    SND.addSand,
    speaker((i) => (i < 6 ? 180 + r() * 420 : i < 8 ? 0 : i < 15 ? 700 + (i - 8) * 90 : 0)),
  );
  // Spending sand: pat-pat (two low thumps), the way you pat a sand wall.
  put(
    SND.useSand,
    speaker((i) => (i < 6 ? 140 - i * 6 + r() * 60 : i < 12 ? 0 : i < 18 ? 120 - (i - 12) * 5 + r() * 50 : i < 22 ? 0 : i < 30 ? 520 : 0)),
  );
  // Extra life: a little fanfare.
  put(
    SND.addLife,
    tune(
      [
        ['G4', 4],
        ['C5', 4],
        ['E5', 4],
        ['G5', 6],
        ['E5', 3],
        ['G5', 3],
        ['C6', 12],
      ],
      0.004,
    ),
  );
  // Points: a bright two-tone coin.
  put(
    SND.addScore,
    tune([
      ['B5', 5],
      ['E6', 20],
      [0, 11],
    ]),
  );
  // Points lost: a sad slide down.
  put(
    SND.subScore,
    speaker((i) => (i < 30 ? 660 * 0.965 ** i : 0)),
  );
  // A flag, a ball, a golden shell: three notes that climb, then a short ring (it plays on
  // most pickups, so the ring stops well before the end of the 36 steps).
  put(
    SND.addOther,
    arp(
      [
        [['C5'], 4],
        [['G5'], 4],
        [['C6', 'E6', 'G6'], 12],
      ],
      2,
    ),
  );
  // A gate, a root door or a dune gives way: a short grind, then a bright little fanfare.
  put(
    SND.useOther,
    speaker((i) =>
      i < 8
        ? 300 * 0.96 ** i + Math.sin(i * 2.6) * 60
        : i < 10
          ? 0
          : hz(['G4', 'C5', 'E5', 'G5', 'C6', 'C6'][Math.min(5, Math.floor((i - 10) / 4))]) * (i >= 30 ? 1 + 0.01 * Math.sin(i * 1.9) : 1),
    ),
  );
  // Flinging sand: a whoosh of noise that falls away.
  put(
    SND.fling,
    speaker((i) => (i < 22 ? (2600 - i * 100) * (0.6 + r() * 0.5) : 0)),
  );
  // Water splash: a wet warbling drop, then spray.
  put(
    SND.splash,
    speaker((i) => (i < 14 ? 1400 * 0.9 ** i + Math.sin(i * 3) * 120 : i < 30 ? 1500 + r() * 2500 : 0)),
  );
  // Hurt: a harsh low wobble.
  put(
    SND.hurt,
    speaker((i) => (i < 26 ? (i % 2 ? 160 : 110) * (1 - i / 70) + (i % 4 < 2 ? 30 : 0) : 0)),
  );
  // Teddy flops over, tuckered out: a long sliding wobble down to nothing.
  put(
    SND.die,
    speaker((i) => 900 * 0.94 ** i * (1 + 0.12 * Math.sin(i * 1.7))),
  );
  // Picking something up: a quick rising sweep with a sparkle.
  put(
    SND.pickup,
    speaker((i) => (i < 18 ? 400 * 1.11 ** i : i < 22 ? 0 : i < 28 ? 2093 : i < 34 ? 2637 : 0)),
  );
  // NO CARRIER: a modem's dying screech.
  put(
    SND.noCarrier,
    speaker((i) => (i < 12 ? 2100 + (i % 2) * 300 : i < 24 ? 1200 + r() * 1800 : 980 * (1 - (i - 24) / 14))),
  );
  // A corgi bark: two short rough yaps ("ruff-ruff!").
  put(
    SND.bark,
    speaker((i) =>
      i < 9 ? 520 + Math.sin(i * 2.3) * 160 + r() * 260 - i * 18 : i < 14 ? 0 : i < 22 ? 600 + Math.sin(i * 2.1) * 150 + r() * 260 - (i - 14) * 22 : 0,
    ),
  );
  // A tossed tennis ball: a squeaky toy's wheeze up and down.
  put(
    SND.squeak,
    speaker((i) => (i < 14 ? 1700 + i * 90 + (i % 2) * 140 : i < 18 ? 0 : i < 30 ? 2900 - (i - 18) * 110 + (i % 2) * 140 : 0)),
  );
  // A trick: a happy little "ta-da!" (good boy!).
  put(
    SND.trick,
    tune([
      ['E5', 4],
      ['G5', 4],
      ['C6', 4],
      [0, 2],
      ['G5', 3],
      ['C6', 14],
    ]),
  );
  // The spin: sand swirling, a rising and falling whirr.
  put(
    SND.whirl,
    speaker((i) => (i < 34 ? 500 + Math.sin(i / 3.5) * 380 + r() * 300 : 0)),
  );
  return serializeSoundSet(s);
}
