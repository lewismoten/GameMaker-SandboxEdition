// One volume for everything the PC plays (the desk speakers' knob): each AudioContext
// sends its sound through a gain node here instead of straight to its destination.
const KEY = "gm-volume";
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
  for (const [ctx, g] of outputs)
    g.gain.setTargetAtTime(volume, ctx.currentTime, 0.02);
  try {
    localStorage.setItem(KEY, String(volume));
  } catch {
    /* private mode */
  }
}

/** Where a context's sound should go: its destination, through the volume. */
export function output(ctx: BaseAudioContext): AudioNode {
  let g = outputs.get(ctx);
  if (!g) {
    g = ctx.createGain();
    g.gain.value = volume;
    g.connect(ctx.destination);
    outputs.set(ctx, g);
  }
  return g;
}
