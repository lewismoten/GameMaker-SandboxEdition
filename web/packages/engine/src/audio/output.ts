// One volume for everything the PC plays (the desk speakers' knob): each AudioContext
// sends its sound through a gain node here instead of straight to its destination.
const KEY = 'gm-volume';
const outputs = new Map<BaseAudioContext, GainNode>();

function load(): number {
  try {
    const v = Number(localStorage.getItem(KEY));
    return localStorage.getItem(KEY) !== null && v >= 0 && v <= 1 ? v : 1;
  } catch {
    return 1;
  }
}

let volume = load();

export const getVolume = (): number => volume;

/** 0 (silent) to 1 (full). */
export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  for (const [ctx, g] of outputs) g.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
  try {
    localStorage.setItem(KEY, String(volume));
  } catch {
    /* private mode */
  }
}

/** Each context's line out: its sound before the volume knob (what a recording takes). */
const lines = new Map<BaseAudioContext, GainNode>();

/** Where a context's sound should go: its destination, through the volume. */
export function output(ctx: BaseAudioContext): AudioNode {
  let line = lines.get(ctx);
  if (!line) {
    const g = ctx.createGain();
    g.gain.value = volume;
    g.connect(ctx.destination);
    outputs.set(ctx, g);
    line = ctx.createGain();
    line.connect(g);
    lines.set(ctx, line);
    for (const f of taps) f(ctx, line);
  }
  return line;
}

type Tap = (ctx: BaseAudioContext, node: AudioNode) => void;
const taps = new Set<Tap>();

/**
 * Calls `f` for every context's line out, now and as new ones appear (for recording the
 * sound). Like a capture card on the sound card's line out, a recording has the PC's sound
 * whatever the speakers' volume knob is set to, even turned all the way down.
 */
export function tapOutputs(f: Tap): () => void {
  for (const [ctx, line] of lines) f(ctx, line);
  taps.add(f);
  return () => taps.delete(f);
}
