// KEEP IT BRIEF!'s cover: The Dog House at night, a little lending library on a post, its red
// door flung open on a library much bigger than the box. A whirlwind of torn-out word slips
// pours from the door, and Mystery Robot Joe, the tin night librarian, stands in the warm
// light with a stack of words in his arms and his tally counter heart glowing.
import { type Ctx, ell, fill, finish, glow, lin, poly, rad, seeded, stars, stroke } from './paint';

/** A slip of paper torn from a book: a few lines of print, a dog-eared corner. */
function slip(c: Ctx, x: number, y: number, w: number, rot: number, alpha: number, value?: string): void {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.globalAlpha = alpha;
  const h = w * 0.62;
  c.fillStyle = 'rgba(0,0,0,0.25)';
  c.fillRect(-w / 2 + 3, -h / 2 + 3, w, h);
  c.fillStyle = lin(c, -w / 2, -h / 2, w / 2, h / 2, [
    [0, '#fffaf0'],
    [1, '#e8dcc0'],
  ]);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = '#8a8070';
  for (let i = 0; i < 3; i++) c.fillRect(-w / 2 + w * 0.1, -h / 2 + h * (0.22 + i * 0.22), w * (0.8 - i * 0.15), Math.max(1, h * 0.06));
  if (value) {
    c.fillStyle = '#c8241e';
    c.font = `bold ${Math.round(h * 0.5)}px Georgia, serif`;
    c.textAlign = 'right';
    c.fillText(value, w / 2 - w * 0.06, h / 2 - h * 0.08);
  }
  c.restore();
}

/** The Dog House, its box `s` wide with its top-left at (x, y). */
function dogHouse(c: Ctx, x: number, y: number, s: number): void {
  const u = s / 44;
  const R = (xx: number, yy: number, w: number, h: number, style: string | CanvasGradient) => {
    c.fillStyle = style;
    c.fillRect(x + xx * u, y + yy * u, w * u, h * u);
  };
  // post and the rock cubby
  R(18, 40, 8, 60, lin(c, x + 18 * u, 0, x + 26 * u, 0, [
    [0, '#3a2414'],
    [1, '#1a0e06'],
  ]));
  R(4, 46, 36, 18, '#f2eee4');
  R(4, 46, 36, 2.5, '#c8241e');
  const rocks = ['#e8443a', '#ffd23f', '#3d8fd1', '#4caf50', '#a05cd0', '#f08a2c'];
  rocks.forEach((col, i) => {
    const cx = 7 + (i % 3) * 11;
    const cy = 50 + Math.floor(i / 3) * 7;
    R(cx, cy, 9, 6, '#6a6a70');
    c.beginPath();
    c.ellipse(x + (cx + 4.5) * u, y + (cy + 3.2) * u, 3 * u, 2.2 * u, 0, 0, Math.PI * 2);
    c.fillStyle = col;
    c.fill();
  });
  // the box, lit from inside
  R(0, 6, 44, 34, lin(c, x, 0, x + 44 * u, 0, [
    [0, '#ffffff'],
    [1, '#d8d4c8'],
  ]));
  R(4, 10, 36, 26, rad(c, x + 22 * u, y + 23 * u, 26 * u, [
    [0, '#ffe7a0'],
    [0.6, '#d8902c'],
    [1, '#6a3a10'],
  ]));
  // books inside, a library bigger than the box: rows receding into the glow
  const books = ['#c8241e', '#1d5fb8', '#ffd23f', '#2e8b57', '#e88a2c', '#7a3fb0', '#1f9a9a'];
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 9; i++) {
      const bw = 3.4 - row * 0.8;
      R(6 + i * 3.6 + row * 3, 13 + row * 7.5, bw, 6 - row * 1.3, books[(i + row * 3) % books.length]);
    }
  // roof
  c.beginPath();
  c.moveTo(x - 6 * u, y + 7 * u);
  c.lineTo(x + 22 * u, y - 6 * u);
  c.lineTo(x + 50 * u, y + 7 * u);
  c.closePath();
  c.fillStyle = lin(c, 0, y - 6 * u, 0, y + 7 * u, [
    [0, '#3a3a44'],
    [1, '#0e0e14'],
  ]);
  c.fill();
  // the red door, flung open to the left on its strap hinges
  poly(c, [x + 4 * u, y + 10 * u, x - 18 * u, y + 4 * u, x - 18 * u, y + 42 * u, x + 4 * u, y + 36 * u]);
  fill(c, lin(c, x - 18 * u, 0, x + 4 * u, 0, [
    [0, '#7a0a06'],
    [1, '#e0281c'],
  ]));
  poly(c, [x - 0 * u, y + 13 * u, x - 14 * u, y + 9.5 * u, x - 14 * u, y + 33 * u, x - 0 * u, y + 33 * u]);
  fill(c, 'rgba(160,210,255,0.35)');
  // dog-bone handle
  stroke(c, '#111', 2.2 * u, [x - 15 * u, y + 24 * u, x - 9 * u, y + 25 * u]);
  for (const bx of [-15.5, -8.5]) {
    ell(c, x + bx * u, y + 24.5 * u, 1.4 * u, 2 * u);
    fill(c, '#111');
  }
}

/** Mystery Robot Joe: a tin box of a robot, bow tie, reading glasses, a tally counter heart. */
function joe(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  ell(c, 0, 118, 70, 12);
  fill(c, 'rgba(0,0,0,0.4)');
  const tin = (x0: number, x1: number) =>
    lin(c, x0, 0, x1, 0, [
      [0, '#6c7a8e'],
      [0.35, '#e8eef6'],
      [0.7, '#a8b4c4'],
      [1, '#4a5466'],
    ]);
  // legs
  for (const lx of [-26, 10]) {
    c.fillStyle = tin(lx, lx + 16);
    c.fillRect(lx, 64, 16, 46);
    c.fillStyle = '#1a1a22';
    c.fillRect(lx - 4, 108, 24, 10);
  }
  // body
  c.fillStyle = tin(-48, 48);
  c.fillRect(-48, -10, 96, 80);
  c.strokeStyle = '#1a1a22';
  c.lineWidth = 3;
  c.strokeRect(-48, -10, 96, 80);
  // the tally counter heart
  c.fillStyle = '#1a1a22';
  c.fillRect(-22, 8, 44, 24);
  c.fillStyle = '#fff6d8';
  c.fillRect(-18, 12, 36, 16);
  c.fillStyle = '#c8241e';
  c.font = 'bold 15px Georgia, serif';
  c.textAlign = 'center';
  c.fillText('100', 0, 26);
  glow(c, 0, 20, 40, '#ffd060', 0.45);
  ell(c, 30, 20, 5, 5);
  fill(c, '#d8a030');
  // arms, holding a stack of word slips
  stroke(c, '#7a889c', 12, [-48, 4, -66, 34, -40, 50]);
  stroke(c, '#7a889c', 12, [48, 4, 66, 34, 40, 50]);
  for (let i = 0; i < 6; i++) slip(c, (i % 2) * 4 - 2, 46 - i * 7, 70, (i - 2.5) * 0.05, 1, i === 5 ? '20' : undefined);
  // neck and bow tie
  c.fillStyle = '#5a6476';
  c.fillRect(-8, -18, 16, 10);
  poly(c, [-18, -16, 0, -10, -18, -4]);
  fill(c, '#c8241e');
  poly(c, [18, -16, 0, -10, 18, -4]);
  fill(c, '#c8241e');
  ell(c, 0, -10, 4, 4);
  fill(c, '#ff5a40');
  // head
  c.fillStyle = tin(-44, 44);
  c.fillRect(-44, -76, 88, 58);
  c.strokeRect(-44, -76, 88, 58);
  // reading glasses he does not need
  for (const ex of [-18, 18]) {
    ell(c, ex, -50, 13, 11);
    fill(c, 'rgba(220,240,255,0.5)');
    c.strokeStyle = '#d8a030';
    c.lineWidth = 3;
    c.stroke();
    ell(c, ex + 2, -50, 3.5, 4.5);
    fill(c, '#111');
  }
  stroke(c, '#d8a030', 3, [-5, -50, 5, -50]);
  // grille mouth
  c.fillStyle = '#3a4252';
  c.fillRect(-14, -32, 28, 6);
  // antenna and its bulb
  stroke(c, '#9aa6b6', 4, [0, -76, 0, -98]);
  ell(c, 0, -102, 7, 7);
  fill(c, rad(c, -2, -104, 8, [
    [0, '#fffbe0'],
    [0.5, '#ffd23f'],
    [1, '#a07000'],
  ]));
  glow(c, 0, -102, 30, '#ffd23f', 0.7);
  c.restore();
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('brief-cover');
  c.fillStyle = lin(c, 0, 0, 0, h, [
    [0, '#070a22'],
    [0.6, '#1c2452'],
    [1, '#2a2048'],
  ]);
  c.fillRect(0, 0, w, h);
  stars(c, w, h * 0.55, 70, 'brief');
  ell(c, w * 0.86, h * 0.16, w * 0.05, w * 0.05);
  fill(c, '#fff8e0');
  ell(c, w * 0.875, h * 0.15, w * 0.045, w * 0.045);
  fill(c, '#0c1030');
  // the lawn
  const gy = h * 0.82;
  c.fillStyle = lin(c, 0, gy, 0, h, [
    [0, '#14361e'],
    [1, '#061208'],
  ]);
  c.fillRect(0, gy, w, h - gy);
  // the box, and its light pouring out across the lawn
  const bs = w * 0.27;
  const bx = w * 0.14;
  const by = gy - bs * (100 / 44) + 6;
  c.save();
  c.globalCompositeOperation = 'lighter';
  poly(c, [bx + bs * 0.1, by + bs * 0.25, bx + bs * 0.9, by + bs * 0.25, w * 0.98, h, w * 0.02, h]);
  fill(c, lin(c, 0, by, 0, h, [
    [0, 'rgba(255,200,90,0.35)'],
    [1, 'rgba(255,200,90,0.02)'],
  ]));
  c.restore();
  glow(c, bx + bs * 0.5, by + bs * 0.5, bs * 0.9, '#ffb040', 0.55);
  dogHouse(c, bx, by, bs);
  // the whirlwind of words, spiraling up and out of the door
  for (let i = 0; i < 90; i++) {
    const t = i / 90;
    const a = t * Math.PI * 5 + r() * 0.6;
    const rr = 20 + t * w * 0.5;
    const x = bx + bs * 0.45 + Math.cos(a) * rr * 0.9 + t * w * 0.18;
    const y = by + bs * 0.4 - t * h * 0.45 + Math.sin(a) * rr * 0.35;
    if (y < h * 0.05 || x > w * 1.05) continue;
    const vals = ['1', '5', '10', '20'];
    slip(c, x, y, 18 + r() * 26 * (0.4 + t), a + r(), 0.55 + 0.45 * (1 - t), r() < 0.35 ? vals[Math.floor(r() * 4)] : undefined);
  }
  joe(c, w * 0.72, gy - h * 0.12, w / 640);
  finish(c, w, h, 'brief');
};
export default paint;
