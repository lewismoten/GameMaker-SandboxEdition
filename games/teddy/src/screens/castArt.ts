// The cast's portraits are pixel art, stored the way the sprites are: rows of characters, one
// per pixel, each character a shade of one of the palette's named ramps ('.' is clear). They
// were drawn over the family's photos (the silhouettes and the light traced from them), then
// cleaned up by hand in the screens' palette: flat bands of shade, inked eyes and mouths.
import type { Pixels } from '../../../kit/pixels';

export interface Art {
  /** Where the top-left of `rows` goes on the 320x200 screen. */
  x: number;
  y: number;
  /** Character -> [ramp, shade]. */
  key: Record<string, [string, number]>;
  rows: string[];
}

/** Draws a piece of art (shifted by dx, dy), coloring through `c(ramp, shade)`. */
export function drawArt(p: Pixels, art: Art, c: (ramp: string, shade: number) => number, dx = 0, dy = 0): Pixels {
  const ink: Record<string, number> = {};
  for (const [ch, [ramp, k]] of Object.entries(art.key)) ink[ch] = c(ramp, k);
  art.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== '.') p.set(art.x + dx + x, art.y + dy + y, ink[row[x]]);
  });
  return p;
}
