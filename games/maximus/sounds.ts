// MAXIMUS.SND: all thirty sound slots, each with a PC speaker tune and a digitized
// Sound Blaster sample (.VOC) synthesized here.
import { newSoundSet, serializeSoundSet } from '../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../kit/sound';
import { rng } from '../kit/pixels';

const noise = (seed: number): Synth => osc.noise(seed);
/** A noise source low-passed by averaging (rumble). */
const rumble = (seed: number, k = 8): Synth => {
  const n = osc.noise(seed);
  const buf: number[] = [];
  return (t) => {
    buf.push(n(t));
    if (buf.length > k) buf.shift();
    return (buf.reduce((a, b) => a + b, 0) / buf.length) * 1.8;
  };
};
const sweep = (from: number, to: number, dur: number) => (t: number) => from * (to / from) ** Math.min(1, t / dur);
const tri = (hz: number | ((t: number) => number)): Synth => {
  const s = osc.sine(hz);
  return (t) => Math.asin(s(t)) / (Math.PI / 2);
};
const notes = (seq: number[], each: number, voice: (hz: number) => Synth): Synth => {
  const voices = seq.map((hz) => voice(hz));
  return (t) => {
    const i = Math.min(seq.length - 1, Math.floor(t / each));
    const local = t - i * each;
    return voices[i](t) * Math.min(1, (each - local) * 40);
  };
};
/** A crude formant "voice": pulse train through two resonant sines (for the hail). */
const voice = (pitch: (t: number) => number, f1: (t: number) => number, f2: (t: number) => number): Synth => {
  let phase = 0;
  let last = 0;
  return (t) => {
    phase += pitch(t) * (t - last);
    last = t;
    const p = phase % 1;
    const env = Math.exp(-p * 6);
    return env * (Math.sin((2 * Math.PI * f1(t) * p) / pitch(t)) * 0.7 + Math.sin((2 * Math.PI * f2(t) * p) / pitch(t)) * 0.35);
  };
};

/** "Hel-lo!": two syllables of a little formant voice. */
function hello(): Synth {
  const a = voice(
    () => 160,
    () => 550,
    () => 1800,
  );
  const b = voice(
    (u) => 190 - (u - 0.28) * 60,
    () => 450,
    () => 900,
  );
  return (t) => (t < 0.28 ? a(t) : b(t)) * (t > 0.24 && t < 0.3 ? 0.2 : 1);
}

export interface Sfx {
  slot: number;
  name: string;
  voc: string;
  what: string;
}

export function buildSounds(): { snd: Uint8Array; vocs: Map<string, Uint8Array>; list: Sfx[] } {
  const set = newSoundSet();
  const vocs = new Map<string, Uint8Array>();
  const list: Sfx[] = [];
  const add = (slot: number, voc: string, what: string, pc: Uint16Array, wav: Uint8Array) => {
    set.freqs[slot] = pc;
    set.digital[slot] = voc;
    vocs.set(`${voc}.voc`, wav);
    list.push({ slot, name: what, voc, what });
  };
  const r = rng(30);
  void r;

  add(
    0,
    'heal',
    'Healed',
    SPEAKER.rise(400, 1600),
    sample(
      0.45,
      notes([523, 659, 784, 1047], 0.1, (hz) => mix([osc.sine(hz), 0.6], [osc.sine(hz * 2), 0.2])),
      { gain: 0.7 },
    ),
  );
  add(1, 'splat', 'Monster destroyed', SPEAKER.noise(3, 80, 900), sample(0.28, mix([noise(1), 0.6], [osc.square(sweep(300, 60, 0.25)), 0.4]), { gain: 0.8 }));
  add(
    2,
    'coin',
    'Credits',
    SPEAKER.coin(),
    sample(
      0.32,
      notes([1319, 1976], 0.07, (hz) => mix([osc.square(hz), 0.35], [osc.sine(hz), 0.4])),
      { gain: 0.6 },
    ),
  );
  add(
    3,
    'paid',
    'Credits spent',
    SPEAKER.arpeggio([988, 784, 659, 523]),
    sample(
      0.4,
      notes([1047, 784, 523], 0.12, (hz) => mix([osc.sine(hz), 0.6], [osc.sine(hz * 3), 0.15])),
      { gain: 0.7 },
    ),
  );
  add(
    4,
    'oneup',
    'Extra life',
    SPEAKER.arpeggio([523, 659, 784, 1047, 1319, 1568]),
    sample(
      0.9,
      notes([523, 659, 784, 1047, 784, 1047, 1319], 0.12, (hz) => mix([osc.square(hz), 0.25], [tri(hz), 0.5])),
      { gain: 0.6 },
    ),
  );
  add(
    5,
    'gem',
    'Score',
    speaker((i) => (i < 20 ? 1800 + (i % 4) * 300 : 0)),
    sample(0.35, mix([osc.sine(sweep(1800, 3200, 0.1)), 0.5], [osc.sine(2600), 0.3]), { gain: 0.5 }),
  );
  add(
    6,
    'buzz',
    'Score lost',
    speaker((i) => (i < 24 ? 110 + (i % 2) * 30 : 0)),
    sample(0.3, osc.square(sweep(180, 90, 0.3)), { gain: 0.4 }),
  );
  add(
    7,
    'cell',
    'Ammo or star-shard',
    SPEAKER.rise(600, 2400),
    sample(0.4, mix([osc.square(sweep(500, 1500, 0.2)), 0.3], [osc.sine(sweep(1000, 3000, 0.25)), 0.4]), { gain: 0.6 }),
  );
  add(8, 'drain', 'Counter spent', SPEAKER.fall(1200, 300), sample(0.3, osc.sine(sweep(900, 300, 0.3)), { gain: 0.6 }));
  add(
    9,
    'jet',
    'Jet hop',
    speaker((i) => (i < 10 ? 300 + i * 40 : 0)),
    sample(0.22, mix([rumble(9, 3), 0.7], [osc.sine(sweep(200, 500, 0.2)), 0.3]), { gain: 0.7 }),
  );
  add(10, 'pew', 'Blaster', SPEAKER.zap(), sample(0.18, mix([osc.square(sweep(2400, 400, 0.17)), 0.5], [noise(10), 0.1]), { gain: 0.5 }));
  add(
    11,
    'lance',
    'Plasma lance',
    speaker((i) => (i < 20 ? 900 - i * 35 + (i % 2) * 200 : 0)),
    sample(0.4, mix([osc.square(sweep(800, 100, 0.35)), 0.4], [osc.sine(sweep(1600, 200, 0.35)), 0.3], [noise(11), 0.15]), { gain: 0.7 }),
  );
  add(
    12,
    'nova',
    'Nova burst',
    SPEAKER.noise(12, 60, 400),
    sample(0.8, mix([rumble(12, 12), 0.8], [osc.sine(sweep(120, 40, 0.8)), 0.4], [osc.sine(sweep(3000, 500, 0.3)), 0.15]), { gain: 0.9 }),
  );
  add(
    13,
    'dash',
    'Dash',
    speaker((i) => (i < 12 ? 2000 - i * 120 : 0)),
    sample(0.25, mix([noise(13), 0.5], [osc.sine(sweep(1200, 300, 0.25)), 0.3]), { gain: 0.6 }),
  );
  add(
    14,
    'shield',
    'Shield orb',
    SPEAKER.warble(900, 400, 1.6),
    sample(0.6, mix([osc.sine((t) => 900 + Math.sin(t * 60) * 300), 0.4], [osc.sine((t) => 1350 + Math.sin(t * 45) * 200), 0.3]), { gain: 0.5 }),
  );
  add(
    15,
    'hover',
    'Hover pack',
    speaker((i) => 150 + (i % 3) * 20),
    sample(0.35, mix([rumble(15, 6), 0.5], [osc.sine(110), 0.4]), { gain: 0.6, envelope: (t) => Math.min(1, t * 8) * (1 - t) }),
  );
  const n16 = noise(16);
  add(
    16,
    'mine',
    'Mine laid',
    speaker((i) => (i < 4 ? 200 : i > 12 && i < 18 ? 1400 : 0)),
    sample(0.35, (t) => (t < 0.08 ? n16(t) * 0.8 : t > 0.18 && t < 0.26 ? Math.sign(Math.sin(t * 2 * Math.PI * 1400)) * 0.3 : 0), {
      gain: 0.7,
      envelope: () => 1,
    }),
  );
  add(
    17,
    'ouch',
    'Hurt',
    SPEAKER.hurt(),
    sample(
      0.3,
      voice(sweep(180, 120, 0.3), sweep(700, 500, 0.3), () => 1100),
      { gain: 0.8 },
    ),
  );
  add(
    18,
    'boom',
    'Destroyed',
    SPEAKER.noise(18, 50, 500),
    sample(1.2, mix([rumble(18, 16), 0.9], [osc.sine(sweep(90, 30, 1.2)), 0.5], [noise(19), 0.2]), { gain: 0.9 }),
  );
  add(
    19,
    'grab',
    'Picked up',
    SPEAKER.chirp(),
    sample(
      0.2,
      notes([880, 1320], 0.06, (hz) => osc.square(hz)),
      { gain: 0.35 },
    ),
  );
  add(20, 'thunk', 'Dropped', SPEAKER.fall(600, 100), sample(0.2, mix([osc.sine(sweep(200, 60, 0.2)), 0.7], [noise(20), 0.2]), { gain: 0.7 }));
  add(21, 'hail', 'Hail', SPEAKER.arpeggio([392, 523, 659]), sample(0.7, hello(), { gain: 0.8 }));
  add(
    22,
    'engine',
    'Pod thrust',
    speaker((i) => (i % 2 ? 90 : 70)),
    sample(0.3, mix([rumble(22, 10), 0.8], [osc.square(55), 0.15]), { gain: 0.6, envelope: (t) => Math.min(1, t * 10) * (1 - t * 0.6) }),
  );
  add(
    23,
    'bubble',
    'Swim',
    speaker((i) => (i < 16 ? 400 + (i % 4) * 150 : 0)),
    sample(
      0.3,
      notes([300, 450, 380, 600], 0.06, (hz) => osc.sine(sweep(hz, hz * 2, 0.06))),
      { gain: 0.5 },
    ),
  );
  add(
    24,
    'motor',
    'Rover',
    speaker((i) => (i % 3 === 0 ? 120 : 80)),
    sample(0.3, (t) => Math.sign(Math.sin(2 * Math.PI * 70 * t)) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 18 * t)) * 0.5, {
      gain: 0.6,
      envelope: (t) => Math.min(1, t * 10) * (1 - t * 0.5),
    }),
  );
  add(25, 'medkit', 'Med kit', SPEAKER.rise(300, 900), sample(0.5, mix([noise(25), 0.25], [osc.sine(sweep(400, 1200, 0.5)), 0.45]), { gain: 0.6 }));
  const n26 = noise(26);
  add(
    26,
    'flak',
    'Flak cannon',
    speaker((i) => (i % 8 < 3 ? 1500 - i * 20 : 0)),
    sample(0.4, (t) => (t % 0.12 < 0.05 ? n26(t) * 0.7 + Math.sin(t * 2 * Math.PI * 600) * 0.3 : 0), { gain: 0.8 }),
  );
  add(27, 'splash', 'Splash', SPEAKER.noise(27, 300, 3000), sample(0.5, mix([noise(27), 0.6], [osc.sine(sweep(600, 200, 0.4)), 0.2]), { gain: 0.6 }));
  add(
    28,
    'warp',
    'Warp',
    SPEAKER.rise(100, 4000),
    sample(0.9, mix([osc.sine(sweep(80, 2400, 0.9)), 0.5], [osc.sine(sweep(120, 3600, 0.9)), 0.3], [noise(28), 0.08]), { gain: 0.6 }),
  );
  add(
    29,
    'roll',
    'Roll',
    speaker((i) => (i < 8 ? 220 - i * 10 : 0)),
    sample(0.15, mix([noise(29), 0.3], [osc.sine(sweep(300, 150, 0.15)), 0.5]), { gain: 0.6 }),
  );
  return { snd: serializeSoundSet(set), vocs, list: list.sort((a, b) => a.slot - b.slot) };
}
