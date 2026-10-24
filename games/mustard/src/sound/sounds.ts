// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC.
// The little noises are synthesized here (a soft spring for every hop, the scritch of a root, a
// drip, a chime, a sip of dew, an "eep!", a wilting sigh, a pop, stone crumbling); the singing
// is cut from the song itself (clips.ts): "...the mustard seed hustle!" or "...got the greatest
// feet!" for an extra life, "Hallelujah!" for Space (up in the sky, "keep the mustard
// seed hustle alive!"), "Keep on hustlin'" as the sidewalk cracks open, and "Tiny faith can
// move mountains" each time a boulder moves.
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

/** A tiny voice: harmonics of a pitch through two vowel formants (the seed's "eep!" and "aww"). */
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

export type Place = 'garden' | 'dust' | 'mountain' | 'sky';

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // the greatest feet: a small, soft spring (it plays on every hop, so it stays short and quiet)
  vocs.boing = sample(0.14, mix([osc.sine((t) => 300 + 340 * Math.exp(-t * 22)), 0.85], [osc.sine((t) => 600 + 680 * Math.exp(-t * 22)), 0.15]), {
    envelope: env(0.015, 2.2),
    gain: 0.42,
  });
  // a root pushing down into the dust: a gritty scritch
  vocs.scritch = sample(0.24, mix([gate(lowNoise(3, 0.55), 0, 0.08), 0.8], [gate(lowNoise(4, 0.35), 0.1, 0.2), 0.7]), { envelope: () => 1, gain: 0.7 });
  // a drop of water (or of faith)
  vocs.drip = sample(
    0.22,
    osc.sine((t) => 900 + 1500 * Math.exp(-t * 30)),
    { envelope: env(0.01, 2.2), gain: 0.8 },
  );
  // a sunbeam: two bell partials
  vocs.chime = sample(0.5, mix([osc.sine(1568), 0.5], [osc.sine(2349), 0.3], [osc.sine(3136), 0.15]), { envelope: env(0.005, 2.4) });
  // a sip of dew
  vocs.sip = sample(0.28, mix([gate(lowNoise(5, 0.2), 0, 0.12), 0.4], [osc.sine((t) => 500 + t * 900), 0.4]), { envelope: env(0.05, 1) });
  // hurt: a startled "eep!"
  vocs.eep = sample(
    0.26,
    voice((t) => 820 + t * 900, 900, 2600, 5),
    { envelope: env(0.04, 1.2) },
  );
  // wilting: a long, sad "aww..."
  vocs.wilt = sample(
    0.9,
    voice((t) => 560 - t * 260, 750, 1200, 6),
    { envelope: env(0.06, 0.9) },
  );
  // a pop
  vocs.pop = sample(
    0.12,
    osc.sine((t) => 600 - t * 2000),
    { envelope: env(0.01, 2), gain: 0.7 },
  );
  // stone crumbling
  vocs.crumble = sample(
    0.7,
    mix([lowNoise(9, (t) => 0.5 - t * 0.6), 0.6], [gate(lowNoise(10, 0.2), 0.1, 0.18), 0.6], [gate(lowNoise(11, 0.25), 0.3, 0.36), 0.5]),
    { envelope: env(0.01, 1.3) },
  );
  // the song itself
  vocs.hustle = clipVoc('hustle');
  vocs.hallelu = clipVoc('hallelu');
  vocs.keepon = clipVoc('keepon');
  vocs.alive = clipVoc('alive');
  vocs.mountain = clipVoc('mountain');
  vocs.feet = clipVoc('feet');
  return vocs;
}

/** A level's .SND: which VOC each effect plays. */
export function buildSoundSet(place: Place): SoundSet {
  const set = newSoundSet();
  const add = (n: number, name: string, freqs: Uint16Array) => {
    set.freqs[n] = freqs;
    set.digital[n] = name;
  };
  const high = place === 'mountain' || place === 'sky';
  add(SND.help, 'sip', SPEAKER.rise(400, 900));
  add(
    SND.kill,
    'pop',
    speaker((i) => (i < 4 ? 700 - i * 100 : 0)),
  );
  add(SND.money, 'drip', SPEAKER.coin());
  add(SND.pay, 'crumble', SPEAKER.noise(2, 80, 400));
  add(SND.life, high ? 'feet' : 'hustle', SPEAKER.arpeggio([440, 554, 659, 880, 659, 880]));
  add(
    SND.score,
    'chime',
    speaker((i) => (i < 6 ? 1568 : i < 14 ? 2349 : 0)),
  );
  add(SND.lose, 'pop', SPEAKER.fall(600, 200));
  add(
    SND.gain,
    'drip',
    speaker((i) => (i < 8 ? 900 + i * 120 : 0)),
  );
  add(SND.spend, place === 'mountain' ? 'mountain' : place === 'dust' ? 'keepon' : 'crumble', SPEAKER.noise(3, 60, 300));
  add(
    SND.hop,
    'boing',
    speaker((i) => (i < 5 ? 320 + (5 - i) * 50 : 0)),
  );
  add(SND.root, 'scritch', SPEAKER.noise(4, 90, 260));
  add(SND.hurt, 'eep', SPEAKER.warble(900, 120, 2.4));
  add(SND.wilt, 'wilt', SPEAKER.fall(700, 120));
  add(SND.joy, place === 'sky' ? 'alive' : 'hallelu', SPEAKER.arpeggio([440, 554, 659, 880]));
  return set;
}
