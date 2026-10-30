// The game's version ("v1.1", from about.json) in the lower right of its menu picture, so players
// and walkthrough videos can tell which version they are watching. Disk.write() stamps it on the
// GIF the start scene names as its menu graphic, in the PC font with a dark outline, in the
// picture's own lightest and darkest colors. PLAYGAME draws nothing there: its menu words sit at
// x 80..240, y 104..168, and "Hit any key" (only over the menu when a game has no high score
// picture) ends at x 204.
import { decodeGif, encodeGif, isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outlined, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';

/** Where a game wants its version instead of the corner: the text's top-left, or false for none. */
export type MenuVersionSpot = { x?: number; y?: number } | false;

/** The version's top-left by default: right-aligned two pixels in from the edge, on the bottom row. */
const RIGHT = 318;
const TOP = 190;

/** A palette entry's brightness (6-bit VGA values, weighted as the eye sees them). */
const lum = (pal: Uint8Array, i: number) => 0.2126 * pal[i * 3] + 0.7152 * pal[i * 3 + 1] + 0.0722 * pal[i * 3 + 2];

/** Stamps "v<version>" on the menu picture among `files` (a disk's files, lower-case names). */
export function stampMenuVersion(files: Map<string, Uint8Array>, version: string, spot: MenuVersionSpot = {}): void {
  if (spot === false) return;
  const gam = [...files.keys()].find((n) => n.endsWith('.gam'));
  const menu = gam && parseGame(files.get(gam)!).scenes[0]?.files[2]?.toLowerCase();
  const bytes = menu ? files.get(menu) : undefined;
  if (!bytes || !isGif(bytes)) return;
  const img = decodeGif(bytes);
  const p = new Pixels(img.width, img.height);
  p.px.set(img.pixels);
  // the lightest and darkest colors the picture already uses
  const used = [...new Set(img.pixels)];
  const ink = used.reduce((a, b) => (lum(img.palette, b) > lum(img.palette, a) ? b : a));
  const edge = used.reduce((a, b) => (lum(img.palette, b) < lum(img.palette, a) ? b : a));
  if (lum(img.palette, ink) - lum(img.palette, edge) < 32) throw new Error(`${menu}: no light and dark colors to letter the version in`);
  const s = `v${version}`;
  outlined(p, spot.x ?? RIGHT - textWidth(s), spot.y ?? TOP, s, ink, edge);
  files.set(menu!, encodeGif({ ...img, pixels: p.px }));
}
