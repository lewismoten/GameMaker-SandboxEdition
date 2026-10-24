// Teddy's Little Bigger Adventure's cover: the Tri-County Fair's midway at nightfall, the
// Ferris wheel and THE BIG DROP lit up and fireworks going off. Teddy, nose to the ground,
// follows a faint green wisp of scent straight to Gwinn, sitting up proud (for once) with her
// Best Behaved blue rosette, while Doc Leo waves by THE CHEZ.
import { GWINN, TEDDY } from './dog';
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, seeded, stars, stroke } from './paint';
import { leoFace } from './leoFace';

/** The 1976½ CitiCar, seen from its front corner as it sits in the photo: a short tomato-red
 * wedge, the hood sloping straight up into a big flat windshield, a tall boxy cabin with a black
 * roof, round headlight pods on the hood's corners, a black bumper with "THE CHEZ" on its plate,
 * and little whitewall wheels (its charge port is round the back, low on the passenger side,
 * out of sight). Drawn in the photo's own coordinates (ground under the middle at
 * 320, 520), then placed with its ground at (x, y). */
function citicar(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.translate(-320, -520);
  ell(c, 320, 500, 200, 34);
  fill(c, 'rgba(0,0,0,0.35)');
  const red = (x0: number, y0: number, x1: number, y1: number) =>
    lin(c, x0, y0, x1, y1, [
      [0, '#ff6a50'],
      [0.5, '#e02a18'],
      [1, '#9a160a'],
    ]);
  // wheels behind the body: the far rear one and the front one tucked under the bumper
  for (const [wx, wy, rx, ry] of [
    [182, 446, 18, 30],
    [462, 456, 20, 30],
  ]) {
    ell(c, wx, wy, rx, ry);
    fill(c, '#151515');
  }
  // the side: rear quarter and the tall door, flat panels
  poly(c, [150, 262, 222, 250, 270, 452, 268, 486, 152, 448]);
  fill(c, red(150, 0, 270, 0));
  poly(c, [174, 266, 212, 258, 218, 346, 178, 352]);
  fill(
    c,
    lin(c, 0, 258, 0, 352, [
      [0, '#9ad4ff'],
      [1, '#2a4a6a'],
    ]),
  );
  stroke(c, '#7a1006', 3, [216, 256, 222, 470]);
  // the racing stripes: a dark pair edged in white, low along the side, stepping up over the
  // rear quarter behind the door
  const band = (d: number) => [268, 436 + d, 178, 407 + d, 172, 400 + d, 166, 386 + d, 160, 381 + d, 152, 379 + d];
  stroke(c, '#fff4e8', 16, band(0));
  stroke(c, '#d02818', 12, band(0));
  for (const d of [-3.5, 3.5]) stroke(c, '#26262a', 4.5, band(d));
  // the black roof
  poly(c, [162, 248, 222, 238, 328, 236, 336, 246, 222, 252, 158, 262]);
  fill(c, '#141416');
  stroke(c, 'rgba(255,255,255,0.18)', 2, [226, 241, 326, 239]);
  // the windshield: big, flat, raked back
  poly(c, [224, 252, 330, 246, 380, 300, 226, 324]);
  fill(
    c,
    lin(c, 0, 246, 0, 324, [
      [0, '#c8ecff'],
      [0.55, '#6aa8d8'],
      [1, '#2a4a6a'],
    ]),
  );
  stroke(c, 'rgba(255,255,255,0.7)', 4, [250, 262, 236, 312]);
  stroke(c, '#151515', 3, [262, 318, 330, 300]);
  // the hood, sloping straight down from the windshield to the bumper, with its little scoop
  poly(c, [226, 324, 380, 300, 392, 312, 488, 398, 482, 404, 270, 448, 228, 330]);
  fill(c, red(300, 300, 380, 440));
  poly(c, [330, 330, 350, 326, 366, 372, 342, 380]);
  fill(c, '#c01e10');
  stroke(c, '#7a1006', 2, [342, 380, 366, 372]);
  // round headlight pods on the hood's corners, chrome rims, amber turn signals below
  for (const [hx, hy, r] of [
    [290, 384, 24],
    [418, 354, 21],
  ]) {
    ell(c, hx + 4, hy - 4, r + 6, r + 4);
    fill(c, red(hx - r, hy - r, hx + r, hy + r));
    ell(c, hx, hy, r * 0.82, r * 0.82);
    fill(c, '#d8d8e0');
    ell(c, hx, hy, r * 0.62, r * 0.62);
    fill(
      c,
      rad(c, hx - 4, hy - 4, r * 0.62, [
        [0, '#ffffff'],
        [1, '#a8b0c0'],
      ]),
    );
  }
  for (const [tx, ty] of [
    [288, 432],
    [470, 384],
  ]) {
    poly(c, [tx - 9, ty - 6, tx + 9, ty - 8, tx + 9, ty + 4, tx - 9, ty + 6]);
    fill(c, '#ffa020');
  }
  // its headlights on: it's getting dark
  glow(c, 290, 384, 90, '#fff4c0', 0.55);
  glow(c, 418, 354, 80, '#fff4c0', 0.5);
  // the black bumper bar across the nose, and the plate
  poly(c, [266, 446, 494, 396, 500, 404, 500, 428, 272, 482, 266, 476]);
  fill(c, '#1a1a1e');
  c.save();
  c.translate(392, 452);
  c.rotate(-0.21);
  poly(c, [-38, -16, 38, -16, 38, 16, -38, 16]);
  fill(c, '#f2c81a');
  stroke(c, '#1a1a1e', 2, [-36, -14, 36, -14, 36, 14, -36, 14, -36, -14]);
  c.fillStyle = '#1a1a1e';
  c.font = '900 19px Arial, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('THE CHEZ', 0, 2, 70);
  c.restore();
  // the near front wheel: small, round, a whitewall and a chrome cap
  ell(c, 276, 500, 26, 34);
  fill(c, '#151515');
  ell(c, 276, 500, 17, 23);
  fill(c, '#f4f4f4');
  ell(c, 278, 500, 9, 12);
  fill(c, '#9a9aa4');
  c.restore();
}

/** Doc Leo, the hobo clown. (x, y) is the ground between his red sneakers; `flip` turns him
 * round so he waves with his other hand and the chicken sits on his other side. */
function docLeo(c: Ctx, x: number, y: number, s: number, flip = false): void {
  c.save();
  c.translate(x, y);
  c.scale(flip ? -s : s, s);
  // grey trousers, red sneakers
  for (const lx of [-20, 20]) {
    poly(c, [lx - 15, -150, lx + 15, -150, lx + 16, -16, lx - 14, -16]);
    fill(
      c,
      lin(c, lx - 15, 0, lx + 15, 0, [
        [0, '#3a3a40'],
        [0.5, '#6a6a74'],
        [1, '#2a2a30'],
      ]),
    );
    blob(c, [lx - 18, -20, lx + 28, -22, lx + 34, 0, lx - 18, 2]);
    fill(c, '#e01e1e');
    stroke(c, '#fff', 3, [lx - 16, -2, lx + 32, -2]);
  }
  // navy corduroy jacket over a purple shirt and a green tie
  blob(c, [-54, -140, -58, -260, -30, -290, 30, -290, 58, -260, 54, -140, 0, -132]);
  fill(
    c,
    lin(c, -58, 0, 58, 0, [
      [0, '#0e1838'],
      [0.4, '#2a3a74'],
      [1, '#0a1230'],
    ]),
  );
  for (let i = -4; i <= 4; i++) stroke(c, 'rgba(0,0,0,0.25)', 1.5, [i * 11, -284, i * 11.5, -144]);
  poly(c, [-20, -290, 20, -290, 12, -200, -12, -200]);
  fill(c, '#7a3aa8');
  poly(c, [-6, -286, 6, -286, 9, -210, 0, -196, -9, -210]);
  fill(c, '#1e9a5a');
  for (const sx of [-1, 1]) stroke(c, '#2a6ad8', 6, [sx * 17, -288, sx * 14, -200, sx * 16, -146]);
  ell(c, -36, -250, 6, 6);
  fill(c, '#ffd23c');
  // one arm waving, the other holding the chicken's leash
  stroke(c, '#1a2a5a', 22, [50, -270, 86, -320, 92, -370]);
  ell(c, 94, -380, 14, 16);
  fill(c, '#fff');
  stroke(c, '#1a2a5a', 22, [-50, -268, -70, -210, -84, -170]);
  ell(c, -86, -164, 12, 12);
  fill(c, '#fff');
  leoFace(c);
  // the chewed-up fedora
  ell(c, 0, -362, 50, 10, -0.08);
  fill(c, '#3a3a3e');
  blob(c, [-30, -364, -28, -398, -4, -392, 6, -404, 28, -396, 32, -364]);
  fill(
    c,
    lin(c, -30, 0, 32, 0, [
      [0, '#2a2a2e'],
      [0.5, '#5a5a62'],
      [1, '#222226'],
    ]),
  );
  stroke(c, '#7a3aa8', 6, [-30, -370, 31, -370]);
  // the rubber chicken on its leash
  stroke(c, '#d81e1e', 3, [-86, -160, -110, -90, -120, -40]);
  c.translate(-128, -22);
  blob(c, [-24, -6, 0, -26, 26, -12, 30, 10, -20, 12]);
  fill(
    c,
    lin(c, 0, -26, 0, 12, [
      [0, '#fff26a'],
      [1, '#d8b010'],
    ]),
  );
  ell(c, -26, -20, 10, 10);
  fill(c, '#ffe84a');
  poly(c, [-36, -20, -46, -16, -36, -14]);
  fill(c, '#ff8a20');
  blob(c, [-28, -34, -22, -38, -20, -28]);
  fill(c, '#e01e1e');
  stroke(c, '#d81e1e', 4, [-16, -12, 6, -2]);
  c.restore();
}

/** Teddy nose-down on the trail, facing right; (x, y) is the ground under his middle. */
function sniffer(c: Ctx, x: number, y: number, s: number): void {
  const [hi, mid, lo] = TEDDY.coat;
  const L = 72;
  const top = -70;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  ell(c, 10, 4, L + 34, 10);
  fill(c, 'rgba(0,0,0,0.35)');
  const leg = (lx: number, back: boolean, len = 0) => {
    blob(c, [lx - 13, top + 10, lx + 13, top + 10, lx + 12, -6 + len, lx - 12, -6 + len]);
    fill(
      c,
      lin(c, 0, top, 0, 0, [
        [0, back ? lo : mid],
        [0.78, back ? lo : mid],
        [0.92, back ? '#d8d0c6' : '#f6efe6'],
      ]),
    );
    ell(c, lx + 4, -5, 15, 8);
    fill(c, back ? '#d8d0c6' : '#fff');
  };
  leg(-L + 30, true);
  leg(L - 30, true);
  // the body, tipped forward a little as his nose goes down
  c.save();
  c.translate(0, top);
  c.rotate(0.1);
  ell(c, 0, 0, L, 36);
  fill(
    c,
    lin(c, 0, -36, 0, 36, [
      [0, hi],
      [0.45, mid],
      [1, lo],
    ]),
  );
  ell(c, 10, 22, L * 0.7, 13);
  fill(c, '#fbf3e8');
  // the fluffy corgi rump, up in the air
  ell(c, -L + 14, -6, 26, 30);
  fill(
    c,
    rad(c, -L + 6, -20, 36, [
      [0, hi],
      [1, mid],
    ]),
  );
  c.restore();
  leg(-L + 46, false);
  leg(L - 16, false);
  // chest
  blob(c, [L - 34, top - 12, L + 10, top - 20, L + 26, top + 26, L - 10, top + 40]);
  fill(c, '#fffaf0');
  // the head, down low, the muzzle pointing at the ground
  const hx = L + 26;
  const hy = top + 12;
  ell(c, hx, hy, 36, 32, 0.4);
  fill(
    c,
    rad(c, hx - 8, hy - 14, 42, [
      [0, hi],
      [0.6, mid],
      [1, lo],
    ]),
  );
  poly(c, [hx - 4, hy - 30, hx + 8, hy - 32, hx + 30, hy + 8, hx + 14, hy + 14]);
  fill(c, '#fffaf0');
  ell(c, hx + 24, hy + 28, 25, 15, 0.95);
  fill(c, '#fffaf0');
  ell(c, hx + 38, hy + 46, 9, 7, 0.9);
  fill(c, TEDDY.nose);
  ell(c, hx + 38, hy + 42, 3, 2);
  fill(c, 'rgba(255,255,255,0.6)');
  stroke(c, '#7a3a2a', 2, [hx + 14, hy + 40, hx + 26, hy + 48]);
  // eyes on the trail, a happy brow above each
  for (const [ex, ey, er] of [
    [hx + 12, hy - 6, 6],
    [hx - 6, hy - 10, 5],
  ]) {
    ell(c, ex, ey, er, er * 1.15);
    fill(c, TEDDY.eye);
    ell(c, ex + 1.5, ey + er * 0.35, er * 0.35, er * 0.35);
    fill(c, '#fff');
    c.beginPath();
    c.arc(ex, ey - er * 0.2, er + 3, Math.PI * 1.2, Math.PI * 1.8);
    c.lineWidth = 2;
    c.strokeStyle = lo;
    c.stroke();
  }
  // the ears, pricked forward, both the same height
  for (const [bx, tx, ty] of [
    [hx - 24, hx - 22, hy - 92],
    [hx + 4, hx + 22, hy - 92],
  ]) {
    poly(c, [bx - 14, hy - 16, tx, ty, bx + 18, hy - 22]);
    fill(
      c,
      lin(c, 0, ty, 0, hy, [
        [0, lo],
        [0.3, mid],
        [1, mid],
      ]),
    );
    poly(c, [bx - 6, hy - 20, tx + 1, ty + 18, bx + 10, hy - 23]);
    fill(c, '#f4a0a0');
  }
  // sniff, sniff
  for (const [ax, ay, r] of [
    [hx + 50, hy + 40, 8],
    [hx + 54, hy + 38, 14],
  ]) {
    c.beginPath();
    c.arc(ax, ay, r, -0.9, 0.5);
    c.lineWidth = 2.5;
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.stroke();
  }
  c.restore();
}

/** Gwinn sitting up straight (for once) with her blue rosette, facing left; (x, y) is the
 * ground under her. */
function sitter(c: Ctx, x: number, y: number, s: number): void {
  const [hi, mid, lo] = GWINN.coat;
  c.save();
  c.translate(x, y);
  c.scale(-s, s);
  ell(c, -10, 4, 90, 12);
  fill(c, 'rgba(0,0,0,0.35)');
  // her tail, curled round on the ground, for once not wagging
  stroke(c, mid, 11, [-80, -18, -60, -4, -20, -2, 10, -6]);
  // the haunch and the back foot
  ell(c, -30, -54, 54, 52);
  fill(
    c,
    rad(c, -46, -84, 70, [
      [0, hi],
      [0.55, mid],
      [1, lo],
    ]),
  );
  ell(c, -2, -8, 32, 10);
  fill(c, lo);
  // the body, upright
  blob(c, [-66, -74, -50, -156, 0, -200, 48, -176, 58, -96, 36, -30, -24, -24]);
  fill(
    c,
    lin(c, -66, 0, 58, 0, [
      [0, lo],
      [0.45, mid],
      [1, hi],
    ]),
  );
  blob(c, [20, -170, 52, -160, 56, -100, 34, -60, 22, -110]);
  fill(c, '#e8d0c0');
  // front legs, straight as a judge could ask
  for (const [lx, back] of [
    [20, true],
    [46, false],
  ] as const) {
    blob(c, [lx - 11, -128, lx + 12, -128, lx + 12, -8, lx - 10, -8]);
    fill(
      c,
      lin(
        c,
        lx - 11,
        0,
        lx + 12,
        0,
        back
          ? [
              [0, lo],
              [1, mid],
            ]
          : [
              [0, mid],
              [0.6, hi],
              [1, mid],
            ],
      ),
    );
    ell(c, lx + 6, -6, 15, 8);
    fill(c, back ? lo : mid);
  }
  // the head, chin up
  const hx = 50;
  const hy = -214;
  c.save();
  c.translate(hx, hy);
  c.rotate(-0.12);
  ell(c, 0, 0, 40, 35);
  fill(
    c,
    rad(c, -8, -14, 44, [
      [0, hi],
      [0.6, mid],
      [1, lo],
    ]),
  );
  stroke(c, GWINN.collar!, 10, [-34, 16, -16, 32, 4, 38, 18, 36]);
  ell(c, 30, 10, 28, 18, 0.1);
  fill(
    c,
    lin(c, 0, 0, 0, 26, [
      [0, hi],
      [1, mid],
    ]),
  );
  ell(c, 56, 2, 9, 7);
  fill(c, GWINN.nose);
  ell(c, 54, -1, 3, 2);
  fill(c, 'rgba(255,255,255,0.5)');
  // a proud, closed-mouth smile with the tip of her tongue
  blob(c, [24, 18, 50, 14, 42, 26, 28, 26]);
  fill(c, '#3a0a0a');
  blob(c, [32, 22, 42, 22, 42, 34, 34, 34]);
  fill(c, '#ff6f8a');
  for (const [ex, ey, er] of [
    [16, -8, 6],
    [-2, -10, 5],
  ]) {
    ell(c, ex, ey, er, er * 1.15);
    fill(c, GWINN.eye);
    ell(c, ex, ey, er * 0.5, er * 0.55);
    fill(c, '#2a1408');
    ell(c, ex + 1.5, ey - 2, er * 0.35, er * 0.35);
    fill(c, '#fff');
  }
  for (const ex of [-26, -4]) {
    blob(c, [ex - 8, -30, ex + 14, -32, ex + 10, 8, ex - 4, 10]);
    fill(c, lo);
  }
  c.restore();
  // the blue rosette pinned to her collar
  rosette(c, hx + 8, hy + 52, 1);
  c.restore();
}

/** A first-place rosette: ruffled blue rings, a gold button and two notched tails. */
function rosette(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  for (const [tx, rot] of [
    [-8, 0.18],
    [8, -0.12],
  ]) {
    c.save();
    c.translate(tx, 6);
    c.rotate(rot);
    poly(c, [-8, 0, 8, 0, 9, 46, 0, 38, -9, 46]);
    fill(
      c,
      lin(c, -8, 0, 8, 0, [
        [0, '#123a8a'],
        [0.5, '#2a6ad8'],
        [1, '#123a8a'],
      ]),
    );
    c.restore();
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ell(c, Math.cos(a) * 15, Math.sin(a) * 15, 8, 8);
    fill(c, i % 2 ? '#1d5fb8' : '#3a82ea');
  }
  ell(c, 0, 0, 14, 14);
  fill(c, '#0e3a8a');
  ell(c, 0, 0, 9, 9);
  fill(
    c,
    rad(c, -3, -3, 10, [
      [0, '#fff4b0'],
      [1, '#e0a810'],
    ]),
  );
  c.restore();
}

/** The Ferris wheel, lit up. */
function ferris(c: Ctx, x: number, y: number, R: number, ground: number): void {
  // the A-frame legs
  for (const dx of [-0.55, 0.55]) stroke(c, '#2a1840', 8, [x, y, x + dx * R, ground]);
  stroke(c, '#2a1840', 5, [x - 0.3 * R, y + 0.55 * R, x + 0.3 * R, y + 0.55 * R]);
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    stroke(c, 'rgba(255,220,240,0.55)', 2, [x, y, x + Math.cos(a) * R, y + Math.sin(a) * R]);
  }
  for (const rr of [R, R * 0.93]) {
    c.beginPath();
    c.arc(x, y, rr, 0, Math.PI * 2);
    c.lineWidth = 4;
    c.strokeStyle = '#ffd8ec';
    c.stroke();
  }
  glow(c, x, y, R * 1.15, '#ff4a9a', 0.25);
  const cols = ['#ffd23f', '#ff5aa8', '#6ae0ff', '#ffffff'];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const bx = x + Math.cos(a) * R;
    const by = y + Math.sin(a) * R;
    glow(c, bx, by, 9, cols[i % 4], 0.8);
    ell(c, bx, by, 2.2, 2.2);
    fill(c, '#fff');
  }
  // the gondolas, hanging straight down
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.13;
    const gx = x + Math.cos(a) * R;
    const gy = y + Math.sin(a) * R;
    stroke(c, '#2a1840', 2, [gx, gy, gx, gy + 8]);
    blob(c, [gx - 13, gy + 8, gx + 13, gy + 8, gx + 10, gy + 24, gx - 10, gy + 24]);
    fill(c, ['#d9381e', '#ffd23f', '#1d5fb8', '#1e9a5a'][i % 4]);
  }
  ell(c, x, y, 10, 10);
  fill(c, '#ffe890');
  glow(c, x, y, 40, '#fff0b0', 0.7);
}

/** THE BIG DROP: a tall lattice tower, its ring of seats near the top. */
function dropTower(c: Ctx, x: number, top: number, ground: number): void {
  poly(c, [x - 14, ground, x - 10, top, x + 10, top, x + 14, ground]);
  fill(
    c,
    lin(c, x - 14, 0, x + 14, 0, [
      [0, '#1a1030'],
      [0.5, '#4a3a6a'],
      [1, '#1a1030'],
    ]),
  );
  for (let yy = top + 10; yy < ground; yy += 16) stroke(c, 'rgba(255,255,255,0.18)', 1.5, [x - 12, yy, x + 12, yy + 16]);
  // the chasing lights up its face
  for (let yy = top + 14; yy < ground - 10; yy += 18) {
    const col = (yy / 18) % 3 < 1 ? '#ff5aa8' : (yy / 18) % 3 < 2 ? '#ffd23f' : '#6ae0ff';
    glow(c, x, yy, 10, col, 0.7);
    ell(c, x, yy, 2, 2);
    fill(c, '#fff');
  }
  // the crown
  poly(c, [x - 26, top + 6, x - 18, top - 16, x + 18, top - 16, x + 26, top + 6]);
  fill(c, '#d9381e');
  for (let i = 0; i < 7; i++) (ell(c, x - 18 + i * 6, top - 4, 2, 2), fill(c, '#ffe890'));
  glow(c, x, top - 6, 46, '#ff6a40', 0.6);
  glow(c, x, top - 30, 8, '#ff2020', 1);
  // the seats, riders' legs dangling, held at the top
  const sy = top + 70;
  ell(c, x, sy, 54, 12);
  fill(c, '#ffd23f');
  ell(c, x, sy - 3, 54, 8);
  fill(c, '#fff4b0');
  for (let i = -4; i <= 4; i++) {
    if (!i) continue;
    stroke(c, '#2a1840', 3, [x + i * 11, sy + 8, x + i * 11 + 1, sy + 22]);
  }
  glow(c, x, sy, 70, '#ffd23f', 0.35);
}

/** A striped midway booth, lit inside. */
function booth(c: Ctx, x: number, bw: number, ground: number, a: string, b: string): void {
  const bh = bw * 0.7;
  poly(c, [x, ground, x, ground - bh, x + bw, ground - bh, x + bw, ground]);
  fill(c, '#3a1a2a');
  poly(c, [x + 8, ground, x + 8, ground - bh + 22, x + bw - 8, ground - bh + 22, x + bw - 8, ground]);
  fill(
    c,
    lin(c, 0, ground - bh, 0, ground, [
      [0, '#fff0b0'],
      [1, '#ff9a3a'],
    ]),
  );
  const n = 6;
  for (let i = 0; i < n; i++) {
    poly(c, [x - 6 + (i * (bw + 12)) / n, ground - bh + 24, x - 6 + ((i + 1) * (bw + 12)) / n, ground - bh + 24, x + bw / 2, ground - bh - 26]);
    fill(c, i % 2 ? b : a);
  }
  glow(c, x + bw / 2, ground - bh / 2 + 10, bw * 0.8, '#ffb040', 0.35);
}

/** A string of fair lights hung in a sag between two points. */
function lights(c: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, n: number): void {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 + sag;
  c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo(mx, my, x1, y1);
  c.lineWidth = 1.5;
  c.strokeStyle = '#1a1020';
  c.stroke();
  const cols = ['#ffd23f', '#ff5a5a', '#6ae0ff', '#9aff6a', '#ff9a3a'];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
    const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1 + 4;
    glow(c, bx, by, 12, cols[i % 5], 0.75);
    ell(c, bx, by, 2.6, 3.2);
    fill(c, '#fffbe8');
  }
}

/** A firework bursting: streaks of light falling away from the middle, sparks at their ends. */
function firework(c: Ctx, x: number, y: number, r: number, color: string, seed: string): void {
  const rnd = seeded(seed);
  glow(c, x, y, r * 1.2, color, 0.35);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.1;
    const len = r * (0.75 + rnd() * 0.25);
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len + len * 0.12;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2);
    c.quadraticCurveTo(x + Math.cos(a) * len * 0.7, y + Math.sin(a) * len * 0.7, ex, ey);
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.strokeStyle = color;
    c.globalAlpha = 0.6;
    c.stroke();
    c.globalAlpha = 1;
    ell(c, ex, ey, 2.2, 2.2);
    fill(c, '#fff');
  }
  c.restore();
}

/** The scent: a faint green wisp along the ground, from Teddy's nose to Gwinn. */
function scent(c: Ctx, pts: number[]): void {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [wd, a, dy] of [
    [16, 0.12, 0],
    [8, 0.25, -3],
    [3, 0.55, 2],
  ]) {
    c.beginPath();
    c.moveTo(pts[0], pts[1] + dy);
    for (let i = 2; i < pts.length - 2; i += 2) {
      const mx = (pts[i] + pts[i + 2]) / 2;
      const my = (pts[i + 1] + pts[i + 3]) / 2 + dy;
      c.quadraticCurveTo(pts[i], pts[i + 1] + dy, mx, my);
    }
    c.lineTo(pts[pts.length - 2], pts[pts.length - 1] + dy);
    c.lineWidth = wd;
    c.lineCap = 'round';
    c.strokeStyle = `rgba(120,255,140,${a})`;
    c.stroke();
  }
  c.restore();
  const rnd = seeded('teddy2-scent');
  for (let i = 0; i < 12; i++) {
    const k = Math.floor(rnd() * (pts.length / 2 - 1)) * 2;
    glow(c, pts[k] + rnd() * 16 - 8, pts[k + 1] + rnd() * 16 - 12, 6, '#9aff9a', 0.8);
  }
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('teddy2-cover');
  const ground = 410;
  // sunset going to night over the Tri-County Fair
  c.fillStyle = lin(c, 0, 0, 0, ground, [
    [0, '#0e0a34'],
    [0.42, '#3a1a6a'],
    [0.7, '#a83a72'],
    [0.88, '#ff7a3a'],
    [1, '#ffc060'],
  ]);
  c.fillRect(0, 0, w, ground);
  stars(c, w, 260, 70, 'teddy2-stars');
  firework(c, 300, 92, 86, '#ffd23f', 'fw1');
  firework(c, 70, 70, 56, '#9aff6a', 'fw2');
  firework(c, 452, 160, 58, '#6ae0ff', 'fw3');
  firework(c, 444, 282, 46, '#ff5aa8', 'fw4');
  // far hills and the treeline
  blob(c, [-40, ground, -20, ground - 48, 120, ground - 56, 260, ground - 38, 400, ground - 60, 560, ground - 44, 660, ground - 52, 660, ground]);
  fill(c, '#3a1a3e');
  ferris(c, 140, 262, 136, ground);
  dropTower(c, 520, 110, ground);
  // the midway's back row of booths
  booth(c, 236, 92, ground + 6, '#d9381e', '#fff4e0');
  booth(c, 340, 80, ground + 6, '#1d5fb8', '#ffd23f');
  booth(c, -20, 70, ground + 6, '#1e9a5a', '#fff4e0');
  // the midway
  c.fillStyle = lin(c, 0, ground, 0, h, [
    [0, '#7a4a3a'],
    [0.35, '#4a2a2a'],
    [1, '#1e1018'],
  ]);
  c.fillRect(0, ground, w, h - ground);
  glow(c, 300, ground + 60, 280, '#ffb050', 0.28);
  // straw and popcorn about the trampled ground
  for (let i = 0; i < 60; i++) {
    const px = r() * w;
    const py = ground + 10 + r() * (h - ground - 10);
    if (i % 3) stroke(c, 'rgba(255,214,120,0.5)', 1.5, [px, py, px + 6 + r() * 6, py - 2 + r() * 4]);
    else (ell(c, px, py, 2.5, 2), fill(c, 'rgba(255,248,220,0.7)'));
  }
  // string lights over the midway
  stroke(c, '#1a1020', 5, [26, ground + 30, 26, 294]);
  stroke(c, '#1a1020', 5, [590, ground + 30, 590, 280]);
  lights(c, 26, 296, 590, 282, 64, 22);
  lights(c, 26, 320, 300, 246, 44, 10);
  citicar(c, 246, 462, 0.5);
  docLeo(c, 344, 508, 0.62, true);
  sitter(c, 520, 560, 0.92);
  sniffer(c, 254, 548, 1.0);
  // the trail from Teddy's nose to Gwinn
  scent(c, [356, 542, 384, 536, 412, 544, 440, 530, 462, 536, 478, 520, 488, 510]);
  // confetti (the Clown Club was here)
  for (let i = 0; i < 30; i++) {
    c.fillStyle = ['#d9381e', '#ffd23f', '#1d5fb8', '#1e9a5a', '#ff5aa8'][i % 5];
    c.save();
    c.translate(r() * w, 280 + r() * 200);
    c.rotate(r() * 3);
    c.fillRect(-4, -2, 8, 4);
    c.restore();
  }
  finish(c, w, h, 'teddy2', 0.45);
};
export default paint;
