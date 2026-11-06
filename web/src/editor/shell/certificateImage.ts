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

interface CertificateText {
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
export function certificateText(c: Ceremony, name: string, iso: string | undefined): CertificateText {
  return {
    title: certificateTitle(c),
    lead: 'This certificate is awarded to',
    to: cleanName(name) || 'a Game Maker',
    skills: c === DIPLOMA ? 'for finishing every stage of the Starters: Game Maker, first class.' : `for learning: ${c.skills}.`,
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

/** Draws the certificate into `canvas` (resized to CERT_W x CERT_H). */
export function drawCertificate(canvas: HTMLCanvasElement, c: Ceremony, name: string, iso: string | undefined): void {
  canvas.width = CERT_W;
  canvas.height = CERT_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const t = certificateText(c, name, iso);
  const color = c === DIPLOMA ? GOLD : (COLORS[CEREMONIES.indexOf(c)] ?? COLORS[0]);
  ctx.fillStyle = '#fbf3dc';
  ctx.fillRect(0, 0, CERT_W, CERT_H);
  ctx.strokeStyle = color;
  ctx.lineWidth = 14;
  ctx.strokeRect(24, 24, CERT_W - 48, CERT_H - 48);
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
  // the rosette: a scalloped disc with two ribbon tails and the stage's number (a star for the diploma)
  const rx = CERT_W / 2;
  const ry = CERT_H - 150;
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
  ctx.fillText(c === DIPLOMA ? '★' : String(CEREMONIES.indexOf(c) + 1), rx, ry + 12);
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
export function certificateAlt(c: Ceremony, name: string, iso: string | undefined): string {
  const t = certificateText(c, name, iso);
  return `${t.title}, awarded to ${t.to}${t.date ? `, ${t.date}` : ''}`;
}
