// A secret game's cover (registered by idHash in covers/index.ts): a colonial kitchen at night,
// a frosty mug of root beer glowing under a tricorn inside a ring of thirteen gold stars, a
// hobo clown holding up a squawking rubber chicken, a corgi, a recipe card stamped CLASSIFIED,
// and a toy Redcoat peering round the cellar door.
import { type Ctx, ell, fill, finish, glow, lin, poly, rad, seeded, stroke } from './paint';

function star(c: Ctx, x: number, y: number, r: number, color: string): void {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  poly(c, pts);
  fill(c, color);
}

/** The mug, `s` scale, its base at (x, y). */
function mug(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  // handle
  c.lineWidth = 16;
  c.strokeStyle = 'rgba(200,230,255,0.7)';
  c.beginPath();
  c.ellipse(64, -80, 26, 36, 0, -Math.PI / 2, Math.PI / 2);
  c.stroke();
  // glass and root beer
  poly(c, [-60, -160, 60, -160, 54, 0, -54, 0]);
  fill(
    c,
    lin(c, -60, 0, 60, 0, [
      [0, 'rgba(180,220,255,0.55)'],
      [0.2, 'rgba(255,255,255,0.75)'],
      [0.5, 'rgba(180,220,255,0.35)'],
      [1, 'rgba(120,170,220,0.6)'],
    ]),
  );
  poly(c, [-52, -140, 52, -140, 47, -8, -47, -8]);
  fill(
    c,
    lin(c, 0, -140, 0, -8, [
      [0, '#c87a34'],
      [0.4, '#7a3410'],
      [1, '#2a0c04'],
    ]),
  );
  const r = seeded('mug-bubbles');
  for (let i = 0; i < 26; i++) {
    ell(c, -40 + r() * 80, -130 + r() * 115, 1.5 + r() * 2.5, 1.5 + r() * 2.5);
    fill(c, 'rgba(255,230,190,0.55)');
  }
  // the highlight
  poly(c, [-44, -150, -32, -150, -30, -12, -40, -12]);
  fill(c, 'rgba(255,255,255,0.35)');
  // foam
  for (const [fx, fy, fr] of [
    [-44, -162, 24],
    [-14, -176, 30],
    [22, -170, 28],
    [48, -158, 20],
    [0, -150, 26],
  ]) {
    ell(c, fx, fy, fr, fr * 0.8);
    fill(
      c,
      rad(c, fx - fr * 0.3, fy - fr * 0.4, fr * 1.2, [
        [0, '#fffef6'],
        [0.6, '#f4e6c8'],
        [1, '#c8a878'],
      ]),
    );
  }
  // a drip
  stroke(c, '#f4e6c8', 8, [56, -150, 58, -110]);
  ell(c, 58, -106, 6, 7);
  fill(c, '#f4e6c8');
  // the tricorn on top, at an angle
  c.save();
  c.translate(-4, -196);
  c.rotate(-0.12);
  poly(c, [-74, 10, -60, -8, -20, -2, 0, -30, 20, -2, 60, -8, 74, 10, 0, 22]);
  fill(
    c,
    lin(c, 0, -30, 0, 22, [
      [0, '#2a2a34'],
      [1, '#08080c'],
    ]),
  );
  stroke(c, '#d8a030', 4, [-70, 10, 0, 21, 70, 10]);
  ell(c, 40, 2, 9, 9);
  fill(c, '#f8f4ec');
  ell(c, 40, 2, 4, 4);
  fill(c, '#c8241e');
  c.restore();
  c.restore();
}

/** A hobo clown in a chewed fedora, holding a rubber chicken up high; base at (x, y). */
function clown(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  ell(c, 0, 4, 70, 12);
  fill(c, 'rgba(0,0,0,0.35)');
  // red sneakers, navy trousers
  for (const lx of [-30, 8]) {
    ell(c, lx + 10, -4, 22, 10);
    fill(c, '#d02a20');
    c.fillStyle = '#1c2440';
    c.fillRect(lx, -110, 22, 104);
  }
  // corduroy jacket over a purple shirt and a green tie
  poly(c, [-52, -230, 52, -230, 46, -100, -46, -100]);
  fill(
    c,
    lin(c, -52, 0, 52, 0, [
      [0, '#141c3c'],
      [0.5, '#2a3870'],
      [1, '#141c3c'],
    ]),
  );
  c.strokeStyle = 'rgba(255,255,255,0.08)';
  c.lineWidth = 2;
  for (let i = -48; i < 48; i += 6) stroke(c, 'rgba(255,255,255,0.07)', 2, [i, -228, i, -102]);
  poly(c, [-18, -230, 18, -230, 10, -140, -10, -140]);
  fill(c, '#7a3cb4');
  poly(c, [-6, -226, 6, -226, 9, -150, 0, -140, -9, -150]);
  fill(c, '#2a9a5a');
  // a pin or two on the lapel
  ell(c, -32, -200, 5, 5);
  fill(c, '#e8b84a');
  ell(c, -30, -184, 4, 4);
  fill(c, '#c8241e');
  // the arm holding the chicken up
  stroke(c, '#1e2a58', 22, [40, -220, 74, -270, 84, -330]);
  ell(c, 86, -338, 12, 12);
  fill(c, '#f2c8a8');
  // the rubber chicken, mid-squawk
  c.save();
  c.translate(96, -368);
  c.rotate(-0.4);
  ell(c, 0, 0, 34, 16);
  fill(
    c,
    lin(c, 0, -16, 0, 16, [
      [0, '#fff27a'],
      [1, '#e0b820'],
    ]),
  );
  ell(c, 34, -14, 13, 12);
  fill(c, '#ffe860');
  poly(c, [44, -16, 66, -22, 46, -8]);
  fill(c, '#ff8a20');
  poly(c, [44, -10, 64, -4, 46, -4]);
  fill(c, '#ff8a20');
  poly(c, [28, -26, 32, -36, 36, -26, 40, -34, 42, -24]);
  fill(c, '#e82a20');
  ell(c, 38, -16, 2.5, 2.5);
  fill(c, '#111');
  c.restore();
  // the squawk
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    c.arc(150, -398, 20 + k * 16, -0.9, 0.5);
    c.strokeStyle = `rgba(255,240,160,${0.8 - k * 0.22})`;
    c.lineWidth = 5;
    c.stroke();
  }
  // the head
  ell(c, 0, -262, 36, 40);
  fill(
    c,
    rad(c, -10, -275, 50, [
      [0, '#ffd9bc'],
      [1, '#d8987a'],
    ]),
  );
  // ash beard and the white mouth, turned down
  poly(c, [-32, -258, 32, -258, 26, -230, 0, -222, -26, -230]);
  fill(c, 'rgba(60,64,90,0.85)');
  ell(c, 0, -240, 14, 8);
  fill(c, '#fbfbf6');
  stroke(c, '#5a1010', 3, [-8, -238, 0, -243, 8, -238]);
  // rosy cheeks and the red nose
  ell(c, -20, -258, 7, 5);
  fill(c, 'rgba(230,80,80,0.6)');
  ell(c, 20, -258, 7, 5);
  fill(c, 'rgba(230,80,80,0.6)');
  ell(c, 0, -258, 9, 9);
  fill(
    c,
    rad(c, -3, -261, 10, [
      [0, '#ff8a80'],
      [1, '#c01818'],
    ]),
  );
  // white round the eyes, spectacles, thick brows
  for (const ex of [-14, 14]) {
    ell(c, ex, -276, 9, 7);
    fill(c, '#fbfbf6');
    ell(c, ex, -276, 3, 3.5);
    fill(c, '#222');
    ell(c, ex, -276, 10, 8);
    c.strokeStyle = '#c8a040';
    c.lineWidth = 2;
    c.stroke();
    stroke(c, '#1a1a1a', 5, [ex - 9, -290, ex + 9, -288]);
  }
  // the chewed fedora
  poly(c, [-58, -296, 58, -296, 50, -288, -50, -288]);
  fill(c, '#4a4a52');
  poly(c, [-34, -296, -30, -336, 0, -342, 30, -336, 34, -296]);
  fill(
    c,
    lin(c, 0, -342, 0, -296, [
      [0, '#6a6a74'],
      [1, '#3a3a42'],
    ]),
  );
  c.fillStyle = '#8a1a1a';
  c.fillRect(-34, -306, 68, 8);
  poly(c, [22, -336, 30, -330, 26, -322]);
  fill(c, '#14182c');
  c.restore();
}

/** A corgi sitting up, ears high (a matching pair); base at (x, y). */
function corgi(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  ell(c, 0, 2, 50, 9);
  fill(c, 'rgba(0,0,0,0.35)');
  ell(c, 0, -34, 34, 36);
  fill(
    c,
    rad(c, -10, -46, 50, [
      [0, '#ffb060'],
      [1, '#c0581c'],
    ]),
  );
  ell(c, 2, -26, 18, 24);
  fill(c, '#fbf4ea');
  ell(c, 0, -86, 28, 24);
  fill(
    c,
    rad(c, -8, -94, 34, [
      [0, '#ffb868'],
      [1, '#c86020'],
    ]),
  );
  poly(c, [-24, -98, -30, -144, -6, -108]);
  fill(c, '#d06a28');
  poly(c, [10, -108, 34, -144, 28, -98]);
  fill(c, '#d06a28');
  poly(c, [-22, -104, -26, -128, -12, -108]);
  fill(c, '#f0a8a0');
  poly(c, [16, -108, 30, -128, 26, -104]);
  fill(c, '#f0a8a0');
  ell(c, 2, -76, 13, 12);
  fill(c, '#fbf4ea');
  poly(c, [-2, -112, 4, -112, 6, -86, 0, -84]);
  fill(c, '#fbf4ea');
  ell(c, 3, -80, 6, 4);
  fill(c, '#151515');
  ell(c, -11, -92, 3.5, 4);
  fill(c, '#1c120c');
  ell(c, 15, -92, 3.5, 4);
  fill(c, '#1c120c');
  stroke(c, '#5a1a10', 2.5, [-6, -70, 3, -66, 12, -70]);
  poly(c, [0, -66, 6, -66, 4, -58]);
  fill(c, '#f07080');
  c.restore();
}

/** A recipe card, ruled, with a CLASSIFIED stamp. */
function card(c: Ctx, x: number, y: number, w: number, rot: number): void {
  const h = w * 0.62;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = 'rgba(0,0,0,0.35)';
  c.fillRect(-w / 2 + 6, -h / 2 + 6, w, h);
  c.fillStyle = '#fbf3e0';
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = '#c8241e';
  c.fillRect(-w / 2, -h / 2 + h * 0.18, w, 2);
  c.fillStyle = '#a9bfd8';
  for (let i = 1; i < 6; i++) c.fillRect(-w / 2 + 4, -h / 2 + h * 0.18 + i * h * 0.13, w - 8, 1);
  c.fillStyle = '#1b2d6b';
  c.font = `italic ${Math.round(h * 0.1)}px Georgia, serif`;
  c.textAlign = 'left';
  ['1. Sassafras', '2. Wintergreen', '3. Nutmeg (genuine)', '4. Molasses', '13. ..........'].forEach((t, i) =>
    c.fillText(t, -w / 2 + 10, -h / 2 + h * 0.3 + i * h * 0.13),
  );
  c.save();
  c.rotate(-0.25);
  c.strokeStyle = 'rgba(200,36,30,0.85)';
  c.lineWidth = 3;
  c.strokeRect(-w * 0.28, -h * 0.02, w * 0.62, h * 0.24);
  c.fillStyle = 'rgba(200,36,30,0.85)';
  c.font = `bold ${Math.round(h * 0.16)}px "Courier New", monospace`;
  c.textAlign = 'center';
  c.fillText('CLASSIFIED', w * 0.03, h * 0.16);
  c.restore();
  c.restore();
}

/** A toy Redcoat, peering round a door. */
function redcoat(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = '#c82a20';
  c.fillRect(-14, -60, 28, 40);
  stroke(c, '#f8f4ec', 4, [-14, -60, 14, -24]);
  stroke(c, '#f8f4ec', 4, [14, -60, -14, -24]);
  ell(c, 0, -72, 11, 12);
  fill(c, '#f2c8a8');
  poly(c, [-13, -78, -13, -110, 13, -110, 13, -78]);
  fill(c, '#111');
  ell(c, 4, -72, 2, 2);
  fill(c, '#111');
  c.fillStyle = '#eee8dc';
  c.fillRect(-12, -20, 10, 22);
  c.fillRect(2, -20, 10, 22);
  stroke(c, '#5a3a1c', 4, [18, -110, 18, -30]);
  c.restore();
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('rb-cover');
  // the kitchen at night: plaster, beams, a brick hearth glowing
  c.fillStyle = lin(c, 0, 0, 0, h, [
    [0, '#0c1028'],
    [0.55, '#1a1838'],
    [1, '#2a1a20'],
  ]);
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 5; i++) {
    c.fillStyle = 'rgba(70,40,20,0.55)';
    c.fillRect(0, h * (0.08 + i * 0.12), w, h * 0.025);
  }
  // the cellar door, ajar, a Redcoat peering round it
  c.fillStyle = '#05060e';
  c.fillRect(w * 0.04, h * 0.36, w * 0.18, h * 0.42);
  c.fillStyle = '#3a2412';
  poly(c, [w * 0.04, h * 0.36, w * 0.1, h * 0.38, w * 0.1, h * 0.76, w * 0.04, h * 0.78]);
  fill(c, '#3a2412');
  redcoat(c, w * 0.15, h * 0.76, w / 900);
  // the floor
  const gy = h * 0.78;
  c.fillStyle = lin(c, 0, gy, 0, h, [
    [0, '#3a2414'],
    [1, '#140a04'],
  ]);
  c.fillRect(0, gy, w, h - gy);
  for (let x = 0; x < w; x += w / 9) stroke(c, 'rgba(0,0,0,0.3)', 2, [x, gy, x - w * 0.06, h]);
  // thirteen gold stars round the mug
  const cx = w * 0.42;
  const cy = h * 0.5;
  glow(c, cx, cy, w * 0.42, '#ffb040', 0.5);
  for (let i = 0; i < 13; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 13;
    const sx = cx + Math.cos(a) * w * 0.3;
    const sy = cy + Math.sin(a) * w * 0.27;
    glow(c, sx, sy, w * 0.04, '#ffe080', 0.5);
    star(c, sx, sy, w * 0.03, i === 0 ? '#fff6c0' : '#e8b84a');
  }
  mug(c, cx, gy + h * 0.02, w / 560);
  clown(c, w * 0.8, gy + h * 0.06, w / 760);
  corgi(c, w * 0.16, h * 0.97, w / 620);
  card(c, w * 0.5, h * 0.9, w * 0.3, -0.08);
  // sparks of fizz rising from the mug
  for (let i = 0; i < 30; i++) {
    ell(c, cx - w * 0.08 + r() * w * 0.16, cy - h * 0.12 - r() * h * 0.3, 1 + r() * 2, 1 + r() * 2);
    fill(c, `rgba(255,240,200,${0.3 + r() * 0.5})`);
  }
  finish(c, w, h, 'rb-cover');
};
export default paint;
