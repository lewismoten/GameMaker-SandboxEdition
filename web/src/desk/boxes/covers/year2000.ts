// In The Year 2000!'s cover: tomorrow as 1995 imagined it. Saucer-topped towers, bubble cars
// zooming down the skyways, a Teleport-A-Phone booth, the Moon (with the Science Fair dome)
// hanging huge, and Dex Dynamo chasing Sparky 3000, pages of his report flying.
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, seeded, stars, stroke } from './paint';

/** A Googie tower with a saucer on top. */
function tower(c: Ctx, x: number, base: number, top: number, s: number, lit: string): void {
  poly(c, [x - 10 * s, base, x - 5 * s, top, x + 5 * s, top, x + 10 * s, base]);
  fill(c, lin(c, x - 10 * s, 0, x + 10 * s, 0, [
    [0, '#2a1a5a'],
    [0.5, '#8a7ad0'],
    [1, '#1a0a3a'],
  ]));
  ell(c, x, top, 44 * s, 11 * s);
  fill(c, lin(c, 0, top - 11 * s, 0, top + 11 * s, [
    [0, '#e8f4ff'],
    [1, '#4a5a9a'],
  ]));
  ell(c, x, top - 8 * s, 20 * s, 12 * s);
  fill(c, lit);
  glow(c, x, top, 50 * s, lit, 0.4);
  for (let i = -3; i <= 3; i++) (ell(c, x + i * 11 * s, top + 3 * s, 2.5 * s, 2.5 * s), fill(c, '#fff8a0'));
}

/** A bubble-top flying car with fins and a speed trail. */
function car(c: Ctx, x: number, y: number, s: number, body: string, dir: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s * dir, s);
  poly(c, [-50, -6, -220, 0, -50, 8]);
  fill(c, lin(c, -50, 0, -220, 0, [
    [0, 'rgba(120,255,240,0.6)'],
    [1, 'rgba(120,255,240,0)'],
  ]));
  ell(c, 6, -16, 26, 20);
  fill(c, rad(c, 0, -26, 30, [
    [0, 'rgba(230,255,255,0.95)'],
    [1, 'rgba(80,180,220,0.6)'],
  ]));
  poly(c, [-56, -10, -40, -34, -30, -10]);
  fill(c, body);
  blob(c, [-58, -8, 40, -10, 62, 0, 50, 12, -54, 12]);
  fill(c, lin(c, 0, -10, 0, 12, [
    [0, '#ffffff'],
    [0.3, body],
    [1, '#1a0a2a'],
  ]));
  glow(c, -40, 14, 30, '#ff60c0', 0.7);
  c.restore();
}

/** Sparky 3000: a chrome robot dog with antenna ears, the report in his jaws. */
function sparky(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  ell(c, 0, 4, 70, 9);
  fill(c, 'rgba(0,0,0,0.35)');
  const chrome = (x0: number, x1: number) =>
    lin(c, x0, 0, x1, 0, [
      [0, '#4a5a7a'],
      [0.4, '#f4f8ff'],
      [0.6, '#a8b8d8'],
      [1, '#3a4a6a'],
    ]);
  for (const lx of [-40, -22, 28, 44]) {
    stroke(c, '#5a6a8a', 9, [lx, -40, lx + (lx < 0 ? -10 : 10), -4]);
    ell(c, lx + (lx < 0 ? -10 : 10), -2, 9, 5);
    fill(c, '#2a3a5a');
  }
  blob(c, [-60, -70, 50, -74, 60, -40, -56, -38]);
  fill(c, chrome(-60, 60));
  stroke(c, '#5a6a8a', 6, [-58, -64, -82, -96]);
  ell(c, -84, -100, 6, 6);
  fill(c, '#ff3060');
  // head
  blob(c, [40, -110, 92, -112, 106, -82, 96, -66, 44, -66]);
  fill(c, chrome(40, 106));
  ell(c, 82, -96, 8, 6);
  fill(c, '#3fe0d0');
  glow(c, 82, -96, 20, '#3fe0d0', 0.8);
  for (const ex of [50, 66]) {
    stroke(c, '#5a6a8a', 4, [ex, -110, ex - 6, -140]);
    ell(c, ex - 6, -142, 5, 5);
    fill(c, '#ffd23c');
  }
  // the report pages
  c.translate(104, -70);
  c.rotate(0.3);
  poly(c, [-8, -16, 26, -12, 22, 22, -10, 18]);
  fill(c, '#fffdf0');
  for (let i = 0; i < 4; i++) stroke(c, '#8ab0e0', 1.5, [-4, -8 + i * 7, 20, -5 + i * 7]);
  c.restore();
}

/** Dex Dynamo, 11, in a silver jumpsuit, mid-stride after his dog. */
function dex(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  // legs mid-run, with moon boots
  stroke(c, '#c8d0e8', 20, [-8, -120, -40, -64, -70, -40]);
  stroke(c, '#e8eefa', 20, [10, -120, 26, -60, 20, -10]);
  blob(c, [-90, -48, -60, -54, -56, -30, -92, -28]);
  fill(c, '#d9381e');
  blob(c, [6, -20, 40, -20, 44, 2, 4, 2]);
  fill(c, '#d9381e');
  // jumpsuit body with a lightning-bolt chest badge
  blob(c, [-30, -124, -34, -200, -14, -222, 22, -222, 40, -200, 34, -124]);
  fill(c, lin(c, -34, 0, 40, 0, [
    [0, '#7a86a8'],
    [0.4, '#f4f8ff'],
    [1, '#6a7698'],
  ]));
  poly(c, [0, -204, 14, -204, 6, -186, 16, -186, -2, -160, 4, -180, -6, -180]);
  fill(c, '#3fe0d0');
  // arms: one reaching for the dog
  stroke(c, '#dce4f4', 16, [30, -206, 70, -190, 104, -200]);
  ell(c, 110, -202, 10, 9);
  fill(c, '#f2c096');
  stroke(c, '#dce4f4', 16, [-26, -204, -54, -170, -70, -180]);
  // head, with a flat-top and a big open "Hey!"
  ell(c, 6, -250, 30, 32);
  fill(c, rad(c, 0, -258, 38, [
    [0, '#ffd8b8'],
    [1, '#c8865a'],
  ]));
  blob(c, [-26, -262, -24, -290, 30, -292, 34, -262, 4, -272]);
  fill(c, '#5a2a10');
  ell(c, 20, -250, 4, 5);
  fill(c, '#1a0a04');
  ell(c, 26, -232, 7, 6);
  fill(c, '#7a1a10');
  // goggles pushed up
  stroke(c, '#3fe0d0', 7, [-24, -276, 32, -278]);
  c.restore();
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('year2000-cover');
  c.fillStyle = lin(c, 0, 0, 0, 470, [
    [0, '#0a0420'],
    [0.6, '#3a1070'],
    [1, '#ff6aa0'],
  ]);
  c.fillRect(0, 0, w, 470);
  stars(c, w, 300, 120, 'year2000');
  // the Moon, with the Science Fair dome on its rim
  glow(c, 470, 230, 220, '#b0c8ff', 0.4);
  ell(c, 470, 230, 110, 110);
  fill(c, rad(c, 430, 190, 150, [
    [0, '#ffffff'],
    [0.5, '#c8d0e8'],
    [1, '#5a6080'],
  ]));
  for (const [mx, my, mr] of [
    [430, 200, 18],
    [500, 260, 26],
    [480, 170, 10],
    [420, 270, 12],
  ]) {
    ell(c, mx, my, mr, mr);
    fill(c, 'rgba(90,96,128,0.35)');
  }
  c.beginPath();
  c.arc(530, 140, 30, Math.PI, 0);
  fill(c, 'rgba(160,255,240,0.6)');
  glow(c, 530, 130, 40, '#3fe0d0', 0.6);
  // the skyline
  for (let i = 0; i < 12; i++) {
    const bx = i * 56 - 20;
    const bh = 60 + r() * 90;
    poly(c, [bx, 470, bx, 470 - bh, bx + 44, 470 - bh, bx + 44, 470]);
    fill(c, '#1a0a3a');
    for (let k = 0; k < 6; k++) if (r() > 0.4) (c.fillStyle = '#ffd860'), c.fillRect(bx + 6 + (k % 3) * 12, 476 - bh + Math.floor(k / 3) * 14, 6, 6);
  }
  tower(c, 90, 470, 280, 1.2, '#3fe0d0');
  tower(c, 260, 470, 330, 0.9, '#ff60c0');
  tower(c, 560, 470, 360, 0.8, '#ffd23c');
  // the skyway: a glass tube sweeping across
  c.beginPath();
  c.moveTo(-20, 430);
  c.quadraticCurveTo(w / 2, 340, w + 20, 420);
  c.lineWidth = 26;
  c.strokeStyle = 'rgba(160,240,255,0.35)';
  c.stroke();
  c.lineWidth = 2;
  c.strokeStyle = 'rgba(220,255,255,0.8)';
  c.stroke();
  car(c, 220, 300, 0.9, '#ff5a7a', 1);
  car(c, 470, 400, 0.7, '#3fe0d0', -1);
  car(c, 120, 220, 0.5, '#ffd23c', 1);
  // the moving sidewalk in front
  poly(c, [-20, 470, w + 20, 470, w + 20, h, -20, h]);
  fill(c, lin(c, 0, 470, 0, h, [
    [0, '#4a3a8a'],
    [1, '#1a0a3a'],
  ]));
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    stroke(c, 'rgba(63,224,208,0.4)', 2, [0, 480 + t * t * 220, w, 480 + t * t * 220]);
  }
  // the Teleport-A-Phone booth
  poly(c, [496, 600, 496, 440, 580, 440, 580, 600]);
  fill(c, 'rgba(120,255,240,0.25)');
  stroke(c, '#c8d0e8', 6, [496, 600, 496, 440, 580, 440, 580, 600]);
  c.beginPath();
  c.arc(538, 440, 42, Math.PI, 0);
  fill(c, '#d9381e');
  c.fillStyle = '#fff';
  c.font = "900 13px Arial, sans-serif";
  c.textAlign = 'center';
  c.fillText('PHONE', 538, 432);
  c.fillText('25¢', 538, 470);
  glow(c, 538, 530, 80, '#3fe0d0', 0.5);
  sparky(c, 280, 624, 1.05);
  dex(c, 150, 640, 1.08);
  // pages of the report whirling between them
  for (let i = 0; i < 6; i++) {
    c.save();
    c.translate(240 + r() * 220, 380 + r() * 120);
    c.rotate(r() * 2 - 1);
    poly(c, [-14, -18, 14, -18, 14, 18, -14, 18]);
    fill(c, '#fffdf0');
    for (let k = 0; k < 4; k++) stroke(c, '#8ab0e0', 1.5, [-10, -10 + k * 7, 10, -10 + k * 7]);
    c.restore();
  }
  finish(c, w, h, 'year2000', 0.5);
};
export default paint;
