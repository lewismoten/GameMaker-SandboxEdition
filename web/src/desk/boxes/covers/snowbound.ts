// Snowbound: The $89 Shovel's cover: dawn over a buried Fort Ashby street, a kid in a red
// coat raising a shovelful of snow like a sword, dollar bills in the drifts, and the dream
// itself glowing in the sky: the pink Game-Maker box, $89.
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, rays, seeded, stroke } from './paint';

/** A little house with a snowy roof and a lit window. */
function house(c: Ctx, x: number, y: number, s: number, wall: string): void {
  poly(c, [x - 40 * s, y, x - 40 * s, y - 40 * s, x + 40 * s, y - 40 * s, x + 40 * s, y]);
  fill(c, wall);
  poly(c, [x - 50 * s, y - 38 * s, x, y - 78 * s, x + 50 * s, y - 38 * s]);
  fill(c, '#3a3a52');
  blob(c, [x - 52 * s, y - 36 * s, x, y - 84 * s, x + 52 * s, y - 36 * s, x, y - 50 * s]);
  fill(c, '#eef4ff');
  poly(c, [x - 24 * s, y - 30 * s, x - 8 * s, y - 30 * s, x - 8 * s, y - 14 * s, x - 24 * s, y - 14 * s]);
  fill(c, '#ffd070');
  glow(c, x - 16 * s, y - 22 * s, 26 * s, '#ffb040', 0.5);
}

/** The kid: red puffy coat, knit hat, flying scarf, the shovel raised high. */
function kid(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(-s, s); // facing the prize, the shovel raised to the left
  // snow pants and boots
  for (const lx of [-26, 26]) {
    blob(c, [lx - 20, -130, lx + 20, -130, lx + 18, -20, lx - 18, -20]);
    fill(
      c,
      lin(c, lx - 20, 0, lx + 20, 0, [
        [0, '#1a2a6a'],
        [0.5, '#3a5ab0'],
        [1, '#101a4a'],
      ]),
    );
    blob(c, [lx - 22, -30, lx + 22, -30, lx + 30, 0, lx - 22, 0]);
    fill(c, '#3a2010');
  }
  // the coat
  blob(c, [-66, -110, -70, -230, -40, -266, 40, -266, 70, -230, 66, -110, 0, -98]);
  fill(
    c,
    lin(c, -70, 0, 70, 0, [
      [0, '#7a0a10'],
      [0.35, '#f44a3c'],
      [0.6, '#d8281e'],
      [1, '#5a0408'],
    ]),
  );
  for (const py of [-140, -180, -220]) stroke(c, 'rgba(90,4,8,0.6)', 3, [-62, py, 0, py + 8, 62, py]);
  stroke(c, '#e8e0d0', 4, [0, -258, 0, -104]);
  // the scarf, its end streaming in the wind
  blob(c, [-44, -276, 44, -276, 44, -254, -44, -252]);
  fill(c, '#ffd23c');
  blob(c, [30, -270, 120, -300, 150, -280, 116, -268, 40, -250]);
  fill(
    c,
    lin(c, 30, 0, 150, 0, [
      [0, '#ffd23c'],
      [1, '#2a9a4a'],
    ]),
  );
  // the face
  ell(c, 0, -312, 38, 40);
  fill(
    c,
    rad(c, -10, -322, 48, [
      [0, '#ffe0c4'],
      [1, '#d89a74'],
    ]),
  );
  for (const ex of [-14, 14]) {
    ell(c, ex, -314, 4.5, 6);
    fill(c, '#1a0a04');
    ell(c, ex * 1.5, -298, 9, 6);
    fill(c, 'rgba(255,90,90,0.45)');
  }
  c.beginPath();
  c.arc(0, -302, 14, 0.25, Math.PI - 0.25);
  c.lineWidth = 4;
  c.strokeStyle = '#7a1a10';
  c.stroke();
  // knit hat with a pompom
  c.beginPath();
  c.ellipse(0, -326, 42, 40, 0, Math.PI, 0);
  c.closePath();
  fill(
    c,
    lin(c, -40, 0, 40, 0, [
      [0, '#0a4a8a'],
      [0.4, '#3a8ae0'],
      [1, '#062a5a'],
    ]),
  );
  blob(c, [-44, -334, 44, -334, 44, -318, -44, -318]);
  fill(c, '#f4f4f4');
  ell(c, 0, -370, 15, 14);
  fill(
    c,
    rad(c, -4, -374, 16, [
      [0, '#fff'],
      [1, '#c8d4e8'],
    ]),
  );
  // arms up, both mittens on the shovel handle
  stroke(c, '#c81e18', 30, [-54, -230, -84, -190, -60, -150]);
  stroke(c, '#c81e18', 30, [54, -230, 70, -270, 92, -300]);
  // the shovel: a long handle and a blade heaped with snow
  stroke(c, '#8a5a2a', 12, [-80, -140, 150, -390]);
  stroke(c, '#c89a5a', 4, [-78, -146, 148, -394]);
  c.save();
  c.translate(158, -398);
  c.rotate(0.75);
  poly(c, [-30, 12, 30, 12, 44, -66, -44, -66]);
  fill(
    c,
    lin(c, -44, 0, 44, 0, [
      [0, '#606878'],
      [0.45, '#f0f4fa'],
      [1, '#3a4250'],
    ]),
  );
  blob(c, [-40, -20, -30, -64, 0, -76, 34, -62, 40, -18, 0, -6]);
  fill(
    c,
    rad(c, -8, -54, 50, [
      [0, '#ffffff'],
      [1, '#c8d8f4'],
    ]),
  );
  c.restore();
  for (const [mx, my] of [
    [-62, -150],
    [92, -300],
  ]) {
    ell(c, mx, my, 15, 13);
    fill(c, '#2a9a4a');
  }
  c.restore();
}

/** The pink Game-Maker box from the store window, glowing like a prize. */
function prize(c: Ctx, x: number, y: number): void {
  rays(c, x, y, 220, 16, '#ffd0f0', 0.35);
  glow(c, x, y, 120, '#ff8fc8', 0.7);
  c.save();
  c.translate(x, y);
  c.rotate(0.12);
  poly(c, [-44, -58, 44, -58, 44, 58, -44, 58]);
  fill(
    c,
    lin(c, -44, -58, 44, 58, [
      [0, '#ffd0ec'],
      [0.5, '#ff7ac0'],
      [1, '#c03a88'],
    ]),
  );
  poly(c, [44, -58, 58, -48, 58, 66, 44, 58]);
  fill(c, '#a02a70');
  c.fillStyle = '#2a0a20';
  c.font = "italic 900 15px 'Arial Black', Impact, sans-serif";
  c.textAlign = 'center';
  c.fillText('GAME-', 0, -24);
  c.fillText('MAKER', 0, -8);
  poly(c, [-30, 6, 30, 6, 30, 40, -30, 40]);
  fill(c, '#3a1a6a');
  stroke(c, '#7cf0ff', 3, [-24, 32, -8, 18, 4, 28, 22, 12]);
  // the price tag
  c.rotate(-0.3);
  poly(c, [10, 44, 70, 44, 80, 60, 70, 76, 10, 76]);
  fill(c, '#fff8d0');
  c.fillStyle = '#c81e18';
  c.font = '900 22px Arial, sans-serif';
  c.fillText('$89', 42, 68);
  c.restore();
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('snowbound-cover');
  // dawn
  c.fillStyle = lin(c, 0, 0, 0, 400, [
    [0, '#14204a'],
    [0.5, '#5a4a8a'],
    [0.8, '#ff9ab0'],
    [1, '#ffd0a0'],
  ]);
  c.fillRect(0, 0, w, 400);
  glow(c, 120, 400, 200, '#ffb070', 0.5);
  // the street, houses on both sides running to the hills
  blob(c, [-40, 400, 80, 340, 220, 360, 380, 330, 520, 350, 660, 330, 660, 420, -40, 420]);
  fill(c, '#c8d0f0');
  house(c, 70, 410, 1.1, '#6a4a6a');
  house(c, 190, 396, 0.7, '#4a5a7a');
  house(c, 590, 430, 0.95, '#5a6a4a');
  prize(c, 474, 290);
  // the lamppost still on
  stroke(c, '#1a1a2a', 5, [370, 420, 370, 330]);
  ell(c, 370, 326, 8, 6);
  fill(c, '#fff4c0');
  glow(c, 370, 326, 60, '#ffd080', 0.6);
  // deep snow over everything
  c.fillStyle = lin(c, 0, 400, 0, h, [
    [0, '#dce6ff'],
    [1, '#9ab0e0'],
  ]);
  c.fillRect(0, 410, w, h - 410);
  blob(c, [-40, 420, 140, 400, 320, 430, 470, 410, 660, 430, 660, 470, -40, 470]);
  fill(c, '#eef4ff');
  // the plowed tire tracks
  stroke(c, 'rgba(90,110,170,0.35)', 10, [300, 430, 120, h]);
  stroke(c, 'rgba(90,110,170,0.35)', 10, [330, 430, 380, h]);
  // drifts in front, lit pink by the sunrise
  blob(c, [-40, h, -40, 560, 80, 520, 200, 560, 300, 600, 420, 560, 540, 590, 660, 550, 660, h]);
  fill(
    c,
    lin(c, 0, 520, 0, h, [
      [0, '#ffffff'],
      [0.4, '#e8eeff'],
      [1, '#a8b8e8'],
    ]),
  );
  // dollar bills blowing in the snow
  for (let i = 0; i < 7; i++) {
    const bx = 30 + r() * 540;
    const by = 380 + r() * 260;
    c.save();
    c.translate(bx, by);
    c.rotate(r() * 1.4 - 0.7);
    poly(c, [-16, -8, 16, -8, 16, 8, -16, 8]);
    fill(c, '#7ac07a');
    ell(c, 0, 0, 5, 5);
    fill(c, '#2a6a2a');
    c.restore();
  }
  kid(c, 280, 650, 1.02);
  // falling snow
  c.fillStyle = '#fff';
  for (let i = 0; i < 160; i++) {
    const sx = r() * w;
    const sy = r() * h;
    const ss = 1 + r() * 3.2;
    c.globalAlpha = 0.5 + r() * 0.5;
    ell(c, sx, sy, ss, ss);
    c.fill();
  }
  c.globalAlpha = 1;
  finish(c, w, h, 'snowbound', 0.45);
};
export default paint;
