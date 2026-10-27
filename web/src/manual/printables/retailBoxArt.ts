// A game's retail box laid out flat to print (retailBoxTemplate.ts), in two sheets as a two-piece
// box is made: the lid (the front cover on its face, the spines, top and bottom on its walls) and
// the bottom (the back cover on its face). The covers are the desk's own (desk/boxes/gameBox.ts),
// drawn at the print's resolution with no shelf wear or price sticker; the walls are lettered here
// to fit the box's 1 1/8 inch depth. Every panel's background runs on into the turn-ins, the tabs
// and the bleed (the background only: lettering stays inside the safe lines).
import type { CatalogEntry } from '../../project/files';
import { splitTitle } from '../../project/gameTitle';
import { gameDisks } from '../../project/diskFacts';
import { drawPrintFaces } from '../../desk/boxes/gameBox';
import { type Box, PPI, background, fit, SANS, TITLE_FONT } from '../../desk/boxes/boxPaint';
import { platformBadge, platformBadgeHeight } from '../../desk/boxes/boxSeals';
import { drawSandboxMark } from './sandboxMark';
import { boxDie, boxPanels, BOX, type Rect } from './retailBoxTemplate';
import { pixelSize } from './dieLines';

/** The desk draws a box 7.5 in wide; the template's face is 9.375: 1.25 times as big, so a desk pixel is 1/64 in. */
const UNIT = PPI / (BOX.face[0] / 7.5);
/** The face in desk units (7.5 x 9.5 desk inches). */
const FACE = { w: (BOX.face[0] * UNIT) / PPI, h: (BOX.face[1] * UNIT) / PPI };

export type BoxSheet = 'lid' | 'bottom';

const L = (r: Rect): Rect => r.map((v) => v * UNIT) as Rect;

/** The title along a spine, reading downward, as big as fits its length and the wall's depth. */
function spineTitle(g: CanvasRenderingContext2D, box: Box, main: string, sub: string, depth: number, y0: number, length: number): void {
  const across = depth - 18; // inside the safe lines, with a little air
  const subPx = sub
    ? Math.min(
        11,
        fit(g, sub, (p) => SANS(p, 900), length, 11),
      )
    : 0;
  const capRoom = across - (sub ? subPx * 0.8 + 6 : 0);
  let px = fit(g, main, TITLE_FONT, length, Math.floor(capRoom / 0.74));
  px = Math.min(px, Math.floor(capRoom / 0.74));
  const cap = px * 0.74;
  const block = cap + (sub ? 6 + subPx * 0.74 : 0);
  g.save();
  g.translate(depth / 2, y0 + length / 2);
  g.rotate(Math.PI / 2);
  g.textAlign = 'center';
  g.font = TITLE_FONT(px);
  g.lineJoin = 'round';
  g.lineWidth = px * 0.12;
  g.strokeStyle = '#000';
  g.fillStyle = box.accent;
  const y = -block / 2 + cap;
  g.strokeText(main, 0, y);
  g.fillText(main, 0, y);
  if (sub) {
    g.font = SANS(subPx, 900);
    g.fillStyle = box.ink;
    g.fillText(sub, 0, y + 6 + subPx * 0.74);
  }
  g.restore();
}

/** The platform badge cut down to a spine's width: MS-DOS on black, the disks under it. Returns its height. */
function spineBadge(g: CanvasRenderingContext2D, x: number, y: number, w: number, disks: number): number {
  const dos = fit(g, 'MS-DOS', (p) => `italic 900 ${p}px 'Arial Black', Impact, sans-serif`, w - 8, 15);
  const line = `${disks} DISK${disks === 1 ? '' : 'S'}`;
  const small = fit(g, line, (p) => SANS(p, 900), w - 8, 9);
  const h = dos + small + 12;
  g.save();
  g.fillStyle = '#0b0b0b';
  g.beginPath();
  g.roundRect(x, y, w, h, 4);
  g.fill();
  g.textAlign = 'center';
  g.fillStyle = '#fff';
  g.font = `italic 900 ${dos}px 'Arial Black', Impact, sans-serif`;
  g.fillText('MS-DOS', x + w / 2, y + 4 + dos * 0.86);
  g.fillStyle = '#f5d000';
  g.font = SANS(small, 900);
  g.fillText(line, x + w / 2, y + h - 5);
  g.restore();
  return h;
}

/** A long wall (a spine): the company band at the top, the title down it, the platform badge and a line at the foot. */
function spine(g: CanvasRenderingContext2D, entry: CatalogEntry, box: Box, [x, y, w, h]: Rect, foot: string): void {
  const [main, sub] = splitTitle(entry.title);
  g.save();
  g.translate(x, y);
  g.fillStyle = '#0b0b0b';
  g.fillRect(0, 0, w, 88);
  drawSandboxMark(g, w / 2 - 17, 12, 34);
  g.fillStyle = '#f5d000';
  g.textAlign = 'center';
  for (const [word, at] of [
    ['SANDBOX', 62],
    ['SOFTWARE', 76],
  ] as const) {
    g.font = SANS(
      fit(g, word, (p) => SANS(p, 900), w - 20, 12),
      900,
    );
    g.fillText(word, w / 2, at);
  }
  const disks = gameDisks(entry);
  const bw = w - 22;
  const bh = spineBadge(g, 11, h - 34 - 40, bw, disks);
  g.fillStyle = box.ink;
  g.textAlign = 'center';
  g.font = SANS(
    fit(g, foot, (p) => SANS(p, 700), w - 20, 11),
    700,
  );
  g.fillText(foot, w / 2, h - 16);
  spineTitle(g, box, main.toUpperCase(), sub.toUpperCase(), w, 100, h - 100 - 44 - Math.max(40, bh));
  g.restore();
}

/** A short wall (the top or the bottom end): the title, and a line under it; the bottom has the platform badge too. */
function end(g: CanvasRenderingContext2D, entry: CatalogEntry, box: Box, [x, y, w, h]: Rect, line: string, withBadge: boolean): void {
  g.save();
  g.translate(x, y);
  const disks = gameDisks(entry);
  let left = 14;
  if (withBadge) {
    // as wide as it can be while it stays inside the safe lines, top and bottom
    let fitW = 128;
    while (fitW > 40 && platformBadgeHeight(g, fitW, disks) > h - 24) fitW -= 2;
    platformBadge(g, 14, (h - platformBadgeHeight(g, fitW, disks)) / 2, fitW, disks);
    left = 14 + fitW + 12;
  }
  const mid = (left + w - 14) / 2;
  const room = w - 14 - left;
  const title = entry.title.toUpperCase();
  const px = fit(g, title, TITLE_FONT, room, 34);
  g.textAlign = 'center';
  g.font = TITLE_FONT(px);
  g.lineJoin = 'round';
  g.lineWidth = px * 0.12;
  g.strokeStyle = '#000';
  g.fillStyle = box.accent;
  g.strokeText(title, mid, 14 + px * 0.74);
  g.fillText(title, mid, 14 + px * 0.74);
  g.fillStyle = box.ink;
  g.font = SANS(
    fit(g, line, (p) => SANS(p, 700), room, 11),
    700,
  );
  g.fillText(line, mid, h - 13);
  g.restore();
}

/**
 * One sheet of the flat box at `dpi`: 13.25 x 15.75 in (retailBoxTemplate.ts). `faces` are
 * the desk's covers drawn for this dpi (printFaces), shared by the two sheets.
 */
export function paintBoxSheet(
  entry: CatalogEntry,
  which: BoxSheet,
  faces: { front: HTMLCanvasElement; back: HTMLCanvasElement },
  dpi: number,
): HTMLCanvasElement {
  const box = entry.original!.box as Box;
  const c = document.createElement('canvas');
  [c.width, c.height] = pixelSize(boxDie(), dpi); // the die cut's size exactly
  const g = c.getContext('2d')!;
  g.scale(dpi / UNIT, dpi / UNIT);
  // the box's background everywhere: the walls, turn-ins, tabs and bleed are all its color
  background(g, box, BOX.sheet[0] * UNIT, BOX.sheet[1] * UNIT);
  const p = boxPanels();
  const [fx, fy, fw, fh] = L(p.face);
  g.drawImage(which === 'lid' ? faces.front : faces.back, fx, fy, fw, fh);
  if (which === 'bottom') return c; // its walls are under the lid's: only the background shows
  const sb = entry.original?.sound === 'sb';
  const disks = gameDisks(entry);
  spine(g, entry, box, L(p.left), entry.price ? `MSRP ${entry.price}` : 'SHAREWARE');
  spine(g, entry, box, L(p.right), sb ? 'SOUND BLASTER' : 'PC SPEAKER');
  end(g, entry, box, L(p.top), (entry.company ?? 'Sandbox Software').toUpperCase(), false);
  end(g, entry, box, L(p.bottom), `VGA · ${sb ? 'SOUND BLASTER' : 'PC SPEAKER'} · 1 PLAYER · ${disks} DISK${disks === 1 ? '' : 'S'}`, true);
  return c;
}

/** The desk's front and back covers drawn for `dpi`, to fill the template's face. */
export async function printFaces(entry: CatalogEntry, dpi: number): Promise<{ front: HTMLCanvasElement; back: HTMLCanvasElement } | undefined> {
  return drawPrintFaces(entry, { w: FACE.w, h: FACE.h, scale: dpi / UNIT });
}
