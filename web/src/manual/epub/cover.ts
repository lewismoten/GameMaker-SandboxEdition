// A book's cover picture: the printed cover (a Sheet, as the Library's cards draw it) drawn as
// a JPEG about 1200 pixels wide, its words as the picture's description.
import type { Sheet } from '../printables/kit';
import type { EpubBook } from './book';
import { rasterize } from './raster';

/** Laid out this wide in CSS pixels (unless the sheet names its own width), drawn 1200 pixels wide. */
const COVER_W = 600;
const DRAWN_W = 1200;

export async function coverPicture(sheet: Sheet | undefined, alt: string): Promise<EpubBook['cover']> {
  if (!sheet) return undefined;
  const width = Number(sheet.el.dataset.layout) || COVER_W;
  const r = await rasterize(sheet.el, { width, height: Math.round((width * sheet.h) / sheet.w), type: 'image/jpeg', scale: DRAWN_W / width });
  return r && { path: 'images/cover.jpg', type: r.type, data: r.data, alt };
}
