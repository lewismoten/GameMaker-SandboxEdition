// The fade to black an intro ends on before its title picture. PLAYGAME cuts from an FLI's
// last frame straight to black and fades the next GIF in from there, so an intro that stops on
// a lit frame snaps off. These add a short fade: the last picture held while its palette
// dims, frames that store only a COLOR chunk (the pixels do not change), so it costs little.
// Reel cartoons have Reel.fadeOut; these are for intros built as plain frame lists.
import { encodeFli } from '../../web/src/formats/fli';
import { dimmed } from './reel';

/** Frames in a fade at `speed` (1/70 s per frame): about `seconds` long, and at least 4. */
export function fadeOutLength(speed: number, seconds = 0.5): number {
  return Math.max(4, Math.round((seconds * 70) / Math.max(1, speed)));
}

type FliOpts = NonNullable<Parameters<typeof encodeFli>[2]>;

/**
 * encodeFli with a fade to black after the last frame: `fade` palette-only frames (by default
 * about half a second at the FLI's speed). `palettes`, when given, is a palette per frame.
 */
export function encodeFliFadeOut(frames: Uint8Array[], palette: Uint8Array, opts: FliOpts & { fade?: number } = {}): Uint8Array {
  const { fade, ...rest } = opts;
  const n = fade ?? fadeOutLength(opts.speed ?? 5);
  const pals = frames.map((_, i) => opts.palettes?.[i] ?? palette);
  const last = frames[frames.length - 1];
  const lit = pals[pals.length - 1];
  const tail = Array.from({ length: n }, (_, k) => dimmed(lit, (n - 1 - k) / n));
  return encodeFli([...frames, ...tail.map(() => last)], palette, { ...rest, palettes: [...pals, ...tail] });
}
