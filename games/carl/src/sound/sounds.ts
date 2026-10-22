// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC. The
// noises are synthesized here: Carl's buzz going by (its pitch drops as he passes, the Doppler
// way), a little buzz as he takes off, the whoosh of a barrel roll, a smack, a splat, a crunch of
// a snack, a ding, a creak, a sip; the singing is cut from the song itself (clips.ts): "There's a fly in
// the room" for an extra life, "I swing and I miss" when a barrel roll makes something miss, "...to
// flash me a smile" for every smile on the kitchen walls, "On my lamp" as the lamp takes him,
// "I've named it Carl. I hate Carl." when a life is lost, "I've opened the window" as the window
// opens, "Carl has broken time" as the clock breaks, "Carl has seen things" for a life in the
// wild, and "Carl's got the aux cord now" at the very end.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { rng } from '../../../kit/pixels';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
import { SND } from '../ids';
import { clipVoc, CLIPS } from './clips';

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

/** A fly's buzz: a buzzy sawtooth at `pitch(t)` with the wingbeat's flutter on it. */
function buzzer(pitch: (t: number) => number, seed = 1): Synth {
  let phase = 0;
  let last = 0;
  const r = rng(seed);
  return (t) => {
    const f = pitch(t) * (1 + (r() - 0.5) * 0.02);
    phase += f * (t - last);
    last = t;
    const saw = (phase % 1) * 2 - 1;
    const flutter = 0.75 + 0.25 * Math.sin(2 * Math.PI * 190 * t);
    return (saw * 0.7 + Math.sin(2 * Math.PI * phase * 2) * 0.3) * flutter;
  };
}

export type Place = 'house' | 'kitchen' | 'bed' | 'yard' | 'wild' | 'aux';

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // Carl's buzz going by, close to your ear: rising as he comes, dropping as he passes (Doppler)
  vocs.buzz = sample(0.9, buzzer((t) => 205 + 55 * Math.tanh((0.45 - t) * 7), 2), { envelope: (u) => Math.exp(-(((u - 0.45) / 0.28) ** 2)), gain: 0.9 });
  // a little buzz taking off
  vocs.fly = sample(0.22, buzzer((t) => 230 + t * 120, 3), { envelope: env(0.05, 1.4), gain: 0.5 });
  // the barrel roll: a whoosh up and over
  vocs.roll = sample(0.4, mix([lowNoise(21, (t) => 0.08 + Math.sin(t * Math.PI * 2.5) ** 2 * 0.4), 0.7], [buzzer((t) => 220 + Math.sin(t * Math.PI * 2.5) * 80, 4), 0.25]), { envelope: env(0.15, 1.2) });
  // a smack (the towel, the magazine) and Carl's "ow"
  vocs.smack = sample(0.3, mix([gate(lowNoise(22, 0.9), 0, 0.03), 1], [buzzer((t) => 320 - t * 400, 5), 0.4]), { envelope: env(0.003, 1.4) });
  // splat
  vocs.splat = sample(0.55, mix([gate(lowNoise(23, 0.7), 0, 0.06), 1], [lowNoise(24, (t) => 0.3 - t * 0.4), 0.4], [buzzer((t) => 260 - t * 300, 6), 0.3]), { envelope: env(0.004, 1.3) });
  // a crunch of a snack
  vocs.crunch = sample(0.24, mix([gate(lowNoise(25, 0.8), 0, 0.03), 0.9], [gate(lowNoise(26, 0.7), 0.07, 0.1), 0.8], [gate(lowNoise(27, 0.6), 0.14, 0.17), 0.6]), { envelope: env(0.005, 1) });
  // a ding (crumbs, points)
  vocs.ding = sample(0.4, mix([osc.sine(1568), 0.5], [osc.sine(2349), 0.3]), { envelope: env(0.005, 2.6) });
  // a sip
  vocs.sip = sample(0.28, mix([gate(lowNoise(29, 0.2), 0, 0.12), 0.4], [osc.sine((t) => 500 + t * 900), 0.4]), { envelope: env(0.05, 1) });
  // a creak (the kitchen door)
  vocs.creak = sample(0.5, (t) => Math.sin(2 * Math.PI * (160 + Math.sin(t * 30) * 40) * t) * (Math.sin(t * 300) > 0.2 ? 1 : 0.2) * 0.7, { envelope: env(0.03, 1) });
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
  add(SND.kill, 'miss', speaker((i) => (i < 4 ? 700 - i * 100 : 0)));
  add(SND.money, 'ding', SPEAKER.coin());
  add(SND.pay, 'creak', SPEAKER.noise(2, 80, 400));
  add(SND.life, place === 'wild' ? 'seen' : 'hook', SPEAKER.arpeggio([587, 698, 880, 1175]));
  add(SND.score, 'ding', speaker((i) => (i < 6 ? 1568 : i < 14 ? 2349 : 0)));
  add(SND.lose, 'named', SPEAKER.fall(600, 200));
  // a counter up: a snack crunched, a smile flashed (kitchen), an ear buzzed (bed), an hour (wild), the aux cord
  const gain = { house: 'crunch', kitchen: 'smile', bed: 'buzz', yard: 'crunch', wild: 'ding', aux: 'aux' }[place];
  add(SND.gain, gain, speaker((i) => (i < 8 ? 1175 + i * 120 : 0)));
  const spend = { house: 'lamp', kitchen: 'creak', bed: 'window', yard: 'creak', wild: 'time', aux: 'creak' }[place];
  add(SND.spend, spend, SPEAKER.noise(3, 60, 300));
  add(SND.fly, 'fly', speaker((i) => (i < 6 ? 220 + (i % 2) * 30 : 0)));
  add(SND.roll, 'roll', speaker((i) => (i < 12 ? 300 + Math.sin(i / 2) * 200 : 0)));
  add(SND.hurt, 'smack', SPEAKER.warble(500, 120, 2.4));
  add(SND.splat, 'splat', SPEAKER.fall(700, 120));
  add(SND.buzz, 'buzz', SPEAKER.warble(220, 40, 3));
  return set;
}
