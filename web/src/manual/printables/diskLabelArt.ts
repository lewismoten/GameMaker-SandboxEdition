// A game's 3.5" disk label drawn to print: the desk's printed label (desk/disks/diskLabel.ts) on
// the front, the company band, the title in the box's colors over a strip of the game with its
// hero, the small print, and a strip that folds over the disk's top edge with the title and disk
// number, upside down so it reads on the back. Drawn on a canvas in hundredths of an inch, so it
// prints sharp at any dpi; the game's own pixels are enlarged without smoothing. The bleed carries
// each band's own background color past the cut, never the picture.
import type { CatalogEntry } from '../../project/files';
import { splitTitle } from '../../project/gameTitle';
import { mapShot } from '../../gfx/gameShots';
import { bandInk, logoText } from '../../desk/disks/diskLabel';
import { portrait } from './kit';
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
  hero?: HTMLImageElement;
}

/** The pictures on a game's label: the strip of its first box shot and its hero, as the desk's label has. */
export async function diskLabelArt(g: CatalogEntry): Promise<DiskLabelArt> {
  const shot = g.original?.box?.shots?.[0];
  const hero =
    g.original?.printables?.stickers?.find((s) => s.hero)?.hero ??
    g.original?.printables?.items?.flatMap((i) => (i.kind === 'idcard' && i.portrait ? [i.portrait] : []))[0];
  const [pic, face] = await Promise.all([
    shot ? mapShot(g, shot[0], shot[1] + 2, shot[2] + 3, 12, 4).catch(() => undefined) : undefined,
    hero ? portrait(g, hero).catch(() => undefined) : undefined,
  ]);
  let img: HTMLImageElement | undefined;
  if (face) {
    img = new Image();
    img.src = face;
    await img.decode().catch(() => (img = undefined));
  }
  return { shot: pic ?? undefined, hero: img };
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
  if (art.hero) {
    const hh = bh * 0.92;
    const w = (art.hero.width / art.hero.height) * hh;
    g.save();
    g.imageSmoothingEnabled = false;
    g.drawImage(art.hero, LW - LW * 0.06 - w, bottom - hh, w, hh);
    g.restore();
  }
  // the title, wrapped and as big as fits beside the hero
  // under the disk number's tab, which sits in the banner's top right
  const clear = tag ? 20 : 0;
  const textW = LW * 0.66 - PAD;
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
  g.fillText(`Shareware${entry.price ? ` · ${entry.price} Registration` : ''}`, PAD, LH - 36, LW - 2 * PAD);
  g.fillText(`© ${entry.year ?? 1995} ${entry.company ?? 'Sandbox Software'}`, PAD, LH - 20, LW - 2 * PAD);

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
