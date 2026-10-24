// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC. The
// little noises are synthesized here (a cushion's poof, the remote's click you make with your
// empty thumb, a VCR whirring as the tape loads, Teddy's grumble, the cat's hiss, the raccoon's
// chitter, a penny's clink, a fridge magnet's clack, the baby gate, the toaster, a pay TV
// warming up, the Voice-O-Matic's babble, an "ow!" and a flop into the couch); the singing is
// cut from the song itself (clips.ts): "Where's the remote?!" for SPACE, "Lifted the dog, looked
// under the cat." as Teddy gets lifted, "Opened the fridge, who knows anymore?", "Called my
// mom..." as the phone dials, "Check your hand." (C), "a tiny raccoon" and
// "There you are, you sneaky guy." as you sit back down on the couch.
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

/** A little voice: harmonics of a pitch through two vowel formants that can move. */
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
    for (let k = 1; k <= 16; k++) {
      const f = f0 * k;
      if (f > 5000) break;
      s += (Math.exp(-(((f - a) / 260) ** 2)) + 0.6 * Math.exp(-(((f - b) / 380) ** 2)) + 0.05 / k) * Math.sin(phase * k);
    }
    return s * 0.5 + (r() * 2 - 1) * breath;
  };
}

export type Place = 'den' | 'kitchen' | 'void' | 'ride';

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // a couch cushion lifted and dropped: a soft, dusty whump
  vocs.poof = sample(0.42, mix([lowNoise(11, (t) => 0.32 - t * 0.6), 0.9], [osc.sine((t) => 90 - t * 60), 0.5]), { envelope: env(0.04, 2.2) });
  // the remote's click (with an empty thumb): a plastic tick, then the button's spring
  vocs.click = sample(0.14, mix([gate(lowNoise(12, 0.9), 0, 0.006), 1], [gate(osc.sine(2400), 0, 0.02), 0.5], [gate(lowNoise(13, 0.7), 0.06, 0.068), 0.6]), {
    envelope: () => 1,
    gain: 0.8,
  });
  // a VCR loading a tape: the motor whirrs up, the heads spin, a clunk
  vocs.whirr = sample(
    1.1,
    mix([osc.square((t) => 60 + t * 140), 0.12], [osc.sine((t) => 120 + t * 280), 0.35], [lowNoise(14, 0.05), 0.25], [gate(lowNoise(15, 0.6), 0.95, 1.0), 1.2]),
    { envelope: env(0.2, 0.3), gain: 0.7 },
  );
  // Teddy grumbles (a low, put-upon growl that falls)
  vocs.grumble = sample(
    0.7,
    voice((t) => 150 - t * 50 + Math.sin(t * 90) * 8, 500, 900, 4, 0.12),
    { envelope: env(0.1, 0.8) },
  );
  // the cat hisses
  vocs.hiss = sample(
    0.6,
    mix(
      [lowNoise(16, 0.95), 0.8],
      [
        gate(
          voice(() => 420, 900, 2400, 6),
          0,
          0.08,
        ),
        0.4,
      ],
    ),
    { envelope: env(0.02, 1.4) },
  );
  // the tiny raccoon chitters (fast little chirps)
  vocs.chitter = sample(
    0.5,
    (t) => {
      const k = Math.floor(t * 22);
      const u = t * 22 - k;
      return u < 0.55 ? Math.sin(2 * Math.PI * (1800 + (k % 3) * 300 - u * 900) * t) * (1 - u / 0.55) : 0;
    },
    { envelope: env(0.02, 0.6), gain: 0.7 },
  );
  // a penny: a small copper clink and its ring
  vocs.clink = sample(0.35, mix([osc.sine(2093), 0.5], [osc.sine(3136), 0.35], [osc.sine(5274), 0.15], [gate(lowNoise(17, 0.9), 0, 0.004), 0.6]), {
    envelope: env(0.003, 3),
  });
  // points: a little two-note chime
  vocs.chime = sample(0.3, (t) => Math.sin(2 * Math.PI * (t < 0.08 ? 1319 : 1760) * t) * 0.7, { envelope: env(0.005, 2) });
  // a fridge magnet snapped up: clack
  vocs.clack = sample(0.16, mix([gate(lowNoise(18, 0.8), 0, 0.01), 1], [osc.sine(900), 0.3]), { envelope: env(0.002, 2.5) });
  // the baby gate swinging open: a creak and a latch
  vocs.gate = sample(
    0.5,
    mix(
      [(t) => Math.sin(2 * Math.PI * (210 + Math.sin(t * 34) * 50) * t) * (Math.sin(t * 300) > 0.1 ? 1 : 0.2), 0.6],
      [gate(lowNoise(19, 0.7), 0.42, 0.45), 1],
    ),
    { envelope: env(0.03, 0.6) },
  );
  // the toaster pops: a spring boing and a clank
  vocs.pop = sample(0.4, mix([gate(lowNoise(20, 0.8), 0, 0.01), 1], [osc.sine((t) => 300 + Math.sin(t * 60) * 120), 0.5]), { envelope: env(0.003, 1.6) });
  // a 1995 pay TV warming up: a high whine, the tube's thump, then static
  vocs.warm = sample(1.2, mix([osc.sine((t) => 15000 / (1 + t * 1.5)), 0.08], [gate(osc.sine(60), 0.1, 0.2), 0.8], [gate(lowNoise(21, 0.9), 0.3, 1.2), 0.35]), {
    envelope: env(0.05, 0.4),
    gain: 0.8,
  });
  // the Voice-O-Matic answers: a cheerful robot babbling the wrong thing ("re-mou-lade?")
  vocs.babble = sample(
    0.9,
    (() => {
      const pitch = (t: number) => (t < 0.3 ? 220 : t < 0.6 ? 180 : 260 + (t - 0.6) * 300);
      const f1 = (t: number) => [700, 400, 600][Math.min(2, Math.floor(t / 0.3))];
      const f2 = (t: number) => [1200, 800, 1700][Math.min(2, Math.floor(t / 0.3))];
      const v = voice(pitch, f1, f2, 8, 0.01);
      return (t: number) => Math.sign(v(t)) * Math.min(1, Math.abs(v(t)) * 1.8);
    })(),
    { envelope: env(0.02, 0.4), gain: 0.6 },
  );
  // "Ow!"
  vocs.ow = sample(
    0.34,
    voice(
      (t) => 330 - t * 300,
      (t) => 700 - t * 300,
      (t) => 1100 - t * 300,
      9,
    ),
    { envelope: env(0.05, 1) },
  );
  // a sock's soft bump in the void: a muffled cloth thump, no voice (it happens a lot there)
  vocs.boff = sample(0.16, mix([lowNoise(23, (t) => 0.12 - t * 0.5), 1], [osc.sine((t) => 140 - t * 300), 0.4]), { envelope: env(0.01, 1.8), gain: 0.6 });
  // flopping back into the couch, defeated
  vocs.flop = sample(0.7, mix([lowNoise(22, (t) => 0.2 - t * 0.18), 0.9], [voice((t) => 200 - t * 120, 600, 1000, 10), 0.3]), { envelope: env(0.03, 1.4) });
  // the song itself
  for (const name of ['remote', 'dogcat', 'fridge', 'mom', 'hand', 'raccoon', 'sneaky'] as const) vocs[name] = clipVoc(name);
  return vocs;
}

/** A level's .SND: which VOC each effect plays. */
export function buildSoundSet(place: Place): SoundSet {
  const set = newSoundSet();
  const add = (n: number, name: string, freqs: Uint16Array) => {
    set.freqs[n] = freqs;
    set.digital[n] = name;
  };
  const den = place === 'den';
  const kitchen = place === 'kitchen';
  const voidLevel = place === 'void';
  add(SND.help, den ? 'dogcat' : kitchen ? 'fridge' : 'chime', SPEAKER.rise(400, 900));
  add(
    SND.kill,
    den ? 'poof' : kitchen ? 'pop' : voidLevel ? 'raccoon' : 'chitter',
    speaker((i) => (i < 6 ? 900 - i * 120 : 0)),
  );
  add(SND.money, 'clink', SPEAKER.coin());
  add(SND.pay, 'warm', SPEAKER.rise(80, 1600));
  add(SND.life, den ? 'babble' : 'hand', SPEAKER.arpeggio([440, 523, 659, 880, 659, 880]));
  add(
    SND.score,
    'chime',
    speaker((i) => (i < 6 ? 1319 : i < 14 ? 1760 : 0)),
  );
  add(SND.lose, 'grumble', SPEAKER.fall(300, 90));
  add(
    SND.gain,
    den ? 'poof' : kitchen ? 'clack' : place === 'ride' ? 'whirr' : 'click',
    speaker((i) => (i < 8 ? 600 + i * 90 : 0)),
  );
  add(SND.spend, den ? 'gate' : kitchen ? 'mom' : 'sneaky', SPEAKER.noise(3, 60, 300));
  add(SND.shout, 'remote', SPEAKER.warble(700, 250, 1.1));
  add(SND.hurt, den || kitchen ? 'hiss' : voidLevel ? 'boff' : 'ow', SPEAKER.hurt());
  add(SND.die, 'flop', SPEAKER.fall(500, 80));
  add(
    SND.click,
    'click',
    speaker((i) => (i < 2 ? 2400 : 0)),
  );
  add(SND.hand, 'hand', SPEAKER.arpeggio([659, 587, 523]));
  return set;
}
