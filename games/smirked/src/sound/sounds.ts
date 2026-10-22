// The sound sets: a PC speaker sound for every effect, each backed by a Sound Blaster .VOC. The
// little noises are synthesized here (a fog machine's hiss, your scream like a cat being dipped
// in a bathtub, a sneeze, the werewolf guy's howl, a creaky door, an animatronic zombie's servo
// and groan, a papier-mache witch going flat, a flashlight battery clicking in, a dollar, candy
// corn, a juice box slurped, the foam sword's whoosh, a clown horn, the kid's laugh, an "ow!"
// and fainting onto a couch like a Victorian woman seeing a ghost); the singing is cut from the
// song itself (clips.ts): "GET DOWN!" for SPACE, "Fog machine hisses, I scream like a cat" for
// B in the fog hall, "You okay with that?" and "You know it's not real, right?" for C, "Turns
// out she was cardboard" for each sorry, "She strolls like it's Target" as the STAFF ONLY door
// opens, Lily's pats, "I get a souvenir sword" at the gift shop, "the emergency exit sign".
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

export type Place = 'foyer' | 'parade' | 'webs' | 'exit';

/** Every VOC on the disk, by name. */
export function buildVocs(): Record<string, Uint8Array> {
  const vocs: Record<string, Uint8Array> = {};
  // a fog machine: the pump's click, then a long hiss that thins out
  vocs.hiss = sample(1.1, mix([gate(lowNoise(11, 0.9), 0, 0.01), 1], [lowNoise(12, (t) => 0.75 - t * 0.4), 0.7]), { envelope: env(0.05, 1.2), gain: 0.8 });
  // you, screaming like a cat being dipped in a bathtub: a high, rising, yowling falsetto
  vocs.scream = sample(
    0.9,
    voice((t) => 520 + t * 380 + Math.sin(t * 46) * 40, (t) => 820 + Math.sin(t * 9) * 120, 1500, 21, 0.08),
    { envelope: env(0.04, 0.7), gain: 0.85 },
  );
  // a sneeze: ah... ah... CHOO!
  vocs.sneeze = sample(
    1.0,
    mix(
      [gate(voice((t) => 230 + t * 160, 750, 1200, 22, 0.05), 0, 0.22), 0.6],
      [gate(voice((t) => 260 + t * 160, 760, 1250, 23, 0.05), 0.3, 0.55), 0.7],
      [gate(lowNoise(24, (t) => 0.95 - (t - 0.62) * 1.2), 0.62, 1.0), 1.2],
    ),
    { envelope: () => 1, gain: 0.75 },
  );
  // the werewolf guy's howl: a long rising-falling ooOOOooo through the mask
  vocs.howl = sample(1.5, voice((t) => (t < 0.5 ? 260 + t * 400 : t < 1 ? 460 + Math.sin(t * 30) * 12 : 460 - (t - 1) * 360), (t) => 450 + t * 150, 900, 25, 0.06), { envelope: env(0.1, 0.6), gain: 0.8 });
  // the werewolf guy's growl
  vocs.growl = sample(0.8, mix([voice((t) => 90 + Math.sin(t * 70) * 14, 500, 900, 26, 0.2), 0.8], [lowNoise(27, 0.2), 0.3]), { envelope: env(0.1, 0.6) });
  // a creaky door swinging open
  vocs.creak = sample(1.0, (t) => Math.sin(2 * Math.PI * (180 + Math.sin(t * 7) * 60 + t * 80) * t) * (Math.sin(t * 260) > -0.2 ? 1 : 0.15) * 0.7, { envelope: env(0.05, 0.4) });
  // an animatronic zombie: a servo whine, a clunk, and a groan off a tape
  vocs.groan = sample(
    1.0,
    mix([gate(osc.square((t) => 900 + t * 1200), 0, 0.18), 0.1], [gate(lowNoise(28, 0.7), 0.2, 0.23), 0.9], [gate(voice((t) => 110 - t * 30, (t) => 600 - t * 200, 1000, 29, 0.05), 0.25, 1.0), 0.8]),
    { envelope: env(0.02, 0.5), gain: 0.8 },
  );
  // a papier-mache witch going over: a cardboard flap and a hollow thump
  vocs.thump = sample(0.45, mix([gate(lowNoise(30, 0.5), 0, 0.06), 0.8], [osc.sine((t) => 140 - t * 120), 0.8], [gate(lowNoise(31, 0.3), 0.08, 0.2), 0.5]), { envelope: env(0.005, 2) });
  // a flashlight battery clicking in
  vocs.click = sample(0.16, mix([gate(lowNoise(32, 0.9), 0, 0.008), 1], [gate(osc.sine(1800), 0, 0.03), 0.5], [gate(lowNoise(33, 0.8), 0.07, 0.08), 0.7]), { envelope: () => 1, gain: 0.8 });
  // a dollar bill: a papery rustle and a snap
  vocs.rustle = sample(0.35, mix([lowNoise(34, (t) => 0.5 + Math.sin(t * 90) * 0.3), 0.6], [gate(lowNoise(35, 0.95), 0.25, 0.27), 1]), { envelope: env(0.02, 1) });
  // candy corn: a wrapper's crinkle
  vocs.crinkle = sample(0.3, (() => {
    const r = rng(36);
    const n = lowNoise(37, 0.95);
    return (t: number) => (r() < 0.25 ? n(t) : n(t) * 0.1);
  })(), { envelope: env(0.01, 1.2), gain: 0.7 });
  // points: a little ding-dong
  vocs.chime = sample(0.4, (t) => Math.sin(2 * Math.PI * (t < 0.12 ? 1568 : 1319) * t) * 0.7, { envelope: env(0.005, 2) });
  // a juice box: the straw's slurp, the box crumpling
  vocs.slurp = sample(0.6, mix([lowNoise(38, (t) => 0.15 + (Math.sin(t * 40) > 0 ? 0.3 : 0)), 0.8], [gate(lowNoise(39, 0.9), 0.5, 0.56), 0.6]), { envelope: env(0.03, 0.5) });
  // the souvenir register: ka-CHING
  vocs.register = sample(0.7, mix([gate(lowNoise(40, 0.8), 0, 0.05), 0.8], [gate(osc.sine(2637), 0.08, 0.7), 0.5], [gate(osc.sine(3520), 0.08, 0.7), 0.3]), { envelope: env(0.01, 1.4) });
  // the $12 foam sword: a soft whoosh and a squeaky bonk
  vocs.whoosh = sample(0.4, mix([lowNoise(41, (t) => 0.1 + t * 1.6), 0.7], [gate(osc.sine((t) => 700 - t * 300), 0.28, 0.36), 0.5]), { envelope: env(0.2, 1) });
  // a clown horn: HONK
  vocs.honk = sample(0.35, (t) => Math.sign(Math.sin(2 * Math.PI * 330 * t)) * 0.4 + Math.sin(2 * Math.PI * 660 * t) * 0.3, { envelope: env(0.02, 0.8) });
  // the 11-year-old laughing as he runs off, wig in your hand: ha-ha-ha!
  vocs.laugh = sample(
    0.8,
    (() => {
      const v = voice((t) => 420 - t * 120, 900, 1700, 42, 0.05);
      return (t: number) => (Math.floor(t * 9) % 2 === 0 ? v(t) : v(t) * 0.1);
    })(),
    { envelope: env(0.02, 0.8) },
  );
  // "Ow!"
  vocs.ow = sample(0.34, voice((t) => 330 - t * 300, (t) => 700 - t * 300, (t) => 1100 - t * 300, 43), { envelope: env(0.05, 1) });
  // fainting into a couch like a Victorian woman seeing a ghost: "oh!" and a soft flump
  vocs.faint = sample(1.0, mix([gate(voice((t) => 480 - t * 400, 600, 1000, 44, 0.04), 0, 0.5), 0.7], [gate(lowNoise(45, (t) => 0.3 - (t - 0.55) * 0.5), 0.55, 1.0), 0.8]), { envelope: env(0.03, 0.8) });
  // the song itself
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
  const by = (o: Record<Place, string>) => o[place];
  add(SND.help, by({ foyer: 'slurp', parade: 'slurp', webs: 'pats', exit: 'juice' }), SPEAKER.rise(400, 900));
  add(SND.kill, by({ foyer: 'thump', parade: 'thump', webs: 'werewolf', exit: 'laugh' }), speaker((i) => (i < 6 ? 900 - i * 120 : 0)));
  add(SND.money, 'rustle', SPEAKER.coin());
  add(SND.pay, by({ foyer: 'register', parade: 'register', webs: 'sword', exit: 'register' }), SPEAKER.rise(80, 1600));
  add(SND.life, 'afraid', SPEAKER.arpeggio([523, 659, 784, 1047, 784, 1047]));
  add(SND.score, by({ foyer: 'crinkle', parade: 'crinkle', webs: 'crinkle', exit: 'chime' }), speaker((i) => (i < 6 ? 1568 : i < 14 ? 1319 : 0)));
  add(SND.lose, 'groan', SPEAKER.fall(300, 90));
  add(SND.gain, by({ foyer: 'click', parade: 'cardboard', webs: 'sneezing', exit: 'honk' }), speaker((i) => (i < 8 ? 600 + i * 90 : 0)));
  add(SND.spend, by({ foyer: 'mild', parade: 'target', webs: 'creak', exit: 'exit' }), SPEAKER.noise(3, 60, 300));
  add(SND.tackle, place === 'exit' ? 'whoosh' : 'getdown', SPEAKER.warble(700, 250, 1.1));
  add(SND.hurt, by({ foyer: 'scream', parade: 'scream', webs: 'sneeze', exit: 'ow' }), SPEAKER.hurt());
  add(SND.die, 'faint', SPEAKER.fall(500, 80));
  add(SND.scream, by({ foyer: 'fog', parade: 'afraid', webs: 'dontrun', exit: 'ashamed' }), SPEAKER.warble(1200, 500, 2.1));
  add(SND.ask, place === 'foyer' ? 'okay' : 'notreal', SPEAKER.arpeggio([659, 587, 523]));
  return set;
}
