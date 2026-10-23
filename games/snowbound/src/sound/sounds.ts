// SNOW.SND: PC speaker effects, each backed by a digitized Sound Blaster .VOC that is
// synthesized here (shovel scrapes, the cash register, snowball whooshes...).
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { rng } from '../../../kit/pixels';
import { SND } from '../ids';

/** White noise through a one-pole low-pass (0..1: how much of the new sample passes). */
function lowNoise(seed: number, cutoff: number | ((t: number) => number)): Synth {
  const r = rng(seed);
  let y = 0;
  return (t) => {
    const a = typeof cutoff === 'number' ? cutoff : cutoff(t);
    y += a * (r() * 2 - 1 - y);
    return y * (1.4 / Math.sqrt(Math.max(0.05, a)));
  };
}
/** A synth that is silent outside [from, to). */
const gate =
  (v: Synth, from: number, to: number, fade = false): Synth =>
  (t) =>
    t >= from && t < to ? v(t) * (fade ? 1 - (t - from) / (to - from) : 1) : 0;
const env = (attack: number, decay: number) => (u: number) => Math.min(1, u / attack) * Math.max(0, 1 - u) ** decay;
const bell = (hz: number, start = 0, len = 1): Synth => {
  const s = osc.sine(hz);
  const s2 = osc.sine(hz * 2.76);
  return (t) => (t < start ? 0 : (s(t) * 0.7 + s2(t) * 0.3) * Math.exp(-(t - start) * (4 / len)));
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

  // A shovel scoop and a little coin: "shhk-tik". It plays on every dollar, a scoop every
  // third of a second while you dig, so it is short and soft: a scrape and a quiet tick
  // that is over before the next scoop, never a ringing bell stacking up.
  add(
    SND.money,
    'scoop',
    speaker((i) => (i < 4 ? 180 + i * 50 : i < 6 ? 0 : i < 10 ? 1568 : 0)),
    sample(0.24, mix([gate(lowNoise(3, 0.35), 0, 0.11, true), 0.6], [bell(1568, 0.09, 0.14), 0.22], [bell(2349, 0.11, 0.12), 0.1]), { envelope: () => 1 }),
  );
  // The register at Bits & Bytes: "ka-CHING!"
  add(
    SND.pay,
    'kaching',
    speaker((i) => (i < 3 ? 120 : i < 6 ? 0 : i < 30 ? [2093, 2637, 3136][i % 3] : 0)),
    sample(1.1, mix([gate(lowNoise(5, 0.6), 0, 0.06), 0.6], [bell(2637, 0.1, 1.2), 0.3], [bell(3322, 0.1, 1.1), 0.25], [bell(1319, 0.1, 1.3), 0.2]), {
      envelope: () => 1,
    }),
  );
  // Hot cocoa: a warm rising chime.
  add(
    SND.help,
    'cocoa',
    SPEAKER.arpeggio([523, 659, 784, 1047, 1319]),
    sample(0.6, mix([bell(523), 0.3], [bell(659, 0.08), 0.3], [bell(784, 0.16), 0.3], [bell(1047, 0.24), 0.3]), { envelope: () => 1 }),
  );
  // Something knocked flat (a snowball, a fort kid giving up).
  add(
    SND.kill,
    'poof',
    SPEAKER.noise(7, 80, 600),
    sample(
      0.25,
      lowNoise(9, (t) => 0.5 - t),
      { envelope: env(0.01, 2) },
    ),
  );
  add(
    SND.life,
    'oneup',
    SPEAKER.arpeggio([784, 988, 1175, 1568]),
    sample(0.5, mix([bell(784), 0.3], [bell(988, 0.1), 0.3], [bell(1568, 0.2), 0.4]), { envelope: () => 1 }),
  );
  // A fort caving in.
  add(
    SND.score,
    'crunch',
    SPEAKER.noise(11, 60, 400),
    sample(0.35, mix([lowNoise(13, 0.25), 0.8], [osc.sine((t) => 140 - t * 200), 0.4]), { envelope: env(0.005, 1.5) }),
  );
  add(
    SND.lose,
    'bonk',
    SPEAKER.fall(400, 120),
    sample(
      0.25,
      osc.sine((t) => 300 - t * 600),
      { envelope: env(0.005, 2) },
    ),
  );
  // Packing a snowball: pat-pat.
  add(
    SND.ammo,
    'patpat',
    speaker((i) => (i < 3 || (i > 8 && i < 12) ? 220 : 0)),
    sample(0.3, mix([gate(lowNoise(17, 0.2), 0, 0.05, true), 1], [gate(lowNoise(18, 0.2), 0.13, 0.19, true), 1]), { envelope: () => 1 }),
  );
  add(SND.other, 'blip', SPEAKER.chirp(), sample(0.12, osc.square(880), { envelope: env(0.005, 2), gain: 0.4 }));
  // Throw: a quick whoosh.
  add(
    SND.throw,
    'whoosh',
    SPEAKER.rise(300, 1200),
    sample(
      0.28,
      lowNoise(19, (t) => 0.08 + t * 2),
      { envelope: (u) => Math.sin(Math.PI * u) ** 2 },
    ),
  );
  // Hurt: "oof".
  add(
    SND.hurt,
    'oof',
    SPEAKER.hurt(),
    sample(0.3, mix([osc.sine((t) => 230 - t * 300), 0.7], [osc.sine((t) => 460 - t * 600), 0.25], [lowNoise(23, 0.1), 0.2]), { envelope: env(0.01, 1.5) }),
  );
  // Out cold: a sliding whistle down into the drift.
  add(
    SND.die,
    'slide',
    SPEAKER.fall(1600, 200),
    sample(
      1.0,
      osc.sine((t) => 1100 * Math.exp(-t * 1.8) * (1 + 0.04 * Math.sin(t * 40))),
      { envelope: env(0.02, 0.8), gain: 0.7 },
    ),
  );
  // Sled: digging in your heels, and pushing off.
  add(SND.brake, 'brake', SPEAKER.noise(29, 300, 900), sample(0.35, lowNoise(29, 0.5), { envelope: env(0.02, 1) }));
  add(
    SND.push,
    'push',
    SPEAKER.rise(200, 500),
    sample(
      0.25,
      lowNoise(31, (t) => 0.1 + t),
      { envelope: (u) => Math.sin(Math.PI * u) },
    ),
  );
  return { set, vocs };
}
