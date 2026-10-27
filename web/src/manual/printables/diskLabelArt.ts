// A game's 3.5" disk label drawn to print: the desk's printed label (desk/disks/diskLabel.ts) on
// the front, the company band, the title in the box's colors over a strip of the game with its
// main character (its sticker sheet's hero, else its first level's), the small print (with the
// Bard of Bizarre's logo on his games' labels, its white ground taken out), and a strip that folds
// over the disk's top edge with the title and disk number, upside down so it reads on the back. Drawn on a canvas in hundredths of an inch, so it
// prints sharp at any dpi; the game's own pixels are enlarged without smoothing. The bleed carries
// each band's own background color past the cut, never the picture.
import type { CatalogEntry } from '../../project/files';
import { splitTitle } from '../../project/gameTitle';
import { mapShot } from '../../gfx/gameShots';
import { bandInk, logoText } from '../../desk/disks/diskLabel';
import { isBizarreGame } from '../../project/bizarre';
import { gameHero } from './hintCoverArt';
import { DISK_LABEL } from './labelSheets';

/** Hundredths of an inch. */
const U = 100;
const LW = DISK_LABEL.w * U;
const LH = DISK_LABEL.h * U;
const BACK = DISK_LABEL.back * U;
const FRONT = (DISK_LABEL.back + DISK_LABEL.edge) * U;
/** Inside the safe lines: 1/8 in from the cut, with a little air. */
const PAD = 18;

export interface DiskLabelArt {
  shot?: HTMLCanvasElement;
  /** The main character, cropped to his pixels. */
  hero?: HTMLImageElement;
  /** The Bard of Bizarre's logo on a clear ground, for his games. */
  logo?: HTMLCanvasElement;
}

/** The Bard of Bizarre's logo (the BBS's BARDLOGO.GIF, made with DeepAI), as served with the site. */
const BARD_LOGO = './bbs/BARDLOGO.GIF';
let bardLogo: Promise<HTMLCanvasElement | undefined> | undefined;

/**
 * The logo with its white ground taken out: the near-white pixels joined to the picture's edge
 * go clear (the rooster's white feathers are inside his black outline, so they stay), the light
 * edge pixels beside them fade with how light they are, and it is cropped to what is left.
 */
function logoClear(): Promise<HTMLCanvasElement | undefined> {
  bardLogo ??= (async () => {
    const img = new Image();
    img.src = BARD_LOGO;
    await img.decode();
    const [w, h] = [img.naturalWidth, img.naturalHeight];
    const c = document.createElement('canvas');
    [c.width, c.height] = [w, h];
    const g = c.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(img, 0, 0);
    const data = g.getImageData(0, 0, w, h);
    const px = data.data;
    const light = (i: number) => Math.min(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
    const ground = new Uint8Array(w * h);
    const todo: number[] = [];
    for (let x = 0; x < w; x++) todo.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) todo.push(y * w, y * w + w - 1);
    while (todo.length) {
      const i = todo.pop()!;
      if (ground[i] || light(i) < 232) continue;
      ground[i] = 1;
      const x = i % w;
      if (x > 0) todo.push(i - 1);
      if (x < w - 1) todo.push(i + 1);
      if (i >= w) todo.push(i - w);
      if (i < w * (h - 1)) todo.push(i + w);
    }
    let [x0, y0, x1, y1] = [w, h, -1, -1];
    for (let i = 0; i < w * h; i++) {
      const x = i % w;
      const y = (i - x) / w;
      if (ground[i]) px[i * 4 + 3] = 0;
      else {
        const edge = (x > 0 && ground[i - 1]) || (x < w - 1 && ground[i + 1]) || (y > 0 && ground[i - w]) || (y < h - 1 && ground[i + w]);
        if (edge) px[i * 4 + 3] = Math.round(255 * Math.min(1, (255 - light(i)) / 90));
        if (px[i * 4 + 3]) ((x0 = Math.min(x0, x)), (y0 = Math.min(y0, y)), (x1 = Math.max(x1, x)), (y1 = Math.max(y1, y)));
      }
    }
    if (x1 < 0) return undefined;
    g.putImageData(data, 0, 0);
    const out = document.createElement('canvas');
    [out.width, out.height] = [x1 - x0 + 1, y1 - y0 + 1];
    out.getContext('2d')!.drawImage(c, -x0, -y0);
    return out;
  })().catch(() => undefined);
  return bardLogo;
}

/** The pictures on a game's label: the strip of its first box shot and its hero, as the desk's label has. */
export async function diskLabelArt(g: CatalogEntry): Promise<DiskLabelArt> {
  const shot = g.original?.box?.shots?.[0];
  const [pic, face, logo] = await Promise.all([
    shot ? mapShot(g, shot[0], shot[1] + 2, shot[2] + 3, 12, 4).catch(() => undefined) : undefined,
    gameHero(g),
    isBizarreGame(g) ? logoClear() : undefined,
  ]);
  let img: HTMLImageElement | undefined;
  if (face) {
    img = new Image();
    img.src = face.src;
    await img.decode().catch(() => (img = undefined));
  }
  return { shot: pic ?? undefined, hero: img, logo };
}

/** A #rrggbb color at alpha `a` (any other color as it is). */
function withAlpha(color: string, a: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = parseInt(m[1], 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

const ARIAL = (px: number, weight = 700) => `${weight} ${px}px Arial, Helvetica, sans-serif`;
const TITLE = (px: number) => `italic 900 ${px}px 'Arial Black', Impact, sans-serif`;

/** Lines of `text` that fit `width` at the font set, broken between words. */
function lines(g: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (line && g.measureText(test).width > width) (out.push(line), (line = word));
    else line = test;
  }
  if (line) out.push(line);
  return out;
}

/**
 * One label with its top left at the canvas's origin, in hundredths of an inch (scale the
 * canvas first). `disk` is "Disk 1" in a set, empty for a one-disk game; `of` is how many.
 * `bleed` (hundredths) is how far the backgrounds run past the cut.
 */
export function paintDiskLabel(g: CanvasRenderingContext2D, entry: CatalogEntry, art: DiskLabelArt, disk: number, of: number, bleed: number): void {
  const l = entry.original?.label;
  const box = entry.original?.box;
  const lbg = l?.background ?? '#fff';
  const band = l?.band ?? '#c62828';
  const ink = l?.ink ?? '#111';
  const bbg = box?.background ?? band;
  const acc = box?.accent ?? '#ffd400';
  const bink = box?.ink ?? '#fff';
  const [main, sub] = splitTitle(entry.title);
  const tag = of > 1 ? `Disk ${disk}` : '';
  const b = bleed;
  g.save();
  // the label's own outline, grown by the bleed: nothing is drawn past it
  g.beginPath();
  g.roundRect(-b, -b, LW + 2 * b, LH + 2 * b, b ? 0 : DISK_LABEL.corner * U);
  g.clip();

  // the back strip and the edge: the box's color, the bleed above and beside it
  g.fillStyle = bbg;
  g.fillRect(-b, -b, LW + 2 * b, FRONT + b);
  // the front: the label paper under everything, the bleed below and beside it
  g.fillStyle = lbg;
  g.fillRect(-b, FRONT, LW + 2 * b, LH - FRONT + b);
  // the company band
  const bandH = 32;
  g.fillStyle = band;
  g.fillRect(-b, FRONT, LW + 2 * b, bandH);
  g.fillStyle = bandInk(band);
  g.font = ARIAL(12, 900);
  g.letterSpacing = '2.2px';
  g.textBaseline = 'alphabetic';
  g.fillText(logoText(entry), PAD, FRONT + bandH - 9);
  g.letterSpacing = '0px';

  // the banner: the box's color, a strip of the game fading in behind the title, the hero in front
  const top = FRONT + bandH + 3;
  const bottom = LH - 56;
  const bh = bottom - top;
  g.fillStyle = bbg;
  g.fillRect(-b, top, LW + 2 * b, bh);
  if (art.shot) {
    const s = Math.max(LW / art.shot.width, bh / art.shot.height);
    const w = art.shot.width * s;
    const hh = art.shot.height * s;
    g.save();
    g.beginPath();
    g.rect(0, top, LW, bh);
    g.clip();
    g.imageSmoothingEnabled = false;
    g.drawImage(art.shot, (LW - w) / 2, top + (bh - hh) / 2, w, hh);
    g.restore();
    const fade = g.createLinearGradient(0, 0, LW, 0);
    fade.addColorStop(0, bbg);
    fade.addColorStop(0.42, bbg);
    fade.addColorStop(0.75, withAlpha(bbg, 0.3));
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = fade;
    g.fillRect(0, top, LW, bh);
  }
  // the Bard's logo in the bottom right corner, over the banner's foot, inside the safe line
  const logoH = 80;
  const logoW = art.logo ? (art.logo.width / art.logo.height) * logoH : 0;
  const right = LW - PAD - (art.logo ? logoW + 4 : 0);
  // the hero standing on the banner's foot, each of his pixels a whole 1/150 in, as tall as fits
  let heroLeft = right;
  if (art.hero) {
    // under the disk number's tab, and no wider than 3/4 in, so the title keeps its room
    const tall = bh - (tag ? 26 : 10);
    const unit = Math.max(1, Math.min(Math.floor((tall * 1.5) / art.hero.height), Math.floor((75 * 1.5) / art.hero.width))) / 1.5;
    const w = art.hero.width * unit;
    const hh = art.hero.height * unit;
    heroLeft = right - w;
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(art.hero, heroLeft, bottom - hh, w, hh);
    g.restore();
  }
  if (art.logo) {
    g.save();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(art.logo, LW - PAD - logoW, LH - 13 - logoH, logoW, logoH);
    g.restore();
  }
  // the title, wrapped and as big as fits beside the hero
  // under the disk number's tab, which sits in the banner's top right
  const clear = tag ? 20 : 0;
  const textW = Math.min(LW * 0.66, heroLeft - 4) - PAD;
  let px = main.length > 14 ? 22 : 29;
  let rows: string[] = [];
  for (; px > 12; px -= 1) {
    g.font = TITLE(px);
    rows = lines(g, main, textW);
    const subH = sub ? 18 : 0;
    if (rows.length * px * 0.95 + subH <= bh - 16 - clear && rows.every((r) => g.measureText(r).width <= textW)) break;
  }
  const subH = sub ? 18 : 0;
  let y = top + clear + (bh - clear - (rows.length * px * 0.95 + subH)) / 2 + px * 0.78;
  g.fillStyle = acc;
  g.lineJoin = 'round';
  g.strokeStyle = 'rgba(0,0,0,0.75)';
  g.lineWidth = px * 0.08;
  for (const r of rows) {
    g.strokeText(r, PAD + 0.6, y + 0.6);
    g.fillText(r, PAD, y);
    y += px * 0.95;
  }
  if (sub) {
    g.font = ARIAL(12, 700);
    g.letterSpacing = '0.8px';
    g.fillStyle = bink;
    g.fillText(sub.toUpperCase(), PAD, y - px * 0.95 + 16, textW);
    g.letterSpacing = '0px';
  }
  if (tag) {
    g.font = ARIAL(12, 700);
    const tw = g.measureText(tag).width;
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.beginPath();
    g.roundRect(LW - PAD - tw - 8, top + 5, tw + 8, 17, 2);
    g.fill();
    g.fillStyle = acc;
    g.fillText(tag, LW - PAD - tw - 4, top + 18);
  }
  // the small print
  g.fillStyle = ink;
  g.font = ARIAL(14, 400);
  const printW = LW - 2 * PAD - (art.logo ? logoW + 6 : 0);
  g.fillText(`Shareware${entry.price ? ` · ${entry.price} Registration` : ''}`, PAD, LH - 36, printW);
  g.fillText(`© ${entry.year ?? 1995} ${entry.company ?? 'Sandbox Software'}`, PAD, LH - 20, printW);

  // the back strip, upside down so it reads once folded over the top edge
  g.save();
  g.translate(LW / 2, BACK / 2);
  g.rotate(Math.PI);
  g.textAlign = 'center';
  g.font = TITLE(17);
  g.fillStyle = acc;
  g.lineWidth = 1.4;
  g.strokeStyle = 'rgba(0,0,0,0.75)';
  const back = entry.title.toUpperCase();
  g.strokeText(back, 0, 2, LW - 2 * PAD);
  g.fillText(back, 0, 2, LW - 2 * PAD);
  g.font = ARIAL(10, 700);
  g.fillStyle = bink;
  g.letterSpacing = '0.8px';
  g.fillText([tag && `${tag.toUpperCase()} OF ${of}`, logoText(entry), 'SHAREWARE'].filter(Boolean).join(' · '), 0, 16, LW - 2 * PAD);
  g.restore();
  g.restore();
}
