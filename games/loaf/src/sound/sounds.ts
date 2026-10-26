// The effects are leveled to about -15 dB RMS (the roll and the crunch were hot, the crumble and
// the holy shimmer quiet), near the sung clips.
//
// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC. The
// little noises are synthesized here (the soft whump of dough rising, a crusty roll, a crunchy
// bite, a loaf crumbling, a crumb's chime and a holy crumb's shimmer, the creak of wicker, a
// brother loaf's "hi!", a fish's flop, a sip); the singing is cut from the song itself
// (clips.ts): "I'm still bread!" for Space and B (hushed on the way home), "Don't count me out!"
// for an extra life, "twelve baskets full" for each basket gathered, "Nothing's ever wasted."
// as the twelfth basket takes you, and "Mama, look what I've got..." at the door of home.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { rng } from '../../../kit/pixels';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';
import { clipVoc } from './clips';

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

/** A tiny voice: harmonics of a pitch through two vowel formants (a brother loaf's "hi!"). */
function voice(pitch: (t: number) => number, f1: number, f2: number, seed = 3): Synth {
  let phase = 0;
  let last = 0;
  const r = rng(seed);
  return (t) => {
    const f0 = pitch(t);
    phase += 2 * Math.PI * f0 * (t - last);
    last = t;
    let s = 0;
    for (let k = 1; k <= 12; k++) {
      const f = f0 * k;
      if (f > 5000) break;
      s += (Math.exp(-(((f - f1) / 300) ** 2)) + 0.6 * Math.exp(-(((f - f2) / 400) ** 2)) + 0.06 / k) * Math.sin(phase * k);
    }
    return s * 0.5 + (r() * 2 - 1) * 0.03;
  };
}

export type Place = 'hill' | 'wicker' | 'baskets' | 'home';

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // rising: a soft, swelling whump of dough with a little upward whistle of steam
  vocs.puff = sample(0.36, mix([lowNoise(21, (t) => 0.05 + t * 0.5), 0.6], [osc.sine((t) => 180 + t * 700), 0.5]), { envelope: env(0.12, 1.6), gain: 0.65 });
  // rolling: two crusty bumps
  vocs.roll = sample(0.22, mix([gate(lowNoise(22, 0.3), 0, 0.05), 0.8], [gate(lowNoise(23, 0.25), 0.11, 0.16), 0.7], [osc.sine((t) => 110 - t * 120), 0.3]), {
    envelope: () => 1,
    gain: 0.42,
  });
  // a bite: a crunch of crust
  vocs.crunch = sample(
    0.28,
    mix(
      [gate(lowNoise(24, 0.8), 0, 0.03), 0.9],
      [gate(lowNoise(25, 0.7), 0.05, 0.08), 0.8],
      [gate(lowNoise(26, 0.6), 0.11, 0.15), 0.6],
      [voice((t) => 300 - t * 300, 600, 1000, 7), 0.25],
    ),
    { envelope: env(0.005, 1), gain: 0.55 },
  );
  // crumbling to crumbs: a long patter
  const grit = lowNoise(31, 0.6);
  vocs.crumble = sample(
    0.9,
    (t) => {
      const k = Math.floor(t * 40);
      const v = grit(t);
      return rng(k * 7 + 1)() < 0.8 - t * 0.5 ? v * Math.exp(-(t * 40 - k) * 6) : 0;
    },
    { envelope: env(0.01, 0.8), gain: 1 },
  );
  // a crumb: a tiny chime
  vocs.chime = sample(0.4, mix([osc.sine(1760), 0.5], [osc.sine(2637), 0.3]), { envelope: env(0.005, 2.6) });
  // a holy crumb: a shimmer of bells going up
  vocs.holy = sample(
    0.7,
    (t) => [1397, 1760, 2093, 2637].reduce((s, f, i) => s + (t > i * 0.06 ? Math.sin(2 * Math.PI * f * t) * Math.exp(-(t - i * 0.06) * 6) * 0.3 : 0), 0),
    { envelope: env(0.005, 1.2), gain: 1.4 },
  );
  // wicker: a creak
  vocs.creak = sample(0.4, (t) => Math.sin(2 * Math.PI * (140 + Math.sin(t * 40) * 30) * t) * (Math.sin(t * 380) > 0.2 ? 1 : 0.2) * 0.7, {
    envelope: env(0.03, 1),
  });
  // a brother loaf says hi
  vocs.hello = sample(
    0.24,
    voice((t) => 520 + t * 600, 700, 2100, 5),
    { envelope: env(0.03, 1.2) },
  );
  // a fish flops
  vocs.flop = sample(0.3, mix([gate(lowNoise(27, 0.4), 0, 0.04), 0.8], [gate(lowNoise(28, 0.4), 0.14, 0.18), 0.6], [osc.sine((t) => 300 - t * 500), 0.3]), {
    envelope: env(0.005, 1),
    gain: 0.72,
  });
  // a sip of water
  vocs.sip = sample(0.28, mix([gate(lowNoise(29, 0.2), 0, 0.12), 0.4], [osc.sine((t) => 500 + t * 900), 0.4]), { envelope: env(0.05, 1) });
  // the song itself
  vocs.bread = clipVoc('bread');
  vocs.countme = clipVoc('countme');
  vocs.twelve = clipVoc('twelve');
  vocs.wasted = clipVoc('wasted');
  vocs.still = clipVoc('still');
  vocs.mama = clipVoc('mama');
  return vocs;
}

/** A level's .SND: which VOC each effect plays. */
export function buildSoundSet(place: Place): SoundSet {
  const set = newSoundSet();
  const add = (n: number, name: string, freqs: Uint16Array) => {
    set.freqs[n] = freqs;
    set.digital[n] = name;
  };
  add(SND.help, 'sip', SPEAKER.rise(400, 900));
  add(
    SND.kill,
    place === 'hill' ? 'hello' : 'flop',
    speaker((i) => (i < 4 ? 700 - i * 100 : 0)),
  );
  add(SND.money, 'chime', SPEAKER.coin());
  add(SND.pay, 'creak', SPEAKER.noise(2, 80, 400));
  add(SND.life, 'countme', SPEAKER.arpeggio([466, 587, 698, 932, 698, 932]));
  add(
    SND.score,
    'chime',
    speaker((i) => (i < 6 ? 1760 : i < 14 ? 2637 : 0)),
  );
  add(SND.lose, 'crumble', SPEAKER.fall(600, 200));
  add(
    SND.gain,
    place === 'baskets' ? 'twelve' : 'holy',
    speaker((i) => (i < 8 ? 1397 + i * 120 : 0)),
  );
  add(SND.spend, place === 'wicker' ? 'bread' : place === 'baskets' ? 'wasted' : place === 'home' ? 'mama' : 'creak', SPEAKER.noise(3, 60, 300));
  add(
    SND.rise,
    'puff',
    speaker((i) => (i < 12 ? 200 + i * 40 : 0)),
  );
  add(SND.roll, 'roll', SPEAKER.noise(4, 90, 260));
  add(SND.hurt, 'crunch', SPEAKER.warble(500, 120, 2.4));
  add(SND.crumble, 'crumble', SPEAKER.fall(700, 120));
  add(SND.bread, place === 'home' ? 'still' : 'bread', SPEAKER.arpeggio([466, 587, 698, 932]));
  return set;
}
