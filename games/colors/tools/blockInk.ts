// Foreground coverage for the color lesson's block checks.
export function hasInk(pixel: number, sky: number): boolean {
  return pixel !== sky && pixel !== 255;
}

/** The share of cells where exactly one of the two blocks has ink. */
export function shapeDifference(pa: Uint8Array, pb: Uint8Array, sky: number): number {
  let diff = 0;
  for (let i = 0; i < pa.length; i++) if (hasInk(pa[i], sky) !== hasInk(pb[i], sky)) diff++;
  return diff / pa.length;
}
