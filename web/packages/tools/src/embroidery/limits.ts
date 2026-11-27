// Bounds on generated rows and needle points, including intermediate paths.
export const MAX_ROWS = 50_000;
const MAX_STITCHES = 100_000;

export function checkStitches(count: number): void {
  if (count > MAX_STITCHES) throw new RangeError('Embroidery stitch limit exceeded');
}
