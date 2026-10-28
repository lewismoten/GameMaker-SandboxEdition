// A book's cover picture: the printed cover (a Sheet, as the Library's cards draw it) drawn as
// a JPEG about 1200 pixels wide, its words as the picture's description.
import type { Sheet } from '../printables/kit';
import type { EpubBook } from './book';
import { rasterize } from './raster';

/** Laid out this wide in CSS pixels, then drawn at twice that. */
const COVER_W = 600;

export async function coverPicture(sheet: Sheet | undefined, alt: string): Promise<EpubBook['cover']> {
  if (!sheet) return undefined;
  const r = await rasterize(sheet.el, { width: COVER_W, height: Math.round((COVER_W * sheet.h) / sheet.w), type: 'image/jpeg' });
  return r && { path: 'images/cover.jpg', type: r.type, data: r.data, alt };
}
