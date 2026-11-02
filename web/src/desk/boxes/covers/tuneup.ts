// Tune-Up's cover: the town bandstand at night, the night before the parade, under strings of
// lights. Doc Leo the hobo clown (no clown nose of his own) waves his baton over two friendly
// Clown Club clowns with a horn and a drum. Teddy trots up with a trumpet in his mouth; Gwinn
// sits by the tipped-over instrument trunk (its lettering has the red rubber nose for the "o"),
// instruments spilled in the grass. The clock tower stands in the town behind.
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, seeded, stars, stroke } from './paint';
import { dog, GWINN, TEDDY } from './dog';
import { leoFace } from './leoFace';

const BRASS: [number, string][] = [
  [0, '#fff0a0'],
  [0.45, '#e8a820'],
  [1, '#8a5a08'],
];

/** A trumpet from the mouthpiece at (0,0) out along +x, `len` long, with its bell flared at the end. */
function trumpet(c: Ctx, len: number): void {
  stroke(c, '#c88a14', 5, [0, 0, len * 0.7, 0]);
  stroke(c, '#f0c040', 2, [0, -1.5, len * 0.7, -1.5]);
  ell(c, len * 0.3, 8, len * 0.2, 7); // the coil
  c.lineWidth = 3;
  c.strokeStyle = '#c88a14';
  c.stroke();
  poly(c, [len * 0.68, -3, len, -len * 0.2, len, len * 0.2, len * 0.68, 3]);
  fill(c, lin(c, 0, -len * 0.2, 0, len * 0.2, BRASS));
  ell(c, len, 0, len * 0.06, len * 0.2);
  fill(c, '#5a3a06');
  ell(c, 0, 0, 4, 4);
  fill(c, '#d0d0d8');
}

/** A bass drum seen from the front, red with white rope lacing, standing on its edge. */
function drum(c: Ctx, x: number, y: number, r: number): void {
  ell(c, x, y, r, r * 0.9);
  fill(
    c,
    rad(c, x - r * 0.3, y - r * 0.3, r * 1.4, [
      [0, '#f4f0e0'],
      [1, '#c8c0a8'],
    ]),
  );
  c.lineWidth = r * 0.22;
  c.strokeStyle = '#d9381e';
  c.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    stroke(c, '#fff4e0', 1.6, [x + Math.cos(a) * r * 1.02, y + Math.sin(a) * r * 0.92, x + Math.cos(a + 0.4) * r * 1.02, y + Math.sin(a + 0.4) * r * 0.92]);
  }
}

/** A friendly Clown Club clown: round white face with a red rubber nose, a big smile, bright
 * hair, a striped suit. (x, y) is the ground between the shoes. */
function clown(c: Ctx, x: number, y: number, s: number, hair: string, suit: [string, string], tool: 'horn' | 'drum'): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  for (const lx of [-12, 12]) {
    poly(c, [lx - 8, -70, lx + 8, -70, lx + 8, -12, lx - 8, -12]);
    fill(c, suit[1]);
    blob(c, [lx - 14, -14, lx + 18, -14, lx + 22, 0, lx - 14, 2]);
    fill(c, '#d9381e');
  }
  blob(c, [-30, -66, -34, -118, -14, -136, 14, -136, 34, -118, 30, -66, 0, -60]);
  fill(
    c,
    lin(c, -34, 0, 34, 0, [
      [0, suit[0]],
      [0.5, '#fff'],
      [1, suit[0]],
    ]),
  );
  c.save();
  blob(c, [-30, -66, -34, -118, -14, -136, 14, -136, 34, -118, 30, -66, 0, -60]);
  c.clip();
  for (let i = -3; i < 4; i++) stroke(c, suit[1], 8, [i * 12 - 4, -140, i * 12 + 4, -60]);
  c.restore();
  // ruffle collar
  for (let i = -3; i <= 3; i++) {
    ell(c, i * 8, -134, 6, 7);
    fill(c, i % 2 ? '#ffd23f' : '#ff5aa8');
  }
  // the instrument, held at the mouth or at the belly
  if (tool === 'horn') {
    stroke(c, '#f4f4f0', 12, [-24, -112, -10, -150]);
    stroke(c, '#f4f4f0', 12, [24, -112, 10, -140]);
    c.save();
    c.translate(8, -150);
    c.rotate(-0.55);
    trumpet(c, 54);
    c.restore();
  } else {
    drum(c, 0, -92, 26);
    stroke(c, '#f4f4f0', 10, [-26, -118, -16, -100]);
    stroke(c, '#f4f4f0', 10, [26, -118, 40, -150]);
    stroke(c, '#c8a060', 3, [40, -150, 52, -166]);
    ell(c, 53, -168, 4, 4);
    fill(c, '#c8a060');
  }
  // the head
  for (const sx of [-1, 1]) {
    ell(c, sx * 22, -168, 14, 14);
    fill(c, hair);
  }
  ell(c, 0, -158, 22, 24);
  fill(c, '#fbf6ee');
  ell(c, -9, -163, 3, 3.5);
  ell(c, 9, -163, 3, 3.5);
  fill(c, '#1a1a1a');
  c.beginPath();
  c.arc(0, -156, 12, 0.3, Math.PI - 0.3);
  c.lineWidth = 3;
  c.strokeStyle = '#c01818';
  c.stroke();
  ell(c, 0, -157, 6, 6);
  fill(
    c,
    rad(c, -2, -159, 7, [
      [0, '#ff7a6a'],
      [1, '#c01010'],
    ]),
  );
  poly(c, [-14, -178, 14, -178, 10, -200, -10, -200]);
  fill(c, suit[1]);
  ell(c, 0, -178, 18, 4);
  fill(c, suit[1]);
  ell(c, 0, -202, 5, 5);
  fill(c, '#ffd23f');
  c.restore();
}

/** Doc Leo, the friendly hobo clown, in his own face paint (no clown nose), his fedora, navy
 * jacket, lavender shirt, green tie and blue suspenders, one hand up with a baton. */
function docLeo(c: Ctx, x: number, y: number, s: number): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
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
  blob(c, [-54, -140, -58, -260, -30, -290, 30, -290, 58, -260, 54, -140, 0, -132]);
  fill(
    c,
    lin(c, -58, 0, 58, 0, [
      [0, '#0e1838'],
      [0.4, '#2a3a74'],
      [1, '#0a1230'],
    ]),
  );
  poly(c, [-22, -290, 22, -290, 14, -150, -14, -150]);
  fill(
    c,
    lin(c, -22, 0, 22, 0, [
      [0, '#9a84c8'],
      [0.5, '#c8b4ec'],
      [1, '#9a84c8'],
    ]),
  );
  for (const sx of [-1, 1]) stroke(c, '#2a6ad8', 6, [sx * 17, -288, sx * 14, -210, sx * 13, -150]);
  poly(c, [-6, -286, 6, -286, 9, -210, 0, -196, -9, -210]);
  fill(c, '#1e9a5a');
  // the baton arm up and out, the other arm out the other side, white gloves
  stroke(c, '#1a2a5a', 22, [50, -270, 90, -330, 100, -392]);
  ell(c, 101, -402, 14, 16);
  fill(c, '#fff');
  stroke(c, '#f4f4f0', 7, [104, -410, 150, -480]);
  ell(c, 152, -483, 6, 6);
  fill(c, '#f4f4f0');
  stroke(c, '#1a2a5a', 22, [-50, -268, -88, -240, -110, -214]);
  ell(c, -114, -208, 12, 12);
  fill(c, '#fff');
  leoFace(c);
  ell(c, 0, -362, 50, 10, -0.08);
  fill(c, '#4a4038');
  blob(c, [-30, -364, -28, -398, -4, -392, 6, -404, 28, -396, 32, -364]);
  fill(
    c,
    lin(c, -30, 0, 32, 0, [
      [0, '#3a322c'],
      [0.5, '#6a5c50'],
      [1, '#302a24'],
    ]),
  );
  stroke(c, '#16121a', 7, [-30, -370, 31, -370]);
  c.restore();
}

/** A string of lights hung in a sag between two points. */
function lights(c: Ctx, x0: number, y0: number, x1: number, y1: number, sag: number, n: number): void {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2 + sag;
  c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo(mx, my, x1, y1);
  c.lineWidth = 1.5;
  c.strokeStyle = '#0a0814';
  c.stroke();
  const cols = ['#ffd23f', '#ff5a5a', '#6ae0ff', '#9aff6a', '#ff9a3a'];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1;
    const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1 + 4;
    glow(c, bx, by, 14, cols[i % 5], 0.75);
    ell(c, bx, by, 2.6, 3.2);
    fill(c, '#fffbe8');
  }
}

/** A musical note: head, stem, flag. */
function note(c: Ctx, x: number, y: number, s: number, col: string): void {
  ell(c, x, y, 7 * s, 5 * s, -0.4);
  fill(c, col);
  stroke(c, col, 2 * s, [x + 6 * s, y - 2 * s, x + 6 * s, y - 28 * s]);
  stroke(c, col, 3 * s, [x + 6 * s, y - 28 * s, x + 16 * s, y - 20 * s]);
}

/** The town behind: roofs with lit windows, and the clock tower. */
function town(c: Ctx, w: number, base: number): void {
  const r = seeded('tuneup-town');
  for (let x = -10; x < w;) {
    const bw = 44 + r() * 50;
    const bh = 50 + r() * 80;
    c.fillStyle = '#1c1838';
    c.fillRect(x, base - bh, bw, bh + 4);
    poly(c, [x - 3, base - bh, x + bw / 2, base - bh - 20 - r() * 14, x + bw + 3, base - bh]);
    fill(c, '#14102a');
    for (let wy = base - bh + 12; wy < base - 14; wy += 22)
      for (let wx = x + 8; wx < x + bw - 12; wx += 18)
        if (r() > 0.4) {
          c.fillStyle = '#ffd890';
          c.fillRect(wx, wy, 8, 11);
        }
    x += bw + 2;
  }
  // the clock tower on the right
  const tx = 500;
  c.fillStyle = '#241e48';
  c.fillRect(tx - 24, base - 260, 48, 264);
  poly(c, [tx - 30, base - 260, tx, base - 322, tx + 30, base - 260]);
  fill(c, '#171233');
  ell(c, tx, base - 222, 17, 17);
  fill(c, '#fff4d0');
  stroke(c, '#2a1a10', 2, [tx, base - 222, tx, base - 234]);
  stroke(c, '#2a1a10', 2, [tx, base - 222, tx + 8, base - 218]);
  glow(c, tx, base - 222, 50, '#ffe8a0', 0.4);
}

/** The bandstand: a lit wooden platform, six posts, a scalloped roof with bunting. */
function bandstand(c: Ctx, cx: number, floor: number, rw: number, eave: number, peak: number): void {
  // the glow of the stage inside
  const x0 = cx - rw * 0.8;
  const x1 = cx + rw * 0.8;
  c.fillStyle = lin(c, 0, eave, 0, floor, [
    [0, '#4a2a50'],
    [1, '#c87a50'],
  ]);
  c.fillRect(x0, eave, x1 - x0, floor - eave);
  glow(c, cx, floor - 70, 180, '#ffd890', 0.5);
  // posts and the railing
  for (const px of [x0, cx - rw * 0.4, cx + rw * 0.4, x1]) {
    c.fillStyle = lin(c, px - 5, 0, px + 5, 0, [
      [0, '#d8d0c0'],
      [1, '#8a8070'],
    ]);
    c.fillRect(px - 5, eave, 10, floor - eave);
  }
  // the platform with its lattice
  c.fillStyle = lin(c, 0, floor, 0, floor + 46, [
    [0, '#a07048'],
    [1, '#4a2a18'],
  ]);
  c.fillRect(x0 - 18, floor, x1 - x0 + 36, 12);
  c.fillStyle = '#2a1a24';
  c.fillRect(x0 - 10, floor + 12, x1 - x0 + 20, 34);
  for (let lx = x0 - 6; lx < x1 + 6; lx += 12) {
    stroke(c, '#a89478', 2, [lx, floor + 14, lx + 12, floor + 44]);
    stroke(c, '#a89478', 2, [lx + 12, floor + 14, lx, floor + 44]);
  }
  // steps in front
  for (let i = 0; i < 3; i++) {
    c.fillStyle = i % 2 ? '#8a6038' : '#a07048';
    c.fillRect(cx - 40 - i * 8, floor + 46 + i * 6 - 18, 80 + i * 16, 8);
  }
  // the roof: a wide red-and-cream canopy with a scalloped edge and a finial
  poly(c, [x0 - 40, eave, cx, peak, x1 + 40, eave]);
  fill(
    c,
    lin(c, 0, peak, 0, eave, [
      [0, '#8a1c24'],
      [1, '#c8302a'],
    ]),
  );
  for (let i = -4; i <= 4; i++)
    poly(c, [cx, peak, cx + i * ((x1 - x0 + 80) / 8) - (x1 - x0 + 80) / 16, eave, cx + i * ((x1 - x0 + 80) / 8) + (x1 - x0 + 80) / 16, eave]);
  c.save();
  poly(c, [x0 - 40, eave, cx, peak, x1 + 40, eave]);
  c.clip();
  for (let i = -5; i <= 5; i += 2) stroke(c, 'rgba(255,244,224,0.85)', 14, [cx + i * 20, peak - 6, cx + i * 60, eave + 4]);
  c.restore();
  const sc = (x1 - x0 + 80) / 12;
  for (let i = 0; i < 12; i++) {
    ell(c, x0 - 40 + sc * (i + 0.5), eave + 2, sc / 2, 9);
    fill(c, i % 2 ? '#fff4e0' : '#c8302a');
  }
  stroke(c, '#d8b040', 4, [cx, peak, cx, peak - 22]);
  ell(c, cx, peak - 24, 6, 6);
  fill(c, '#ffd23f');
}

/** The instrument trunk, tipped over on its side, open, a French horn and a violin spilling out. */
function trunk(c: Ctx, x: number, y: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(-0.28);
  ell(c, 0, 8, 96, 10);
  fill(c, 'rgba(0,0,0,0.4)');
  // the open lid, hinged at the back, hanging down behind
  poly(c, [-80, -60, 80, -60, 74, -118, -74, -118]);
  fill(c, '#5a3048');
  // the trunk body and its dark inside
  poly(c, [-84, 0, 84, 0, 84, -62, -84, -62]);
  fill(
    c,
    lin(c, 0, -62, 0, 0, [
      [0, '#8a2a3a'],
      [1, '#4a1424'],
    ]),
  );
  for (const bx of [-60, -20, 20, 60]) {
    c.fillStyle = '#d8b040';
    c.fillRect(bx - 4, -62, 8, 62);
  }
  c.fillStyle = '#d8b040';
  c.fillRect(-84, -34, 168, 5);
  c.fillRect(-12, -40, 24, 18);
  c.fillStyle = '#3a2a10';
  c.fillRect(-4, -34, 8, 8);
  // the Clown Club lettering on the lid, the o of Clown a red rubber nose
  const pieces = ['CL', 'o', 'WN CLUB'];
  c.font = 'bold 15px Arial, sans-serif';
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  const widths = [c.measureText(pieces[0]).width, 11, c.measureText(pieces[2]).width];
  let tx = -(widths[0] + widths[1] + widths[2]) / 2;
  c.fillStyle = '#ffd23f';
  c.fillText(pieces[0], tx, -88);
  tx += widths[0];
  ell(c, tx + 5.5, -88, 5.5, 5.5);
  fill(
    c,
    rad(c, tx + 4, -90, 7, [
      [0, '#ff7a6a'],
      [1, '#c01010'],
    ]),
  );
  tx += widths[1];
  c.fillStyle = '#ffd23f';
  c.fillText(pieces[2], tx, -88);
  c.restore();
}

/** A French horn's coil, face on, for the spill. */
function hornCoil(c: Ctx, x: number, y: number, r: number): void {
  for (let i = 0; i < 3; i++) {
    ell(c, x, y, r - i * 7, r - i * 7);
    c.lineWidth = 5;
    c.strokeStyle = i % 2 ? '#e8a820' : '#c88a14';
    c.stroke();
  }
  poly(c, [x + r - 4, y - 4, x + r + 30, y - 24, x + r + 30, y + 24, x + r - 4, y + 4]);
  fill(c, lin(c, 0, y - 24, 0, y + 24, BRASS));
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('tuneup-cover');
  const ground = 478;
  // the night sky, a late moon, stars
  c.fillStyle = lin(c, 0, 0, 0, ground, [
    [0, '#0a0828'],
    [0.6, '#2a2a6a'],
    [1, '#5a3a78'],
  ]);
  c.fillRect(0, 0, w, h);
  stars(c, w, 220, 80, 'tuneup-stars');
  ell(c, 44, 206, 22, 22);
  fill(c, '#fff4d0');
  glow(c, 44, 206, 70, '#fff0c0', 0.35);
  town(c, w, ground - 10);
  // the green, a dark lawn under the lights
  c.fillStyle = lin(c, 0, ground - 10, 0, h, [
    [0, '#1c3a2a'],
    [1, '#08180e'],
  ]);
  c.fillRect(0, ground - 10, w, h);
  ell(c, 250, 548, 300, 30);
  fill(c, 'rgba(255,220,150,0.12)');
  // the bandstand and its band, a little smaller so the title and the badges clear them
  c.save();
  c.translate(12, 55);
  c.scale(0.85, 0.85);
  bandstand(c, 280, 404, 150, 205, 120);
  // the band: a clown with a horn and a clown with a drum either side of Doc Leo
  clown(c, 195, 408, 0.95, '#ff7a1a', ['#ffd23f', '#d9381e'], 'horn');
  clown(c, 372, 408, 0.95, '#3ab0e8', ['#ff7aa8', '#1d5fb8'], 'drum');
  docLeo(c, 282, 408, 0.4);
  // lights from the roof across the town square
  lights(c, 130, 195, -20, 150, 22, 8);
  lights(c, 440, 195, 700, 130, 24, 8);
  lights(c, -20, 250, 280, 200, 52, 14);
  lights(c, 280, 200, 700, 250, 52, 14);
  // notes rising from the bandstand
  note(c, 130, 170, 1.2, '#ffd23f');
  note(c, 430, 150, 1, '#ff7aa8');
  note(c, 330, 78, 1.1, '#6ae0ff');
  c.restore();
  // the trunk, tipped over, and what fell out of it
  c.save();
  c.translate(404, 552);
  c.scale(0.6, 0.6);
  trunk(c, 0, 0);
  c.restore();
  hornCoil(c, 228, 548, 13);
  note(c, 252, 506, 0.8, '#9aff6a');
  // Gwinn, beside the trunk she knocked over, looking at it
  dog(c, 296, 552, 0.42, GWINN);
  // Teddy trotting up from the left with a trumpet in his mouth; his ears match
  c.save();
  c.translate(78, 552);
  c.scale(0.62, 0.62);
  dog(c, 0, 0, 1, TEDDY);
  c.translate(104, -104);
  c.rotate(-0.4);
  trumpet(c, 70);
  c.restore();
  // a few fireflies
  for (let i = 0; i < 24; i++) glow(c, r() * w, 330 + r() * 230, 7, '#d8ff8a', 0.7);
  finish(c, w, h, 'tuneup', 0.5);
};
export default paint;
