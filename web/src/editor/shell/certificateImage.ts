// The honors certificate as a picture, drawn on a canvas in the page (nothing is sent anywhere): cream paper, a
// double border in the stage's color, the award's title, "awarded to" the player's optional name, what the
// stage taught, the day it was earned and Doc Leo's signature line, with a rosette at the bottom. The words
// are worked out apart from the drawing (certificateText) so they can be tested.
import { DIPLOMA, CEREMONIES, certificateTitle, type Ceremony } from '../../project/ceremonies';

const CERT_W = 960;
const CERT_H = 720;
/** The longest name the player can put on a certificate. */
export const NAME_MAX = 24;

const COLORS = ['#2f7d4f', '#2b6cb0', '#b4551d', '#7a3e9d', '#0e7c86', '#a3322f'];
const GOLD = '#b98a00';

/** How the diploma reads: Highest Honors (every course a B or better) or a perfect 4.0 (every course an A). Stage honors have none. */
export type DiplomaTier = 'highest' | 'perfect' | undefined;

interface CertificateText {
  /** The ribbon under the title, or "". */
  banner: string;
  title: string;
  /** "This certificate is awarded to" */
  lead: string;
  /** The name, or "a Game Maker". */
  to: string;
  /** What the holder can do. */
  skills: string;
  /** "May 5, 2026", or "" when the day is not known. */
  date: string;
  signed: string;
}

/** "2026-11-05" as "November 5, 2026" (the day as written, not shifted by a time zone), or "" for anything else. */
export function longDate(iso: string | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return '';
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = months[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[3])}, ${m[1]}` : '';
}

/** The name as kept: trimmed, one line, at most NAME_MAX characters. */
export const cleanName = (s: string): string => s.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

/** The words on one certificate. */
export function certificateText(c: Ceremony, name: string, iso: string | undefined, tier?: DiplomaTier): CertificateText {
  const every = tier && c === DIPLOMA ? 'every stage and every course of the Starters' : 'every stage of the Starters';
  return {
    banner: tier && c === DIPLOMA ? (tier === 'perfect' ? 'With Highest Honors \u00b7 Perfect 4.0' : 'With Highest Honors') : '',
    title: certificateTitle(c),
    lead: 'This certificate is awarded to',
    to: cleanName(name) || 'a Game Maker',
    skills: c === DIPLOMA ? `for finishing ${every}: Game Maker, first\u00a0class.` : `for learning: ${c.skills}.`,
    date: longDate(iso),
    signed: 'Doc Leo, Sandbox Software',
  };
}

/** A line broken into rows no wider than `max` pixels in the canvas's current font. */
function wrap(ctx: CanvasRenderingContext2D, s: string, max: number): string[] {
  const rows: string[] = [];
  let row = '';
  for (const word of s.split(' ')) {
    const next = row ? `${row} ${word}` : word;
    if (row && ctx.measureText(next).width > max) {
      rows.push(row);
      row = word;
    } else row = next;
  }
  return row ? [...rows, row] : rows;
}

/** A rosette: a scalloped disc with two ribbon tails, the stage's number inside (a star for the diploma), and a small gold star above it for a perfect 4.0. */
function drawSeal(ctx: CanvasRenderingContext2D, rx: number, ry: number, color: string, mark: string, star: boolean): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(rx - 24, ry + 20);
  ctx.lineTo(rx - 44, ry + 80);
  ctx.lineTo(rx - 22, ry + 68);
  ctx.lineTo(rx - 6, ry + 84);
  ctx.lineTo(rx + 2, ry + 30);
  ctx.moveTo(rx + 24, ry + 20);
  ctx.lineTo(rx + 44, ry + 80);
  ctx.lineTo(rx + 22, ry + 68);
  ctx.lineTo(rx + 6, ry + 84);
  ctx.lineTo(rx - 2, ry + 30);
  ctx.fill();
  ctx.fillStyle = GOLD;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(rx + Math.cos(a) * 36, ry + Math.sin(a) * 36, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(rx, ry, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fbf3dc';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(mark, rx, ry + 12);
  if (star) {
    ctx.fillStyle = '#ffe27a';
    ctx.strokeStyle = '#8a6208';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 7 : 16;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(rx + Math.cos(a) * r, ry - 54 + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Draws the certificate into `canvas` (resized to CERT_W x CERT_H). */
export function drawCertificate(canvas: HTMLCanvasElement, c: Ceremony, name: string, iso: string | undefined, tier?: DiplomaTier): void {
  canvas.width = CERT_W;
  canvas.height = CERT_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const t = certificateText(c, name, iso, tier);
  const color = c === DIPLOMA ? GOLD : (COLORS[CEREMONIES.indexOf(c)] ?? COLORS[0]);
  ctx.fillStyle = '#fbf3dc';
  ctx.fillRect(0, 0, CERT_W, CERT_H);
  ctx.strokeStyle = color;
  if (tier === 'perfect' && c === DIPLOMA) {
    // gold foil: a bright-to-deep gold gradient border with a thin bright line outside it
    const foil = ctx.createLinearGradient(0, 0, CERT_W, CERT_H);
    for (const [at, col] of [
      [0, '#8a6208'],
      [0.25, '#ffe27a'],
      [0.5, '#b98a00'],
      [0.75, '#ffe27a'],
      [1, '#8a6208'],
    ] as const)
      foil.addColorStop(at, col);
    ctx.strokeStyle = foil;
    ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, CERT_W - 24, CERT_H - 24);
    ctx.lineWidth = 22;
    ctx.strokeRect(28, 28, CERT_W - 56, CERT_H - 56);
  } else {
    ctx.lineWidth = 14;
    ctx.strokeRect(24, 24, CERT_W - 48, CERT_H - 48);
  }
  ctx.strokeStyle = tier === 'perfect' && c === DIPLOMA ? '#b98a00' : color;
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 46, CERT_W - 92, CERT_H - 92);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3a2f1d';
  ctx.font = '600 22px Georgia, serif';
  ctx.fillText('GAME-MAKER: SANDBOX EDITION', CERT_W / 2, 100);
  ctx.fillStyle = color;
  ctx.font = 'bold 56px Georgia, serif';
  let y = 180;
  for (const row of wrap(ctx, t.title, CERT_W - 200)) {
    ctx.fillText(row, CERT_W / 2, y);
    y += 62;
  }
  if (t.banner) {
    // a red ribbon banner with swallowtail ends under the title
    const bw = 520;
    const by = y - 34;
    ctx.fillStyle = '#a3262a';
    ctx.beginPath();
    ctx.moveTo(CERT_W / 2 - bw / 2 - 26, by);
    ctx.lineTo(CERT_W / 2 + bw / 2 + 26, by);
    ctx.lineTo(CERT_W / 2 + bw / 2 + 6, by + 22);
    ctx.lineTo(CERT_W / 2 + bw / 2 + 26, by + 44);
    ctx.lineTo(CERT_W / 2 - bw / 2 - 26, by + 44);
    ctx.lineTo(CERT_W / 2 - bw / 2 - 6, by + 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbf3dc';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(t.banner, CERT_W / 2, by + 30);
    y += 40;
  }
  ctx.fillStyle = '#3a2f1d';
  ctx.font = 'italic 26px Georgia, serif';
  ctx.fillText(t.lead, CERT_W / 2, y + 14);
  ctx.font = 'bold 48px Georgia, serif';
  ctx.fillText(t.to, CERT_W / 2, y + 80);
  ctx.fillRect(CERT_W / 2 - 230, y + 96, 460, 2);
  ctx.font = '26px Georgia, serif';
  let sy = y + 146;
  for (const row of wrap(ctx, t.skills, CERT_W - 260)) {
    ctx.fillText(row, CERT_W / 2, sy);
    sy += 34;
  }
  const ry = CERT_H - 150;
  const mark = c === DIPLOMA ? '★' : String(CEREMONIES.indexOf(c) + 1);
  const gold = tier === 'perfect' && c === DIPLOMA;
  if (t.banner) {
    drawSeal(ctx, CERT_W / 2 - 54, ry, color, mark, gold);
    drawSeal(ctx, CERT_W / 2 + 54, ry, color, mark, gold);
  } else drawSeal(ctx, CERT_W / 2, ry, color, mark, false);
  ctx.fillStyle = '#3a2f1d';
  ctx.font = '22px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(t.date, 100, CERT_H - 80);
  ctx.fillRect(100, CERT_H - 106, 220, 2);
  ctx.textAlign = 'right';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText(t.signed, CERT_W - 100, CERT_H - 80);
  ctx.fillRect(CERT_W - 340, CERT_H - 106, 240, 2);
}

/** The picture's description for a screen reader. */
export function certificateAlt(c: Ceremony, name: string, iso: string | undefined, tier?: DiplomaTier): string {
  const t = certificateText(c, name, iso, tier);
  return `${t.title}${t.banner ? ` ${t.banner}` : ''}, awarded to ${t.to}${t.date ? `, ${t.date}` : ''}`;
}
