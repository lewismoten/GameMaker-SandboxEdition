// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC.
// Goat noises are synthesized here (the scream, a "meh" when hurt, the stiff thud of a
// faint, munching, the pail's clang, a sneeze); the singing is cut from the song itself
// (clips.ts): "Third goat from the left!" for an extra life, a bleat of joy for wool and
// for B, "...all night long" for C, "Hey!" when the place in the line opens, and in the
// stable "He sees you."
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

/**
 * A goat's voice: harmonics of a wobbling pitch, shaped by two vowel formants, with the
 * fast tremolo that makes a bleat a bleat. pitch(t) in Hz, `trem` the bleat rate.
 */
function goatVoice(pitch: (t: number) => number, f1: number, f2: number, trem: number, rough = 0.15, seed = 3): Synth {
  let phase = 0;
  let last = 0;
  const r = rng(seed);
  return (t) => {
    const f0 = pitch(t);
    phase += 2 * Math.PI * f0 * (t - last);
    last = t;
    let s = 0;
    for (let k = 1; k <= 14; k++) {
      const f = f0 * k;
      if (f > 5000) break;
      const a = Math.exp(-(((f - f1) / 260) ** 2)) + 0.6 * Math.exp(-(((f - f2) / 360) ** 2)) + 0.08 / k;
      s += a * Math.sin(phase * k);
    }
    const am = 0.55 + 0.45 * Math.sin(2 * Math.PI * trem * t);
    return (s * 0.45 + (r() * 2 - 1) * rough) * am;
  };
}

export interface SoundFiles {
  set: SoundSet;
  vocs: Record<string, Uint8Array>;
}

export type Place = 'outside' | 'stable';

/** The VOCs every set shares, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // munching hay: three crunchy bites
  vocs.munch = sample(0.42, mix([gate(lowNoise(3, 0.5), 0, 0.07), 0.8], [gate(lowNoise(4, 0.45), 0.14, 0.21), 0.7], [gate(lowNoise(5, 0.5), 0.28, 0.35), 0.6]), {
    envelope: () => 1,
  });
  // a fainted cousin hits the ground: boing, thud
  vocs.thud = sample(
    0.5,
    mix([osc.sine((t) => 420 * Math.exp(-t * 7)), 0.55], [gate(lowNoise(7, (t) => 0.3 - t * 0.4), 0.12, 0.5), 0.6]),
    { envelope: env(0.005, 1.6) },
  );
  vocs.blip = sample(0.12, osc.square((t) => 880 + t * 3000), { gain: 0.4 });
  vocs.nom = sample(0.22, mix([goatVoice(() => 300, 500, 1400, 30, 0.05, 2), 0.8], [gate(lowNoise(8, 0.4), 0, 0.05), 0.4]), { envelope: env(0.02, 1.2) });
  // the pail: a tin clang and the slosh
  const tin = (hz: number): Synth => {
    const s = osc.sine(hz);
    return (t) => s(t) * Math.exp(-t * 5);
  };
  vocs.clang = sample(0.9, mix([tin(523), 0.3], [tin(1307), 0.25], [tin(2141), 0.2], [tin(3387), 0.12], [gate(lowNoise(9, 0.25), 0.05, 0.9), 0.25]), { envelope: () => 1 });
  // THE SCREAM: an indignant, very human-sounding "AAAAAAH!"
  vocs.scream = sample(
    0.95,
    goatVoice((t) => 620 + 260 * Math.min(1, t * 6) - 160 * t + 25 * Math.sin(t * 40), 900, 1500, 9, 0.22, 4),
    { envelope: (u) => Math.min(1, u * 14) * (u < 0.75 ? 1 : (1 - u) * 4), gain: 0.95 },
  );
  // hurt: a startled "meh!"
  vocs.meh = sample(0.38, goatVoice((t) => 520 - t * 200, 600, 1800, 24, 0.1, 5), { envelope: env(0.03, 1) });
  // fainting: a little gasp, then over she goes, stiff
  vocs.faint = sample(
    0.9,
    mix([gate(goatVoice((t) => 700 + t * 300, 700, 1700, 0, 0.3, 6), 0, 0.25), 0.6], [gate(osc.sine((t) => 300 * Math.exp(-(t - 0.4) * 6)), 0.4, 0.9), 0.6], [gate(lowNoise(10, 0.3), 0.55, 0.75), 0.6]),
    { envelope: () => 1 },
  );
  // a bleat (until the song's own bleat replaces it)
  vocs.bleat = sample(0.7, goatVoice((t) => 380 + 30 * Math.sin(t * 9), 650, 1750, 18, 0.08, 7), { envelope: env(0.06, 0.8) });
  // the stable's dust: "ah... ah... CHOO!"
  vocs.achoo = sample(
    0.9,
    mix([gate(goatVoice((t) => 300 + t * 600, 700, 1300, 0, 0.1, 8), 0, 0.45), 0.5], [gate(lowNoise(11, (t) => 0.9 - (t - 0.5) * 1.5), 0.5, 0.9), 0.9]),
    { envelope: (u) => (u < 0.5 ? u * 1.4 : 1 - (u - 0.5) * 2.2) },
  );
  // the song itself
  vocs.hook = clipVoc('hook');
  vocs.yay = clipVoc('bleat');
  vocs.hey = clipVoc('hey');
  vocs.seesyou = clipVoc('seesyou');
  vocs.nightlng = clipVoc('nightlong');
  return vocs;
}

/** A level's .SND: which VOC each effect plays; the stable sneezes and sees you. */
export function buildSoundSet(place: Place): SoundSet {
  const set = newSoundSet();
  const add = (n: number, name: string, freqs: Uint16Array) => {
    set.freqs[n] = freqs;
    set.digital[n] = name;
  };
  add(SND.help, 'munch', speaker((i) => (i % 6 < 3 && i < 18 ? 160 + (i % 3) * 40 : 0)));
  add(SND.kill, 'thud', SPEAKER.fall(900, 80));
  add(SND.money, 'blip', SPEAKER.coin());
  add(SND.pay, 'blip', SPEAKER.chirp());
  add(SND.life, place === 'stable' ? 'seesyou' : 'hook', SPEAKER.arpeggio([523, 659, 784, 1047, 784, 1047]));
  add(SND.score, place === 'stable' ? 'achoo' : 'nom', place === 'stable' ? SPEAKER.noise(3, 400, 3000) : speaker((i) => (i < 6 ? 330 : 0)));
  add(SND.lose, 'clang', speaker((i) => (i < 20 ? [1307, 523, 2141][i % 3] : 0)));
  add(SND.wool, 'yay', SPEAKER.warble(500, 60, 2.2));
  add(SND.gift, 'hey', SPEAKER.arpeggio([392, 523, 659, 784]));
  add(SND.scream, 'scream', speaker((i) => 900 + Math.sin(i * 1.7) * 120 - i * 6));
  add(SND.hurt, 'meh', SPEAKER.warble(520, 90, 2.6));
  add(SND.faint, 'faint', SPEAKER.fall(1200, 60));
  add(SND.bleat, 'yay', SPEAKER.warble(400, 70, 2.4));
  add(SND.chew, 'nightlng', speaker((i) => (i % 9 < 2 ? 140 : 0)));
  return set;
}
