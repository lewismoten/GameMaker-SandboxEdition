// Starting points for the sound effect maker: each preset makes a fresh take on a kind of
// sound (a jump, a coin, a hurt…) from a random source, so pressing it again gives another.
// Also a fully random effect, and a small nudge of every setting ("mutate").
import { SLIDERS, WAVES, cleanParams, defaultParams, type SfxParams, type Wave } from './sfxSynth';

type Rnd = () => number;

export interface SfxPreset {
  id: string;
  name: string;
  icon: string;
  make: (rnd: Rnd) => SfxParams;
}

const between = (rnd: Rnd, a: number, b: number) => a + rnd() * (b - a);
const pick = <T>(rnd: Rnd, xs: T[]): T => xs[Math.floor(rnd() * xs.length)];
const seed = (rnd: Rnd) => Math.floor(rnd() * 0xffffffff) >>> 0 || 1;
const base = (rnd: Rnd, p: Partial<SfxParams>): SfxParams => cleanParams({ ...defaultParams(), seed: seed(rnd), ...p });

export const PRESETS: SfxPreset[] = [
  {
    id: 'jump',
    name: 'Jump',
    icon: '🦘',
    make: (r) =>
      base(r, {
        wave: pick(r, ['square', 'square', 'triangle'] as Wave[]),
        pitch: between(r, 220, 480),
        slide: between(r, 2.5, 5),
        duty: between(r, 0.2, 0.5),
        hold: between(r, 0.03, 0.08),
        decay: between(r, 0.12, 0.25),
      }),
  },
  {
    id: 'coin',
    name: 'Coin',
    icon: '🪙',
    make: (r) =>
      base(r, {
        wave: pick(r, ['square', 'sine'] as Wave[]),
        pitch: between(r, 800, 1400),
        jump: pick(r, [5, 7, 12]),
        jumpAt: between(r, 0.04, 0.09),
        duty: between(r, 0.3, 0.5),
        hold: between(r, 0.08, 0.14),
        decay: between(r, 0.15, 0.35),
      }),
  },
  {
    id: 'hurt',
    name: 'Hurt',
    icon: '🤕',
    make: (r) =>
      base(r, {
        wave: pick(r, ['saw', 'square', 'noise'] as Wave[]),
        pitch: between(r, 300, 700),
        slide: between(r, -7, -3),
        duty: between(r, 0.15, 0.35),
        hold: between(r, 0.02, 0.06),
        decay: between(r, 0.12, 0.25),
        tone: between(r, 0.5, 0.9),
      }),
  },
  {
    id: 'explosion',
    name: 'Explosion',
    icon: '💥',
    make: (r) =>
      base(r, {
        wave: 'noise',
        pitch: between(r, 150, 500),
        slide: between(r, -2.5, -0.5),
        attack: 0,
        hold: between(r, 0.05, 0.15),
        decay: between(r, 0.5, 1.1),
        tone: between(r, 0.3, 0.6),
        volume: 1,
      }),
  },
  {
    id: 'powerup',
    name: 'Power-up',
    icon: '⭐',
    make: (r) =>
      base(r, {
        wave: pick(r, ['square', 'triangle', 'saw'] as Wave[]),
        pitch: between(r, 200, 400),
        slide: between(r, 2, 4),
        repeat: between(r, 0.07, 0.12),
        vibrato: between(r, 0, 0.4),
        vibratoSpeed: between(r, 8, 16),
        duty: between(r, 0.25, 0.5),
        hold: between(r, 0.3, 0.45),
        decay: between(r, 0.15, 0.3),
      }),
  },
  {
    id: 'laser',
    name: 'Laser',
    icon: '🔫',
    make: (r) =>
      base(r, {
        wave: pick(r, ['square', 'saw'] as Wave[]),
        pitch: between(r, 1200, 2800),
        slide: between(r, -10, -5),
        duty: between(r, 0.1, 0.4),
        hold: between(r, 0.02, 0.06),
        decay: between(r, 0.1, 0.2),
      }),
  },
  {
    id: 'blip',
    name: 'Blip',
    icon: '🔘',
    make: (r) =>
      base(r, {
        wave: pick(r, ['square', 'sine', 'triangle'] as Wave[]),
        pitch: between(r, 500, 1500),
        duty: 0.5,
        hold: between(r, 0.02, 0.05),
        decay: between(r, 0.03, 0.08),
      }),
  },
  {
    id: 'footstep',
    name: 'Footstep',
    icon: '👣',
    make: (r) =>
      base(r, { wave: 'noise', pitch: between(r, 600, 1500), slide: between(r, -3, 0), hold: 0, decay: between(r, 0.05, 0.1), tone: between(r, 0.2, 0.4) }),
  },
  {
    id: 'splash',
    name: 'Splash',
    icon: '💦',
    make: (r) =>
      base(r, {
        wave: 'noise',
        pitch: between(r, 1500, 3500),
        slide: between(r, -1.5, -0.4),
        attack: between(r, 0.01, 0.04),
        hold: between(r, 0.05, 0.1),
        decay: between(r, 0.35, 0.6),
        vibrato: between(r, 1, 3),
        vibratoSpeed: between(r, 15, 30),
        tone: between(r, 0.5, 0.8),
      }),
  },
  {
    id: 'boing',
    name: 'Boing',
    icon: '🌀',
    make: (r) =>
      base(r, {
        wave: pick(r, ['sine', 'triangle'] as Wave[]),
        pitch: between(r, 150, 320),
        slide: between(r, 0.5, 1.5),
        vibrato: between(r, 1.5, 3),
        vibratoSpeed: between(r, 10, 18),
        hold: between(r, 0.1, 0.2),
        decay: between(r, 0.25, 0.45),
      }),
  },
];

/** Anything at all, within sensible bounds. */
export function randomParams(rnd: Rnd): SfxParams {
  const p = base(rnd, {
    wave: pick(
      rnd,
      WAVES.map(([w]) => w),
    ),
  });
  for (const s of SLIDERS) {
    const v = rnd();
    p[s.key] = s.log ? s.min * (s.max / s.min) ** v : s.min + v * (s.max - s.min);
  }
  // keep it short and audible: a sound set effect plays often
  p.hold = Math.min(p.hold, 0.3);
  p.decay = Math.min(p.decay, 0.8);
  p.attack = Math.min(p.attack, 0.1);
  p.volume = Math.max(p.volume, 0.6);
  p.tone = Math.max(p.tone, 0.3);
  if (rnd() < 0.5) p.jump = 0;
  if (rnd() < 0.6) p.repeat = 0;
  if (rnd() < 0.5) p.vibrato = 0;
  return cleanParams(p);
}

/** Every setting nudged a little (`amount` of its range at most), the wave kept. */
export function mutate(p: SfxParams, rnd: Rnd, amount = 0.08): SfxParams {
  const out = { ...p, seed: seed(rnd) };
  for (const s of SLIDERS) {
    const nudge = (rnd() * 2 - 1) * amount;
    out[s.key] = s.log ? p[s.key] * (s.max / s.min) ** nudge : p[s.key] + nudge * (s.max - s.min);
  }
  return cleanParams(out);
}

/** Math.random as a source; tests pass their own. */
export const anyRandom: Rnd = () => Math.random();

/** The preset to start from for each of the sound set's first nine slots (SOUND_NAMES). */
export const SLOT_PRESET = ['powerup', 'explosion', 'coin', 'hurt', 'powerup', 'coin', 'hurt', 'blip', 'blip'];
