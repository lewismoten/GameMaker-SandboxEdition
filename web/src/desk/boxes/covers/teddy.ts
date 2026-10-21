// Teddy's Little Big Adventure's cover: Main Street on the afternoon of the Klown Klub's Big
// Show. Teddy grins front and center, Doc Leo the hobo clown (fedora, ash beard, green tie,
// red sneakers, rubber chicken on a leash) waves by his little red CitiCar, and Gwin makes
// off with the costume suitcase.
import { dog, GWIN, TEDDY } from './dog';
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, seeded, stroke } from './paint';

/** The 1976½ CitiCar: a tomato-red wedge with round headlight pods and a tall windshield. */
function citicar(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  ell(c, 0, 4, 130, 14);
  fill(c, 'rgba(0,0,0,0.35)');
  // the cabin: grey roof, tall upright glass
  poly(c, [-40, -70, -30, -150, 70, -150, 84, -70]);
  fill(c, lin(c, 0, -150, 0, -70, [
    [0, '#9ad4ff'],
    [1, '#2a5a8a'],
  ]));
  poly(c, [-36, -150, 74, -150, 72, -160, -32, -160]);
  fill(c, '#8a8a96');
  stroke(c, '#c01810', 8, [16, -150, 20, -72]);
  stroke(c, 'rgba(255,255,255,0.6)', 5, [-20, -140, -4, -84]);
  // the wedge body
  poly(c, [-118, -40, -40, -76, 100, -76, 108, -16, 100, -6, -116, -6, -124, -24]);
  fill(c, lin(c, 0, -76, 0, -6, [
    [0, '#ff7a5a'],
    [0.4, '#e8321e'],
    [1, '#8a1408'],
  ]));
  stroke(c, '#fff', 2, [-110, -30, 100, -40]);
  // headlight pods, the bumper bar, small whitewall tires
  for (const hx of [-104, -78]) {
    ell(c, hx, -46, 11, 11);
    fill(c, '#c01810');
    ell(c, hx, -46, 7, 7);
    fill(c, '#fff8d0');
    glow(c, hx, -46, 20, '#fff2a0', 0.5);
  }
  stroke(c, '#151515', 9, [-126, -16, -40, -14]);
  for (const wx of [-74, 66]) {
    ell(c, wx, -6, 22, 22);
    fill(c, '#151515');
    ell(c, wx, -6, 13, 13);
    fill(c, '#f4f4f4');
    ell(c, wx, -6, 7, 7);
    fill(c, '#9a9aa4');
  }
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
    fill(c, lin(c, lx - 15, 0, lx + 15, 0, [
      [0, '#3a3a40'],
      [0.5, '#6a6a74'],
      [1, '#2a2a30'],
    ]));
    blob(c, [lx - 18, -20, lx + 28, -22, lx + 34, 0, lx - 18, 2]);
    fill(c, '#e01e1e');
    stroke(c, '#fff', 3, [lx - 16, -2, lx + 32, -2]);
  }
  // navy corduroy jacket over a purple shirt and a green tie
  blob(c, [-54, -140, -58, -260, -30, -290, 30, -290, 58, -260, 54, -140, 0, -132]);
  fill(c, lin(c, -58, 0, 58, 0, [
    [0, '#0e1838'],
    [0.4, '#2a3a74'],
    [1, '#0a1230'],
  ]));
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
  fill(c, rad(c, -3, -325, 10, [
    [0, '#ffb0a0'],
    [1, '#d82020'],
  ]));
  // the chewed-up fedora
  ell(c, 0, -362, 50, 10, -0.08);
  fill(c, '#3a3a3e');
  blob(c, [-30, -364, -28, -398, -4, -392, 6, -404, 28, -396, 32, -364]);
  fill(c, lin(c, -30, 0, 32, 0, [
    [0, '#2a2a2e'],
    [0.5, '#5a5a62'],
    [1, '#222226'],
  ]));
  stroke(c, '#7a3aa8', 6, [-30, -370, 31, -370]);
  // the rubber chicken on its leash
  stroke(c, '#d81e1e', 3, [-86, -160, -110, -90, -120, -40]);
  c.translate(-128, -22);
  blob(c, [-24, -6, 0, -26, 26, -12, 30, 10, -20, 12]);
  fill(c, lin(c, 0, -26, 0, 12, [
    [0, '#fff26a'],
    [1, '#d8b010'],
  ]));
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
    fill(c, lin(c, x, 0, x + sw, 0, [
      [0, wall],
      [1, '#2a1a1a'],
    ]));
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
    fill(c, rad(c, bx - 8, by - 10, 30, [
      [0, '#fff'],
      [0.25, col],
      [1, '#2a0a0a'],
    ]));
  }
  for (const [bx, by, rx, ry] of [
    [60, 210, 24, 12],
    [94, 196, 12, 18],
    [104, 226, 8, 16],
    [36, 226, 8, 16],
    [32, 200, 12, 7],
  ])
    (ell(c, bx, by, rx, ry), fill(c, rad(c, bx - 4, by - 4, rx + 6, [[0, '#ffd0f0'], [1, '#ff5aa8']])));
  citicar(c, 440, 520, 1.15);
  docLeo(c, 150, 600, 0.95);
  // Gwin dashing off with the costume suitcase
  dog(c, 480, 600, 0.55, GWIN);
  c.save();
  c.translate(480 + 112 * 0.55, 600 - 140 * 0.55);
  c.rotate(0.15);
  poly(c, [-16, -4, 30, -4, 30, 26, -16, 26]);
  fill(c, lin(c, 0, -4, 0, 26, [
    [0, '#c88a4a'],
    [1, '#6a3a12'],
  ]));
  stroke(c, '#3a1a06', 3, [0, -4, 4, -12, 12, -12, 16, -4]);
  stroke(c, '#ffd23c', 3, [-16, 8, 30, 8]);
  c.restore();
  dog(c, 290, 640, 1.18, TEDDY);
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
