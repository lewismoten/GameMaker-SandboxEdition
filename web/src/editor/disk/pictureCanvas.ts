// An indexed picture (palette indices and its palette) drawn on a canvas of its own pixels, to be scaled by CSS.
import { vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { LevelPicture } from '../../gfx/levelPicture';

export function pictureCanvas(p: LevelPicture): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = p.width;
  c.height = p.height;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(p.width, p.height);
  for (let i = 0; i < p.pixels.length; i++) {
    const v = p.pixels[i] * 3;
    img.data.set([vga8(p.palette[v]), vga8(p.palette[v + 1]), vga8(p.palette[v + 2]), 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
