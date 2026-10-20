// Pure helpers for the pictures editor.
import { TRANSPARENT } from '../../formats/blocks';

/** A block with nothing drawn on it: one flat color (background) or all transparent (sprites). */
export function isBlankBlock(pixels: Uint8Array, sprite: boolean): boolean {
  const first = pixels[0];
  if (sprite && first !== TRANSPARENT) return false;
  return pixels.every((v) => v === first);
}
