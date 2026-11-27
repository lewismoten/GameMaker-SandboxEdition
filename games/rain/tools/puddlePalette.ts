// Checks the palette change between the two puddle scenes.
export function assertDarkerPuddle(mild: Uint8Array, storm: Uint8Array, water: number): void {
  const offset = water * 3;
  const luminance = (pal: Uint8Array) => 0.2126 * pal[offset] + 0.7152 * pal[offset + 1] + 0.0722 * pal[offset + 2];
  if (!(luminance(storm) < luminance(mild))) throw new Error('storm puddle must be darker');
}
