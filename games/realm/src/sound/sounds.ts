// REALM.SND: PC speaker effects, each backed by a digitized Sound Blaster .VOC synthesized
// here: a sword's swish, coins, a kazoo's buzz, a tonic's glug, THE CHEZ's horn.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { rng } from '../../../kit/pixels';
import { SND } from '../ids';

function lowNoise(seed: number, cutoff: number | ((t: number) => number)): Synth {
  const r = rng(seed);
  let y = 0;
  return (t) => {
    const a = typeof cutoff === 'number' ? cutoff : cutoff(t);
    y += a * (r() * 2 - 1 - y);
    return y * (1.4 / Math.sqrt(Math.max(0.05, a)));
  };
}
const env = (attack: number, decay: number) => (u: number) => Math.min(1, u / attack) * Math.max(0, 1 - u) ** decay;
const bell = (hz: number, start = 0, len = 1): Synth => {
  const s = osc.sine(hz);
  const s2 = osc.sine(hz * 2.76);
  return (t) => (t < start ? 0 : (s(t) * 0.7 + s2(t) * 0.3) * Math.exp(-(t - start) * (4 / len)));
};
/** A buzzy reed: a sawtooth-ish stack with a rattle (the kazoo's whole personality). */
const reed = (hz: (t: number) => number, seed: number): Synth => {
  const a = osc.sine(hz);
  const b = osc.sine((t) => hz(t) * 2);
  const c = osc.sine((t) => hz(t) * 3);
  const d = osc.sine((t) => hz(t) * 4);
  const n = lowNoise(seed, 0.6);
  return (t) => {
    const v = a(t) + b(t) * 0.6 + c(t) * 0.45 + d(t) * 0.3;
    return Math.tanh(v * 1.6) * (0.85 + n(t) * 0.25);
  };
};

export interface SoundFiles {
  set: SoundSet;
  vocs: Record<string, Uint8Array>;
}

export function buildSounds(): SoundFiles {
  const set = newSoundSet();
  const vocs: Record<string, Uint8Array> = {};
  const add = (n: number, name: string, freqs: Uint16Array, voc: Uint8Array) => {
    set.freqs[n] = freqs;
    set.digital[n] = name;
    vocs[name] = voc;
  };
  const chime = (notes: number[], gap = 0.07, len = 0.7) =>
    sample(len, mix(...notes.map((f, i) => [bell(f, i * gap, 0.6), 0.3] as [Synth, number])), { envelope: () => 1 });

  // A healing sparkle (an inn's rest, a tonic, a heart, Teddy's kiss).
  add(SND.help, 'sparkle', SPEAKER.arpeggio([784, 988, 1175, 1568, 1976]), chime([784, 988, 1175, 1568, 1976], 0.06, 0.8));
  // A foe vanishing in a puff.
  add(
    SND.kill,
    'puff',
    SPEAKER.noise(7, 100, 900),
    sample(0.32, mix([lowNoise(9, (t) => 0.6 - t), 0.8], [osc.sine((t) => 900 - t * 1800), 0.25]), { envelope: env(0.01, 2), gain: 0.6 }),
  );
  // Coins in the purse.
  add(
    SND.addMoney,
    'coins',
    speaker((i) => (i < 5 ? 1568 : i < 9 ? 0 : i < 16 ? 2093 : i < 20 ? 0 : i < 28 ? 2637 : 0)),
    chime([1568, 2093, 2637], 0.05, 0.5),
  );
  // Paying: the purse strings and a sad little clink.
  add(
    SND.subMoney,
    'pay',
    speaker((i) => (i < 8 ? 900 - i * 40 : i < 12 ? 0 : i < 20 ? 660 : 0)),
    sample(0.4, mix([lowNoise(11, 0.3), 0.3], [bell(1319, 0.08, 0.5), 0.35], [bell(988, 0.16, 0.4), 0.3]), { envelope: () => 1 }),
  );
  add(SND.addLife, 'feather', SPEAKER.arpeggio([523, 659, 784, 1047]), chime([523, 659, 784, 1047, 1319, 1568], 0.08, 1.0));
  add(SND.addScore, 'ding', SPEAKER.coin(), chime([1319, 1976], 0.06, 0.4));
  add(
    SND.subScore,
    'bonk',
    SPEAKER.fall(500, 140),
    sample(
      0.25,
      osc.sine((t) => 320 - t * 700),
      { envelope: env(0.005, 2) },
    ),
  );
  // A quest item, a key, a gate opening: a bright fanfare figure.
  add(
    SND.addOther,
    'fanfare',
    SPEAKER.arpeggio([659, 784, 1047, 1319]),
    sample(0.7, mix([reed((t) => (t < 0.12 ? 523 : t < 0.24 ? 659 : 784), 3), 0.3], [bell(1568, 0.24, 0.6), 0.2]), { envelope: env(0.02, 0.8) }),
  );
  // Something handed over, a gate unlocked: a low "clunk".
  add(
    SND.subOther,
    'clunk',
    SPEAKER.fall(300, 90),
    sample(0.3, mix([osc.sine((t) => 160 - t * 200), 0.7], [lowNoise(13, 0.3), 0.4]), { envelope: env(0.003, 2), gain: 0.6 }),
  );
  // The sword: a swish of air, kept soft because it plays on every swing.
  add(
    SND.slash,
    'swish',
    SPEAKER.rise(400, 2400),
    sample(
      0.2,
      lowNoise(19, (t) => 0.1 + t * 4),
      { envelope: (u) => Math.sin(Math.PI * u) ** 2, gain: 0.4 },
    ),
  );
  add(
    SND.hurt,
    'ouch',
    SPEAKER.hurt(),
    sample(0.28, mix([osc.sine((t) => 330 - t * 500), 0.6], [osc.sine((t) => 660 - t * 900), 0.25], [lowNoise(23, 0.1), 0.2]), { envelope: env(0.01, 1.5) }),
  );
  // Down for the count: a slide whistle, all the way down.
  add(
    SND.die,
    'slide',
    SPEAKER.fall(1600, 200),
    sample(
      1.0,
      osc.sine((t) => 1200 * Math.exp(-t * 1.9) * (1 + 0.04 * Math.sin(t * 40))),
      { envelope: env(0.02, 0.8), gain: 0.7 },
    ),
  );
  // The kazoo: bwaaa-ap.
  add(
    SND.kazoo,
    'kazoo',
    speaker((i) => (i < 30 ? (i < 10 ? 392 : 523) + Math.sin(i * 2) * 20 : 0)),
    sample(
      0.45,
      reed((t) => (t < 0.12 ? 392 : 523) * (1 + 0.02 * Math.sin(t * 60)), 29),
      { envelope: env(0.02, 0.6), gain: 0.55 },
    ),
  );
  // A tonic: glug, glug, ahh.
  add(
    SND.tonic,
    'glug',
    speaker((i) => (i % 8 < 4 ? 200 + (i % 8) * 30 : 0)),
    sample(0.5, mix([osc.sine((t) => 180 + 120 * Math.abs(Math.sin(t * 22))), 0.6], [lowNoise(31, 0.15), 0.25]), {
      envelope: (u) => (Math.sin(u * 22) > 0 ? 1 : 0.2) * (1 - u),
    }),
  );
  add(SND.pickup, 'pickup', SPEAKER.chirp(), chime([1047, 1568], 0.05, 0.3));
  // THE CHEZ's horn: a squeeze-bulb "ah-OOO-gah".
  add(
    SND.honk,
    'ahooga',
    speaker((i) => (i < 30 ? 220 + Math.min(i, 15) * 18 : 0)),
    sample(
      0.7,
      reed((t) => 180 + 160 * Math.min(1, t * 3) - (t > 0.45 ? (t - 0.45) * 300 : 0), 37),
      { envelope: env(0.03, 0.4), gain: 0.6 },
    ),
  );
  return { set, vocs };
}
