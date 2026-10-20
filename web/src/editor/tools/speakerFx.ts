// PC speaker effect generators, sfxr-style: each kind of sound has a recipe with random
// variety, so pressing a button again gives a new take on it. A sound is 36 pitches, one
// every 1/145.6 s (about a quarter second in all); 0 is silence.
import { NUMFREQ } from '../../formats/sound';

export type Speaker = Uint16Array;

const MIN = 40;
const MAX = 8192;

function make(fn: (i: number, t: number) => number): Speaker {
  return Uint16Array.from({ length: NUMFREQ }, (_, i) => {
    const f = fn(i, i / (NUMFREQ - 1));
    return f <= 0 || !Number.isFinite(f) ? 0 : Math.max(MIN, Math.min(MAX, Math.round(f)));
  });
}

const r = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
/** A musical note's frequency, from semitones above A4 (440 Hz). */
const note = (semi: number) => 440 * 2 ** (semi / 12);
const sweep = (from: number, to: number, t: number) => from * (to / from) ** t;

export interface Recipe {
  name: string;
  icon: string;
  make: () => Speaker;
}

export const RECIPES: Recipe[] = [
  {
    name: 'Heal',
    icon: '❤️',
    make: () => {
      const base = r(-5, 7);
      const steps = pick([3, 4, 5]);
      const len = Math.floor(r(24, 36));
      return make((i) => (i < len ? note(base + [0, 4, 7, 12, 16][Math.floor((i / len) * steps)] + Math.sin(i * 1.7) * 0.25) : 0));
    },
  },
  {
    name: 'Defeat',
    icon: '💥',
    make: () => {
      const start = r(1200, 3000);
      return make((i, t) => (i % 3 === 2 ? r(80, 300) : sweep(start, r(60, 140), t) + r(-60, 60)));
    },
  },
  {
    name: 'Coin',
    icon: '🪙',
    make: () => {
      const a = note(r(10, 20));
      const b = a * pick([1.335, 1.5, 2]);
      const split = Math.floor(r(3, 7));
      return make((i) => (i < split ? a : i < split + Math.floor(r(14, 24)) ? b : 0));
    },
  },
  {
    name: 'Pay',
    icon: '💸',
    make: () => {
      const a = note(r(4, 12));
      return make((i) => (i < 8 ? a : i < 20 ? a * 0.75 : i < 30 ? a * 0.5 : 0));
    },
  },
  {
    name: 'Extra life',
    icon: '⭐',
    make: () => {
      const base = r(0, 8);
      const tune = pick([
        [0, 4, 7, 12, 7, 12, 16],
        [0, 7, 12, 16, 19, 24],
        [0, 2, 4, 7, 9, 12],
      ]);
      const per = NUMFREQ / tune.length;
      return make((i) => (i % per < per - 1 ? note(base + tune[Math.floor(i / per)]) : 0));
    },
  },
  {
    name: 'Points',
    icon: '➕',
    make: () => {
      const start = note(r(5, 15));
      return make((i, t) => (i < 26 ? sweep(start, start * 2.4, t * 1.4) * (i % 2 ? 1 : 1.01) : 0));
    },
  },
  {
    name: 'Lose points',
    icon: '➖',
    make: () => {
      const start = note(r(8, 16));
      return make((i, t) => (i < 30 ? sweep(start, start / 3, t) * (1 + 0.04 * Math.sin(i * 2)) : 0));
    },
  },
  {
    name: 'Power up',
    icon: '⚡',
    make: () => {
      const base = r(150, 400);
      const wob = r(1.5, 3);
      return make((i, t) => base * 2 ** (t * 3) * (1 + 0.15 * Math.sin(i * wob)));
    },
  },
  {
    name: 'Power down',
    icon: '🔋',
    make: () => {
      const base = r(1500, 3000);
      return make((i, t) => base * 2 ** (-t * 3.5) * (1 + 0.12 * Math.sin(i * 2.4)));
    },
  },
  {
    name: 'Jump',
    icon: '🦘',
    make: () => {
      const a = r(250, 500);
      const len = Math.floor(r(14, 24));
      return make((i) => (i < len ? a * 2 ** ((i / len) * r(1.2, 1.4)) : 0));
    },
  },
  {
    name: 'Laser',
    icon: '🔫',
    make: () => {
      const a = r(2500, 5000);
      const len = Math.floor(r(10, 22));
      return make((i) => (i < len ? sweep(a, r(300, 700), i / len) : 0));
    },
  },
  {
    name: 'Explosion',
    icon: '🧨',
    make: () => make((_, t) => r(60, 400) * (1 - t * 0.6)),
  },
  {
    name: 'Hurt',
    icon: '🤕',
    make: () => {
      const a = r(150, 300);
      return make((i) => (i < 22 ? (i % 2 ? a : a * 0.7) * (1 - i / 50) : 0));
    },
  },
  {
    name: 'Blip',
    icon: '🔹',
    make: () => {
      const a = note(r(5, 25));
      const len = Math.floor(r(3, 8));
      return make((i) => (i < len ? a : 0));
    },
  },
  {
    name: 'Alarm',
    icon: '🚨',
    make: () => {
      const a = r(600, 1000);
      const b = a * r(1.3, 1.6);
      const per = Math.floor(r(3, 6));
      return make((i) => (Math.floor(i / per) % 2 ? a : b));
    },
  },
  {
    name: 'Random',
    icon: '🎲',
    make: () => RECIPES[Math.floor(Math.random() * (RECIPES.length - 1))].make(),
  },
];

/** The recipe that suits each of the nine sounds the game plays by itself. */
export const SLOT_RECIPE = ['Heal', 'Defeat', 'Coin', 'Pay', 'Extra life', 'Points', 'Lose points', 'Power up', 'Power down'];

/** Changes to an existing sound. */
export const TRANSFORMS: { name: string; title: string; run: (s: Speaker) => Speaker }[] = [
  { name: 'Higher', title: 'Up a few semitones', run: (s) => make((i) => s[i] * 2 ** (3 / 12)) },
  { name: 'Lower', title: 'Down a few semitones', run: (s) => make((i) => s[i] * 2 ** (-3 / 12)) },
  { name: 'Faster', title: 'Play it in half the time', run: (s) => make((i) => s[i * 2] ?? 0) },
  { name: 'Slower', title: 'Stretch it to twice as long (the end is cut)', run: (s) => make((i) => s[Math.floor(i / 2)]) },
  { name: 'Reverse', title: 'Play it backwards', run: (s) => make((i) => s[NUMFREQ - 1 - i]) },
  {
    name: 'Echo',
    title: 'Repeat it softly after a gap',
    run: (s) => {
      let used = NUMFREQ;
      while (used > 0 && !s[used - 1]) used--;
      const gap = Math.max(4, Math.floor(used / 2));
      return make((i) => (s[i] ? s[i] : i >= gap && s[i - gap] ? s[i - gap] * 0.99 : 0));
    },
  },
  { name: 'Vibrato', title: 'Wobble the pitch', run: (s) => make((i) => (s[i] ? s[i] * (1 + 0.08 * Math.sin(i * 1.9)) : 0)) },
  { name: 'Mutate', title: 'Change it a little, at random', run: (s) => make((i) => (s[i] ? s[i] * 2 ** (r(-1.5, 1.5) / 12) : Math.random() < 0.05 ? r(200, 2000) : 0)) },
  { name: 'Smooth', title: 'Average neighbouring pitches', run: (s) => make((i) => (s[i] ? (s[Math.max(0, i - 1)] || s[i]) / 4 + s[i] / 2 + (s[Math.min(NUMFREQ - 1, i + 1)] || s[i]) / 4 : 0)) },
  { name: 'Choppy', title: 'Silence every other step', run: (s) => make((i) => (i % 2 ? 0 : s[i])) },
];
