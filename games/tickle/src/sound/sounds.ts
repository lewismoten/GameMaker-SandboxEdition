// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC, all
// synthesized here (no recording came with the song). Rats sing above our hearing, so the game
// plays them the way a bat detector does, brought down into earshot: joy at 50 kHz is a burst of
// quick rising chirps, dread at 22 kHz a long flat whistle; a pin lands with a squeak and the
// detector's click. Doc Leo's maniacal laugh ("MWA-HA-HA-HA-HA!") is a little formant voice, its
// pitch climbing and falling, with its own echo; the rubber chicken honks.
import { newSoundSet, type SoundSet } from '../../../../web/src/formats/sound';
import { rng } from '../../../kit/pixels';
import { SPEAKER, mix, osc, sample, speaker, type Synth } from '../../../kit/sound';
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
const gate =
  (v: Synth, from: number, to: number): Synth =>
  (t) =>
    t >= from && t < to ? v(t) : 0;
const env = (attack: number, decay: number) => (u: number) => Math.min(1, u / attack) * Math.max(0, 1 - u) ** decay;

/** A voice: harmonics of a pitch through two vowel formants, with a breath of noise. */
function voice(pitch: (t: number) => number, f1: (t: number) => number, f2: (t: number) => number, seed = 3, breath = 0.04): Synth {
  let phase = 0;
  let last = 0;
  const r = rng(seed);
  return (t) => {
    const f0 = pitch(t);
    phase += 2 * Math.PI * f0 * (t - last);
    last = t;
    const a = f1(t);
    const b = f2(t);
    let s = 0;
    for (let k = 1; k <= 24; k++) {
      const f = f0 * k;
      if (f > 5000) break;
      s += (Math.exp(-(((f - a) / 160) ** 2)) + 0.5 * Math.exp(-(((f - b) / 260) ** 2)) + 0.03 / k) * Math.sin(phase * k);
    }
    return s * 0.45 + (r() * 2 - 1) * breath;
  };
}

/** Bat-detector chirps: `n` quick upward sweeps from `lo` to `hi` Hz, `every` seconds apart. */
function chirps(n: number, every: number, lo: number, hi: number, len = 0.035): Synth {
  const sweep = (t0: number): Synth => {
    let phase = 0;
    let last = 0;
    return (t) => {
      const u = (t - t0) / len;
      if (u < 0 || u > 1) return 0;
      const f = lo + (hi - lo) * u * u;
      phase += 2 * Math.PI * f * (t - last || 1 / 11025);
      last = t;
      return Math.sin(phase) * Math.sin(Math.PI * u);
    };
  };
  const all = Array.from({ length: n }, (_, k) => sweep(k * every + (k % 3) * 0.006));
  return (t) => all.reduce((s, v) => s + v(t), 0);
}

/** The detector's crackle: a few clicks. */
function clicks(seed: number, times: number[]): Synth {
  const r = rng(seed);
  return (t) => times.reduce((s, at) => s + (t >= at && t < at + 0.004 ? (r() * 2 - 1) * (1 - (t - at) / 0.004) : 0), 0);
}

/** The maniacal laugh: "MWA-" then "HA-HA-HA-HA-HA!", each syllable its own pitch, then an echo. */
function laughVoice(): Synth {
  // [start, length, pitch]: the "MWA" low and long, the HAs climbing then tumbling down
  const syl: [number, number, number][] = [
    [0, 0.26, 150],
    [0.3, 0.13, 220],
    [0.46, 0.13, 247],
    [0.62, 0.13, 262],
    [0.78, 0.13, 233],
    [0.94, 0.13, 208],
    [1.1, 0.24, 185],
  ];
  const v = voice(
    (t) => {
      const s = syl.find(([a, l]) => t >= a && t < a + l + 0.03) ?? syl[syl.length - 1];
      const u = (t - s[0]) / s[1];
      return s[2] * (1 + 0.08 * Math.sin(u * Math.PI)) * (1 + 0.02 * Math.sin(t * 40));
    },
    (t) => (t < 0.3 ? 400 + (t / 0.3) * 400 : 800),
    () => 1250,
    11,
    0.05,
  );
  const shape = (t: number) => {
    for (const [a, l] of syl) {
      if (t < a || t > a + l) continue;
      const u = (t - a) / l;
      // an "h": a puff of breath first
      return Math.min(1, u * 10) * (1 - u) ** 0.5;
    }
    return 0;
  };
  const breath = lowNoise(41, 0.5);
  const dry: Synth = (t) => {
    const g = shape(t);
    if (!g) return 0;
    const s = syl.find(([a, l]) => t >= a && t <= a + l)!;
    const h = t - s[0] < 0.025 && s[0] > 0.2 ? breath(t) * 0.6 : 0;
    return (v(t) + h) * g;
  };
  // a cave's echo: the laugh again, softer, a third of a second behind, twice
  return (t) => dry(t) + (t > 0.34 ? dry(t - 0.34) * 0.42 : 0) + (t > 0.68 ? dry(t - 0.68) * 0.18 : 0);
}

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // 50 kHz through a bat detector: a burst of rising chirps (a rat joins the carpet)
  vocs.joy = sample(0.62, mix([chirps(11, 0.05, 1800, 4200), 0.7], [clicks(3, [0, 0.21, 0.4]), 0.4]), { envelope: env(0.01, 0.5) });
  // 22 kHz: a long, flat, unhappy whistle with the detector's crackle (rapport down)
  vocs.dread = sample(
    0.7,
    mix([osc.sine((t) => 1100 + Math.sin(t * 30) * 12), 0.55], [osc.sine((t) => 2200 + Math.sin(t * 30) * 24), 0.12], [lowNoise(5, 0.6), 0.06], [clicks(4, [0.02, 0.33]), 0.4]),
    { envelope: env(0.06, 0.6) },
  );
  // a pin lands: a squeak ("eep!") and a click
  vocs.squeak = sample(0.2, mix([osc.sine((t) => 2600 + t * 9000 - (t > 0.08 ? (t - 0.08) * 16000 : 0)), 0.6], [clicks(6, [0]), 0.6]), { envelope: env(0.01, 1.4) });
  // PIN: a soft press, "boop"
  vocs.press = sample(0.18, mix([osc.sine((t) => 220 - t * 400), 0.7], [gate(lowNoise(7, 0.2), 0, 0.03), 0.4]), { envelope: env(0.01, 1.6) });
  // TICKLE: fingers fluttering (brrrrr), giggling chirps on top
  const flutter = lowNoise(8, 0.35);
  const giggles = chirps(4, 0.11, 2400, 3600, 0.03);
  vocs.tickle = sample(0.5, (t) => (flutter(t) * 0.5 + Math.sin(2 * Math.PI * 700 * t) * 0.15) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 26 * t)) + giggles(t) * 0.4, {
    envelope: env(0.03, 0.8),
  });
  // the maniacal laugh
  vocs.laugh = sample(2.1, laughVoice(), { envelope: (u) => Math.min(1, u * 40), gain: 0.95 });
  // a hop in red sneakers: a little spring
  vocs.boing = sample(0.26, osc.sine((t) => 300 + Math.sin(t * 60) * 90 + t * 500), { envelope: env(0.01, 1.4) });
  // a step: a soft squeak of sneaker
  vocs.step = sample(0.07, mix([osc.sine((t) => 900 + t * 3000), 0.3], [lowNoise(9, 0.3), 0.2]), { envelope: env(0.1, 1.5), gain: 0.5 });
  // the rubber chicken honks (an extra life)
  vocs.honk = sample(0.5, voice((t) => 520 - t * 160, () => 900, () => 1900, 13, 0.15), { envelope: env(0.02, 0.7) });
  // a sip of coffee
  vocs.sip = sample(0.3, mix([gate(lowNoise(10, 0.2), 0, 0.14), 0.4], [osc.sine((t) => 500 + t * 900), 0.4]), { envelope: env(0.05, 1) });
  // points: a tiny ding
  vocs.ding = sample(0.3, mix([osc.sine(1568), 0.5], [osc.sine(2349), 0.3]), { envelope: env(0.005, 2.4) });
  // the door: a latch and a creak
  vocs.door = sample(0.5, mix([gate(lowNoise(12, 0.7), 0, 0.03), 0.8], [(t) => Math.sin(2 * Math.PI * (160 + Math.sin(t * 30) * 40) * t) * (t > 0.08 ? 0.6 : 0), 0.6]), { envelope: env(0.01, 1) });
  // Doc Leo out of rapport: a whistle sliding down, and a sad squeak of rubber chicken
  vocs.flop = sample(0.9, mix([osc.sine((t) => 900 * 0.4 ** t), 0.5], [voice((t) => 300 - t * 120, () => 700, () => 1200, 15, 0.1), 0.4]), { envelope: env(0.02, 0.8) });
  return vocs;
}

/** TICKLE.SND (every level's): which VOC each effect plays. */
export function buildSoundSet(): SoundSet {
  const set = newSoundSet();
  const add = (n: number, name: string, freqs: Uint16Array) => {
    set.freqs[n] = freqs;
    set.digital[n] = name;
  };
  add(SND.help, 'sip', SPEAKER.rise(400, 900));
  add(SND.kill, 'squeak', speaker((i) => (i < 6 ? 2600 + i * 300 : 0)));
  add(SND.money, 'ding', SPEAKER.coin());
  add(SND.pay, 'door', SPEAKER.noise(2, 80, 400));
  add(SND.life, 'honk', SPEAKER.warble(520, 80, 2));
  add(SND.score, 'ding', speaker((i) => (i < 6 ? 1568 : i < 14 ? 2349 : 0)));
  add(SND.lose, 'flop', SPEAKER.fall(900, 200));
  add(SND.gain, 'joy', speaker((i) => (i < 30 ? 1800 + (i % 5) * 500 : 0)));
  add(SND.spend, 'door', SPEAKER.noise(3, 60, 300));
  add(SND.hop, 'boing', speaker((i) => (i < 12 ? 300 + i * 50 : 0)));
  add(SND.step, 'step', speaker((i) => (i < 2 ? 900 : 0)));
  add(SND.dread, 'dread', speaker((i) => (i < 30 ? 1100 : 0)));
  add(SND.die, 'flop', SPEAKER.fall(900, 120));
  add(SND.pin, 'press', speaker((i) => (i < 4 ? 220 - i * 30 : 0)));
  add(SND.tickle, 'tickle', SPEAKER.warble(700, 300, 3));
  add(SND.laugh, 'laugh', SPEAKER.arpeggio([147, 220, 247, 262, 233, 208, 185]));
  return set;
}
