// The Game-Maker: Sandbox Edition box laid out flat to print, on the same retail box layout as
// the games' (retailBoxTemplate.ts): the lid with the box's front (desk/boxes/gmBox.ts, drawn at
// the print's resolution with no store price sticker) and its spines and ends lettered for the
// 1 1/8 inch walls, the bottom with its back. The desk's box is the games' size (7.5 x 9.25 in),
// so it fits the template's face the same way: 1.25 times as big, the extra 1/4 inch of height
// going to the front's grid of screenshots and the back's space above the small print. The pink
// runs on into the turn-ins, tabs and bleed; the spines are black to their folds.
import { sandboxShots } from '../../gfx/sandboxShots';
import { GM_BOX_COLORS as C, logo, paintGmFaces } from '../../desk/boxes/gmBox';
import { pixelSize } from './dieLines';
import { boxDie, boxPanels, BOX, type Rect } from './retailBoxTemplate';
import { L, UNIT, type BoxSheet } from './retailBoxArt';

const SANS = (px: number, weight = 700, italic = false) => `${italic ? 'italic ' : ''}${weight} ${px}px Arial, Helvetica, sans-serif`;

/** Sets the biggest font up to `max` at which `text` fits `width`. */
function fitText(g: CanvasRenderingContext2D, text: string, font: (px: number) => string, width: number, max: number): void {
  let px = max;
  g.font = font(px);
  while (g.measureText(text).width > width && px > 6) g.font = font(--px);
}

/** A spine: black, RSD and this edition's SE mark at the top, the logo down it, the version on a red band at the foot. */
function spine(g: CanvasRenderingContext2D, [x, y, w, h]: Rect): void {
  g.save();
  g.translate(x, y);
  g.fillStyle = C.black;
  g.fillRect(0, 0, w, h);
  g.textAlign = 'center';
  g.fillStyle = '#fff';
  g.font = SANS(14, 900);
  g.fillText('RSD', w / 2, 34);
  g.fillStyle = C.navy;
  g.fillRect(w / 2 - 26, 44, 52, 26);
  g.strokeStyle = C.yellow;
  g.lineWidth = 2;
  g.strokeRect(w / 2 - 25, 45, 50, 24);
  g.fillStyle = C.yellow;
  g.font = SANS(17, 900);
  g.fillText('SE', w / 2, 64);
  g.fillStyle = C.red;
  g.fillRect(0, h - 118, w, 30);
  g.fillStyle = '#fff';
  fitText(g, 'VERSION 3.0', (p) => SANS(p, 700, true), w - 18, 12);
  g.fillText('VERSION 3.0', w / 2, h - 98);
  fitText(g, 'SANDBOX EDITION', (p) => SANS(p, 700), w - 18, 10);
  g.fillText('SANDBOX EDITION', w / 2, h - 60);
  // the logo down the spine, as big as the wall's depth allows inside the safe lines
  // turned a quarter, the letters rise toward the wall's right edge from their baseline, so the
  // baseline sits half a capital left of the middle
  const px = 40;
  g.translate(w / 2 - px * 0.37, 90 + (h - 90 - 130) / 2);
  g.rotate(Math.PI / 2);
  logo(g, 0, 0, h - 90 - 150, px, 'center');
  g.restore();
}

/** An end (the top or the bottom): pink, the logo on a black band. */
function end(g: CanvasRenderingContext2D, [x, y, w, h]: Rect, line: string): void {
  g.save();
  g.translate(x, y);
  g.fillStyle = C.black;
  g.fillRect(0, 10, w, h - 20);
  logo(g, w / 2, h - 26, w - 120, 36, 'center');
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  fitText(g, line, (p) => SANS(p, 700, true), w - 40, 10);
  g.fillText(line, w / 2, h - 14);
  g.restore();
}

/** The Game-Maker box's front and back for `dpi`, with the Sandbox games' screenshots on them. */
export async function gmPrintFaces(dpi: number): Promise<{ front: HTMLCanvasElement; back: HTMLCanvasElement }> {
  const shots = await sandboxShots();
  const tiles = shots.map((s) => [s.canvas, s.feature] as [HTMLCanvasElement, string]);
  return paintGmFaces(tiles, { h: BOX.face[1] * UNIT, scale: dpi / UNIT });
}

/** One sheet of the Game-Maker box at `dpi` (13.25 x 15.75 in). */
export function paintGmBoxSheet(which: BoxSheet, faces: { front: HTMLCanvasElement; back: HTMLCanvasElement }, dpi: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  [c.width, c.height] = pixelSize(boxDie(), dpi);
  const g = c.getContext('2d')!;
  g.scale(dpi / UNIT, dpi / UNIT);
  g.fillStyle = C.pink;
  g.fillRect(0, 0, BOX.sheet[0] * UNIT, BOX.sheet[1] * UNIT);
  const p = boxPanels();
  const [fx, fy, fw, fh] = L(p.face);
  g.drawImage(which === 'lid' ? faces.front : faces.back, fx, fy, fw, fh);
  if (which === 'bottom') return c;
  spine(g, L(p.left));
  spine(g, L(p.right));
  end(g, L(p.top), 'COMPUTER-AIDED DESIGN TOOLS · SANDBOX EDITION');
  end(g, L(p.bottom), 'CREATE YOUR OWN COMPUTER GAMES · VERSION 3.0');
  return c;
}
