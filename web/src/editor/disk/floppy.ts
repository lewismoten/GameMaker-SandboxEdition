// A 3.5" floppy disk drawn on a canvas, the disk-space tool's picture of a game: plastic in the
// game's own color, a metal shutter, the notches, and a paper label carrying the game's title
// picture with its hero standing on it and its name along the bottom. A render, not an icon.
import { vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

export interface FloppyArt {
  /** The plastic: 8-bit red, green, blue. */
  plastic: [number, number, number];
  title: string;
  /** The title picture (indexed pixels in its own palette), any size; drawn to cover the label. */
  picture?: { width: number; height: number; pixels: Uint8Array; palette: Uint8Array };
  /** The player's character block (indexed, 255 is clear) and the palette it is shown with. */
  hero?: { width: number; height: number; pixels: Uint8Array; palette: Uint8Array };
}

/** The disk's design size (3.50 x 3.66 inches, as on the real case), in canvas units. */
export const FLOPPY_W = 350;
export const FLOPPY_H = 366;

const shade = ([r, g, b]: number[], k: number): string => {
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

/** An indexed picture on a canvas of its own pixels, ready to scale (255 clear when `clear`). */
function indexed(p: { width: number; height: number; pixels: Uint8Array; palette: Uint8Array }, clear: boolean): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = p.width;
  c.height = p.height;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(p.width, p.height);
  for (let i = 0; i < p.pixels.length; i++) {
    const v = p.pixels[i];
    img.data.set([vga8(p.palette[v * 3]), vga8(p.palette[v * 3 + 1]), vga8(p.palette[v * 3 + 2]), clear && v === 255 ? 0 : 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

const rounded = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

/** Draws the disk into a canvas (its size is set from `width`, keeping the case's shape). */
export function drawFloppy(canvas: HTMLCanvasElement, art: FloppyArt, width = 175, ratio = 2): HTMLCanvasElement {
  const scale = (width * ratio) / FLOPPY_W;
  canvas.width = Math.round(FLOPPY_W * scale);
  canvas.height = Math.round(FLOPPY_H * scale);
  canvas.style.width = `${width}px`;
  canvas.style.aspectRatio = `${FLOPPY_W} / ${FLOPPY_H}`;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  const p = art.plastic;

  // the case: square except the rounded corners and the cut one at the top right
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.moveTo(10, 4);
  ctx.lineTo(FLOPPY_W - 34, 4);
  ctx.lineTo(FLOPPY_W - 4, 34);
  ctx.lineTo(FLOPPY_W - 4, FLOPPY_H - 12);
  ctx.arcTo(FLOPPY_W - 4, FLOPPY_H - 4, FLOPPY_W - 14, FLOPPY_H - 4, 8);
  ctx.lineTo(14, FLOPPY_H - 4);
  ctx.arcTo(4, FLOPPY_H - 4, 4, FLOPPY_H - 14, 8);
  ctx.lineTo(4, 14);
  ctx.arcTo(4, 4, 14, 4, 8);
  ctx.closePath();
  const body = ctx.createLinearGradient(0, 0, FLOPPY_W, FLOPPY_H);
  body.addColorStop(0, shade(p, 0.12));
  body.addColorStop(0.5, shade(p, 0));
  body.addColorStop(1, shade(p, -0.14));
  ctx.fillStyle = body;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 2;
  ctx.strokeStyle = shade(p, -0.4);
  ctx.stroke();

  // the molded recess around the shutter, and the two notches at the top
  ctx.strokeStyle = shade(p, -0.22);
  ctx.lineWidth = 2;
  rounded(ctx, 28, 12, FLOPPY_W - 82, 8, 4);
  ctx.stroke();
  for (const x of [20, FLOPPY_W - 56]) {
    ctx.fillStyle = shade(p, -0.78);
    rounded(ctx, x, 24, 16, 14, 2);
    ctx.fill();
  }

  // the metal shutter, with its window
  const sx = 96;
  const sw = 150;
  const metal = ctx.createLinearGradient(sx, 0, sx + sw, 0);
  metal.addColorStop(0, '#9ea3a8');
  metal.addColorStop(0.35, '#e4e7ea');
  metal.addColorStop(0.7, '#b7bcc1');
  metal.addColorStop(1, '#8e9398');
  ctx.fillStyle = metal;
  ctx.strokeStyle = '#555a5f';
  ctx.lineWidth = 1.5;
  rounded(ctx, sx, 4, sw, 112, [0, 0, 8, 8]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = shade(p, -0.8);
  rounded(ctx, sx + 84, 12, 44, 80, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)';
  ctx.stroke();

  // the label: paper with the title picture covering it
  const lx = 40;
  const ly = 148;
  const lw = FLOPPY_W - 80;
  const lh = 188;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.3)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#f4f1e8';
  rounded(ctx, lx, ly, lw, lh, 5);
  ctx.fill();
  ctx.restore();
  ctx.save();
  rounded(ctx, lx + 6, ly + 6, lw - 12, lh - 12, 3);
  ctx.clip();
  const iw = lw - 12;
  const ih = lh - 12;
  if (art.picture) {
    const pic = indexed(art.picture, false);
    const k = Math.max(iw / pic.width, ih / pic.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pic, lx + 6 + (iw - pic.width * k) / 2, ly + 6 + (ih - pic.height * k) / 2, pic.width * k, pic.height * k);
  } else {
    ctx.fillStyle = shade(p, 0.55);
    ctx.fillRect(lx + 6, ly + 6, iw, ih);
  }
  const band = 46;
  ctx.fillStyle = 'rgba(8,8,16,.72)';
  ctx.fillRect(lx + 6, ly + 6 + ih - band, iw, band);
  if (art.hero) {
    const hero = indexed(art.hero, true);
    const k = Math.max(1, Math.floor(Math.min(104 / hero.height, 3)));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(hero, lx + 14, ly + 6 + ih - band - hero.height * k + 4, hero.width * k, hero.height * k);
  }
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  let size = 26;
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  while (ctx.measureText(art.title).width > iw - 16 && size > 11) ctx.font = `bold ${--size}px system-ui, sans-serif`;
  ctx.fillText(art.title, lx + 6 + iw / 2, ly + 6 + ih - band / 2 + 1);
  ctx.restore();
  return canvas;
}
