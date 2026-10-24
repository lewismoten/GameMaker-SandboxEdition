// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC. The
// little noises are synthesized here (a creaky board and her sleepy "mm?", "Honey?", a tiptoe,
// a hop, coins, a sip of water, the remote's fanfare, a hello, a dairy "nom", the fridge's hum,
// a cow mooing ominously, the stomach gurgling like a swamp demon awakening, a roll of toilet
// paper, the bathroom door slamming, thunder, a thunderous flush); the lines of the monologue
// are cut from the recording (clips.ts), one set a level: what he says on Space and B, what
// the Devil says when a milkshake hits, and so on. Two VOCs join a noise and a line: the door
// slam then "IT'S NOT WORTH IT!", and the flush then "...Is there Lactaid in hell?".
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { rng } from '../../../kit/pixels';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';
import { clipSamples, clipVoc, vocOf, CLIPS } from './clips';

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
const gate =
  (v: Synth, from: number, to: number): Synth =>
  (t) =>
    t >= from && t < to ? v(t) : 0;
const env = (attack: number, decay: number) => (u: number) => Math.min(1, u / attack) * Math.max(0, 1 - u) ** decay;

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

/** A clip's samples at another rate (linear). */
function resampled(s: Float32Array, from: number, to: number): Float32Array {
  const n = Math.floor((s.length * to) / from);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * from) / to;
    const k = Math.floor(x);
    out[i] = (s[k] ?? 0) + ((s[k + 1] ?? 0) - (s[k] ?? 0)) * (x - k);
  }
  return out;
}

const join = (...parts: Float32Array[]): Float32Array => {
  const out = new Float32Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) (out.set(p, o), (o += p.length));
  return out;
};

export type Place = 'bedroom' | 'fridge' | 'dash' | 'hell';

/** The thunder's rumble (also the start of the flush). */
const thunder = (seed: number): Synth => mix([lowNoise(seed, (t) => 0.5 * Math.exp(-t * 4) + 0.02), 0.9], [osc.sine((t) => 50 - t * 10), 0.3]);
/** A big flush: a roar of water swirling down. */
const flush: Synth = (() => {
  const n = lowNoise(81, (t) => 0.12 + 0.2 * Math.sin(t * 9) ** 2);
  const swirl = osc.sine((t) => 220 + Math.sin(t * 14) * 80 - t * 60);
  return (t: number) => n(t) * 0.8 + swirl(t) * 0.2 * Math.min(1, t * 3);
})();

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // a tiptoe
  vocs.pat = sample(0.12, mix([gate(lowNoise(11, 0.2), 0, 0.03), 0.8], [osc.sine((t) => 140 - t * 300), 0.3]), { envelope: env(0.005, 2), gain: 0.6 });
  // a hop: a little grunt and a whoosh
  vocs.hop = sample(0.26, mix([lowNoise(12, (t) => 0.05 + t * 0.6), 0.5], [voice((t) => 150 + t * 120, 600, 1100, 4), 0.35]), { envelope: env(0.08, 1.5) });
  // coins
  vocs.chime = sample(0.4, mix([osc.sine(1568), 0.5], [osc.sine(2349), 0.3]), { envelope: env(0.005, 2.6) });
  // a sip of water
  vocs.sip = sample(0.3, mix([gate(lowNoise(13, 0.2), 0, 0.14), 0.4], [osc.sine((t) => 500 + t * 900), 0.4]), { envelope: env(0.05, 1) });
  // the remote found: a fanfare
  vocs.tada = sample(
    0.7,
    (t) =>
      [523, 659, 784, 1047].reduce((s, f, i) => s + (t > i * 0.08 ? Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.12 * Math.exp(-(t - i * 0.08) * 3) : 0), 0),
    { envelope: env(0.005, 0.8) },
  );
  // a hello (a friend from another song)
  vocs.hello = sample(
    0.24,
    voice((t) => 520 + t * 600, 700, 2100, 5),
    { envelope: env(0.03, 1.2) },
  );
  // a creaky board, and her sleepy "mm?" (rising)
  vocs.creak = sample(
    0.95,
    mix(
      [gate((t) => Math.sin(2 * Math.PI * (130 + Math.sin(t * 40) * 30) * t) * (Math.sin(t * 380) > 0.2 ? 1 : 0.25), 0, 0.42), 0.6],
      [
        gate(
          voice((t) => 190 + Math.max(0, t - 0.55) * 260, 300, 900, 6, 0.01),
          0.5,
          0.95,
        ),
        0.5,
      ],
    ),
    { envelope: env(0.02, 0.3) },
  );
  // "Honey?": she's awake (two syllables, the second rising)
  vocs.wake = sample(
    0.8,
    mix(
      [
        gate(
          voice(
            () => 230,
            (t) => 520 + t * 200,
            1300,
            7,
          ),
          0.02,
          0.32,
        ),
        0.6,
      ],
      [
        gate(
          voice(
            (t) => 240 + (t - 0.4) * 300,
            300,
            (t) => 2200 + t * 100,
            8,
          ),
          0.4,
          0.78,
        ),
        0.6,
      ],
    ),
    { envelope: env(0.02, 0.4) },
  );
  // a dairy "nom" and a guilty "mmm"
  vocs.nom = sample(
    0.6,
    mix(
      [gate(lowNoise(14, 0.6), 0, 0.05), 0.6],
      [
        gate(
          voice((t) => 160 - t * 40, 280, 800, 9, 0.005),
          0.08,
          0.6,
        ),
        0.7,
      ],
    ),
    { envelope: env(0.01, 0.6) },
  );
  // the fridge's hum
  vocs.hum = sample(0.8, mix([osc.sine(60), 0.4], [osc.sine(120), 0.3], [osc.square(180), 0.05], [lowNoise(15, 0.02), 0.1]), {
    envelope: env(0.2, 0.5),
    gain: 0.7,
  });
  // somewhere, a cow moos ominously (a low "mmmooOOO", falling away)
  vocs.moo = sample(
    1.3,
    voice(
      (t) => 110 + Math.sin(Math.min(1, t / 0.5) * Math.PI) * 30 - t * 30,
      (t) => 300 + Math.min(1, t / 0.4) * 300,
      (t) => 800 + Math.min(1, t / 0.4) * 300,
      10,
      0.04,
    ),
    { envelope: env(0.15, 0.6) },
  );
  // the stomach gurgling like a swamp demon awakening: bubbles at random pitches over a low growl
  {
    const r = rng(16);
    const bubbles = Array.from({ length: 14 }, (_, i) => ({ at: i * 0.055 + r() * 0.03, f: 90 + r() * 260, d: 0.04 + r() * 0.05 }));
    const growl = voice((t) => 70 + Math.sin(t * 13) * 12, 220, 500, 17, 0.08);
    vocs.gurgle = sample(
      0.9,
      (t) =>
        growl(t) * 0.5 +
        bubbles.reduce((s, b) => s + (t > b.at && t < b.at + b.d ? Math.sin(2 * Math.PI * (b.f + (t - b.at) * 900) * (t - b.at)) * 0.7 : 0), 0),
      { envelope: env(0.02, 0.5) },
    );
  }
  // a roll of toilet paper: a soft squeak and a pat
  vocs.squeak = sample(0.3, mix([osc.sine((t) => 1400 + Math.sin(t * 60) * 300), 0.3], [gate(lowNoise(18, 0.3), 0.15, 0.2), 0.5]), {
    envelope: env(0.02, 1.2),
  });
  // a splash of almond milk, thrown (the reckoning's Space after the first "Begone!" on B)
  vocs.splash = sample(0.28, mix([lowNoise(23, (t) => 0.7 - t * 2), 0.7], [osc.sine((t) => 900 - t * 2200), 0.2]), { envelope: env(0.01, 2.2) });
  // a milkshake or the Devil splashed: a short hiss
  vocs.sizzle = sample(0.34, mix([lowNoise(24, 0.95), 0.6], [osc.sine((t) => 300 + Math.sin(t * 90) * 60), 0.15]), { envelope: env(0.005, 1.6), gain: 0.7 });
  // a carton picked up: a glug
  vocs.glug = sample(0.3, (t) => Math.sin(2 * Math.PI * (180 + (t % 0.1) * 1600) * t) * (t % 0.1 < 0.06 ? 0.6 : 0.1), { envelope: env(0.01, 1.4), gain: 0.7 });
  // thunder: a crack and its roll
  vocs.thunder = sample(1.6, mix([gate(lowNoise(19, 0.9), 0, 0.06), 0.9], [thunder(20), 1]), { envelope: env(0.003, 0.9) });
  // the bathroom door slamming, then "IT'S NOT WORTH IT!"
  {
    const rate = CLIPS.worth;
    const slam = render(
      0.35,
      mix([gate(lowNoise(21, 0.8), 0, 0.03), 1], [osc.sine((t) => 90 - t * 100), 0.6], [lowNoise(22, 0.1), 0.4]),
      rate,
      env(0.002, 1.4),
    );
    vocs.slamwrth = vocOf('slamwrth', join(slam, new Float32Array(Math.round(rate * 0.05)), clipSamples('worth')), rate);
  }
  // the thunderous flush, then softly: "...Is there Lactaid in hell?" (kept at 8000 Hz to fit)
  {
    const rate = 8000;
    const roar = render(1.1, flush, rate, env(0.03, 0.9));
    vocs.flushlac = vocOf('flushlac', join(roar, new Float32Array(Math.round(rate * 0.25)), resampled(clipSamples('lactaid'), CLIPS.lactaid, rate)), rate);
  }
  // the monologue itself
  for (const name of [
    'enemy',
    'cant',
    'intol',
    'better',
    'betray',
    'ohno',
    'demon',
    'colon',
    'coward',
    'begone',
    'almond',
    'suffer',
    'shins',
    'lactaid',
  ] as const)
    vocs[name] = clipVoc(name);
  return vocs;
}

/** Which VOC each effect plays, act by act. */
const PLAYS: Record<Place, Partial<Record<keyof typeof SND, string>>> = {
  bedroom: { speak: 'cant', wail: 'intol', hurt: 'creak', die: 'wake', kill: 'hello', step: 'pat' },
  fridge: { speak: 'enemy', wail: 'intol', hurt: 'nom', die: 'moo', gain: 'better', spend: 'betray', kill: 'hello', step: 'hum' },
  dash: { speak: 'ohno', wail: 'shins', hurt: 'gurgle', die: 'colon', gain: 'squeak', spend: 'slamwrth', kill: 'hello', step: 'pat' },
  // the reckoning voices each line once: "I have almond milk now!" for the first carton (it's
  // the only thing in hell that gives dignity back), "Begone, foul beast!" on B; a throw splashes,
  // a hit hisses, and the thunder is for the Devil's last straw
  hell: {
    speak: 'splash',
    wail: 'begone',
    help: 'almond',
    hurt: 'coward',
    die: 'suffer',
    gain: 'glug',
    spend: 'flushlac',
    kill: 'sizzle',
    step: 'pat',
    score: 'thunder',
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
  add('help', 'sip', SPEAKER.rise(400, 900));
  add(
    'kill',
    'hello',
    speaker((i) => (i < 4 ? 700 - i * 100 : 0)),
  );
  add('money', 'chime', SPEAKER.coin());
  add('pay', 'chime', SPEAKER.noise(2, 80, 400));
  add('life', 'tada', SPEAKER.arpeggio([523, 659, 784, 1047, 784, 1047]));
  add(
    'score',
    'chime',
    speaker((i) => (i < 6 ? 1568 : i < 14 ? 2349 : 0)),
  );
  add('lose', 'moo', SPEAKER.fall(600, 120));
  add(
    'gain',
    'chime',
    speaker((i) => (i < 8 ? 1100 + i * 120 : 0)),
  );
  add('spend', 'chime', SPEAKER.noise(3, 60, 300));
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
  add('hurt', 'creak', SPEAKER.warble(300, 120, 2.4));
  add('die', 'moo', SPEAKER.fall(500, 90));
  add('speak', 'cant', SPEAKER.warble(440, 160, 0.7));
  add('wail', 'intol', SPEAKER.warble(520, 220, 0.5));
  return set;
}
