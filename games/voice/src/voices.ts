// OUT LOUD's four voice clips (.VOC), made in code: a little formant synthesizer says a few
// syllables of nonsense, the way a game of 1994 might hum a character's talk. The clips are
// not recordings of anyone. To use your own, record 8-bit mono at 11 kHz into a .VOC file
// with the same name; the game does not care what is in it.
//
//   hello   Kit's "hello", two short syllables (about 0.7 s)
//   welcome the first speaker's line, a bright greeting (about 1.9 s)
//   deeper  the second speaker's line, lower and slower (about 2.0 s)
//   bye     the last speaker's goodbye (about 2.4 s)
import { sample } from '@lewismoten/gamemaker-sandbox-tools/kit/sound';

/** A vowel's first two formants in Hz. */
const VOWEL = {
  a: [800, 1250],
  e: [520, 1850],
  i: [310, 2250],
  o: [520, 950],
  u: [340, 850],
} as const;

/** One syllable: a vowel, its pitch at the start and the end (Hz), how long it lasts (s), and a short pause after it. */
type Syllable = [vowel: keyof typeof VOWEL, from: number, to: number, seconds: number, rest?: number];

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

/** Renders `line` as a .VOC at 11 025 Hz, 8 bits, mono. */
function say(line: Syllable[], gain = 1.6): Uint8Array {
  const rate = 11025;
  const total = line.reduce((t, s) => t + s[3] + (s[4] ?? 0), 0);
  const f1 = resonator(rate);
  const f2 = resonator(rate);
  let phase = 0;
  let seed = 11;
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
  return sample(total, voice, { rate, gain, envelope: (u) => Math.min(1, u * 40) * Math.min(1, (1 - u) * 25) });
}

/** The four clips, by file name (without .VOC). */
export const VOICES: Record<'hello' | 'welcome' | 'deeper' | 'bye', Uint8Array> = {
  hello: say([
    ['e', 210, 260, 0.2, 0.03],
    ['o', 300, 230, 0.4],
  ]),
  welcome: say([
    ['e', 260, 300, 0.2, 0.02],
    ['o', 320, 280, 0.25, 0.1],
    ['u', 300, 340, 0.2, 0.02],
    ['a', 340, 380, 0.25, 0.1],
    ['i', 330, 360, 0.2, 0.02],
    ['o', 380, 260, 0.5],
  ]),
  deeper: say(
    [
      ['o', 130, 120, 0.3, 0.06],
      ['a', 150, 125, 0.3, 0.1],
      ['u', 125, 110, 0.3, 0.06],
      ['e', 140, 150, 0.25, 0.04],
      ['o', 150, 95, 0.55],
    ],
    1.9,
  ),
  bye: say([
    ['a', 280, 330, 0.22, 0.04],
    ['i', 330, 300, 0.22, 0.12],
    ['e', 300, 280, 0.2, 0.04],
    ['a', 290, 320, 0.22, 0.12],
    ['o', 320, 280, 0.2, 0.04],
    ['u', 280, 250, 0.2, 0.04],
    ['a', 260, 180, 0.6],
  ]),
};
