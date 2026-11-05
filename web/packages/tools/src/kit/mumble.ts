// Mumble-speak: a little formant synthesizer that says nonsense, the way a game of 1994
// might hum a character's talk. A line is a list of syllables (a vowel, a pitch glide, a
// length, a rest); `mumble` renders them to samples and `mumbleVoc` to an 8-bit mono
// 11 kHz .VOC. `syllablesFromText` turns a line of text into syllables, the same way
// every time. Nothing here is a recording of anyone.
import { encodeVoc } from '@lewismoten/gamemaker-sandbox-engine/formats/voc';

/** A vowel's first two formants in Hz. */
const VOWEL = {
  a: [800, 1250],
  e: [520, 1850],
  i: [310, 2250],
  o: [520, 950],
  u: [340, 850],
} as const;

/** The vowels a syllable can have. */
export type MumbleVowel = keyof typeof VOWEL;

/** One syllable: a vowel, its pitch at the start and the end (Hz), how long it lasts (s), and a short pause after it (s). */
export type Syllable = [vowel: MumbleVowel, from: number, to: number, seconds: number, rest?: number];

/** How a line is voiced. */
export interface MumbleOptions {
  /** Samples per second. Default 11025. */
  rate?: number;
  /** Loudness before clipping. Default 1.6; samples are clamped to -1..1. */
  gain?: number;
  /** Seed of the breath noise at each syllable's start. Default 11. */
  noiseSeed?: number;
}

/** A voice's settings for `syllablesFromText`. */
export interface TextVoice {
  /** Middle pitch in Hz. */
  pitch: number;
  /** 1 is normal; 2 is twice as fast. */
  speed: number;
}

/** Ready-made voices: `syllablesFromText(text, MUMBLE_VOICES.deep)`. */
export const MUMBLE_VOICES: Record<'bright' | 'deep' | 'small', TextVoice> = {
  bright: { pitch: 300, speed: 1 },
  deep: { pitch: 125, speed: 0.8 },
  small: { pitch: 420, speed: 1.3 },
};

/** A two-pole resonator (a formant): rings at `hz` with the given bandwidth. */
function resonator(rate: number) {
  let y1 = 0;
  let y2 = 0;
  return (x: number, hz: number, bw: number): number => {
    const r = Math.exp((-Math.PI * bw) / rate);
    const c1 = 2 * r * Math.cos((2 * Math.PI * hz) / rate);
    const c2 = -r * r;
    const y = (1 - c1 - c2) * x + c1 * y1 + c2 * y2;
    y2 = y1;
    y1 = y;
    return y;
  };
}

/** How long a line lasts, in seconds. */
export function mumbleSeconds(line: Syllable[]): number {
  return line.reduce((t, s) => t + s[3] + (s[4] ?? 0), 0);
}

/** Renders a line of syllables as samples in -1..1 (never clipped past that). */
export function mumble(line: Syllable[], opts: MumbleOptions = {}): Float32Array {
  const rate = opts.rate ?? 11025;
  const gain = opts.gain ?? 1.6;
  const seconds = mumbleSeconds(line);
  const n = Math.round(seconds * rate);
  const out = new Float32Array(n);
  const f1 = resonator(rate);
  const f2 = resonator(rate);
  let phase = 0;
  let seed = opts.noiseSeed ?? 11;
  const noise = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x3fffffff - 1;
  };
  const voice = (t: number): number => {
    // which syllable are we in
    let at = 0;
    let s: Syllable | undefined;
    let local = 0;
    for (const syl of line) {
      const len = syl[3] + (syl[4] ?? 0);
      if (t < at + len) {
        s = syl;
        local = t - at;
        break;
      }
      at += len;
    }
    if (!s || local > s[3]) return 0;
    const k = local / s[3];
    const hz = s[1] + (s[2] - s[1]) * k;
    const [a, b] = VOWEL[s[0]];
    // a buzz at the pitch, softened by a breath of noise at the start of the syllable
    phase += hz / rate;
    phase -= Math.floor(phase);
    const buzz = (phase < 0.5 ? phase * 4 - 1 : 3 - phase * 4) * 0.8 + (phase * 2 - 1) * 0.2;
    const breath = noise() * Math.max(0, 0.5 - k * 3);
    // each syllable swells and fades, so the line has a rhythm
    const swell = Math.sin(Math.PI * Math.min(1, k * 1.15)) ** 0.7;
    const x = buzz + breath;
    return (f1(x, a, 90) * 0.9 + f2(x, b, 140) * 0.55) * swell;
  };
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const u = t / seconds;
    const env = Math.min(1, u * 40) * Math.min(1, (1 - u) * 25);
    out[i] = Math.max(-1, Math.min(1, voice(t) * env * gain));
  }
  return out;
}

/** Renders a line of syllables as a .VOC (8 bits, mono, 11 025 Hz unless `rate` says otherwise). */
export function mumbleVoc(line: Syllable[], opts: MumbleOptions = {}): Uint8Array {
  return encodeVoc(mumble(line, opts), opts.rate ?? 11025);
}

/** A small seeded random source (0..1). */
function random(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Turns a line of text into syllables: one per vowel group in its words, the vowel taken from the letters, so the same line (and seed) always mumbles the same way. A question rises at the end; a period or an exclamation falls. */
export function syllablesFromText(text: string, opts: Partial<TextVoice> & { seed?: number } = {}): Syllable[] {
  const pitch = opts.pitch ?? MUMBLE_VOICES.bright.pitch;
  const speed = Math.max(0.2, opts.speed ?? 1);
  const rnd = random(opts.seed ?? 1);
  const out: Syllable[] = [];
  const words = text.toLowerCase().match(/[a-z']+[^a-z'\s]*/g) ?? [];
  for (const word of words) {
    // a word with no vowel (hmm, shh) gets one "u"
    const list = word.match(/[aeiouy]+/g) ?? ['u'];
    list.forEach((g, i) => {
      const letter = g.replace('y', 'i')[0] as MumbleVowel;
      const vowel: MumbleVowel = letter in VOWEL ? letter : 'u';
      const from = pitch * (0.85 + rnd() * 0.3);
      const to = from * (0.85 + rnd() * 0.3);
      const seconds = (0.16 + 0.04 * g.length + rnd() * 0.06) / speed;
      const last = i === list.length - 1;
      out.push([vowel, from, to, seconds, last ? 0.08 / speed : 0.02 / speed]);
    });
    const mark = word.match(/[^a-z'\s]+$/)?.[0] ?? '';
    const tail = out[out.length - 1];
    if (tail && mark) {
      if (/[?]/.test(mark)) tail[2] = tail[1] * 1.3;
      else if (/[.!]/.test(mark)) {
        tail[2] = tail[1] * 0.7;
        tail[3] *= 1.5;
      }
      tail[4] = (/[,;:]/.test(mark) ? 0.14 : 0.25) / speed;
    }
  }
  return out;
}
