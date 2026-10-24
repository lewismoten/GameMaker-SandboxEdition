// What a modem sounded like through its speaker when it dialed a BBS: dial tone,
// touch-tones, the ring, then the handshake of the line speed picked (lineSpeed.ts), and
// silence once the speaker turns off at CONNECT. Everything is band-limited like a phone line.
// The handshakes, slowest to fastest:
//   300 (Bell 103): one steady 2225 Hz answer tone, the caller's 1270 Hz joins it, connected.
//   1200 (Bell 212A): the 2225 Hz tone, then a short burst of scrambled data.
//   2400 (V.22bis): the 2100 Hz answer tone with its phase flips, a "bong", a longer hiss.
//   4800, 9600 (V.32) and 14,400 (V.32bis): the answer tone, the "bing-bong" (1800 Hz, then
//     600 + 3000 Hz), then the echo canceller's long hiss.
//   28,800 and 33,600 (V.34): the answer tone wobbling at 15 Hz (ANSam), the V.8 chirps,
//     the line-probing chord, then training.
//   56K (V.90): all of V.34's, then a second, longer round of probing and training.
import { lineSpeed, type LineSpeed } from './lineSpeed';
import { pcOutput } from '../computer/pcAudio';

export const DTMF: Record<string, [number, number]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
  '0': [941, 1336],
  '*': [941, 1209],
  '#': [941, 1477],
};

/** Moments in the call (seconds from the start) the terminal can show. */
export interface CallTimeline {
  rings: number[];
  /** The answering modem picks up. */
  answer: number;
  /** Carrier detected: CONNECT. */
  connect: number;
}

/** A phone line: band-limited to 300..3400 Hz, with tones, the answer tone, FSK and hiss. */
export class Line {
  readonly out: GainNode;
  /** `to`: where it is heard (the PC's own line by default; the wall phone has its own). */
  constructor(
    readonly ctx: AudioContext,
    to: AudioNode = pcOutput(ctx),
  ) {
    // The phone line: 300..3400 Hz.
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 300;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3400;
    this.out = ctx.createGain();
    this.out.gain.value = 0.5;
    this.out.connect(hp).connect(lp).connect(to);
  }

  /** A gain stage that fades in at `start` and out at `start + dur` (no clicks). */
  private envelope(start: number, dur: number, level: number): GainNode {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(level, start + 0.008);
    g.gain.setValueAtTime(level, start + dur - 0.008);
    g.gain.linearRampToValueAtTime(0, start + dur);
    g.connect(this.out);
    return g;
  }

  tones(freqs: number[], start: number, dur: number, level = 0.12): void {
    const g = this.envelope(start, dur, level);
    for (const f of freqs) {
      const o = this.ctx.createOscillator();
      o.frequency.value = f;
      o.connect(g);
      o.start(start);
      o.stop(start + dur);
    }
  }

  /**
   * The answer tone: 2100 Hz with a phase flip every 450 ms (V.25), and from V.34 on
   * amplitude modulated at 15 Hz as well (`wobble`: ANSam).
   */
  answerTone(start: number, dur: number, wobble = true): void {
    const g = this.envelope(start, dur, 0.13);
    const am = this.ctx.createGain();
    am.gain.value = 0.8;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 15;
    const depth = this.ctx.createGain();
    depth.gain.value = wobble ? 0.2 : 0;
    lfo.connect(depth).connect(am.gain);
    const o = this.ctx.createOscillator();
    o.frequency.value = 2100;
    // A phase reversal is heard as a tiny tick: dip the level for a moment.
    for (let t = start + 0.45; t < start + dur; t += 0.45) {
      am.gain.setValueAtTime(0.8, t - 0.004);
      am.gain.linearRampToValueAtTime(0.1, t);
      am.gain.linearRampToValueAtTime(0.8, t + 0.004);
    }
    o.connect(am).connect(g);
    for (const n of [o, lfo]) {
      n.start(start);
      n.stop(start + dur);
    }
  }

  /** V.21 frequency shift keying at 300 baud: random bits, one of two tones each. */
  fsk(mark: number, space: number, start: number, dur: number, level = 0.1): void {
    const g = this.envelope(start, dur, level);
    const o = this.ctx.createOscillator();
    for (let t = start; t < start + dur; t += 1 / 300) o.frequency.setValueAtTime(Math.random() < 0.5 ? mark : space, t);
    o.connect(g);
    o.start(start);
    o.stop(start + dur);
  }

  /** V.34 line probing: a short chord of tones 150 Hz apart across the line, heard as a "pling". */
  probe(start: number, dur = 0.16): void {
    const freqs: number[] = [];
    for (let f = 450; f <= 3300; f += 150) freqs.push(f);
    this.tones(freqs, start, dur, 0.012);
  }

  /** Scrambled data: the hiss of training and of the data that follows. */
  hiss(start: number, dur: number, level = 0.22, center = 1800): void {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = center;
    bp.Q.value = 0.6;
    src.connect(bp).connect(this.envelope(start, dur, level));
    src.start(start);
  }
}

/** Plays the call (if there is audio) and returns when things happen in it. */
/** Phone keypad letters: 1-412-555-SAND dials 7263. */
const KEYPAD: Record<string, string> = {
  A: '2',
  B: '2',
  C: '2',
  D: '3',
  E: '3',
  F: '3',
  G: '4',
  H: '4',
  I: '4',
  J: '5',
  K: '5',
  L: '5',
  M: '6',
  N: '6',
  O: '6',
  P: '7',
  Q: '7',
  R: '7',
  S: '7',
  T: '8',
  U: '8',
  V: '8',
  W: '9',
  X: '9',
  Y: '9',
  Z: '9',
};

export function keypadDigits(number: string): string {
  return number
    .toUpperCase()
    .replace(/[A-Z]/g, (c) => KEYPAD[c])
    .replace(/\D/g, '');
}

/** Dial tone, touch-tones, then the busy signal: returns when it has played (seconds). */
export function busySounds(ctx: AudioContext | undefined, number: string): number {
  const digits = keypadDigits(number);
  const start = 1.1 + digits.length * 0.17 + 0.7;
  const end = start + 4.5;
  if (ctx) {
    const line = new Line(ctx);
    const t0 = ctx.currentTime + 0.05;
    line.tones([350, 440], t0, 1.0, 0.1);
    digits.split('').forEach((d, i) => line.tones(DTMF[d], t0 + 1.1 + i * 0.17, 0.1, 0.12));
    for (let t = start; t < end; t += 1) line.tones([480, 620], t0 + t, 0.5, 0.1);
  }
  return end;
}

export function dialSounds(ctx: AudioContext | undefined, number: string, speed: LineSpeed = lineSpeed()): CallTimeline {
  const digits = keypadDigits(number);
  // The same timeline drives the screen when there is no sound.
  let t = 1.1; // dial tone
  const digitAt: number[] = [];
  for (const _ of digits) {
    digitAt.push(t);
    t += 0.17;
  }
  t += 0.9; // the exchange connects the call
  const rings = [t];
  t += 2.0 + 1.3; // a ring and the silence after it
  const answer = t;
  const line = ctx ? new Line(ctx) : undefined;
  const t0 = ctx ? ctx.currentTime + 0.05 : 0;
  if (line) {
    line.tones([350, 440], t0, 1.0, 0.1);
    digits.split('').forEach((d, i) => line.tones(DTMF[d], t0 + digitAt[i], 0.1, 0.12));
    for (const r of rings) line.tones([440, 480], t0 + r, 2.0, 0.07);
  }
  /** Schedules a sound `dt` seconds after `t` (when there is a line to hear it on). */
  const at = (dt: number, play: (l: Line, when: number) => void) => line && play(line, t0 + t + dt);
  const v32 = () => {
    // AA (1800 Hz) and AC (600 + 3000 Hz): the "bing-bong"
    at(0, (l, w) => l.tones([600, 3000], w, 0.3, 0.09));
    at(0.3, (l, w) => l.tones([1800], w, 0.3, 0.1));
    at(0.6, (l, w) => l.tones([600, 3000], w, 0.25, 0.09));
    t += 0.9;
  };
  const v34 = () => {
    at(0, (l, w) => l.answerTone(w, 2.5, true));
    t += 2.6;
    // V.8: the caller's call menu, the answerer's joint menu
    at(0, (l, w) => l.fsk(1180, 980, w, 0.55));
    at(0.35, (l, w) => l.fsk(1850, 1650, w, 0.6));
    t += 1.0;
    // line probing, twice, then training
    at(0, (l, w) => l.probe(w));
    at(0.35, (l, w) => l.probe(w));
    at(0.6, (l, w) => l.hiss(w, 1.2, 0.22, 1800));
    t += 1.9;
  };
  if (speed === 300) {
    // Bell 103: the answering modem's mark tone, the caller's joins it, and that is all
    at(0, (l, w) => l.tones([2225], w, 2.6, 0.12));
    at(1.6, (l, w) => l.tones([1270], w, 1.0, 0.1));
    t += 2.6;
  } else if (speed === 1200) {
    // Bell 212A: the 2225 Hz tone, then scrambled ones at 1200 and 2400 Hz
    at(0, (l, w) => l.tones([2225], w, 2.0, 0.12));
    t += 2.1;
    at(0, (l, w) => l.hiss(w, 0.8, 0.18, 1800));
    t += 0.9;
  } else if (speed === 2400) {
    // V.22bis: the 2100 Hz answer tone, an unscrambled "bong", then the scrambled hiss
    at(0, (l, w) => l.answerTone(w, 2.5, false));
    t += 2.6;
    at(0, (l, w) => l.tones([1200, 2400], w, 0.45, 0.08));
    at(0.5, (l, w) => l.hiss(w, 1.4, 0.2, 1800));
    t += 2.0;
  } else if (speed === 4800 || speed === 9600 || speed === 14400) {
    // V.32 and V.32bis: the answer tone, the bing-bong, the echo canceller's training
    at(0, (l, w) => l.answerTone(w, 2.5, false));
    t += 2.6;
    v32();
    at(0, (l, w) => l.hiss(w, 1.3, 0.24, 1700));
    at(1.45, (l, w) => l.hiss(w, speed === 14400 ? 1.05 : 0.7, 0.2, 1900));
    t += speed === 14400 ? 2.6 : 2.2;
  } else if (speed === 28800 || speed === 33600) {
    v34();
    at(0, (l, w) => l.hiss(w, 1.1, 0.2, 1900));
    t += 1.2;
  } else {
    // V.90 (56K, and the fastest line there is): V.34's start, then a second round of
    // probing for the digital line and a longer training
    v34();
    at(0, (l, w) => l.probe(w, 0.25));
    at(0.3, (l, w) => l.hiss(w, 1.6, 0.18, 2100));
    at(2.0, (l, w) => l.hiss(w, 0.9, 0.2, 1700));
    t += 3.0;
  }
  return { rings, answer, connect: t };
}
