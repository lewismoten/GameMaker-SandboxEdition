// The Windows program's icon: the same picture as the Mac app's (macIcon.ts: a rounded tile
// with a little 4:3 screen showing the game), cropped a little closer, at the sizes Windows
// shows (16 to 48 pixels for title bars, the taskbar and the Explorer's lists, 256 for big
// icons). The small ones are 32-bit bitmaps, the 64 and 256 ones PNGs, as Windows' own icons are.
//
// The images go into the program as RT_ICON resources with an RT_GROUP_ICON directory
// (winApp.ts), or into an .ico file; both start with the same 6-byte header and differ only
// in each entry's last field (the resource id, or the image's offset in the file).
import { drawIcon, encodeRgbaPng, concat, type IconColors } from './macIcon';
import type { IndexedImage } from '../formats/gif';

export const ICON_SIZES = [16, 24, 32, 48, 64, 256];

export interface IconImage {
  size: number;
  /** A PNG, or a BITMAPINFOHEADER and its pixels (as in an .ico file). */
  data: Uint8Array;
}

/**
 * A square part of an RGBA image (`from` pixels wide, from `left`/`top`, `span` pixels
 * across) shrunk to `to` pixels, each pixel the area average of what it covers (weighted
 * by alpha, so edges do not darken).
 */
export function shrink(rgba: Uint8Array, from: number, left: number, top: number, span: number, to: number): Uint8Array {
  const out = new Uint8Array(to * to * 4);
  const step = span / to;
  for (let y = 0; y < to; y++) {
    const y0 = top + y * step;
    const y1 = y0 + step;
    for (let x = 0; x < to; x++) {
      const x0 = left + x * step;
      const x1 = x0 + step;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let area = 0;
      for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) {
        const wy = Math.min(y1, sy + 1) - Math.max(y0, sy);
        for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
          const w = wy * (Math.min(x1, sx + 1) - Math.max(x0, sx));
          area += w;
          if (sx < 0 || sy < 0 || sx >= from || sy >= from) continue;
          const i = (sy * from + sx) * 4;
          const wa = w * rgba[i + 3];
          r += rgba[i] * wa;
          g += rgba[i + 1] * wa;
          b += rgba[i + 2] * wa;
          a += wa;
        }
      }
      const o = (y * to + x) * 4;
      if (a) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
      out[o + 3] = Math.round(a / area);
    }
  }
  return out;
}

/** An icon bitmap: BITMAPINFOHEADER (height doubled for the mask), BGRA rows bottom up, then the 1-bit AND mask. */
export function iconBitmap(rgba: Uint8Array, size: number): Uint8Array {
  const maskStride = Math.ceil(size / 32) * 4;
  const out = new Uint8Array(40 + size * size * 4 + maskStride * size);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 40, true);
  dv.setInt32(4, size, true);
  dv.setInt32(8, size * 2, true);
  dv.setUint16(12, 1, true); // planes
  dv.setUint16(14, 32, true); // bits a pixel
  dv.setUint32(20, size * size * 4 + maskStride * size, true); // image size
  for (let y = 0; y < size; y++) {
    const row = size - 1 - y;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const o = 40 + (row * size + x) * 4;
      out[o] = rgba[i + 2];
      out[o + 1] = rgba[i + 1];
      out[o + 2] = rgba[i];
      out[o + 3] = rgba[i + 3];
      // the mask: set where fully transparent (only used by very old Windows)
      if (rgba[i + 3] === 0) out[40 + size * size * 4 + row * maskStride + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return out;
}

/** The icon's images, smallest first. */
export async function winIconImages(picture: IndexedImage | undefined, colors?: IconColors): Promise<IconImage[]> {
  const big = drawIcon(picture, colors);
  // the Mac tile leaves room around it for its shadow; Windows icons fill more of the square
  const [left, top, span] = [56, 56, 912];
  return Promise.all(
    ICON_SIZES.map(async (size) => {
      const rgba = shrink(big, 1024, left, top, span, size);
      return { size, data: size >= 64 ? await encodeRgbaPng(rgba, size, size) : iconBitmap(rgba, size) };
    }),
  );
}

/** The 6-byte header and 16 (file) or 14 (resource) byte entries of an icon directory. */
function iconDirectory(images: IconImage[], last: (i: number) => [value: number, bytes: 2 | 4]): Uint8Array {
  const entry = last(0)[1] === 4 ? 16 : 14;
  const out = new Uint8Array(6 + images.length * entry);
  const dv = new DataView(out.buffer);
  dv.setUint16(2, 1, true); // icons
  dv.setUint16(4, images.length, true);
  images.forEach((img, i) => {
    const o = 6 + i * entry;
    out[o] = img.size >= 256 ? 0 : img.size;
    out[o + 1] = img.size >= 256 ? 0 : img.size;
    dv.setUint16(o + 4, 1, true); // planes
    dv.setUint16(o + 6, 32, true); // bits a pixel
    dv.setUint32(o + 8, img.data.length, true);
    const [value, bytes] = last(i);
    if (bytes === 4) dv.setUint32(o + 12, value, true);
    else dv.setUint16(o + 12, value, true);
  });
  return out;
}

/** An .ico file of the images. */
export function icoFile(images: IconImage[]): Uint8Array {
  let at = 6 + images.length * 16;
  const offsets = images.map((img) => ((at += img.data.length), at - img.data.length));
  return concat([iconDirectory(images, (i) => [offsets[i], 4]), ...images.map((img) => img.data)]);
}

/** The RT_GROUP_ICON resource for the images, stored as RT_ICON resources firstId, firstId + 1, … */
export function groupIcon(images: IconImage[], firstId = 1): Uint8Array {
  return iconDirectory(images, (i) => [firstId + i, 2]);
}
