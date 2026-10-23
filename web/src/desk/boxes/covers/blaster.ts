// Virus Blaster's cover: the shrunk-down pilot's BLASTER nano-fighter streaking up a glowing
// motherboard, lasers blazing at GLITCH's viruses, the CPU looming at the end of the traces.
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, rays, seeded, stars, stroke } from './paint';

/** A spiky virus with a mean little face. */
function virus(c: Ctx, x: number, y: number, r: number, hue: string, dark: string): void {
  const spikes = 11;
  c.save();
  c.translate(x, y);
  glow(c, 0, 0, r * 2.2, hue, 0.35);
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + r;
    stroke(c, dark, r * 0.16, [Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45]);
    fill(c, hue, () => c.arc(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45, r * 0.16, 0, Math.PI * 2));
  }
  ell(c, 0, 0, r, r);
  fill(
    c,
    rad(c, -r * 0.35, -r * 0.4, r * 1.2, [
      [0, '#fff'],
      [0.2, hue],
      [1, dark],
    ]),
  );
  // angry eyes and a jagged grin
  for (const s of [-1, 1]) {
    ell(c, s * r * 0.33, -r * 0.12, r * 0.2, r * 0.24);
    fill(c, '#fff');
    ell(c, s * r * 0.28, -r * 0.06, r * 0.09, r * 0.12);
    fill(c, '#000');
    stroke(c, '#000', r * 0.09, [s * r * 0.58, -r * 0.42, s * r * 0.14, -r * 0.26]);
  }
  poly(c, [-r * 0.45, r * 0.3, -r * 0.3, r * 0.5, -r * 0.15, r * 0.34, 0, r * 0.55, r * 0.15, r * 0.34, r * 0.3, r * 0.5, r * 0.45, r * 0.3, 0, r * 0.38]);
  fill(c, '#1a0010');
  c.restore();
}

/** The BLASTER: an arrowhead fighter, nose up, a tiny pilot under the bubble canopy. */
function fighter(c: Ctx, x: number, y: number, s: number, tilt: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(tilt);
  c.scale(s, s);
  // engine flames
  for (const ex of [-22, 22]) {
    glow(c, ex, 92, 60, '#ff7a1a', 0.9);
    blob(c, [ex - 10, 78, ex, 160, ex + 10, 78]);
    fill(
      c,
      lin(c, 0, 78, 0, 160, [
        [0, '#fff8d0'],
        [0.4, '#ffb030'],
        [1, 'rgba(255,60,0,0)'],
      ]),
    );
  }
  // swept wings
  for (const sx of [-1, 1]) {
    poly(c, [sx * 14, -10, sx * 92, 62, sx * 96, 86, sx * 18, 66]);
    fill(
      c,
      lin(c, 0, -10, sx * 96, 86, [
        [0, '#c9d6ec'],
        [0.6, '#5d6f96'],
        [1, '#25304a'],
      ]),
    );
    poly(c, [sx * 70, 52, sx * 96, 86, sx * 92, 62]);
    fill(c, '#ff7a1a');
    // wingtip cannons
    poly(c, [sx * 86, 10, sx * 92, 10, sx * 94, 80, sx * 84, 80]);
    fill(
      c,
      lin(c, sx * 84, 0, sx * 94, 0, [
        [0, '#eef4ff'],
        [1, '#56627d'],
      ]),
    );
  }
  // body
  blob(c, [0, -120, 30, -30, 34, 60, 22, 92, -22, 92, -34, 60, -30, -30]);
  fill(
    c,
    lin(c, -34, 0, 34, 0, [
      [0, '#3a4766'],
      [0.35, '#e8eefa'],
      [0.6, '#9fb0d0'],
      [1, '#29324c'],
    ]),
  );
  stroke(c, '#ff7a1a', 6, [-10, 20, 0, 6, 10, 20]);
  stroke(c, '#ff7a1a', 6, [-10, 36, 0, 22, 10, 36]);
  // canopy and pilot
  ell(c, 0, -40, 19, 34);
  fill(
    c,
    lin(c, -15, -70, 15, -10, [
      [0, '#9ff4ff'],
      [0.5, '#1e6c9a'],
      [1, '#062038'],
    ]),
  );
  // the pilot: shoulders, white helmet, orange visor
  ell(c, 0, -22, 13, 7);
  fill(c, '#d85a10');
  ell(c, 0, -38, 11, 12);
  fill(
    c,
    rad(c, -4, -43, 13, [
      [0, '#ffffff'],
      [1, '#a8b4c8'],
    ]),
  );
  ell(c, 0, -36, 8, 5);
  fill(
    c,
    lin(c, 0, -41, 0, -31, [
      [0, '#ffd070'],
      [1, '#c04000'],
    ]),
  );
  ell(c, -5, -52, 4, 10, -0.3);
  fill(c, 'rgba(255,255,255,0.7)');
  c.restore();
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('blaster-cover');
  const hy = 300; // horizon
  const vx = w * 0.56;
  c.fillStyle = lin(c, 0, 0, 0, hy, [
    [0, '#05030f'],
    [0.7, '#1a0a3a'],
    [1, '#3b1250'],
  ]);
  c.fillRect(0, 0, w, hy);
  stars(c, w, hy, 90, 'blaster', '#9fe8ff');
  // the CPU on the horizon, GLITCH's face burning in it
  c.save();
  poly(c, [vx - 150, hy, vx - 110, hy - 120, vx + 110, hy - 120, vx + 150, hy]);
  fill(
    c,
    lin(c, 0, hy - 120, 0, hy, [
      [0, '#2a2a36'],
      [1, '#0c0c14'],
    ]),
  );
  for (let i = 0; i < 14; i++) {
    const px = vx - 104 + i * 16;
    stroke(c, '#c9b070', 3, [px, hy - 124, px, hy - 136]);
  }
  glow(c, vx, hy - 60, 170, '#ff2050', 0.55);
  for (const s of [-1, 1]) {
    poly(c, [vx + s * 20, hy - 72, vx + s * 70, hy - 92, vx + s * 60, hy - 60]);
    fill(c, '#ffe0e8');
    glow(c, vx + s * 48, hy - 76, 40, '#ff3060', 0.8);
  }
  poly(c, [
    vx - 70,
    hy - 40,
    vx - 46,
    hy - 22,
    vx - 26,
    hy - 38,
    vx,
    hy - 20,
    vx + 26,
    hy - 38,
    vx + 46,
    hy - 22,
    vx + 70,
    hy - 40,
    vx + 50,
    hy - 8,
    vx - 50,
    hy - 8,
  ]);
  fill(c, '#ff4070');
  c.restore();
  // the motherboard, running off to the CPU
  c.fillStyle = lin(c, 0, hy, 0, h, [
    [0, '#062b18'],
    [0.5, '#0b5a2c'],
    [1, '#0e7a38'],
  ]);
  c.fillRect(0, hy, w, h - hy);
  glow(c, vx, hy, 260, '#ff6a20', 0.35);
  // traces in perspective, glowing with current
  for (let i = -9; i <= 9; i++) {
    const bx = vx + i * 90;
    const g = lin(c, vx, hy, bx, h, [
      [0, 'rgba(255,190,80,0.1)'],
      [1, i % 3 ? 'rgba(255,190,80,0.75)' : 'rgba(120,255,240,0.9)'],
    ]);
    stroke(c, g, 2 + Math.abs(i) * 0.4, [vx + i * 6, hy, bx, h]);
  }
  for (let k = 1; k < 9; k++) {
    const t = (k / 9) ** 2.2;
    const y = hy + (h - hy) * t;
    stroke(c, `rgba(255,190,80,${0.1 + t * 0.35})`, 1 + t * 2, [0, y, w, y]);
  }
  // chips and capacitors on the board
  const chip = (cx: number, cy: number, cw: number, ch: number) => {
    poly(c, [cx - cw, cy, cx + cw, cy, cx + cw * 1.15, cy + ch, cx - cw * 1.15, cy + ch]);
    fill(
      c,
      lin(c, 0, cy, 0, cy + ch, [
        [0, '#3a3a48'],
        [1, '#121218'],
      ]),
    );
    stroke(c, '#d8c080', Math.max(1, cw * 0.05), [cx - cw * 1.08, cy + ch * 0.5, cx + cw * 1.08, cy + ch * 0.5]);
  };
  chip(110, 330, 50, 22);
  chip(500, 352, 60, 30);
  chip(70, 470, 70, 50);
  for (const [cx, cy, cr] of [
    [210, 340, 9],
    [430, 330, 7],
    [540, 470, 18],
  ]) {
    ell(c, cx, cy, cr, cr * 0.5);
    fill(c, '#202a40');
    poly(c, [cx - cr, cy, cx - cr, cy - cr * 2.4, cx + cr, cy - cr * 2.4, cx + cr, cy]);
    fill(
      c,
      lin(c, cx - cr, 0, cx + cr, 0, [
        [0, '#1d3a8a'],
        [0.4, '#7ea6ff'],
        [1, '#0d1c4a'],
      ]),
    );
    ell(c, cx, cy - cr * 2.4, cr, cr * 0.5);
    fill(c, '#b8c4d8');
  }
  // the viruses, and lasers tearing into them
  const fx = 260;
  const fy = 490;
  virus(c, 470, 400, 34, '#9be33a', '#1f4a08');
  virus(c, 380, 300, 22, '#d050ff', '#3a0858');
  virus(c, 130, 380, 26, '#9be33a', '#1f4a08');
  virus(c, 530, 270, 16, '#d050ff', '#3a0858');
  for (const [sx, tx, ty] of [
    [-50, 125, 390],
    [50, 462, 410],
  ]) {
    const x0 = fx + sx * 0.96;
    const y0 = fy - 30;
    stroke(c, 'rgba(255,120,30,0.5)', 14, [x0, y0, tx, ty]);
    stroke(c, '#fff4c0', 4, [x0, y0, tx, ty]);
    glow(c, tx, ty, 50, '#ffb040', 0.6);
    rays(c, tx, ty, 60, 10, '#fff2b0', 0.45);
  }
  // spatter from the hit
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2;
    const d = 30 + r() * 50;
    fill(c, '#c8ff70', () => c.arc(462 + Math.cos(a) * d, 410 + Math.sin(a) * d, 2 + r() * 4, 0, Math.PI * 2));
  }
  fighter(c, fx, fy, 1.15, 0.08);
  finish(c, w, h, 'blaster');
};
export default paint;
