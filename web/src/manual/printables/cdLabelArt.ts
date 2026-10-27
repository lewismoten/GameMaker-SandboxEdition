// The two CD labels to print, drawn as the site shows the discs: the Game-Maker CD in the
// Game-Maker box (desk/boxes/gmBox.ts: GAME-MAKER 3.0 round the top, SANDBOX EDITION inside it,
// the bonus-games line round the bottom) and TURBO BUTTON's cover disc (manual/magazine/disc.ts:
// the magazine's name on a red band, yellow below, the source-code line round the bottom). Drawn
// on a canvas in hundredths of an inch round the disc's center, so they print sharp at any dpi.
// The bleed is the label's own background color, past the edge and into the hole.
import { MAG } from '../magazine/masthead';
import { CD_LABEL } from './labelSheets';

export type CdId = 'gmcd' | 'turbocd';

/** Hundredths of an inch. */
const U = 100;
const R = (CD_LABEL.outer / 2) * U;
const HOLE = (CD_LABEL.hole / 2) * U;

/**
 * Text round a circle of radius `r`, centered on the top (reading clockwise) or the bottom
 * (reading left to right, the letters' feet outward). `spacing` is extra room between letters.
 */
function arcText(g: CanvasRenderingContext2D, text: string, r: number, at: 'top' | 'bottom', spacing = 0, stroke = 0): void {
  const chars = [...text];
  const widths = chars.map((c) => g.measureText(c).width + spacing);
  const total = widths.reduce((a, b) => a + b, 0) - spacing;
  const sweep = total / r;
  let run = 0;
  g.save();
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  chars.forEach((c, i) => {
    const mid = (run + (widths[i] - spacing) / 2) / r;
    run += widths[i];
    const a = at === 'top' ? -Math.PI / 2 - sweep / 2 + mid : Math.PI / 2 + sweep / 2 - mid;
    g.save();
    g.translate(Math.cos(a) * r, Math.sin(a) * r);
    g.rotate(at === 'top' ? a + Math.PI / 2 : a - Math.PI / 2);
    if (stroke) {
      g.lineWidth = stroke;
      g.lineJoin = 'round';
      g.strokeText(c, 0, 0);
    }
    g.fillText(c, 0, 0);
    g.restore();
  });
  g.restore();
}

/**
 * Sets the biggest font (up to `max`) at which `text` runs at most `sweep` radians round a circle
 * of radius `r`, letters `spacing` (in ems) apart.
 */
function fitArc(g: CanvasRenderingContext2D, text: string, r: number, sweep: number, font: (px: number) => string, max: number, spacing = 0): number {
  let px = max;
  for (; px > 4; px *= 0.97) {
    g.font = font(px);
    if ((g.measureText(text).width + [...text].length * spacing * px) / r <= sweep) break;
  }
  return px;
}

/** The Game-Maker CD: a white label, the program's name in navy, the edition, and the bonus-games line in red. */
function gmCd(g: CanvasRenderingContext2D, bleed: number): void {
  // the desk's label in a 100-wide box is 94 across; here it fills the 117 mm label
  const s = R / 47;
  const ground = g.createRadialGradient(0, 0, HOLE, 0, 0, R + bleed);
  ground.addColorStop(0, '#ffffff');
  ground.addColorStop(1, '#eef1f5');
  g.fillStyle = ground;
  g.beginPath();
  g.arc(0, 0, R + bleed, 0, Math.PI * 2);
  g.fill();
  // a navy rule round the edge and the hub, inside the safe lines
  g.strokeStyle = '#000080';
  g.lineWidth = 2;
  for (const r of [R - 16, HOLE + 16]) {
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
  }
  // round the top in at most 150 degrees, so the name and the bottom line never meet
  const most = (Math.PI * 150) / 180;
  g.fillStyle = '#000080';
  fitArc(g, 'GAME-MAKER 3.0', 33 * s, most, (px) => `900 ${px}px 'Arial Black', Arial, sans-serif`, 11 * s);
  arcText(g, 'GAME-MAKER 3.0', 33 * s, 'top');
  g.fillStyle = '#1d3f7a';
  const ed = fitArc(g, 'SANDBOX EDITION', 24 * s, most, (px) => `900 ${px}px Arial, Helvetica, sans-serif`, 5.6 * s, 0.12);
  arcText(g, 'SANDBOX EDITION', 24 * s, 'top', 0.12 * ed);
  g.fillStyle = '#8a0a2c';
  const small = fitArc(
    g,
    'BONUS GAMES CD-ROM · NOT AN RSD DISC',
    41 * s,
    (Math.PI * 140) / 180,
    (px) => `900 ${px}px Arial, Helvetica, sans-serif`,
    5 * s,
    0.08,
  );
  arcText(g, 'BONUS GAMES CD-ROM · NOT AN RSD DISC', 41 * s, 'bottom', 0.08 * small);
}

/** TURBO BUTTON's cover disc: yellow, a red band round the top with the name, black type below. */
function turboCd(g: CanvasRenderingContext2D, bleed: number): void {
  const s = R / 48;
  g.fillStyle = '#ffd31a';
  g.beginPath();
  g.arc(0, 0, R + bleed, 0, Math.PI * 2);
  g.fill();
  // the band: the top half, from the edge in to 29 (the magazine's own label's proportions)
  g.fillStyle = '#d61f26';
  g.beginPath();
  g.arc(0, 0, R + bleed, Math.PI, 0);
  g.arc(0, 0, 29 * s, 0, Math.PI, true);
  g.closePath();
  g.fill();
  g.fillStyle = '#ffd31a';
  g.strokeStyle = '#141210';
  g.font = `900 ${11.5 * s}px Impact, 'Arial Black', sans-serif`;
  arcText(g, MAG.name, 35.5 * s, 'top', 0.04 * 11.5 * s, 0.9 * s);
  g.fillStyle = '#141210';
  const small = fitArc(g, 'SOURCE CODE · GAMES · SHAREWARE', 43.5 * s, (Math.PI * 130) / 180, (px) => `900 ${px}px Arial, Helvetica, sans-serif`, 4.6 * s, 0.1);
  arcText(g, 'SOURCE CODE · GAMES · SHAREWARE', 43.5 * s, 'bottom', 0.1 * small);
  g.textAlign = 'center';
  g.font = `700 ${4 * s}px Arial, Helvetica, sans-serif`;
  g.letterSpacing = `${0.08 * 4 * s}px`;
  g.fillStyle = '#141210';
  g.fillText('DISC 1', 0, -21 * s);
  g.fillStyle = '#d61f26';
  g.font = `900 ${7 * s}px Impact, 'Arial Black', sans-serif`;
  g.letterSpacing = `${0.08 * 7 * s}px`;
  g.fillText('COVER DISC', 0, 27 * s);
  g.fillStyle = '#141210';
  g.font = `700 ${4 * s}px Arial, Helvetica, sans-serif`;
  g.letterSpacing = `${0.08 * 4 * s}px`;
  g.fillText(MAG.issue.replace(/^.*·\s*/, '').toUpperCase(), 0, 33 * s);
  g.letterSpacing = '0px';
}

/** The CDs: their tray names and file names. */
export const CDS: Record<CdId, { title: string; note: string; file: string }> = {
  gmcd: { title: 'Game-Maker CD label', note: 'The bonus-games CD in the Game-Maker box', file: 'game-maker-cd-label' },
  turbocd: { title: 'TURBO BUTTON CD label', note: 'The magazine’s cover disc: the source code', file: 'turbo-button-cd-label' },
};

/** One CD label centered on the canvas's origin, in hundredths of an inch (scale the canvas first). */
export function paintCdLabel(g: CanvasRenderingContext2D, id: CdId, bleed: number): void {
  g.save();
  // the label: the disc grown by the bleed, the hole shrunk by it
  g.beginPath();
  g.arc(0, 0, R + bleed, 0, Math.PI * 2);
  g.arc(0, 0, Math.max(0, HOLE - bleed), 0, Math.PI * 2, true);
  g.clip('evenodd');
  if (id === 'gmcd') gmCd(g, bleed);
  else turboCd(g, bleed);
  g.restore();
}
