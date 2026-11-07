// THE CHEZ's sound, everywhere it drives (the cast stage, the desk window): one place, so they
// all match. One voice, made on the spot (chezSynth.ts) and tuned to Lewis's own recording of the
// car (a 1976½ CitiCar); no recorded clips ship. CHEZ_SOUND names it.
import { SynthMotor } from './chezSynth';
import type { ChezMotor, ChezOptions } from './chezTypes';

export type { ChezMotor, ChezOptions } from './chezTypes';

/** The voice THE CHEZ uses everywhere: synthesized in Web Audio, no files. */
export const CHEZ_SOUND = 'synth' as const;

/**
 * THE CHEZ's motor into `out`: go() closes the contactors (clunks) and the motor climbs through its
 * three speed steps to cruise; stop() lets them go and it winds down. Silent until go().
 */
export function chezMotor(ctx: BaseAudioContext, out: AudioNode, opts: ChezOptions = {}, kind: 'synth' = CHEZ_SOUND): ChezMotor {
  return new SynthMotor(ctx, out, opts);
}

/**
 * THE CHEZ driving past at cruise for `seconds`: louder as it comes, its pitch dropping a little as
 * it passes (Doppler), then gone; it frees itself at the end.
 */
export function chezPassBy(ctx: BaseAudioContext, out: AudioNode, seconds: number, opts: ChezOptions = {}, kind: 'synth' = CHEZ_SOUND): ChezMotor {
  const m = chezMotor(ctx, out, opts, kind);
  m.passBy(seconds);
  return m;
}
