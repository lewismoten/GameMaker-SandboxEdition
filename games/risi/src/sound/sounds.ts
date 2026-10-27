// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC. The
// little noises are synthesized here (a sandal's pat, a hop, a denarius, a cough, a shutter
// thrown open, a brass raspberry, a laugh and a whole audience laughing, a meow, a mouse's
// squeak, a clang, a splash, a drum's boing, a sparkle, a cabbage's thud, a rimshot, a gulp,
// a fanfare for a laurel wreath); the sung Latin is cut from the recordings (clips.ts), one set a
// level: what Marcus sings on B, what plays when a counter goes up or is spent, and so on.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { rng } from '../../../kit/pixels';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';
import { CLIPS, clipVoc, type ClipName } from './clips';
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

/** "Ha-ha-ha": `n` bursts of an "ah" with a breathy "h" before each, falling in pitch. */
function laugh(seed: number, base: number, n = 4, gap = 0.13): Synth {
  const v = voice((t) => base * (1 - t * 0.25), 750, 1250, seed, 0.08);
  const h = lowNoise(seed + 1, 0.5);
  return (t) => {
    const k = Math.floor(t / gap);
    if (k >= n) return 0;
    const u = (t - k * gap) / gap;
    return u < 0.2 ? h(t) * 0.4 * (u / 0.2) : v(t) * Math.sin(Math.PI * Math.min(1, (u - 0.2) / 0.8));
  };
}

export type Place = 'banquet' | 'battle' | 'roofs' | 'kitchen' | 'baths' | 'theater';

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // a sandal's pat on marble
  vocs.pat = sample(0.1, mix([gate(lowNoise(11, 0.3), 0, 0.025), 0.8], [osc.sine((t) => 180 - t * 400), 0.3]), { envelope: env(0.005, 2), gain: 0.6 });
  // a hop: a grunt and a whoosh
  vocs.hop = sample(0.26, mix([lowNoise(13, (t) => 0.05 + t * 0.6), 0.5], [voice((t) => 150 + t * 120, 600, 1100, 4), 0.35]), { envelope: env(0.08, 1.5) });
  // a denarius
  vocs.chime = sample(0.4, mix([osc.sine(1760), 0.5], [osc.sine(2637), 0.3]), { envelope: env(0.005, 2.6) });
  // a joke landing: a pop
  vocs.pop = sample(0.12, mix([osc.sine((t) => 1300 - t * 6000), 0.6], [gate(lowNoise(19, 0.9), 0, 0.012), 0.6]), { envelope: env(0.002, 2.4) });
  // a laugh: "ha ha ha" (Space), and a whole audience laughing (a stone face cracking)
  vocs.ha = sample(0.55, laugh(21, 190, 4), { envelope: env(0.01, 0.4) });
  vocs.crowd = sample(1.1, mix([laugh(22, 210, 7, 0.14), 0.4], [laugh(23, 160, 8, 0.12), 0.35], [laugh(24, 260, 6, 0.16), 0.3], [lowNoise(25, 0.4), 0.06]), {
    envelope: env(0.05, 0.6),
  });
  // a senator's cough
  vocs.cough = sample(
    0.45,
    mix([gate(lowNoise(26, 0.7), 0, 0.12), 0.7], [gate(lowNoise(27, 0.6), 0.2, 0.32), 0.6], [voice(() => 120, 500, 1500, 28, 0.2), 0.15]),
    { envelope: env(0.005, 0.6) },
  );
  // a shutter thrown open: a wooden clack and fresh air rushing in
  vocs.shutter = sample(
    0.7,
    mix(
      [gate(lowNoise(29, 0.8), 0, 0.03), 1],
      [
        gate(
          lowNoise(30, (t) => 0.05 + 0.25 * Math.exp(-(t - 0.05) * 4)),
          0.03,
          0.7,
        ),
        0.5,
      ],
    ),
    { envelope: env(0.003, 0.7) },
  );
  // the brass raspberry: a low buzzing blat that sags (Rufus's contribution, played for the clouds)
  vocs.blat = sample(0.7, mix([osc.square((t) => 70 - t * 25 + Math.sin(t * 60) * 4), 0.35], [lowNoise(31, 0.3), 0.25]), { envelope: env(0.03, 0.5) });
  // a gulp of wine and water
  vocs.gulp = sample(0.3, mix([osc.sine((t) => 300 + Math.sin(t * 30) * 120), 0.5], [gate(lowNoise(32, 0.4), 0.1, 0.16), 0.4]), { envelope: env(0.02, 1) });
  // a fanfare for a laurel wreath
  vocs.tantara = sample(0.8, mix([gate(osc.square(523), 0, 0.15), 0.18], [gate(osc.square(659), 0.15, 0.3), 0.18], [gate(osc.square(784), 0.3, 0.8), 0.2]), {
    envelope: env(0.01, 0.6),
  });
  // a clang (an arrow on a shield, a sword)
  vocs.clang = sample(0.6, mix([osc.sine(1180), 0.4], [osc.sine(1876), 0.3], [osc.sine(2711), 0.2], [gate(lowNoise(33, 0.9), 0, 0.01), 0.5]), {
    envelope: env(0.002, 2),
  });
  // a pigeon's coo
  vocs.coo = sample(
    0.5,
    voice((t) => 330 - Math.abs(Math.sin(t * 9)) * 60, 300, 700, 34, 0.02),
    { envelope: env(0.1, 0.8) },
  );
  // a spell: a rising sparkle
  vocs.sparkle = sample(0.5, mix([osc.sine((t) => 1800 + t * 3000 + Math.sin(t * 90) * 200), 0.4], [osc.sine((t) => 2400 + t * 2600), 0.2]), {
    envelope: env(0.01, 1.2),
  });
  // a meow, and a yowl
  vocs.meow = sample(
    0.5,
    voice(
      (t) => 520 + Math.sin(Math.PI * t * 2) * 260,
      (t) => 500 + t * 1400,
      (t) => 1600 + t * 600,
      35,
      0.04,
    ),
    { envelope: env(0.05, 0.6) },
  );
  vocs.yowl = sample(
    0.9,
    voice(
      (t) => 420 + Math.sin(t * 9) * 90,
      (t) => 700 + t * 600,
      1900,
      36,
      0.06,
    ),
    { envelope: env(0.06, 0.6) },
  );
  // a mouse's squeak
  vocs.squeak = sample(
    0.2,
    osc.sine((t) => 3200 + Math.sin(t * 80) * 400),
    { envelope: env(0.01, 1), gain: 0.5 },
  );
  // a chomp (cheese)
  vocs.chomp = sample(0.3, mix([gate(lowNoise(37, 0.6), 0, 0.06), 0.8], [gate(lowNoise(38, 0.5), 0.14, 0.2), 0.6]), { envelope: env(0.004, 0.8) });
  // a wax tablet breaking
  vocs.crack = sample(0.3, mix([gate(lowNoise(39, 0.95), 0, 0.02), 1], [gate(lowNoise(40, 0.5), 0.02, 0.3), 0.4]), { envelope: env(0.002, 1.5) });
  // a splash in a pool
  vocs.splash = sample(
    0.5,
    lowNoise(41, (t) => 0.7 * Math.exp(-t * 6) + 0.05),
    { envelope: env(0.004, 1.2) },
  );
  // a drum's boing (the baths' score sound, so it plays often: kept about 5 dB under the rest)
  vocs.boing = sample(
    0.5,
    osc.sine((t) => 160 + Math.sin(t * 40) * 40 * Math.exp(-t * 4) + t * 120),
    { envelope: env(0.003, 1), gain: 0.5 },
  );
  // a drip of hot water hissing
  vocs.hiss = sample(
    0.5,
    (() => {
      const r = rng(42);
      let last = 0;
      return () => {
        const n = r() * 2 - 1;
        const hp = n - last * 0.85;
        last = n;
        return hp * 0.6;
      };
    })(),
    { envelope: env(0.05, 0.8), gain: 0.6 },
  );
  // a cabbage's thud
  vocs.thud = sample(0.3, mix([osc.sine((t) => 110 - t * 120), 0.7], [gate(lowNoise(43, 0.3), 0, 0.08), 0.6]), { envelope: env(0.003, 1.2) });
  // a rimshot: ba-dum-tss
  vocs.rimshot = sample(
    1.0,
    mix(
      [
        gate(
          osc.sine((t) => 200 - t * 300),
          0,
          0.12,
        ),
        0.6,
      ],
      [
        gate(
          osc.sine((t) => 120 - (t - 0.22) * 100),
          0.22,
          0.4,
        ),
        0.7,
      ],
      [gate(lowNoise(44, 0.95), 0.45, 1), 0.35],
    ),
    { envelope: env(0.003, 0.4) },
  );
  // the songs themselves
  for (const name of Object.keys(CLIPS) as ClipName[]) vocs[name] = clipVoc(name);
  return vocs;
}

/** Which VOC each effect plays, level by level. */
const PLAYS: Record<Place, Partial<Record<keyof typeof SND, string>>> = {
  banquet: {
    speak: 'ha',
    wail: 'canis',
    hurt: 'cough',
    die: 'dii',
    gain: 'shutter',
    spend: 'flatus',
    kill: 'blat',
    step: 'pat',
    life: 'tantara',
    help: 'gulp',
    score: 'chime',
  },
  battle: {
    speak: 'ha',
    wail: 'currimus',
    hurt: 'clang',
    die: 'dii',
    gain: 'chime',
    spend: 'victoria',
    kill: 'pop',
    step: 'pat',
    life: 'tantara',
    help: 'gulp',
    score: 'summa',
  },
  roofs: {
    speak: 'ha',
    wail: 'titus',
    hurt: 'coo',
    die: 'dii',
    gain: 'ter',
    spend: 'tecta',
    kill: 'sparkle',
    step: 'pat',
    life: 'tantara',
    help: 'gulp',
    score: 'chime',
  },
  kitchen: {
    speak: 'meow',
    wail: 'felis',
    hurt: 'squeak',
    die: 'yowl',
    gain: 'cheddar',
    spend: 'corona',
    kill: 'squeak',
    step: 'pat',
    help: 'gulp',
    score: 'crack',
  },
  baths: {
    speak: 'ha',
    wail: 'piscis',
    hurt: 'hiss',
    die: 'dii',
    gain: 'splash',
    spend: 'cantemus',
    kill: 'pop',
    step: 'pat',
    life: 'tantara',
    help: 'gulp',
    score: 'boing',
  },
  theater: {
    speak: 'ha',
    wail: 'nemo',
    hurt: 'thud',
    die: 'ridetis',
    gain: 'crowd',
    spend: 'rimshot',
    // a joke landing pops; "...sed quis ridet?" is sung once, for the comic mask
    kill: 'pop',
    step: 'pat',
    life: 'tantara',
    help: 'gulp',
    score: 'quis',
  },
};

/** A level's .SND: which VOC each effect plays (a PC speaker tune for each, for no Sound Blaster). */
export function buildSoundSet(place: Place): SoundSet {
  const set = newSoundSet();
  const plays = PLAYS[place];
  const add = (n: keyof typeof SND, fallback: string, freqs: Uint16Array) => {
    set.freqs[SND[n]] = freqs;
    set.digital[SND[n]] = plays[n] ?? fallback;
  };
  add('help', 'gulp', SPEAKER.rise(400, 900));
  add(
    'kill',
    'pop',
    speaker((i) => (i < 4 ? 900 - i * 150 : 0)),
  );
  add('money', 'chime', SPEAKER.coin());
  add('pay', 'chime', SPEAKER.noise(2, 80, 400));
  add('life', 'tantara', SPEAKER.arpeggio([523, 659, 784, 1047]));
  add(
    'score',
    'chime',
    speaker((i) => (i < 6 ? 1568 : i < 14 ? 2349 : 0)),
  );
  add('lose', 'dii', SPEAKER.fall(400, 90));
  add(
    'gain',
    'chime',
    speaker((i) => (i < 8 ? 1100 + i * 120 : 0)),
  );
  add('spend', 'rimshot', SPEAKER.arpeggio([392, 523, 659]));
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
  add('hurt', 'cough', SPEAKER.warble(260, 100, 2.4));
  add('die', 'dii', SPEAKER.fall(500, 70));
  add(
    'speak',
    'ha',
    speaker((i) => (i < 24 ? (Math.floor(i / 6) % 2 ? 0 : 440 - i * 6) : 0)),
  );
  add('wail', 'canis', SPEAKER.warble(330, 120, 0.5));
  return set;
}
