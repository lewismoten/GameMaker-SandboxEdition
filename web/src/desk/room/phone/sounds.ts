// What you hear on the wall phone: the dial tone, touch-tones, ringing and busy signals,
// the three rising tones before "the number you have reached is not in service", the
// off-hook howler, answering machine and pager beeps, hold music, a modem screeching on
// the line, a TTY's Baudot, and (out loud, in the room) the phone's bell and a fire engine's siren.
import { output } from '../../../audio/output';
import { audioContext, unlock } from '../../../audio/context';
import { dataNoise, DTMF, Line } from '../../../retro/bbs/modem';
import { baudotSeconds, encodeBaudot, playBaudot } from '../../../retro/bbs/baudot';

let shared: AudioContext | undefined;

/** One audio context for the phone, unlocked by the click that lifts the handset. */
function audio(): AudioContext | undefined {
  try {
    shared ??= audioContext();
    if (shared && shared.state !== 'running') unlock();
    return shared;
  } catch {
    return undefined;
  }
}

/** Für Elise's opening (Beethoven, about 1810: public domain), the hold music on every business line (note, beats). */
const FUR_ELISE: [number, number][] = [
  [76, 1],
  [75, 1],
  [76, 1],
  [75, 1],
  [76, 1],
  [71, 1],
  [74, 1],
  [72, 1],
  [69, 2],
  [0, 1],
  [60, 1],
  [64, 1],
  [69, 1],
  [71, 2],
  [0, 1],
  [64, 1],
  [68, 1],
  [71, 1],
  [72, 2],
  [0, 1],
  [64, 1],
  [76, 1],
  [75, 1],
  [76, 1],
  [75, 1],
  [76, 1],
  [71, 1],
  [74, 1],
  [72, 1],
  [69, 2],
  [0, 1],
  [60, 1],
  [64, 1],
  [69, 1],
  [71, 2],
  [0, 1],
  [64, 1],
  [72, 1],
  [71, 1],
  [69, 3],
  [0, 3],
];
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export class PhoneSounds {
  /** What is playing on the line now (stop() silences it). */
  private now: Line[] = [];
  /** Sounds in the room, outside the handset: the bell, the siren. */
  private room: GainNode[] = [];

  private constructor(readonly ctx: AudioContext) {}

  static open(): PhoneSounds | undefined {
    const ctx = audio();
    return ctx && new PhoneSounds(ctx);
  }

  private line(): [Line, number] {
    const l = new Line(this.ctx, output(this.ctx));
    this.now.push(l);
    return [l, this.ctx.currentTime + 0.03];
  }

  /** Silences the line (the room's sounds go on). */
  stop(): void {
    for (const l of this.now) l.out.disconnect();
    this.now = [];
  }

  /** Stops the bell and the siren. */
  quiet(): void {
    for (const g of this.room) g.disconnect();
    this.room = [];
  }

  dialTone(): void {
    const [l, t] = this.line();
    l.tones([350, 440], t, 600, 0.1);
  }

  /** A touch-tone, on top of whatever else is on the line. */
  key(k: string): void {
    const pair = DTMF[k];
    if (!pair) return;
    const l = new Line(this.ctx, output(this.ctx));
    l.tones(pair, this.ctx.currentTime + 0.01, 0.15, 0.12);
    setTimeout(() => l.out.disconnect(), 400);
  }

  /** The ring you hear while the other end rings: 2 seconds on, 4 off. */
  ringback(): void {
    const [l, t] = this.line();
    for (let i = 0; i < 60; i++) l.tones([440, 480], t + i * 6, 2, 0.07);
  }

  busy(): void {
    const [l, t] = this.line();
    for (let i = 0; i < 300; i++) l.tones([480, 620], t + i, 0.5, 0.1);
  }

  /** The special information tones before a recording: returns their length (s). */
  intercept(): number {
    const [l, t] = this.line();
    l.tones([913.8], t, 0.274, 0.12);
    l.tones([1370.6], t + 0.274, 0.274, 0.12);
    l.tones([1776.7], t + 0.548, 0.38, 0.12);
    return 1.1;
  }

  /** The loud off-hook warning, when you leave the phone off the hook too long. */
  howler(): void {
    const [l, t] = this.line();
    for (let i = 0; i < 300; i++) l.tones([1400, 2060, 2450, 2600], t + i * 0.2, 0.1, 0.06);
  }

  /** An answering machine's beep: returns its length (s). */
  beep(): number {
    const [l, t] = this.line();
    l.tones([1000], t, 0.6, 0.12);
    return 0.7;
  }

  /** A pager service asking for a number. */
  pagerPrompt(): number {
    const [l, t] = this.line();
    for (let i = 0; i < 3; i++) l.tones([1400], t + i * 0.22, 0.12, 0.1);
    return 0.8;
  }

  /** The page went through. */
  pagerOk(): number {
    const [l, t] = this.line();
    for (let i = 0; i < 6; i++) l.tones([1400], t + i * 0.12, 0.07, 0.1);
    return 0.9;
  }

  holdMusic(): void {
    const [l, t] = this.line();
    const beat = 0.24;
    let at = t;
    for (let round = 0; round < 12; round++)
      for (const [note, beats] of FUR_ELISE) {
        if (note) l.tones([hz(note)], at, beats * beat * 0.9, 0.06);
        at += beats * beat;
      }
  }

  /** A modem answers: its answer tone and handshake, then it gives up. Returns its length (s). */
  modemAnswer(): number {
    const [l, t] = this.line();
    l.answerTone(t, 3);
    l.fsk(1850, 1650, t + 3.1, 0.7);
    l.answerTone(t + 4, 2.5);
    l.fsk(1850, 1650, t + 6.6, 0.7);
    return 7.6;
  }

  /** A TTY typing `text`: Baudot's two tones at 45.45 baud. Returns its length (s). */
  tty(text: string): number {
    const [l, t] = this.line();
    const codes = encodeBaudot(text);
    playBaudot(l, codes, t, 0.1);
    return baudotSeconds(codes) + 0.05;
  }

  /** Two modems talking, loud in your ear, as they sound at the line's speed: returns its length (s). */
  modemNoise(): number {
    const [l, t] = this.line();
    dataNoise(l, t, 2.8, undefined, 0.32);
    return 2.9;
  }

  private roomGain(level: number): GainNode {
    const g = this.ctx.createGain();
    g.gain.value = level;
    g.connect(output(this.ctx));
    this.room.push(g);
    return g;
  }

  /** The phone's bell ringing in the room: 2 seconds on, 4 off, for `rings` rings. */
  bell(rings: number): void {
    const g = this.roomGain(0.08);
    const t = this.ctx.currentTime + 0.03;
    for (let i = 0; i < rings; i++) {
      const start = t + i * 6;
      // the clapper hits the two bells 20 times a second
      const strike = this.ctx.createGain();
      strike.gain.value = 0;
      for (let s = start; s < start + 2; s += 0.05) {
        strike.gain.setValueAtTime(1, s);
        strike.gain.exponentialRampToValueAtTime(0.2, s + 0.045);
      }
      strike.gain.setValueAtTime(0, start + 2);
      strike.connect(g);
      for (const f of [1150, 1380]) {
        const o = this.ctx.createOscillator();
        o.frequency.value = f;
        o.connect(strike);
        o.start(start);
        o.stop(start + 2);
      }
    }
  }

  /** A fire engine's wail, coming up the street and going quiet when it stops. */
  siren(after: number, dur: number): void {
    const g = this.roomGain(0);
    const t = this.ctx.currentTime + after;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0, t + dur);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    lp.connect(g);
    const o = this.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 950;
    const sweep = this.ctx.createOscillator();
    sweep.frequency.value = 0.35;
    const depth = this.ctx.createGain();
    depth.gain.value = 320;
    sweep.connect(depth).connect(o.frequency);
    o.connect(lp);
    for (const n of [o, sweep]) {
      n.start(t);
      n.stop(t + dur);
    }
  }
}
