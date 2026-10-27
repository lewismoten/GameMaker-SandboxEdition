// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC. The
// little noises are synthesized here (a wet squelch, steam hissing, a drip, a scrub, the towel's
// scream, a soap bubble's pop, a match struck for a candle, the checkout's ka-ching, a rubber
// duck's squeak, a washcloth wrung out, a splash of brine, the funeral bell); the lines are cut
// from the recording (clips.ts), one set an act: what he sings on B, what the towel screams when
// it hurts him, and so on. Two VOCs join a noise and a line: the towel's scream into "YOU MADE IT
// WORSE!", and the drain's gurgle into "Never touch the loofah."
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { rng } from '../../../kit/pixels';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';
import { clipSamples, clipVoc, vocOf, CLIPS } from './clips';
import { lowNoise, gate, env } from '../../../kit/synthParts';

/** A voice: harmonics of a pitch through two vowel formants (which may move). */
function voice(pitch: (t: number) => number, f1: number | ((t: number) => number), f2: number | ((t: number) => number), seed = 3, breath = 0.03): Synth {
  let phase = 0;
  let last = 0;
  const r = rng(seed);
  return (t) => {
    const f0 = pitch(t);
    const a = typeof f1 === 'number' ? f1 : f1(t);
    const b = typeof f2 === 'number' ? f2 : f2(t);
    phase += 2 * Math.PI * f0 * (t - last);
    last = t;
    let s = 0;
    for (let k = 1; k <= 24; k++) {
      const f = f0 * k;
      if (f > 5000) break;
      s += (Math.exp(-(((f - a) / 160) ** 2)) + 0.6 * Math.exp(-(((f - b) / 260) ** 2)) + 0.05 / k) * Math.sin(phase * k);
    }
    return s * 0.5 + (r() * 2 - 1) * breath;
  };
}

/** Samples of a synth at a rate (for joining with a clip). */
function render(seconds: number, v: Synth, rate: number, envelope: (u: number) => number, gain = 0.9): Float32Array {
  const n = Math.round(seconds * rate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.max(-1, Math.min(1, v(i / rate) * envelope(i / n) * gain));
  return out;
}

const join = (...parts: Float32Array[]): Float32Array => {
  const out = new Float32Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) (out.set(p, o), (o += p.length));
  return out;
};

export type Place = 'bath' | 'aisle' | 'home' | 'shower';

/** A wet squelch: a falling formant over gurgled noise. */
const squelch = (seed: number): Synth =>
  mix(
    [lowNoise(seed, (t) => 0.3 * Math.exp(-t * 8) + 0.03), 0.7],
    [
      voice(
        (t) => 120 - t * 140,
        (t) => 700 - t * 1600,
        1400,
        seed + 1,
        0.1,
      ),
      0.5,
    ],
  );
/** Steam hissing out (high noise, swelling, then fading). */
const hiss = (seed: number): Synth => {
  const r = rng(seed);
  let last = 0;
  return () => {
    const n = r() * 2 - 1;
    const hp = n - last * 0.85;
    last = n;
    return hp * 0.6;
  };
};

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // a bare footstep on wet tile
  vocs.pat = sample(0.12, mix([gate(lowNoise(11, 0.25), 0, 0.03), 0.8], [osc.sine((t) => 160 - t * 300), 0.3]), { envelope: env(0.005, 2), gain: 0.6 });
  // a drip: a plip that rises fast (a drop hitting water)
  vocs.drip = sample(0.22, mix([osc.sine((t) => 900 + t * 5200), 0.7], [gate(lowNoise(12, 0.6), 0, 0.01), 0.3]), { envelope: env(0.003, 3.4) });
  // a hop: a grunt and a whoosh
  vocs.hop = sample(0.26, mix([lowNoise(13, (t) => 0.05 + t * 0.6), 0.5], [voice((t) => 140 + t * 120, 600, 1100, 4), 0.35]), { envelope: env(0.08, 1.5) });
  // a coin
  vocs.chime = sample(0.4, mix([osc.sine(1568), 0.5], [osc.sine(2349), 0.3]), { envelope: env(0.005, 2.6) });
  // the squelch of a loofah, or of anything wet
  vocs.squelch = sample(0.45, squelch(14), { envelope: env(0.01, 0.9) });
  // steam hissing out of the vents
  vocs.hiss = sample(0.9, hiss(15), { envelope: env(0.25, 0.7), gain: 0.7 });
  // a scrub: rough strokes back and forth
  vocs.scrub = sample(
    0.6,
    (() => {
      const n = lowNoise(16, 0.5);
      return (t: number) => n(t) * (0.3 + 0.7 * Math.abs(Math.sin(t * Math.PI * 6)));
    })(),
    { envelope: env(0.02, 0.4) },
  );
  // the towel's scream: a shrill, wavering shriek
  vocs.shriek = sample(0.7, mix([voice((t) => 620 + Math.sin(t * 50) * 70 + t * 200, 900, 2600, 17, 0.15), 0.8], [lowNoise(18, 0.6), 0.1]), {
    envelope: env(0.03, 0.5),
  });
  // a soap bubble popping
  vocs.pop = sample(0.12, mix([osc.sine((t) => 1300 - t * 6000), 0.6], [gate(lowNoise(19, 0.9), 0, 0.012), 0.6]), { envelope: env(0.002, 2.4) });
  // a match struck, and the candle catching
  vocs.match = sample(
    0.6,
    mix(
      [gate(lowNoise(20, 0.8), 0, 0.12), 0.8],
      [
        gate(
          lowNoise(21, (t) => 0.05 + 0.1 * Math.exp(-(t - 0.15) * 6)),
          0.12,
          0.6,
        ),
        0.5,
      ],
    ),
    { envelope: env(0.005, 0.8) },
  );
  // the checkout's register: ka-ching
  vocs.kaching = sample(0.7, mix([gate(lowNoise(22, 0.7), 0, 0.05), 0.6], [gate(osc.sine(2093), 0.08, 0.7), 0.4], [gate(osc.sine(3136), 0.08, 0.7), 0.25]), {
    envelope: env(0.003, 1),
  });
  // a rubber duck: squeak squeak
  vocs.duck = sample(
    0.55,
    mix(
      [
        gate(
          osc.square((t) => 1100 + Math.sin(t * 30) * 200),
          0,
          0.2,
        ),
        0.3,
      ],
      [
        gate(
          osc.square((t) => 1250 - (t - 0.28) * 600),
          0.28,
          0.52,
        ),
        0.3,
      ],
    ),
    { envelope: env(0.01, 0.4) },
  );
  // a washcloth wrung out: drips and a squeeze
  vocs.wring = sample(
    0.5,
    mix(
      [squelch(23), 0.6],
      [
        gate(
          osc.sine((t) => 900 + t * 3000),
          0.3,
          0.42,
        ),
        0.3,
      ],
    ),
    { envelope: env(0.02, 0.8) },
  );
  // a splash of brine
  vocs.splash = sample(
    0.4,
    lowNoise(24, (t) => 0.7 * Math.exp(-t * 7) + 0.05),
    { envelope: env(0.004, 1.3) },
  );
  // the funeral bell
  vocs.bell = sample(1.6, mix([osc.sine(196), 0.5], [osc.sine(392 * 1.19), 0.25], [osc.sine(523 * 1.5), 0.15]), { envelope: env(0.003, 1.6), gain: 0.8 });
  // the screaming towel: a shriek, then "My towel screams, YOU MADE IT WORSE!" (8000 Hz to fit)
  {
    const rate = CLIPS.scream;
    const shriek = render(
      0.4,
      voice((t) => 640 + Math.sin(t * 50) * 70, 900, 2600, 25, 0.15),
      rate,
      env(0.02, 0.6),
    );
    vocs.towel = vocOf('towel', join(shriek, clipSamples('scream')), rate);
  }
  // the drain gurgling, then softly: "Never touch the loofah."
  {
    const rate = CLIPS.never;
    const drain = render(0.6, squelch(26), rate, env(0.02, 0.7));
    vocs.drainnev = vocOf('drainnev', join(drain, new Float32Array(Math.round(rate * 0.1)), clipSamples('never')), rate);
  }
  // the song itself
  for (const name of ['pink', 'wrong', 'lucifer', 'rough', 'line', 'worse', 'scrubbus', 'brine', 'mango', 'never'] as const) vocs[name] = clipVoc(name);
  return vocs;
}

/** Which VOC each effect plays, act by act. */
const PLAYS: Record<Place, Partial<Record<keyof typeof SND, string>>> = {
  bath: {
    speak: 'rough',
    wail: 'pink',
    hurt: 'squelch',
    die: 'drainnev',
    gain: 'drip',
    spend: 'lucifer',
    kill: 'pop',
    step: 'pat',
    life: 'duck',
    help: 'wring',
  },
  aisle: { speak: 'rough', wail: 'wrong', hurt: 'squelch', die: 'drainnev', gain: 'chime', spend: 'kaching', kill: 'scrub', step: 'pat', score: 'mango' },
  home: { speak: 'rough', wail: 'line', hurt: 'towel', die: 'drainnev', gain: 'match', spend: 'bell', kill: 'pop', step: 'pat' },
  // the sung "Scrubbus maximus" once (the first sprig), a chime for the rest
  shower: {
    speak: 'rough',
    wail: 'brine',
    help: 'scrubbus',
    hurt: 'worse',
    die: 'drainnev',
    gain: 'chime',
    spend: 'hiss',
    kill: 'squelch',
    step: 'drip',
    score: 'shriek',
  },
};

/** An act's .SND: which VOC each effect plays (a PC speaker tune for each, for no Sound Blaster). */
export function buildSoundSet(place: Place): SoundSet {
  const set = newSoundSet();
  const plays = PLAYS[place];
  const add = (n: keyof typeof SND, fallback: string, freqs: Uint16Array) => {
    set.freqs[SND[n]] = freqs;
    set.digital[SND[n]] = plays[n] ?? fallback;
  };
  add('help', 'wring', SPEAKER.rise(400, 900));
  add(
    'kill',
    'pop',
    speaker((i) => (i < 4 ? 900 - i * 150 : 0)),
  );
  add('money', 'chime', SPEAKER.coin());
  add('pay', 'chime', SPEAKER.noise(2, 80, 400));
  add('life', 'duck', SPEAKER.arpeggio([1100, 1300, 1100, 1300]));
  add(
    'score',
    'chime',
    speaker((i) => (i < 6 ? 1568 : i < 14 ? 2349 : 0)),
  );
  add('lose', 'bell', SPEAKER.fall(400, 90));
  add(
    'gain',
    'chime',
    speaker((i) => (i < 8 ? 1100 + i * 120 : 0)),
  );
  add('spend', 'hiss', SPEAKER.noise(3, 1500, 4000));
  add(
    'hop',
    'hop',
    speaker((i) => (i < 10 ? 220 + i * 40 : 0)),
  );
  add(
    'step',
    'pat',
    speaker((i) => (i < 3 ? 120 : 0)),
  );
  add('hurt', 'squelch', SPEAKER.warble(260, 100, 2.4));
  add('die', 'drainnev', SPEAKER.fall(500, 70));
  add('speak', 'rough', SPEAKER.noise(4, 300, 1200));
  add('wail', 'pink', SPEAKER.warble(330, 120, 0.5));
  return set;
}
