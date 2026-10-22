// Quest for the Round Tuit's cover: dusk over Procrastia, the Round Tuit rising like a second
// sun behind Laterburg's roofless castle, a road winding down out of the hills, THE CHEZ
// puttering along it, and in front Pip of Nowish with his sword up, Doc Leo with Sir Reginald
// on his leash, and the royal hounds.
import { dog, GWINN, TEDDY } from './dog';
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, rays, seeded, stars, stroke } from './paint';

/** The Round Tuit: an oak disc ringed in brass, TUIT carved round the face. */
function tuit(c: Ctx, x: number, y: number, r: number): void {
  glow(c, x, y, r * 3.2, '#ffd890', 0.55);
  rays(c, x, y, r * 4, 18, 'rgba(255,220,150,0.5)', 0.35);
  ell(c, x, y, r, r);
  fill(c, rad(c, x - r * 0.3, y - r * 0.3, r * 1.2, [
    [0, '#ffe8a0'],
    [0.75, '#d89a40'],
    [1, '#8a5a1a'],
  ]));
  ell(c, x, y, r * 0.84, r * 0.84);
  fill(c, rad(c, x - r * 0.2, y - r * 0.2, r, [
    [0, '#d8a060'],
    [1, '#9a6430'],
  ]));
  c.save();
  c.strokeStyle = 'rgba(90,50,20,0.45)';
  for (let k = 1; k < 6; k++) {
    c.lineWidth = 1.2;
    ell(c, x, y, r * 0.14 * k, r * 0.14 * k);
    c.stroke();
  }
  c.fillStyle = '#5a3414';
  c.font = `bold ${Math.round(r * 0.34)}px Georgia, serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  'TUIT'.split('').forEach((ch, i) => {
    const a = -Math.PI / 2 + (i - 1.5) * 0.5;
    c.save();
    c.translate(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
    c.rotate(a + Math.PI / 2);
    c.fillText(ch, 0, 0);
    c.restore();
  });
  c.restore();
}

function castle(c: Ctx, x: number, base: number, s: number): void {
  const col = '#2e2346';
  const tower = (tx: number, w: number, h: number) => {
    c.fillStyle = col;
    c.fillRect(tx, base - h, w, h);
    poly(c, [tx - w * 0.15, base - h, tx + w / 2, base - h - w * 1.4, tx + w * 1.15, base - h]);
    fill(c, '#3c2d5c');
    c.fillStyle = '#ffd27a';
    c.fillRect(tx + w * 0.4, base - h * 0.7, w * 0.2, w * 0.35);
  };
  c.fillStyle = col;
  c.fillRect(x, base - 52 * s, 180 * s, 52 * s);
  for (let k = 0; k < 180 * s; k += 12 * s) c.fillRect(x + k, base - 60 * s, 6 * s, 8 * s);
  tower(x - 12 * s, 28 * s, 88 * s);
  tower(x + 164 * s, 28 * s, 88 * s);
  tower(x + 66 * s, 50 * s, 124 * s);
  c.fillStyle = '#ffd27a';
  for (const wx of [20, 48, 128, 150]) c.fillRect(x + wx * s, base - 32 * s, 5 * s, 9 * s);
  // pennants
  for (const [px, color] of [
    [x + 2 * s, '#d83a30'],
    [x + 178 * s, '#3a5ad8'],
  ] as [number, string][]) {
    stroke(c, '#2a2030', 2, [px, base - 88 * s - 40 * s, px, base - 88 * s - 70 * s]);
    poly(c, [px, base - 88 * s - 70 * s, px + 26 * s, base - 88 * s - 64 * s, px, base - 88 * s - 58 * s]);
    fill(c, color);
  }
}

/** Pip of Nowish: red feathered cap, green tunic, sword raised. */
function pip(c: Ctx, x: number, y: number, s: number): void {
  ell(c, x, y, 40 * s, 10 * s);
  fill(c, 'rgba(0,0,0,0.35)');
  // legs and boots
  for (const dx of [-14, 10]) {
    c.fillStyle = '#c8945a';
    c.fillRect(x + dx * s, y - 50 * s, 12 * s, 40 * s);
    c.fillStyle = '#4a2a14';
    c.fillRect(x + (dx - 2) * s, y - 14 * s, 16 * s, 14 * s);
  }
  // tunic
  blob(c, [x - 34 * s, y - 50 * s, x - 30 * s, y - 120 * s, x + 30 * s, y - 120 * s, x + 34 * s, y - 50 * s]);
  fill(c, lin(c, x - 34 * s, 0, x + 34 * s, 0, [
    [0, '#2e7a3a'],
    [0.5, '#58b050'],
    [1, '#1e5a2a'],
  ]));
  c.fillStyle = '#6a4020';
  c.fillRect(x - 32 * s, y - 70 * s, 64 * s, 9 * s);
  c.fillStyle = '#f0c040';
  c.fillRect(x - 6 * s, y - 72 * s, 12 * s, 12 * s);
  // the sword arm, raised; the blade catching the Tuit's light
  stroke(c, '#f2c8a0', 12 * s, [x + 24 * s, y - 112 * s, x + 46 * s, y - 150 * s]);
  stroke(c, lin(c, 0, y - 290 * s, 0, y - 150 * s, [
    [0, '#ffffff'],
    [1, '#9aa4c0'],
  ]), 9 * s, [x + 50 * s, y - 156 * s, x + 62 * s, y - 290 * s]);
  stroke(c, '#e0b040', 8 * s, [x + 34 * s, y - 154 * s, x + 66 * s, y - 158 * s]);
  glow(c, x + 62 * s, y - 290 * s, 40 * s, '#ffffff', 0.6);
  stroke(c, '#f2c8a0', 12 * s, [x - 26 * s, y - 112 * s, x - 40 * s, y - 70 * s]);
  // head, hair, cap and feather
  ell(c, x, y - 146 * s, 30 * s, 32 * s);
  fill(c, rad(c, x - 8 * s, y - 154 * s, 40 * s, [
    [0, '#ffe0c0'],
    [1, '#d09070'],
  ]));
  blob(c, [x - 32 * s, y - 150 * s, x - 30 * s, y - 182 * s, x + 30 * s, y - 182 * s, x + 32 * s, y - 150 * s, x + 20 * s, y - 166 * s, x - 20 * s, y - 166 * s]);
  fill(c, '#6a3a1a');
  blob(c, [x - 36 * s, y - 168 * s, x - 24 * s, y - 200 * s, x + 24 * s, y - 204 * s, x + 42 * s, y - 172 * s]);
  fill(c, lin(c, 0, y - 204 * s, 0, y - 168 * s, [
    [0, '#ff6a50'],
    [1, '#a01818'],
  ]));
  stroke(c, '#ffffff', 7 * s, [x + 30 * s, y - 188 * s, x + 64 * s, y - 214 * s]);
  for (const dx of [-11, 11]) {
    ell(c, x + dx * s, y - 146 * s, 4 * s, 5 * s);
    fill(c, '#2a1a10');
  }
  stroke(c, '#a05040', 3 * s, [x - 8 * s, y - 128 * s, x, y - 124 * s, x + 8 * s, y - 128 * s]);
}

/** Doc Leo: grey felt fedora, ash-beard stubble, red nose, navy corduroy, green tie, red sneakers. */
function docLeo(c: Ctx, x: number, y: number, s: number): void {
  ell(c, x, y, 34 * s, 9 * s);
  fill(c, 'rgba(0,0,0,0.35)');
  for (const dx of [-14, 6]) {
    c.fillStyle = '#28305a';
    c.fillRect(x + dx * s, y - 52 * s, 12 * s, 42 * s);
    ell(c, x + (dx + 6) * s, y - 6 * s, 12 * s, 7 * s);
    fill(c, '#e02a2a');
  }
  blob(c, [x - 30 * s, y - 48 * s, x - 28 * s, y - 116 * s, x + 28 * s, y - 116 * s, x + 30 * s, y - 48 * s]);
  fill(c, lin(c, x - 30 * s, 0, x + 30 * s, 0, [
    [0, '#1e2448'],
    [0.5, '#34407a'],
    [1, '#1a1e3a'],
  ]));
  poly(c, [x - 10 * s, y - 116 * s, x + 10 * s, y - 116 * s, x + 4 * s, y - 70 * s, x - 4 * s, y - 70 * s]);
  fill(c, '#8a4ab0');
  poly(c, [x - 4 * s, y - 112 * s, x + 4 * s, y - 112 * s, x + 6 * s, y - 80 * s, x, y - 74 * s, x - 6 * s, y - 80 * s]);
  fill(c, '#2a9a6a');
  ell(c, x, y - 140 * s, 26 * s, 28 * s);
  fill(c, '#f6e6da');
  blob(c, [x - 24 * s, y - 136 * s, x + 24 * s, y - 136 * s, x + 20 * s, y - 116 * s, x - 20 * s, y - 116 * s]);
  fill(c, 'rgba(60,70,90,0.55)');
  ell(c, x, y - 126 * s, 10 * s, 6 * s);
  fill(c, '#ffffff');
  ell(c, x, y - 138 * s, 6 * s, 5 * s);
  fill(c, '#e02a2a');
  for (const dx of [-10, 10]) {
    ell(c, x + dx * s, y - 148 * s, 3 * s, 3 * s);
    fill(c, '#1a1010');
  }
  ell(c, x, y - 164 * s, 42 * s, 8 * s);
  fill(c, '#6a6a76');
  blob(c, [x - 24 * s, y - 164 * s, x - 20 * s, y - 196 * s, x + 20 * s, y - 196 * s, x + 24 * s, y - 164 * s]);
  fill(c, lin(c, 0, y - 196 * s, 0, y - 164 * s, [
    [0, '#8a8a96'],
    [1, '#5a5a66'],
  ]));
  for (const [px, color] of [
    [-10, '#ffd040'],
    [4, '#40a0ff'],
  ] as [number, string][]) {
    ell(c, x + px * s, y - 178 * s, 3 * s, 3 * s);
    fill(c, color);
  }
  // the leash, and Sir Reginald Cluckington III at the end of it
  stroke(c, '#c02020', 3 * s, [x - 28 * s, y - 80 * s, x - 60 * s, y - 40 * s, x - 76 * s, y - 24 * s]);
  ell(c, x - 88 * s, y - 20 * s, 18 * s, 13 * s);
  fill(c, rad(c, x - 92 * s, y - 26 * s, 20 * s, [
    [0, '#fff090'],
    [1, '#e0b020'],
  ]));
  ell(c, x - 104 * s, y - 36 * s, 8 * s, 8 * s);
  fill(c, '#f0c830');
  poly(c, [x - 114 * s, y - 36 * s, x - 124 * s, y - 33 * s, x - 113 * s, y - 31 * s]);
  fill(c, '#f08020');
  stroke(c, '#c02020', 4 * s, [x - 96 * s, y - 28 * s, x - 80 * s, y - 14 * s]);
}

/** THE CHEZ: a little tomato-red wedge with a huge windshield. */
function chez(c: Ctx, x: number, y: number, s: number): void {
  ell(c, x, y + 4 * s, 34 * s, 6 * s);
  fill(c, 'rgba(0,0,0,0.3)');
  poly(c, [x - 34 * s, y - 6 * s, x - 22 * s, y - 14 * s, x - 6 * s, y - 34 * s, x + 26 * s, y - 34 * s, x + 32 * s, y - 6 * s, x + 32 * s, y + 2 * s, x - 34 * s, y + 2 * s]);
  fill(c, lin(c, 0, y - 34 * s, 0, y + 2 * s, [
    [0, '#ff7a60'],
    [1, '#b02018'],
  ]));
  poly(c, [x - 14 * s, y - 14 * s, x - 2 * s, y - 30 * s, x + 8 * s, y - 30 * s, x + 4 * s, y - 12 * s]);
  fill(c, '#a8d8f0');
  for (const wx of [-22, 22]) {
    ell(c, x + wx * s, y + 2 * s, 8 * s, 8 * s);
    fill(c, '#1a1a1a');
    ell(c, x + wx * s, y + 2 * s, 4 * s, 4 * s);
    fill(c, '#e8e8e8');
  }
  ell(c, x - 30 * s, y - 8 * s, 3 * s, 3 * s);
  fill(c, '#fff8c0');
  glow(c, x - 34 * s, y - 8 * s, 30 * s, '#fff0b0', 0.5);
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('realm-cover');
  void r;
  c.fillStyle = lin(c, 0, 0, 0, h * 0.62, [
    [0, '#12123a'],
    [0.4, '#4a2c6a'],
    [0.75, '#e07850'],
    [1, '#ffc880'],
  ]);
  c.fillRect(0, 0, w, h);
  stars(c, w, h * 0.3, 70, 'realm');
  tuit(c, w * 0.5, h * 0.4, w * 0.13);
  // far hills going blue with distance, the castle on the middle one
  blob(c, [-40, h * 0.6, w * 0.2, h * 0.5, w * 0.45, h * 0.56, w * 0.7, h * 0.48, w + 40, h * 0.58, w + 40, h * 0.7, -40, h * 0.7]);
  fill(c, '#5a4a7a');
  castle(c, w * 0.5 - 90 * (w / 640), h * 0.58, w / 640);
  blob(c, [-40, h * 0.66, w * 0.25, h * 0.6, w * 0.5, h * 0.64, w * 0.8, h * 0.59, w + 40, h * 0.64, w + 40, h * 0.8, -40, h * 0.8]);
  fill(c, lin(c, 0, h * 0.6, 0, h * 0.8, [
    [0, '#3a4a5a'],
    [1, '#2a3a3a'],
  ]));
  // the meadow and a road that winds down out of the hills toward us
  c.fillStyle = lin(c, 0, h * 0.68, 0, h, [
    [0, '#3a6a3a'],
    [1, '#5a9a40'],
  ]);
  c.fillRect(0, h * 0.7, w, h * 0.3);
  blob(c, [-40, h * 0.72, w * 0.3, h * 0.68, w * 0.6, h * 0.72, w + 40, h * 0.69, w + 40, h * 0.78, -40, h * 0.78]);
  fill(c, '#467a3e');
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = lin(c, 0, h * 0.6, 0, h, [
    [0, '#a88a60'],
    [1, '#d8b080'],
  ]);
  c.beginPath();
  c.moveTo(w * 0.5, h * 0.6);
  c.bezierCurveTo(w * 0.7, h * 0.66, w * 0.25, h * 0.72, w * 0.55, h * 0.8);
  c.bezierCurveTo(w * 0.8, h * 0.88, w * 0.6, h * 0.95, w * 0.52, h + 20);
  for (const [lw, a] of [
    [w * 0.11, 1],
  ] as [number, number][]) {
    c.lineWidth = lw;
    c.globalAlpha = a;
    c.stroke();
  }
  c.lineWidth = w * 0.004;
  c.setLineDash([w * 0.02, w * 0.03]);
  c.strokeStyle = 'rgba(120,90,50,0.6)';
  c.stroke();
  c.restore();
  chez(c, w * 0.58, h * 0.78, w / 900);
  // the heroes
  dog(c, w * 0.43, h * 0.97, w / 1500, TEDDY);
  docLeo(c, w * 0.76, h * 0.92, w / 900);
  dog(c, w * 0.93, h * 0.98, w / 1500, GWINN, true);
  pip(c, w * 0.26, h * 0.98, w / 720);
  glow(c, w * 0.5, h * 0.4, w * 0.6, '#ffb070', 0.18);
  finish(c, w, h, 'realm', 0.5);
};
export default paint;
