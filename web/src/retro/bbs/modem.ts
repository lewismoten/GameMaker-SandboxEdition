// What a 14,400 bps modem sounded like through its speaker when it dialed a BBS: dial
// tone, touch-tones, the ring, the answering modem's 2100 Hz tone, the V.8 / V.32bis
// handshake (FSK chirps, the "bing-bong" tones, then the hiss of training), and silence
// once the speaker turns off at CONNECT. Everything is band-limited like a phone line.
import { output } from "../../audio/output";

const DTMF: Record<string, [number, number]> = {
  "1": [697, 1209],
  "2": [697, 1336],
  "3": [697, 1477],
  "4": [770, 1209],
  "5": [770, 1336],
  "6": [770, 1477],
  "7": [852, 1209],
  "8": [852, 1336],
  "9": [852, 1477],
  "0": [941, 1336],
};

/** Moments in the call (seconds from the start) the terminal can show. */
export interface CallTimeline {
  rings: number[];
  /** The answering modem picks up. */
  answer: number;
  /** Carrier detected: CONNECT. */
  connect: number;
}

class Line {
  readonly out: GainNode;
  constructor(readonly ctx: AudioContext) {
    // The phone line: 300..3400 Hz.
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 300;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3400;
    this.out = ctx.createGain();
    this.out.gain.value = 0.5;
    this.out.connect(hp).connect(lp).connect(output(ctx));
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

  /** The answer tone (ANSam): 2100 Hz, amplitude modulated at 15 Hz, phase flips every 450 ms. */
  answerTone(start: number, dur: number): void {
    const g = this.envelope(start, dur, 0.13);
    const am = this.ctx.createGain();
    am.gain.value = 0.8;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 15;
    const depth = this.ctx.createGain();
    depth.gain.value = 0.2;
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
  fsk(
    mark: number,
    space: number,
    start: number,
    dur: number,
    level = 0.1,
  ): void {
    const g = this.envelope(start, dur, level);
    const o = this.ctx.createOscillator();
    for (let t = start; t < start + dur; t += 1 / 300)
      o.frequency.setValueAtTime(Math.random() < 0.5 ? mark : space, t);
    o.connect(g);
    o.start(start);
    o.stop(start + dur);
  }

  /** Scrambled data: the hiss of training and of the data that follows. */
  hiss(start: number, dur: number, level = 0.22, center = 1800): void {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * dur),
      ctx.sampleRate,
    );
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = center;
    bp.Q.value = 0.6;
    src.connect(bp).connect(this.envelope(start, dur, level));
    src.start(start);
  }
}

/** Plays the call (if there is audio) and returns when things happen in it. */
/** Phone keypad letters: 1-412-555-SAND dials 7263. */
const KEYPAD: Record<string, string> = {
  A: "2",
  B: "2",
  C: "2",
  D: "3",
  E: "3",
  F: "3",
  G: "4",
  H: "4",
  I: "4",
  J: "5",
  K: "5",
  L: "5",
  M: "6",
  N: "6",
  O: "6",
  P: "7",
  Q: "7",
  R: "7",
  S: "7",
  T: "8",
  U: "8",
  V: "8",
  W: "9",
  X: "9",
  Y: "9",
  Z: "9",
};

export function keypadDigits(number: string): string {
  return number
    .toUpperCase()
    .replace(/[A-Z]/g, (c) => KEYPAD[c])
    .replace(/\D/g, "");
}

/** Dial tone, touch-tones, then the busy signal: returns when it has played (seconds). */
export function busySounds(
  ctx: AudioContext | undefined,
  number: string,
): number {
  const digits = keypadDigits(number);
  const start = 1.1 + digits.length * 0.17 + 0.7;
  const end = start + 4.5;
  if (ctx) {
    const line = new Line(ctx);
    const t0 = ctx.currentTime + 0.05;
    line.tones([350, 440], t0, 1.0, 0.1);
    digits
      .split("")
      .forEach((d, i) => line.tones(DTMF[d], t0 + 1.1 + i * 0.17, 0.1, 0.12));
    for (let t = start; t < end; t += 1)
      line.tones([480, 620], t0 + t, 0.5, 0.1);
  }
  return end;
}

export function dialSounds(
  ctx: AudioContext | undefined,
  number: string,
): CallTimeline {
  const digits = keypadDigits(number);
  // The same timeline drives the screen when there is no sound.
  let t = 0;
  const at: {
    tone: number;
    digits: number[];
    rings: number[];
    answer: number;
    v8: number;
    v32: number;
    train: number;
    connect: number;
  } = {
    tone: 0,
    digits: [],
    rings: [],
    answer: 0,
    v8: 0,
    v32: 0,
    train: 0,
    connect: 0,
  };
  t += 1.1; // dial tone
  for (const _ of digits) {
    at.digits.push(t);
    t += 0.17;
  }
  t += 0.9; // the exchange connects the call
  at.rings.push(t);
  t += 2.0 + 1.3; // a ring and the silence after it
  at.answer = t;
  t += 2.6; // answer tone
  at.v8 = t;
  t += 1.0;
  at.v32 = t;
  t += 0.9;
  at.train = t;
  t += 2.6;
  at.connect = t;

  if (ctx) {
    const line = new Line(ctx);
    const t0 = ctx.currentTime + 0.05;
    line.tones([350, 440], t0 + at.tone, 1.0, 0.1);
    digits
      .split("")
      .forEach((d, i) => line.tones(DTMF[d], t0 + at.digits[i], 0.1, 0.12));
    for (const r of at.rings) line.tones([440, 480], t0 + r, 2.0, 0.07);
    line.answerTone(t0 + at.answer, 2.5);
    // V.8: the caller's call menu, the answerer's joint menu.
    line.fsk(1180, 980, t0 + at.v8, 0.55);
    line.fsk(1850, 1650, t0 + at.v8 + 0.35, 0.6);
    // V.32bis start-up: AA (1800 Hz) and AC (600 + 3000 Hz), the "bing-bong".
    line.tones([600, 3000], t0 + at.v32, 0.3, 0.09);
    line.tones([1800], t0 + at.v32 + 0.3, 0.3, 0.1);
    line.tones([600, 3000], t0 + at.v32 + 0.6, 0.25, 0.09);
    // Echo canceller training, a short pause, then rate negotiation and data.
    line.hiss(t0 + at.train, 1.3, 0.24, 1700);
    line.hiss(t0 + at.train + 1.45, 1.05, 0.2, 1900);
  }
  return { rings: at.rings, answer: at.answer, connect: at.connect };
}
