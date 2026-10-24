// The PC's own line into the speakers: everything the desk PC itself plays (the BIOS beep,
// the modem and the phone line, the BBS's sounds) goes through one gain here on its way to
// the volume knob (audio/output.ts), so the power switch can cut it all in an instant, the
// way switching off a real PC does. (A game's own sound engine is stopped with the game.)
import { output } from '../../audio/output';

let line: { ctx: BaseAudioContext; gain: GainNode } | undefined;

/** Where the PC's sounds go (a fresh line after each power-off). */
export function pcOutput(ctx: BaseAudioContext): AudioNode {
  if (!line || line.ctx !== ctx) {
    const gain = ctx.createGain();
    gain.connect(output(ctx));
    line = { ctx, gain };
  }
  return line.gain;
}

/** Power off: whatever the PC was playing is cut off now (and left to be collected). */
export function cutPcSound(): void {
  if (!line) return;
  line.gain.gain.setValueAtTime(0, line.ctx.currentTime);
  line.gain.disconnect();
  line = undefined;
}
