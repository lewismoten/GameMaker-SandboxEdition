// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC.
// The little noises are synthesized here (the clop of a hop, a camel's grumble as he kneels,
// a coin's clink, a chime, a sip of water, a bleat when he's hurt, a long sigh as he faints,
// a twinkle); the singing is cut from the song itself (clips.ts): "Thread the needle, Brother
// Camel!" for an extra life, "Drop that gold and run your race!" for every coin given away,
// "Even a camel can dream!" for Space, "...squeeze on through!" as an eye gate opens or a thread
// is mended, and "Hump down..." as the eye of the needle opens.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { rng } from '../../../kit/pixels';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';
import { CLIPS, clipVoc } from './clips';

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

/** A voice: harmonics of a pitch through two vowel formants (the camel's grumble, bleat and sigh). */
function voice(pitch: (t: number) => number, f1: number, f2: number, seed = 3, rough = 0.03): Synth {
  let phase = 0;
  let last = 0;
  const r = rng(seed);
  return (t) => {
    const f0 = pitch(t);
    phase += 2 * Math.PI * f0 * (t - last);
    last = t;
    let s = 0;
    for (let k = 1; k <= 16; k++) {
      const f = f0 * k;
      if (f > 5000) break;
      s += (Math.exp(-(((f - f1) / 300) ** 2)) + 0.6 * Math.exp(-(((f - f2) / 400) ** 2)) + 0.06 / k) * Math.sin(phase * k);
    }
    return s * 0.5 + (r() * 2 - 1) * rough;
  };
}

export type Place = 'city' | 'desert' | 'tailor' | 'eye';

/** Every synthesized VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // a hop: two hooves, clip-clop
  vocs.clop = sample(0.28, mix([gate(osc.sine((t) => 420 - t * 900), 0, 0.06), 0.8], [gate(osc.sine((t) => 520 - (t - 0.12) * 900), 0.12, 0.18), 0.7], [lowNoise(2, 0.6), 0.15]), { envelope: env(0.005, 0.6) });
  // kneeling: a low camel grumble, "hrrrmph"
  vocs.grumble = sample(0.5, voice((t) => 95 + 20 * Math.sin(t * 40) - t * 30, 500, 1100, 4, 0.12), { envelope: env(0.04, 1.2) });
  // a coin given: a bright clink
  vocs.clink = sample(0.35, mix([osc.sine(2093), 0.5], [osc.sine(3136), 0.3], [osc.sine(4186), 0.15]), { envelope: env(0.002, 2.6) });
  // a chime (points, grace)
  vocs.chime = sample(0.5, mix([osc.sine(1319), 0.5], [osc.sine(1976), 0.3], [osc.sine(2637), 0.15]), { envelope: env(0.005, 2.4) });
  // a long drink of water
  vocs.sip = sample(0.36, mix([gate(lowNoise(5, 0.2), 0, 0.16), 0.4], [osc.sine((t) => 380 + t * 700), 0.4]), { envelope: env(0.05, 1) });
  // hurt: a startled bleat
  vocs.bleat = sample(0.4, voice((t) => 330 + 30 * Math.sin(t * 60), 700, 1800, 5, 0.06), { envelope: env(0.03, 1.1) });
  // fainting: a long, sinking sigh
  vocs.sigh = sample(1.0, voice((t) => 260 - t * 140, 600, 1000, 6, 0.08), { envelope: env(0.06, 0.9) });
  // a star caught: a twinkle
  vocs.twinkle = sample(0.45, mix([osc.sine((t) => 1800 + 900 * Math.sin(t * 50)), 0.5], [osc.sine(3600), 0.2]), { envelope: env(0.01, 1.8) });
  for (const name of CLIPS) vocs[name] = clipVoc(name);
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
  add(SND.kill, 'twinkle', speaker((i) => (i < 6 ? 1800 + (i % 2) * 600 : 0)));
  add(SND.money, 'clink', SPEAKER.coin());
  add(SND.pay, 'gold', speaker((i) => (i < 5 ? 2000 - i * 200 : 0)));
  add(SND.life, 'thread', SPEAKER.arpeggio([523, 659, 784, 1047, 784, 1047]));
  add(SND.score, 'chime', speaker((i) => (i < 6 ? 1319 : i < 14 ? 1976 : 0)));
  add(SND.lose, 'sigh', SPEAKER.fall(600, 200));
  add(SND.gain, 'chime', speaker((i) => (i < 8 ? 900 + i * 120 : 0)));
  add(SND.spend, place === 'eye' ? 'humpdown' : 'squeeze', SPEAKER.noise(3, 60, 300));
  add(SND.hop, 'clop', speaker((i) => (i < 3 ? 500 : i < 6 ? 0 : i < 9 ? 600 : 0)));
  add(SND.kneel, 'grumble', SPEAKER.noise(4, 70, 160));
  add(SND.hurt, 'bleat', SPEAKER.warble(500, 80, 2.4));
  add(SND.faint, 'sigh', SPEAKER.fall(500, 100));
  add(SND.dream, 'dream', SPEAKER.arpeggio([523, 659, 784, 1047]));
  return set;
}
