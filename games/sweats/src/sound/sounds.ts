// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC. The
// little noises are synthesized here (a footstep in slippers, a hop, a coin in the tip jar, a
// sip of coffee, applause, finger snaps, the register, the curtain's swish, a word balloon's
// "alas"); the lines of the monologues are cut from the recordings (clips.ts), four to a
// monologue: its opening line (the spotlight: the score sound), the line B says, the punch line
// (the last gate: the spend sound) and the word Space declaims.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { rng } from '../../../kit/pixels';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';
import { MONOLOGUES, type SoundPlan } from '../scenes';
import { clipVoc, hasClip } from './clips';

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

/** Claps or snaps: short noise bursts at random times. */
function bursts(seed: number, n: number, seconds: number, cutoff: number, len: number): Synth {
  const r = rng(seed);
  const at = Array.from({ length: n }, () => r() * seconds * 0.8);
  const noise = lowNoise(seed + 1, cutoff);
  return (t) => {
    const v = noise(t);
    return at.reduce((s, a) => s + (t > a && t < a + len ? v * Math.exp(-(t - a) / (len / 3)) : 0), 0);
  };
}

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // a footstep in fuzzy slippers
  vocs.pat = sample(0.1, gate(lowNoise(11, 0.15), 0, 0.05), { envelope: env(0.01, 2), gain: 0.5 });
  // a hop: a whoosh
  vocs.hop = sample(
    0.22,
    lowNoise(12, (t) => 0.05 + t * 0.7),
    { envelope: env(0.1, 1.5), gain: 0.6 },
  );
  // a coin in the tip jar
  vocs.clink = sample(0.35, mix([osc.sine(2093), 0.5], [osc.sine(3136), 0.3], [gate(lowNoise(13, 0.9), 0, 0.01), 0.4]), { envelope: env(0.002, 2.4) });
  // a sip of coffee, and a satisfied "ahh"
  vocs.sip = sample(
    0.5,
    mix(
      [gate(lowNoise(14, 0.25), 0, 0.18), 0.5],
      [
        gate(
          osc.sine((t) => 180 - t * 40),
          0.22,
          0.5,
        ),
        0.3,
      ],
    ),
    { envelope: env(0.05, 1) },
  );
  // the register: ka-ching
  vocs.ching = sample(0.5, mix([gate(lowNoise(15, 0.8), 0, 0.04), 0.6], [gate(osc.sine(2637), 0.06, 0.5), 0.4], [gate(osc.sine(3951), 0.06, 0.5), 0.25]), {
    envelope: env(0.002, 1.6),
  });
  // applause (an extra life), finger snaps (the coffee house's applause), a cheer
  vocs.applause = sample(1.2, bursts(16, 70, 1.2, 0.6, 0.03), { envelope: env(0.1, 0.7), gain: 0.6 });
  vocs.snaps = sample(0.9, bursts(17, 9, 0.9, 0.9, 0.012), { envelope: env(0.01, 0.4), gain: 0.8 });
  vocs.cheer = sample(1.4, mix([bursts(18, 60, 1.4, 0.6, 0.03), 0.6], [lowNoise(19, 0.08), 0.3]), { envelope: env(0.1, 0.8), gain: 0.6 });
  // the curtain's swish
  vocs.curtain = sample(
    0.7,
    lowNoise(20, (t) => 0.03 + 0.25 * Math.sin(Math.PI * Math.min(1, t / 0.7))),
    { envelope: env(0.2, 0.8), gain: 0.7 },
  );
  // a word balloon: a bright little "pop" rising
  vocs.alas = sample(0.25, mix([osc.sine((t) => 600 + t * 2400), 0.4], [gate(lowNoise(21, 0.9), 0, 0.01), 0.4]), { envelope: env(0.01, 1.4) });
  // a word balloon bursting on something: a soft pop
  vocs.pop = sample(0.18, mix([osc.sine((t) => 900 - t * 2600), 0.5], [gate(lowNoise(22, 0.7), 0, 0.02), 0.5]), { envelope: env(0.003, 2) });
  // a hurt: a dismayed "oh!"
  vocs.oh = sample(
    0.3,
    osc.sine((t) => 330 - t * 300),
    { envelope: env(0.02, 1.2), gain: 0.5 },
  );
  // fainting: a long falling sigh
  vocs.swoon = sample(0.9, mix([osc.sine((t) => 440 * 2 ** (-t * 1.5)), 0.4], [lowNoise(23, 0.05), 0.2]), { envelope: env(0.05, 0.8) });
  // a plot thing found: a glint
  vocs.glint = sample(0.4, mix([osc.sine(1568), 0.4], [osc.sine(2349), 0.3], [osc.sine(3136), 0.2]), { envelope: env(0.005, 2) });
  // the monologues' lines
  for (const d of MONOLOGUES) for (const name of Object.values(d.sounds)) if (name && !vocs[name]) vocs[name] = hasClip(name) ? clipVoc(name) : vocs.glint;
  return vocs;
}

/** A scene's .SND: which VOC each effect plays (a PC speaker tune for each, for no Sound Blaster). */
export function buildSoundSet(plan: SoundPlan): SoundSet {
  const set = newSoundSet();
  const add = (n: keyof typeof SND, voc: string, freqs: Uint16Array) => {
    set.freqs[SND[n]] = freqs;
    set.digital[SND[n]] = (plan as Record<string, string | undefined>)[n] ?? voc;
  };
  add('help', 'sip', SPEAKER.rise(400, 900));
  add(
    'kill',
    'pop',
    speaker((i) => (i < 4 ? 900 - i * 120 : 0)),
  );
  add('money', 'clink', SPEAKER.coin());
  add('pay', 'ching', SPEAKER.arpeggio([1319, 1568]));
  add('life', 'applause', SPEAKER.noise(2, 300, 2000));
  add(
    'score',
    'cheer',
    speaker((i) => (i < 6 ? 1568 : i < 14 ? 2349 : 0)),
  );
  add('lose', 'swoon', SPEAKER.fall(600, 120));
  add(
    'gain',
    'glint',
    speaker((i) => (i < 8 ? 1100 + i * 120 : 0)),
  );
  add('spend', 'snaps', SPEAKER.noise(3, 60, 300));
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
  add('hurt', 'oh', SPEAKER.warble(300, 120, 2.4));
  add('die', 'swoon', SPEAKER.fall(500, 90));
  add('declaim', 'alas', SPEAKER.warble(440, 160, 0.7));
  add('line', 'snaps', SPEAKER.warble(520, 220, 0.5));
  return set;
}
