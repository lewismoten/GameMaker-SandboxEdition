// Teddy's Little Big Adventure's cover: Main Street on the afternoon of the Klown Klub's Big
// Show. Teddy grins front and center, Doc Leo the hobo clown (fedora, ash beard, green tie,
// red sneakers, rubber chicken on a leash) waves by his little red CitiCar, and Gwinn makes
// off with the costume suitcase.
import { dog, GWINN, TEDDY } from './dog';
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, seeded, stroke } from './paint';

/** The 1976½ CitiCar, seen from its front corner as it sits in the photo: a short tomato-red
 * wedge, the hood sloping straight up into a big flat windshield, a tall boxy cabin with a black
 * roof, round headlight pods on the hood's corners, a black bumper with "THE CHEZ" on its plate,
 * and little whitewall wheels. Drawn in the photo's own coordinates (ground under the middle at
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

/** Doc Leo, the hobo clown. (x, y) is the ground between his red sneakers. */
function docLeo(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
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
  ell(c, -36, -250, 6, 6);
  fill(c, '#ffd23c');
  // one arm waving, the other holding the chicken's leash
  stroke(c, '#1a2a5a', 22, [50, -270, 86, -320, 92, -370]);
  ell(c, 94, -380, 14, 16);
  fill(c, '#fff');
  stroke(c, '#1a2a5a', 22, [-50, -268, -70, -210, -84, -170]);
  ell(c, -86, -164, 12, 12);
  fill(c, '#fff');
  // face: white mouth and eyes, rosy nose and cheeks, the ash beard, wire glasses
  ell(c, 0, -326, 36, 42);
  fill(c, '#f4c8a4');
  blob(c, [-34, -330, -30, -296, 0, -282, 30, -296, 34, -330, 0, -318]);
  fill(c, 'rgba(60,70,90,0.38)');
  ell(c, 0, -304, 16, 10);
  fill(c, '#fff');
  c.beginPath();
  c.arc(0, -310, 10, 0.3, Math.PI - 0.3);
  c.lineWidth = 3;
  c.strokeStyle = '#8a1010';
  c.stroke();
  for (const ex of [-15, 15]) {
    ell(c, ex, -338, 9, 8);
    fill(c, '#fff');
    ell(c, ex, -338, 3.5, 4);
    fill(c, '#1a1a1a');
    c.beginPath();
    c.arc(ex, -338, 10, 0, Math.PI * 2);
    c.lineWidth = 2;
    c.strokeStyle = '#9a9aa4';
    c.stroke();
    ell(c, ex * 1.6, -318, 7, 5);
    fill(c, 'rgba(240,80,80,0.6)');
  }
  stroke(c, '#1a1a1a', 4, [-24, -354, -6, -350]);
  stroke(c, '#1a1a1a', 4, [24, -354, 6, -350]);
  ell(c, 0, -322, 9, 9);
  fill(
    c,
    rad(c, -3, -325, 10, [
      [0, '#ffb0a0'],
      [1, '#d82020'],
    ]),
  );
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

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('teddy-cover');
  c.fillStyle = lin(c, 0, 0, 0, 440, [
    [0, '#1d5fb8'],
    [0.7, '#7ab8f0'],
    [1, '#ffe0a0'],
  ]);
  c.fillRect(0, 0, w, 440);
  glow(c, 480, 160, 200, '#fff0b0', 0.6);
  // the Big Top past the rooftops
  poly(c, [190, 400, 300, 250, 410, 400]);
  fill(c, '#fff4e0');
  for (let i = 0; i < 6; i++) {
    poly(c, [300, 250, 190 + i * 37, 400, 208 + i * 37, 400]);
    fill(c, '#d9381e');
  }
  poly(c, [298, 252, 298, 222, 322, 230, 298, 238]);
  fill(c, '#ffd23c');
  // Main Street storefronts with striped awnings
  const shop = (x: number, sw: number, sh: number, wall: string, awn: string) => {
    poly(c, [x, 440, x, 440 - sh, x + sw, 440 - sh, x + sw, 440]);
    fill(
      c,
      lin(c, x, 0, x + sw, 0, [
        [0, wall],
        [1, '#2a1a1a'],
      ]),
    );
    for (let i = 0; i < 4; i++) {
      poly(c, [x + (i * sw) / 4, 380, x + ((i + 1) * sw) / 4, 380, x + ((i + 1) * sw) / 4 + 4, 400, x + (i * sw) / 4 + 4, 400]);
      fill(c, i % 2 ? '#fff' : awn);
    }
    poly(c, [x + 12, 404, x + sw - 12, 404, x + sw - 12, 440, x + 12, 440]);
    fill(c, '#ffe8a0');
  };
  shop(-10, 150, 170, '#a0503a', '#1e9a5a');
  shop(420, 200, 150, '#7a5aa0', '#d9381e');
  // bunting across the street
  c.beginPath();
  c.moveTo(0, 300);
  c.quadraticCurveTo(w / 2, 360, w, 290);
  c.lineWidth = 2;
  c.strokeStyle = '#3a2a1a';
  c.stroke();
  for (let i = 1; i < 14; i++) {
    const t = i / 14;
    const bx = t * w;
    const by = (1 - t) * (1 - t) * 300 + 2 * (1 - t) * t * 360 + t * t * 290;
    poly(c, [bx - 12, by, bx + 12, by, bx, by + 22]);
    fill(c, ['#d9381e', '#ffd23c', '#1d5fb8', '#1e9a5a'][i % 4]);
  }
  // the sidewalk and street
  c.fillStyle = lin(c, 0, 440, 0, h, [
    [0, '#b8a890'],
    [1, '#7a6a58'],
  ]);
  c.fillRect(0, 440, w, h - 440);
  stroke(c, '#ffd23c', 6, [0, 520, w, 500]);
  // balloons, and a balloon dog drifting up
  for (const [bx, by, col] of [
    [560, 250, '#d9381e'],
    [520, 210, '#ffd23c'],
    [580, 190, '#1d5fb8'],
  ] as const) {
    stroke(c, '#555', 1.5, [bx, by + 30, 470, 330]);
    ell(c, bx, by, 22, 28);
    fill(
      c,
      rad(c, bx - 8, by - 10, 30, [
        [0, '#fff'],
        [0.25, col],
        [1, '#2a0a0a'],
      ]),
    );
  }
  for (const [bx, by, rx, ry] of [
    [60, 210, 24, 12],
    [94, 196, 12, 18],
    [104, 226, 8, 16],
    [36, 226, 8, 16],
    [32, 200, 12, 7],
  ])
    (ell(c, bx, by, rx, ry),
      fill(
        c,
        rad(c, bx - 4, by - 4, rx + 6, [
          [0, '#ffd0f0'],
          [1, '#ff5aa8'],
        ]),
      ));
  citicar(c, 468, 482, 0.64);
  docLeo(c, 150, 584, 0.95);
  // Gwinn dashing off with the costume suitcase
  dog(c, 480, 574, 0.55, GWINN);
  c.save();
  c.translate(480 + 112 * 0.55, 574 - 140 * 0.55);
  c.rotate(0.15);
  poly(c, [-16, -4, 30, -4, 30, 26, -16, 26]);
  fill(
    c,
    lin(c, 0, -4, 0, 26, [
      [0, '#c88a4a'],
      [1, '#6a3a12'],
    ]),
  );
  stroke(c, '#3a1a06', 3, [0, -4, 4, -12, 12, -12, 16, -4]);
  stroke(c, '#ffd23c', 3, [-16, 8, 30, 8]);
  c.restore();
  dog(c, 290, 604, 1.12, TEDDY);
  // flying confetti
  for (let i = 0; i < 40; i++) {
    c.fillStyle = ['#d9381e', '#ffd23c', '#1d5fb8', '#1e9a5a', '#ff5aa8'][i % 5];
    c.save();
    c.translate(r() * w, 260 + r() * 300);
    c.rotate(r() * 3);
    c.fillRect(-4, -2, 8, 4);
    c.restore();
  }
  finish(c, w, h, 'teddy', 0.45);
};
export default paint;
