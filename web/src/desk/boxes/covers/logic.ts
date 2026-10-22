// Ohm Sweet Ohm's cover: a stormy night, lightning striking the Bitmores' Smart Home, and
// little Watt rolling across a giant haywire circuit board with current arcing all around.
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, seeded, stars, stroke } from './paint';

/** A jagged electric arc from a to b, glowing. */
function arc(c: Ctx, r: () => number, x0: number, y0: number, x1: number, y1: number, color: string, width: number): void {
  const pts = [x0, y0];
  const n = 7;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const j = (r() - 0.5) * Math.hypot(x1 - x0, y1 - y0) * 0.22;
    pts.push(x0 + (x1 - x0) * t + j, y0 + (y1 - y0) * t + j * 0.6);
  }
  pts.push(x1, y1);
  c.save();
  c.globalCompositeOperation = 'lighter';
  stroke(c, color, width * 4, pts);
  c.globalAlpha = 0.5;
  stroke(c, color, width * 2, pts);
  c.globalAlpha = 1;
  stroke(c, '#fff', width * 0.7, pts);
  c.restore();
}

/** Watt: treads, a brass body, a glass dome with big eyes, and a red antenna light. */
function watt(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  ell(c, 0, 92, 120, 18);
  fill(c, 'rgba(0,0,0,0.45)');
  // treads
  blob(c, [-104, 40, 104, 40, 112, 66, 100, 92, -100, 92, -112, 66]);
  fill(c, lin(c, 0, 40, 0, 92, [
    [0, '#4a4a52'],
    [1, '#141418'],
  ]));
  for (let i = 0; i < 5; i++) {
    const wx = -80 + i * 40;
    ell(c, wx, 66, 17, 17);
    fill(c, rad(c, wx - 5, 60, 18, [
      [0, '#c8c8d0'],
      [1, '#3a3a44'],
    ]));
    ell(c, wx, 66, 5, 5);
    fill(c, '#222');
  }
  // body
  poly(c, [-84, -40, 84, -40, 92, 44, -92, 44]);
  fill(c, lin(c, -92, 0, 92, 0, [
    [0, '#8a4a10'],
    [0.3, '#f0a040'],
    [0.55, '#ffd080'],
    [1, '#7a3c08'],
  ]));
  poly(c, [-40, -6, 40, -6, 40, 30, -40, 30]);
  fill(c, '#5a2c06');
  for (const [lx, col] of [
    [-24, '#40ff70'],
    [0, '#ffd23c'],
    [24, '#ff4040'],
  ] as const) {
    ell(c, lx, 12, 7, 7);
    fill(c, col);
    glow(c, lx, 12, 18, col, 0.6);
  }
  for (const rx of [-74, 74]) for (const ry of [-28, 32]) (ell(c, rx, ry, 4, 4), fill(c, '#fff0c0'));
  // a raised arm with a screwdriver
  stroke(c, '#9a9aa8', 12, [78, -10, 128, -54, 150, -104]);
  stroke(c, '#d9381e', 14, [150, -104, 160, -128]);
  stroke(c, '#e0e0ea', 5, [160, -128, 168, -156]);
  // glass dome
  c.beginPath();
  c.ellipse(0, -40, 82, 92, 0, Math.PI, 0);
  c.closePath();
  fill(c, rad(c, -30, -90, 120, [
    [0, 'rgba(220,255,255,0.95)'],
    [0.5, 'rgba(110,220,230,0.85)'],
    [1, 'rgba(20,90,120,0.95)'],
  ]));
  for (const ex of [-30, 30]) {
    ell(c, ex, -64, 26, 30);
    fill(c, rad(c, ex - 6, -72, 32, [
      [0, '#fff'],
      [1, '#c8d8e0'],
    ]));
    ell(c, ex + 6, -74, 12, 14);
    fill(c, '#111');
    ell(c, ex + 10, -79, 4, 5);
    fill(c, '#fff');
  }
  ell(c, -46, -100, 12, 26, 0.6);
  fill(c, 'rgba(255,255,255,0.55)');
  // antenna
  stroke(c, '#c0c0cc', 5, [34, -124, 50, -170]);
  ell(c, 50, -174, 12, 12);
  fill(c, rad(c, 46, -178, 14, [
    [0, '#fff'],
    [0.4, '#ff4030'],
    [1, '#8a0a00'],
  ]));
  glow(c, 50, -174, 50, '#ff3020', 0.8);
  c.restore();
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('logic-cover');
  const hy = 312;
  c.fillStyle = lin(c, 0, 0, 0, hy, [
    [0, '#060a1e'],
    [1, '#24305e'],
  ]);
  c.fillRect(0, 0, w, hy);
  stars(c, w, hy * 0.7, 50, 'logic');
  // storm clouds, their edges lit by the lightning
  for (let i = 0; i < 9; i++) {
    const cx = r() * w;
    const cy = 30 + r() * 110;
    ell(c, cx, cy, 70 + r() * 80, 22 + r() * 18);
    fill(c, rad(c, cx, cy - 20, 140, [
      [0, 'rgba(120,130,190,0.55)'],
      [1, 'rgba(20,24,50,0.4)'],
    ]));
  }
  // lightning on the Smart Home
  const bolt = [420, 0, 400, 70, 432, 96, 404, 170, 440, 196, 470, 250];
  glow(c, 440, 140, 220, '#a0c8ff', 0.5);
  c.save();
  c.globalCompositeOperation = 'lighter';
  stroke(c, 'rgba(150,190,255,0.5)', 18, bolt);
  c.restore();
  stroke(c, '#fff', 5, bolt);
  // the house on the hill
  blob(c, [-40, hy + 10, 120, 286, 330, 262, 470, 246, 640, 270, 660, hy + 10]);
  fill(c, '#0a0f24');
  poly(c, [360, hy, 360, 236, 470, 170, 580, 236, 580, hy]);
  fill(c, lin(c, 0, 170, 0, hy, [
    [0, '#1b2140'],
    [1, '#0b0e22'],
  ]));
  poly(c, [536, 200, 536, 168, 556, 168, 556, 214]);
  fill(c, '#0b0e22');
  for (const [wx, wy] of [
    [390, 250],
    [440, 250],
    [500, 250],
    [540, 250],
    [390, 286],
    [540, 286],
  ]) {
    poly(c, [wx, wy, wx + 24, wy, wx + 24, wy + 22, wx, wy + 22]);
    fill(c, (wx + wy) % 3 ? '#ffd860' : '#7cf0ff');
    glow(c, wx + 12, wy + 11, 30, '#ffc040', 0.35);
  }
  // the board, a giant plane of green fiberglass
  c.fillStyle = lin(c, 0, hy, 0, h, [
    [0, '#06301c'],
    [1, '#13804a'],
  ]);
  c.fillRect(0, hy, w, h - hy);
  const P = (u: number, v: number): [number, number] => {
    const t = v ** 1.6;
    return [w / 2 + (u - 0.5) * w * (0.6 + 1.9 * t), hy + (h - hy) * t];
  };
  const trace = (pts: number[], color: string, width: number) => {
    const out: number[] = [];
    for (let i = 0; i < pts.length; i += 2) out.push(...P(pts[i], pts[i + 1]));
    stroke(c, '#062a14', width + 4, out);
    stroke(c, color, width, out);
  };
  for (let i = 0; i < 12; i++) {
    const u = 0.02 + i * 0.09;
    const v = 0.05 + r() * 0.3;
    trace([u, 0, u, v, u + 0.06, v + 0.1, u + 0.06, 1], '#c88a30', 3);
  }
  // live current, glowing hot along two traces
  for (const u of [0.22, 0.82]) {
    const [ax, ay] = P(u, 0.08);
    const [bx, by] = P(u, 1);
    c.save();
    c.globalCompositeOperation = 'lighter';
    stroke(c, 'rgba(255,220,80,0.35)', 18, [ax, ay, bx, by]);
    c.restore();
    stroke(c, '#fff3a0', 4, [ax, ay, bx, by]);
  }
  // a knife switch thrown open, and a glass fuse
  c.save();
  c.translate(96, 470);
  poly(c, [-50, 0, 50, 0, 60, 30, -60, 30]);
  fill(c, lin(c, 0, 0, 0, 30, [
    [0, '#3a2a20'],
    [1, '#120a06'],
  ]));
  stroke(c, '#e8c060', 8, [-30, 4, 10, -90]);
  ell(c, 12, -98, 12, 16, 0.4);
  fill(c, '#111');
  for (const bx of [-30, 34]) (poly(c, [bx - 6, 2, bx + 6, 2, bx + 6, -20, bx - 6, -20]), fill(c, '#d8b050'));
  c.restore();
  c.save();
  c.translate(512, 470);
  c.rotate(-0.2);
  for (const ex of [-46, 46]) {
    poly(c, [ex - 12, -16, ex + 12, -16, ex + 12, 16, ex - 12, 16]);
    fill(c, lin(c, ex - 12, 0, ex + 12, 0, [
      [0, '#888'],
      [0.4, '#fafafa'],
      [1, '#666'],
    ]));
  }
  poly(c, [-34, -13, 34, -13, 34, 13, -34, 13]);
  fill(c, 'rgba(200,240,255,0.45)');
  stroke(c, '#ffe080', 3, [-34, 0, -10, -6, 10, 6, 34, 0]);
  glow(c, 0, 0, 50, '#ffd040', 0.5);
  c.restore();
  // sparks leaping between the parts, and around Watt
  for (const [a, b, x1, y1] of [
    [110, 380, 250, 330],
    [500, 440, 420, 360],
    [160, 520, 230, 452],
    [430, 520, 380, 470],
    [512, 470, 560, 380],
  ]) {
    arc(c, r, a, b, x1, y1, 'rgba(90,200,255,0.7)', 3);
    glow(c, x1, y1, 26, '#bff', 0.6);
  }
  watt(c, 290, 470, 1.1);
  finish(c, w, h, 'logic');
};
export default paint;
