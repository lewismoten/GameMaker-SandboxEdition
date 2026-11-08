// What THE CHEZ's two voices share: the motor's controls, its options and the numbers measured
// from Lewis's recording (.for-lewis/research/chez-sound/analysis.md has the details).

export interface ChezOptions {
  /** Peak level, 0..1 (default 0.05: under voices and music). */
  level?: number;
  /** Heard from outside, through a window: duller and with no road rumble up close. */
  outside?: boolean;
}

export interface ChezMotor {
  /** Starts it moving: the contactors clunk and the motor climbs to cruise. Nothing if it is already going. */
  go(): void;
  /** Lets it stop: the contactor lets go and the motor winds down. Nothing if it isn't going. */
  stop(): void;
  /** Already at cruise, driving past for `seconds`, then it frees itself. */
  passBy(seconds: number): void;
  /** Silences it at once and frees every node. */
  dispose(): void;
  /** Between go() and stop(). */
  readonly moving: boolean;
}

/** The motor's fundamental at full speed (Hz): about 245 at cruise, 262 at the top of the climb. */
export const CRUISE_HZ = 245;
export const DEFAULT_LEVEL = 0.05;
/** A pass-by's Doppler shift, each way: about 25 mph is ±3%. */
export const DOPPLER = 0.032;

/** The gain curve of something driving past: near silence, a peak in the middle, near silence. */
export function passCurve(points = 33): Float32Array {
  const c = new Float32Array(points);
  for (let i = 0; i < points; i++) {
    const d = (i / (points - 1)) * 2 - 1; // -1 .. 1, 0 when in front of the window
    c[i] = 1 / (1 + 12 * d * d) - (1 / 13) * Math.abs(d);
  }
  return c;
}

/** One second of white noise for `ctx`, made once. */
const noises = new WeakMap<BaseAudioContext, AudioBuffer>();
export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let b = noises.get(ctx);
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noises.set(ctx, b);
  }
  return b;
}

/** The output chain: a gain (the level) and, from outside, a window's lowpass. The first node is its input. */
export function bus(ctx: BaseAudioContext, out: AudioNode, opts: ChezOptions): [GainNode, ...AudioNode[]] {
  const g = ctx.createGain();
  g.gain.value = opts.level ?? DEFAULT_LEVEL;
  if (!opts.outside) {
    g.connect(out);
    return [g];
  }
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  g.connect(lp).connect(out);
  return [g, lp];
}
