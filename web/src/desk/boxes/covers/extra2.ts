// A secret game's cover (registered by idHash in covers/index.ts): dusk over rolling hills, a
// long road winding off to a town clock on the horizon, and a little tin box of a robot walking
// it with the bulb on his antenna lit, a trail of tiny silver hearts glinting on the road
// behind him and a warm glow at the hatch on his chest.
import { type Ctx, ell, fill, finish, glow, lin, poly, seeded, stars, stroke } from './paint';

/** The robot, his feet at (x, y), `s` scale, walking left to right. */
function robot(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const tin = (x0: number, y0: number, w: number, h: number) => {
    c.fillStyle = lin(c, x0, 0, x0 + w, 0, [
      [0, '#e8ecf0'],
      [0.5, '#aeb6be'],
      [1, '#6c747e'],
    ]);
    c.fillRect(x0, y0, w, h);
    c.strokeStyle = '#1a1c24';
    c.lineWidth = 3;
    c.strokeRect(x0, y0, w, h);
  };
  // legs mid-stride
  stroke(c, '#7c848e', 9, [-14, -40, -24, 0]);
  stroke(c, '#7c848e', 9, [14, -40, 22, 0]);
  fill(c, '#1a1c24', () => ell(c, -26, 0, 12, 4));
  fill(c, '#1a1c24', () => ell(c, 26, 0, 12, 4));
  // body, the hatch glowing warm round its edges
  tin(-34, -110, 68, 72);
  glow(c, 0, -76, 46, '#ffc848', 0.55);
  c.strokeStyle = '#ffd870';
  c.lineWidth = 2;
  c.strokeRect(-18, -94, 36, 32);
  c.fillStyle = '#2a2018';
  c.fillRect(-14, -88, 28, 12);
  c.fillStyle = '#fff4d8';
  c.fillRect(-10, -85, 20, 6);
  // arms swinging
  stroke(c, '#8a929c', 8, [-34, -100, -52, -60]);
  stroke(c, '#8a929c', 8, [34, -100, 50, -66]);
  // bow tie and head
  poly(c, [-14, -118, 0, -112, -14, -106]);
  fill(c, '#c8241e');
  poly(c, [14, -118, 0, -112, 14, -106]);
  fill(c, '#c8241e');
  tin(-30, -160, 60, 42);
  // reading glasses and a smile
  c.strokeStyle = '#c89a3a';
  c.lineWidth = 3;
  c.strokeRect(-22, -150, 16, 14);
  c.strokeRect(6, -150, 16, 14);
  stroke(c, '#c89a3a', 3, [-6, -144, 6, -144]);
  fill(c, '#1a1c24', () => ell(c, -14, -143, 2.5, 2.5));
  fill(c, '#1a1c24', () => ell(c, 14, -143, 2.5, 2.5));
  stroke(c, '#1a1c24', 3, [-8, -128, 0, -125, 8, -128]);
  // antenna and its lit bulb
  stroke(c, '#6c747e', 4, [0, -160, 0, -184]);
  glow(c, 0, -190, 34, '#fff0a0', 0.8);
  fill(c, '#fff6c0', () => ell(c, 0, -190, 7, 7));
  c.restore();
}

/** A tiny riveted heart glinting on the road. */
function tinHeart(c: Ctx, x: number, y: number, r: number): void {
  glow(c, x, y, r * 4, '#dfe8f0', 0.35);
  c.beginPath();
  c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.7, y - r * 1.3, x, y - r * 0.45);
  c.bezierCurveTo(x + r * 0.7, y - r * 1.3, x + r * 1.4, y - r * 0.2, x, y + r * 0.9);
  fill(c, '#c8d0d8');
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('tin-cover');
  // dusk, from deep night to a warm band on the horizon
  c.fillStyle = lin(c, 0, 0, 0, h * 0.62, [
    [0, '#0e0c2a'],
    [0.45, '#3a2460'],
    [0.8, '#a04e78'],
    [1, '#f4a870'],
  ]);
  c.fillRect(0, 0, w, h);
  stars(c, w, h * 0.4, 80, 'tin-stars');
  // the town clock and roofs far off on the horizon, the clock face lit
  const hy = h * 0.6;
  c.fillStyle = '#1c1430';
  c.fillRect(w * 0.7, hy - h * 0.14, w * 0.035, h * 0.15);
  poly(c, [w * 0.7, hy - h * 0.14, w * 0.7175, hy - h * 0.18, w * 0.735, hy - h * 0.14]);
  fill(c, '#1c1430');
  for (const [x, bw, bh] of [
    [0.62, 0.07, 0.04],
    [0.745, 0.08, 0.05],
    [0.83, 0.05, 0.03],
  ])
    c.fillRect(w * x, hy - h * bh, w * bw, h * bh + 2);
  glow(c, w * 0.7175, hy - h * 0.115, w * 0.03, '#ffd870', 0.9);
  // rolling hills
  for (const [top, col, f] of [
    [0.6, '#24345a', 0.9],
    [0.66, '#1e3a32', 1.4],
    [0.74, '#16301e', 2.1],
  ] as const) {
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += w / 40) c.lineTo(x, h * top + Math.sin((x / w) * Math.PI * f + top * 9) * h * 0.025);
    c.lineTo(w, h);
    c.closePath();
    fill(c, col);
  }
  // the long road, from the near bottom left over the hills to the clock
  c.beginPath();
  c.moveTo(w * 0.04, h);
  c.bezierCurveTo(w * 0.3, h * 0.84, w * 0.62, h * 0.8, w * 0.7, hy + 2);
  c.lineTo(w * 0.735, hy + 2);
  c.bezierCurveTo(w * 0.7, h * 0.82, w * 0.5, h * 0.9, w * 0.42, h);
  c.closePath();
  fill(c, '#8a6a48');
  // the trail of little tin hearts behind him, back down the road
  for (let i = 0; i < 7; i++) {
    const t = i / 7;
    tinHeart(c, w * (0.12 + t * 0.12) + r() * w * 0.02, h * (0.97 - t * 0.06), w * (0.012 - t * 0.004));
  }
  robot(c, w * 0.36, h * 0.9, w / 900);
  finish(c, w, h, 'tin-cover');
};
export default paint;
