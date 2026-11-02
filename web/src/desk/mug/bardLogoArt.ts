// The mug picture of The Bard of Bizarre's logo (public/bbs/BARDLOGO.GIF, made with DeepAI): the
// real picture, its white page taken away (from the edges in, so the white inside its lettering
// stays) and cropped to the logo, centered in the badges' size.
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { paletteToRGBA } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { BADGE_H, BADGE_W } from './gameBadge';

const isWhite = (c: number) => (c & 255) >= 248 && ((c >>> 8) & 255) >= 248 && ((c >>> 16) & 255) >= 248;

/** The logo, BADGE_W x BADGE_H, or undefined if the picture can't be had. */
export async function bardLogoArt(): Promise<HTMLCanvasElement | undefined> {
  const res = await fetch('./bbs/BARDLOGO.GIF');
  if (!res.ok) return undefined;
  const img = decodeGif(new Uint8Array(await res.arrayBuffer()));
  const { width: w, height: h } = img;
  const lut = paletteToRGBA(img.palette);
  const px = new Uint32Array(w * h);
  for (let i = 0; i < px.length; i++) px[i] = lut[img.pixels[i]];
  // the white page: white reached from the picture's edges
  const page = new Uint8Array(w * h);
  const todo: number[] = [];
  const seed = (i: number) => {
    if (!page[i] && isWhite(px[i])) ((page[i] = 1), todo.push(i));
  };
  for (let x = 0; x < w; x++) (seed(x), seed((h - 1) * w + x));
  for (let y = 0; y < h; y++) (seed(y * w), seed(y * w + w - 1));
  for (let i = todo.pop(); i !== undefined; i = todo.pop()) {
    const x = i % w;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (i >= w) seed(i - w);
    if (i < w * (h - 1)) seed(i + w);
  }
  let x0 = w,
    y0 = h,
    x1 = 0,
    y1 = 0;
  for (let i = 0; i < px.length; i++) {
    if (page[i]) continue;
    const x = i % w,
      y = (i / w) | 0;
    ((x0 = Math.min(x0, x)), (x1 = Math.max(x1, x + 1)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y + 1)));
  }
  if (x1 <= x0) return undefined;
  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  const sg = src.getContext('2d')!;
  const data = sg.createImageData(w, h);
  const out = new Uint32Array(data.data.buffer);
  for (let i = 0; i < px.length; i++) out[i] = page[i] ? 0 : px[i];
  sg.putImageData(data, 0, 0);
  const c = document.createElement('canvas');
  c.width = BADGE_W;
  c.height = BADGE_H;
  const g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  const k = Math.min((BADGE_W - 8) / (x1 - x0), (BADGE_H - 8) / (y1 - y0));
  const dw = (x1 - x0) * k,
    dh = (y1 - y0) * k;
  g.drawImage(src, x0, y0, x1 - x0, y1 - y0, (BADGE_W - dw) / 2, (BADGE_H - dh) / 2, dw, dh);
  return c;
}
