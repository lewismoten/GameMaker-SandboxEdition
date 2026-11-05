// "COURSE 101" in the lower left of a Starter's title picture, so a course number reads in the site's
// thumbnails (the Done or grade pill sits at the lower right there). Disk.write() stamps it on title.gif
// for a Starter that has a course number (web/src/project/ceremonies.ts courseNumber); a graduation or any
// other game gets nothing. Lettered in the picture's own lightest and darkest colors, in the PC font at 2x.
import { decodeGif, encodeGif, isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outlined } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { courseNumber } from '../../web/src/project/ceremonies';

/** A palette entry's brightness (6-bit VGA values, weighted as the eye sees them). */
const lum = (pal: Uint8Array, i: number) => 0.2126 * pal[i * 3] + 0.7152 * pal[i * 3 + 1] + 0.0722 * pal[i * 3 + 2];

/** Stamps the course number of game `id` on `files`' title.gif; nothing when the game has none. */
export function stampCourseNumber(files: Map<string, Uint8Array>, id: string): void {
  const n = courseNumber(id);
  const bytes = files.get('title.gif');
  if (n === undefined || !bytes || !isGif(bytes)) return;
  const img = decodeGif(bytes);
  const p = new Pixels(img.width, img.height);
  p.px.set(img.pixels);
  const used = [...new Set(img.pixels)];
  const ink = used.reduce((a, b) => (lum(img.palette, b) > lum(img.palette, a) ? b : a));
  const edge = used.reduce((a, b) => (lum(img.palette, b) < lum(img.palette, a) ? b : a));
  if (lum(img.palette, ink) - lum(img.palette, edge) < 32) throw new Error(`${id}: no light and dark colors to letter the course number in`);
  outlined(p, 8, 180, `COURSE ${n}`, ink, edge, 2);
  files.set('title.gif', encodeGif({ ...img, pixels: p.px }));
}
