// The room's little sounds, made on the spot (no files): a watch's beeps, a rubber chicken,
// crumpled paper, a door's rattle and a knock, a speaker's thump, a monitor's degauss, a
// fly's buzz, a twinkle. They go out through the speakers' volume knob (audio/output.ts),
// so a knob turned all the way down keeps the room quiet too, and they start only from
// the click or key press that asked for them.
import { output } from "../../audio/output";
import { audioContext, unlock } from "../../audio/context";

interface Out {
  ctx: AudioContext;
  out: AudioNode;
  t: number;
}

/** The page's audio, unlocked by this gesture; undefined where there is none. */
function open(): Out | undefined {
  try {
    const ctx = audioContext();
    if (!ctx) return undefined;
    unlock();
    return { ctx, out: output(ctx), t: ctx.currentTime + 0.02 };
  } catch {
    return undefined;
  }
}

/** A tone: `type` wave from `from` Hz (sliding to `to`), starting `at` seconds in. */
function tone(
  o: Out,
  at: number,
  len: number,
  from: number,
  to = from,
  level = 0.08,
  type: OscillatorType = "sine",
): void {
  const { ctx, out } = o;
  const t = o.t + at;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(level, t + Math.min(0.01, len / 4));
  g.gain.exponentialRampToValueAtTime(0.0008, t + len);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + len + 0.02);
}

/** A burst of filtered noise (paper, a knock's body, a swish). */
function noise(
  o: Out,
  at: number,
  len: number,
  freq: number,
  level = 0.12,
  q = 1,
  sweepTo?: number,
): void {
  const { ctx, out } = o;
  const t = o.t + at;
  const n = Math.max(1, Math.floor(ctx.sampleRate * len));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + len);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + len);
  src.connect(f).connect(g).connect(out);
  src.start(t);
}

export const roomSound = {
  /** The quartz tick and the hourly beep-beep of a sport watch. */
  watch(): void {
    const o = open();
    if (!o) return;
    noise(o, 0, 0.02, 5000, 0.2, 4);
    tone(o, 0.35, 0.09, 4096, 4096, 0.05, "square");
    tone(o, 0.5, 0.09, 4096, 4096, 0.05, "square");
  },
  /** Cuckoo! `times` times (a falling third). */
  cuckoo(times = 2): void {
    const o = open();
    if (!o) return;
    for (let i = 0; i < times; i++) {
      tone(o, i * 0.7, 0.25, 784, 770, 0.12, "triangle");
      tone(o, i * 0.7 + 0.28, 0.35, 622, 610, 0.12, "triangle");
    }
  },
  /** A rubber chicken's squawk, `times` times: a squeeze in, the wheezy honk out. */
  squawk(times = 2): void {
    const o = open();
    if (!o) return;
    for (let i = 0; i < times; i++) {
      const at = i * 0.55;
      tone(o, at, 0.08, 900, 1400, 0.05, "triangle");
      tone(o, at + 0.1, 0.38, 1250, 700, 0.09, "sawtooth");
      tone(o, at + 0.1, 0.38, 1880, 1050, 0.04, "square");
      noise(o, at + 0.1, 0.35, 1600, 0.06, 1.2);
    }
  },
  /** Paper crumpling as it is pulled out of the basket. */
  crinkle(): void {
    const o = open();
    if (!o) return;
    for (let i = 0; i < 7; i++)
      noise(o, i * 0.045 + Math.random() * 0.03, 0.05, 2500 + Math.random() * 3000, 0.16, 2);
  },
  /** A doorknob rattling in a locked door. */
  rattle(): void {
    const o = open();
    if (!o) return;
    for (let i = 0; i < 5; i++) {
      noise(o, i * 0.08, 0.05, 1800, 0.18, 6);
      tone(o, i * 0.08, 0.04, 2400, 2200, 0.03, "square");
    }
  },
  /** Knock, knock (on the other side of the door). */
  knock(times = 2): void {
    const o = open();
    if (!o) return;
    for (let i = 0; i < times; i++) {
      tone(o, i * 0.22, 0.12, 140, 70, 0.35);
      noise(o, i * 0.22, 0.06, 600, 0.25, 1.5);
    }
  },
  /** A door's hinge creaking open a little. */
  creak(): void {
    const o = open();
    if (!o) return;
    tone(o, 0, 0.6, 330, 520, 0.035, "sawtooth");
  },
  /** A bicycle horn honked twice, out in the hall. */
  honk(): void {
    const o = open();
    if (!o) return;
    for (const at of [0, 0.3]) {
      tone(o, at, 0.2, 370, 350, 0.08, "square");
      tone(o, at, 0.2, 466, 440, 0.05, "square");
    }
  },
  /** A little rising twinkle (a wish, a wink). */
  twinkle(): void {
    const o = open();
    if (!o) return;
    [1568, 2093, 2637, 3136].forEach((f, i) => tone(o, i * 0.07, 0.4, f, f, 0.04));
  },
  /** Carl the fly going past. */
  buzz(): void {
    const o = open();
    if (!o) return;
    const { ctx, out } = o;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 210;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 9;
    const depth = ctx.createGain();
    depth.gain.value = 25;
    lfo.connect(depth).connect(osc.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, o.t);
    g.gain.linearRampToValueAtTime(0.04, o.t + 0.5);
    g.gain.linearRampToValueAtTime(0.0008, o.t + 1.6);
    osc.connect(g).connect(out);
    for (const n of [osc, lfo]) {
      n.start(o.t);
      n.stop(o.t + 1.7);
    }
  },
  /** THE CHEZ going by: an electric motor's quiet whirr, rising and falling over `seconds`. */
  whirr(seconds = 10): void {
    const o = open();
    if (!o) return;
    const { ctx, out } = o;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, o.t);
    g.gain.linearRampToValueAtTime(0.025, o.t + seconds * 0.45);
    g.gain.linearRampToValueAtTime(0, o.t + seconds);
    g.connect(out);
    for (const [f, type, level] of [
      [330, "sine", 1],
      [990, "triangle", 0.25],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(f * 0.97, o.t);
      osc.frequency.linearRampToValueAtTime(f * 1.03, o.t + seconds * 0.45);
      osc.frequency.linearRampToValueAtTime(f * 0.94, o.t + seconds);
      const v = ctx.createGain();
      v.gain.value = level;
      osc.connect(v).connect(g);
      osc.start(o.t);
      osc.stop(o.t + seconds + 0.05);
    }
  },
  /** A curtain swished along its rod. */
  swish(): void {
    const o = open();
    if (!o) return;
    noise(o, 0, 0.45, 900, 0.12, 0.7, 3000);
  },
  /** A thump of bass from the speaker. */
  thump(): void {
    const o = open();
    if (!o) return;
    tone(o, 0, 0.35, 120, 45, 0.4);
  },
  /** Degauss: a thunk, then the coil's hum dying away. */
  degauss(): void {
    const o = open();
    if (!o) return;
    tone(o, 0, 0.1, 180, 60, 0.3);
    tone(o, 0.02, 1.1, 60, 60, 0.12, "square");
    tone(o, 0.02, 1.1, 120, 118, 0.05, "sawtooth");
  },
};
