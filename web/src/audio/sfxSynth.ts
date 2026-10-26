// The sound effect maker's synthesizer: one oscillator (square, triangle, saw, sine or noise)
// whose pitch starts somewhere, slides, jumps, wobbles and repeats, shaped by an attack, hold
// and decay, with a simple tone (low-pass) control, levelled so its loudest point is the volume. The same settings also give the 36 PC
// speaker steps of a sound set slot (1/145.6 s each), so one effect works with or without a
// Sound Blaster. The idea of a few sliders plus presets with random variety comes from
// DrPetter's sfxr (2007); this code is written fresh for this edition (see NOTICE.md).
import { NUMFREQ } from '../formats/sound';

export type Wave = 'square' | 'triangle' | 'saw' | 'sine' | 'noise';
export const WAVES: [Wave, string][] = [
  ['square', 'Square'],
  ['triangle', 'Triangle'],
  ['saw', 'Saw'],
  ['sine', 'Sine'],
  ['noise', 'Noise'],
];

export interface SfxParams {
  wave: Wave;
  /** Starting pitch in Hz. */
  pitch: number;
  /** Octaves per second; negative falls. */
  slide: number;
  /** Semitones the pitch jumps by at `jumpAt` seconds (0 = no jump). */
  jump: number;
  jumpAt: number;
  /** Vibrato depth in semitones, and its speed in Hz. */
  vibrato: number;
  vibratoSpeed: number;
  /** Share of each square wave cycle that is high (0.5 = even). */
  duty: number;
  /** Envelope, in seconds. */
  attack: number;
  hold: number;
  decay: number;
  /** Seconds between restarts of the pitch (slide and jump start over); 0 = never. */
  repeat: number;
  /** 1 = bright; lower is duller (a one-pole low-pass). */
  tone: number;
  volume: number;
  /** Seeds the noise, so the same settings always make the same sound. */
  seed: number;
}

/** Each slider: its range, step and a label with units. */
export interface SliderSpec {
  key: Exclude<keyof SfxParams, 'wave' | 'seed'>;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  /** Shown on a log scale (pitch). */
  log?: boolean;
}

export const SLIDERS: SliderSpec[] = [
  { key: 'pitch', label: 'Pitch', min: 40, max: 4000, step: 1, unit: 'Hz', log: true },
  { key: 'slide', label: 'Slide', min: -12, max: 12, step: 0.1, unit: 'oct/s' },
  { key: 'jump', label: 'Jump', min: -12, max: 24, step: 1, unit: 'semitones' },
  { key: 'jumpAt', label: 'Jump at', min: 0, max: 0.5, step: 0.01, unit: 's' },
  { key: 'vibrato', label: 'Vibrato', min: 0, max: 3, step: 0.05, unit: 'semitones' },
  { key: 'vibratoSpeed', label: 'Vibrato speed', min: 0, max: 40, step: 0.5, unit: 'Hz' },
  { key: 'duty', label: 'Square width', min: 0.05, max: 0.5, step: 0.01, unit: '' },
  { key: 'attack', label: 'Attack', min: 0, max: 0.5, step: 0.01, unit: 's' },
  { key: 'hold', label: 'Hold', min: 0, max: 1, step: 0.01, unit: 's' },
  { key: 'decay', label: 'Decay', min: 0.01, max: 2, step: 0.01, unit: 's' },
  { key: 'repeat', label: 'Repeat every', min: 0, max: 0.5, step: 0.01, unit: 's' },
  { key: 'tone', label: 'Tone', min: 0.05, max: 1, step: 0.01, unit: '' },
  { key: 'volume', label: 'Volume', min: 0.1, max: 1, step: 0.01, unit: '' },
];

export const SFX_RATE = 11025;
/** Effects longer than this are cut (a sound set effect should be short). */
export const MAX_SECONDS = 3;
const SPEAKER_STEP = 1 / 145.6;

export function defaultParams(): SfxParams {
  return {
    wave: 'square',
    pitch: 440,
    slide: 0,
    jump: 0,
    jumpAt: 0,
    vibrato: 0,
    vibratoSpeed: 0,
    duty: 0.5,
    attack: 0,
    hold: 0.1,
    decay: 0.3,
    repeat: 0,
    tone: 1,
    volume: 0.8,
    seed: 1,
  };
}

/** Any object as settings: known keys within their ranges, the rest from the defaults. */
export function cleanParams(v: unknown): SfxParams {
  const out = defaultParams();
  if (!v || typeof v !== 'object') return out;
  const o = v as Record<string, unknown>;
  if (WAVES.some(([w]) => w === o.wave)) out.wave = o.wave as Wave;
  for (const s of SLIDERS) {
    const n = o[s.key];
    if (typeof n === 'number' && Number.isFinite(n)) out[s.key] = Math.max(s.min, Math.min(s.max, n));
  }
  if (typeof o.seed === 'number' && Number.isFinite(o.seed)) out.seed = Math.floor(o.seed) >>> 0;
  return out;
}

export function seconds(p: SfxParams): number {
  return Math.min(MAX_SECONDS, Math.max(0.02, p.attack + p.hold + p.decay));
}

/** Loudness 0..1 at time t. */
function envelope(p: SfxParams, t: number): number {
  if (t < p.attack) return t / p.attack;
  if (t < p.attack + p.hold) return 1;
  const d = (t - p.attack - p.hold) / p.decay;
  return d >= 1 ? 0 : (1 - d) * (1 - d);
}

/** The pitch in Hz at time t, before vibrato. */
function pitchAt(p: SfxParams, t: number): number {
  const local = p.repeat > 0 ? t % p.repeat : t;
  let f = p.pitch * 2 ** (p.slide * local);
  if (p.jump && p.jumpAt > 0 && local >= p.jumpAt) f *= 2 ** (p.jump / 12);
  return f;
}

function seeded(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

/** The effect as mono samples (-1..1) at `rate`. */
export function renderSfx(p: SfxParams, rate = SFX_RATE): Float32Array {
  const n = Math.round(seconds(p) * rate);
  const out = new Float32Array(n);
  const rnd = seeded(p.seed);
  // the low-pass's smoothing: 1 passes everything; lower keeps less of each new sample
  const k = Math.min(1, p.tone * p.tone);
  let phase = 0;
  let noise = rnd() * 2 - 1;
  let low = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const vib = p.vibrato && p.vibratoSpeed ? 2 ** ((p.vibrato * Math.sin(2 * Math.PI * p.vibratoSpeed * t)) / 12) : 1;
    const f = Math.max(20, Math.min(rate / 2, pitchAt(p, t) * vib));
    const before = phase;
    phase += f / rate;
    // noise holds a random value for an eighth of a cycle, so its pitch still means something
    if (Math.floor(phase * 8) !== Math.floor(before * 8)) noise = rnd() * 2 - 1;
    phase -= Math.floor(phase);
    let v: number;
    switch (p.wave) {
      case 'square':
        v = phase < p.duty ? 1 : -1;
        break;
      case 'triangle':
        v = phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4;
        break;
      case 'saw':
        v = phase * 2 - 1;
        break;
      case 'sine':
        v = Math.sin(2 * Math.PI * phase);
        break;
      default:
        v = noise;
    }
    low += (v - low) * k;
    out[i] = low * envelope(p, t);
  }
  // a dull tone loses level in the filter: the loudest point is always the volume asked for
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const gain = peak ? p.volume / peak : 0;
  for (let i = 0; i < n; i++) out[i] = Math.max(-1, Math.min(1, out[i] * gain));
  return out;
}

/**
 * The same effect for the PC speaker: the pitch at each of a slot's 36 steps, 0 where the
 * envelope has gone quiet (the speaker has no volume, only on and off). Noise hops around
 * its pitch, as the speaker can only play one tone at a time.
 */
export function speakerSteps(p: SfxParams): Uint16Array {
  const rnd = seeded(p.seed);
  const len = seconds(p);
  return Uint16Array.from({ length: NUMFREQ }, (_, i) => {
    const t = i * SPEAKER_STEP;
    if (t >= len || envelope(p, t) * p.volume < 0.12) return 0;
    const vib = p.vibrato && p.vibratoSpeed ? 2 ** ((p.vibrato * Math.sin(2 * Math.PI * p.vibratoSpeed * t)) / 12) : 1;
    let f = pitchAt(p, t) * vib;
    if (p.wave === 'noise') f *= 0.5 + rnd() * 1.5;
    return Math.max(40, Math.min(8192, Math.round(f)));
  });
}
