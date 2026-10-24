// Teddy's Little Biggest Adventure's cover: SURPRISE! The Clown Club's Big Top at night, the
// lights just come on. Teddy stands in the middle of the ring in the spotlight, in front of
// the biggest birthday cake, a HAPPY BIRTHDAY banner over it and a hundred balloons up in the
// canvas. Gwinn (a bow on her head) boops his nose, Doc Leo the hobo clown waves, rubber
// chicken on its leash, and THE CHEZ is parked outside the tent flap, its headlights on.
import { CHEZ_AXLE, CHEZ_BODY, CHEZ_POD, CHEZ_WHEELS, CHEZ_WINDOW } from '../../props/chezArt';
import { dog, GWINN, TEDDY } from './dog';
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, seeded, stars, stroke } from './paint';
import { leoFace } from './leoFace';

const PARTY = ['#d9381e', '#ffd23f', '#1d5fb8', '#1e9a5a', '#ff5aa8', '#9a5ad8'];

/** THE CHEZ from the side in the shared side view's measurements (games/kit/chez.ts, via
 * props/chezArt: x along the car, y down, the ground at 20), facing left, so the passenger side
 * shows with the charge port at the rear. (x, ground) is its box's bottom left, `k` pixels to
 * the unit. */
function chez(c: Ctx, x: number, ground: number, k: number): void {
  // the stripes' band, as the kit has it: its middle along the front, an S-curve step up over
  // the rear quarter (from 13 back to 10), ending at 6.9
  const stepUp = (u: number) => {
    if (u >= 13) return 0;
    if (u <= 10) return 2.6;
    const t = (13 - u) / 3;
    return 2.6 * t * t * (3 - 2 * t);
  };
  const shape = (pts: [number, number][]) => poly(c, pts.flat());
  c.save();
  c.translate(x + 40 * k, ground - 20 * k);
  c.scale(-k, k);
  ell(c, 20.5, 20, 19, 1.4);
  fill(c, 'rgba(0,0,0,0.45)');
  // white steel wheels and chrome caps on black tires
  for (const wx of CHEZ_WHEELS)
    for (const [r, col] of [
      [3.25, '#121214'],
      [2.0, '#e8e4da'],
      [1.0, '#a8acb4'],
    ] as const) {
      ell(c, wx, CHEZ_AXLE, r, r);
      fill(c, col);
    }
  // plain square black bumpers
  c.fillStyle = '#121216';
  c.fillRect(35.2, 13.0, 2.0, 1.8);
  c.fillRect(3.9, 12.8, 2.0, 1.8);
  // the tomato-red body and the headlight's pod, lit warm from the tent on its far side
  const red = lin(c, 0, 1.3, 0, 18.1, [
    [0, '#ff6a50'],
    [0.55, '#d8382a'],
    [1, '#8a1810'],
  ]);
  shape(CHEZ_BODY);
  fill(c, red);
  shape(CHEZ_POD);
  fill(c, red);
  c.save();
  shape(CHEZ_BODY);
  c.clip();
  c.fillStyle = '#121214';
  c.fillRect(0, 0, 40, 2.05); // the black roof
  // the racing stripes: a white pinstripe round a dark pair with red between them
  const band = (wd: number, col: string, d = 0) => {
    c.beginPath();
    for (let u = 36; u >= 6.9; u -= 0.25) c.lineTo(u, 12.5 - stepUp(u) + d);
    c.lineWidth = wd;
    c.lineCap = 'butt';
    c.strokeStyle = col;
    c.stroke();
  };
  band(1.9, '#fff4e8');
  band(1.5, '#d8382a');
  band(0.5, '#26262a', -0.5);
  band(0.5, '#26262a', 0.5);
  c.restore();
  // the one door window (the tent's glow through it), the windshield's edge, the seams, the
  // handle, the markers and the charge port
  shape(CHEZ_WINDOW);
  fill(
    c,
    lin(c, 0, 2.8, 0, 8.3, [
      [0, '#ffd890'],
      [1, '#5a3a4a'],
    ]),
  );
  stroke(c, '#ffe8c0', 0.35, [18.3, 1.7, 27.2, 7.5]);
  stroke(c, '#6a1006', 0.3, [12.1, 2.2, 13.7, 18.1]);
  stroke(c, '#6a1006', 0.3, [26.1, 8.3, 26.1, 18.1]);
  c.fillStyle = '#d8d8e0';
  c.fillRect(14.5, 10.6, 1.5, 0.6);
  c.fillStyle = '#fff8c0';
  c.fillRect(32.1, 8.9, 0.5, 1.1);
  c.fillStyle = '#ffa020';
  c.fillRect(30.4, 10.9, 1.2, 0.8);
  c.fillStyle = '#e01818';
  c.fillRect(7.1, 12.4, 1.2, 0.8);
  c.fillStyle = '#6a1006';
  c.fillRect(6.6, 5.0, 1.3, 1.3);
  c.restore();
  // its headlight on, out across the grass
  glow(c, x + 7.4 * k, ground - 10.6 * k, 14 * k, '#fff4c0', 0.6);
  // the plate on the back (unmirrored, so it reads)
  const px = x + 35.4 * k;
  const py = ground - 8.9 * k;
  c.fillStyle = '#f4f2e8';
  c.fillRect(px - 0.2 * k, py, 2.6 * k, 1.5 * k);
  c.fillStyle = '#1a3a8a';
  c.font = `bold ${Math.max(3, 0.9 * k)}px Arial, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('THE CHEZ', px + 1.1 * k, py + 0.78 * k, 2.4 * k);
}

/** Doc Leo, the friendly hobo clown, in his own face paint: white round both eyes and round the
 * mouth, painted grey stubble, wire glasses, and his own nose, sunburned pink (no clown nose).
 * A felt fedora with a dark band, a navy jacket over a lavender shirt, a green tie and blue
 * suspenders; one hand waving, the other holding the rubber chicken's leash. (x, y) is the
 * ground between his red sneakers. */
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
  // the navy jacket, open over the lavender shirt, the green tie and the blue suspenders
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
  poly(c, [-7, -290, 7, -290, 5, -280, -5, -280]);
  fill(c, '#14703e');
  // one arm waving, the other holding the chicken's leash, white gloves
  stroke(c, '#1a2a5a', 22, [50, -270, 86, -320, 92, -370]);
  ell(c, 94, -380, 14, 16);
  fill(c, '#fff');
  stroke(c, '#1a2a5a', 22, [-50, -268, -70, -210, -84, -170]);
  ell(c, -86, -164, 12, 12);
  fill(c, '#fff');
  leoFace(c);
  // the felt fedora with its dark band
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
  // the rubber chicken on its leash
  stroke(c, '#d81e1e', 3, [-86, -160, -96, -90, -92, -40]);
  c.translate(-100, -22);
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

/** A ribbon bow: two loops, two tails and a knot. */
function bow(c: Ctx, x: number, y: number, s: number, col: string, dark: string): void {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  for (const sx of [-1, 1]) {
    poly(c, [0, 2, sx * 8, 16, sx * 4, 18, 0, 4]);
    fill(c, dark);
    blob(c, [0, 0, sx * 20, -12, sx * 24, 2, sx * 18, 12]);
    fill(c, col);
    blob(c, [sx * 4, -1, sx * 16, -7, sx * 17, 1, sx * 12, 5]);
    fill(c, dark);
  }
  ell(c, 0, 0, 6, 7);
  fill(c, col);
  ell(c, -1.5, -2, 2, 2);
  fill(c, 'rgba(255,255,255,0.6)');
  c.restore();
}

/** A string of party lights hung in a sag between two points. */
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
    glow(c, bx, by, 12, cols[i % 5], 0.7);
    ell(c, bx, by, 2.6, 3.2);
    fill(c, '#fffbe8');
  }
}

/** A balloon with its string. */
function balloon(c: Ctx, x: number, y: number, rx: number, col: string, tail: number): void {
  c.beginPath();
  c.moveTo(x, y + rx * 1.25);
  c.quadraticCurveTo(x + 6, y + rx * 1.25 + tail / 2, x - 2, y + rx * 1.25 + tail);
  c.lineWidth = 1;
  c.strokeStyle = 'rgba(230,220,210,0.55)';
  c.stroke();
  ell(c, x, y, rx, rx * 1.22);
  fill(
    c,
    rad(c, x - rx * 0.35, y - rx * 0.45, rx * 1.4, [
      [0, '#fff'],
      [0.22, col],
      [1, '#1a0610'],
    ]),
  );
  poly(c, [x - 3, y + rx * 1.3, x + 3, y + rx * 1.3, x, y + rx * 1.16]);
  fill(c, col);
}

/** The cake's tier: a frosted drum from x0 to x1, its top at y, `th` tall. */
function tier(c: Ctx, x0: number, x1: number, y: number, th: number, cake: string, icing: string, trim: string): void {
  const cx = (x0 + x1) / 2;
  const rx = (x1 - x0) / 2;
  const ry = rx * 0.16;
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(x0, y + th);
  c.ellipse(cx, y + th, rx, ry, 0, Math.PI, 0, true);
  c.lineTo(x1, y);
  c.closePath();
  fill(
    c,
    lin(c, x0, 0, x1, 0, [
      [0, shadeOf(cake)],
      [0.4, cake],
      [0.55, '#fff8f4'],
      [0.7, cake],
      [1, shadeOf(cake)],
    ]),
  );
  // the beaded trim round its foot
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (i / 14);
    ell(c, cx - Math.cos(a) * rx, y + th + Math.sin(a) * ry - 2, 4, 4);
    fill(c, trim);
  }
  // the icing on top, dripping down the side
  ell(c, cx, y, rx, ry);
  fill(c, icing);
  c.beginPath();
  c.moveTo(x0, y);
  const drips = 9;
  for (let i = 0; i <= drips * 2; i++) {
    const t = i / (drips * 2);
    const a = Math.PI * t;
    const dx = cx - Math.cos(a) * rx;
    const dy = y + Math.sin(a) * ry + (i % 2 ? 6 + ((i * 7) % 5) * 3 : 2);
    c.lineTo(dx, dy);
  }
  c.lineTo(x1, y);
  c.ellipse(cx, y, rx, ry, 0, 0, Math.PI, true);
  c.closePath();
  fill(c, icing);
  ell(c, cx - rx * 0.3, y - ry * 0.2, rx * 0.4, ry * 0.4);
  fill(c, 'rgba(255,255,255,0.45)');
}

/** A color a little darker, for a tier's shaded sides. */
function shadeOf(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const d = (v: number) => Math.round(v * 0.62);
  return `rgb(${d(n >> 16)},${d((n >> 8) & 255)},${d(n & 255)})`;
}

/** The biggest birthday cake: three tiers on a gold board, TEDDY piped on the middle one, and
 * candles all lit. (x, y) is the middle of its board. */
function cake(c: Ctx, x: number, y: number): void {
  ell(c, x, y, 136, 20);
  fill(
    c,
    lin(c, x - 136, 0, x + 136, 0, [
      [0, '#8a6010'],
      [0.5, '#ffe080'],
      [1, '#8a6010'],
    ]),
  );
  tier(c, x - 120, x + 120, y - 66, 64, '#ff9ac0', '#fff4f8', '#1d5fb8');
  tier(c, x - 90, x + 90, y - 112, 46, '#8ad0ff', '#fff8e8', '#ff5aa8');
  c.save();
  c.font = '900 25px Arial, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineWidth = 6;
  c.strokeStyle = '#fff4f8';
  c.lineJoin = 'round';
  c.strokeText('TEDDY', x, y - 88);
  c.fillStyle = '#1d5fb8';
  c.fillText('TEDDY', x, y - 88);
  c.restore();
  // paw prints in icing round the bottom tier
  for (const px of [x - 96, x - 60, x + 60, x + 96]) {
    ell(c, px, y - 26, 7, 6);
    fill(c, '#fff4f8');
    for (const [tx, ty] of [
      [-7, -8],
      [-2, -11],
      [3, -11],
      [8, -8],
    ])
      (ell(c, px + tx, y - 26 + ty, 2.4, 2.6), fill(c, '#fff4f8'));
  }
  tier(c, x - 56, x + 56, y - 150, 38, '#ffe070', '#fff4f8', '#d9381e');
  // sprinkles on the top and bottom tiers (the middle one has his name)
  const r = seeded('teddy3-sprinkles');
  for (let i = 0; i < 50; i++) {
    const t = i % 2 ? 0 : 2;
    const half = [118, 88, 54][t];
    const top = [y - 64, y - 110, y - 148][t];
    const sx = x + (r() * 2 - 1) * half * 0.9;
    const sy = top + 14 + r() * ([58, 40, 30][t] - 12);
    c.save();
    c.translate(sx, sy);
    c.rotate(r() * 3);
    c.fillStyle = PARTY[i % PARTY.length];
    c.fillRect(-3, -1, 6, 2.2);
    c.restore();
  }
  // the candles, striped, and their flames
  for (let i = 0; i < 7; i++) {
    const cx = x - 42 + i * 14;
    const cy = y - 152 + Math.sin((i / 6) * Math.PI) * 6 - 3;
    poly(c, [cx - 3, cy, cx - 3, cy - 24, cx + 3, cy - 24, cx + 3, cy]);
    fill(c, i % 2 ? '#ff5aa8' : '#6ae0ff');
    for (let k = 0; k < 3; k++) stroke(c, '#fff', 1.5, [cx - 3, cy - 4 - k * 8, cx + 3, cy - 8 - k * 8]);
    glow(c, cx, cy - 32, 22, '#ffb040', 0.7);
    blob(c, [cx, cy - 42, cx + 4, cy - 30, cx, cy - 25, cx - 4, cy - 30]);
    fill(c, '#ffe880');
    ell(c, cx, cy - 29, 1.6, 3);
    fill(c, '#fff');
  }
  glow(c, x, y - 182, 90, '#ffc060', 0.35);
}

/** The banner over the ring: a yellow ribbon with swallowtail ends, sagging a little, HAPPY
 * BIRTHDAY TEDDY! painted along it letter by letter. */
function banner(c: Ctx, x0: number, x1: number, y: number, sag: number, text: string): void {
  const at = (t: number): [number, number] => [x0 + (x1 - x0) * t, y + 4 * sag * t * (1 - t)];
  const bh = 34;
  // the cords up into the rigging
  for (const t of [0, 1]) stroke(c, '#2a1a1a', 1.5, [at(t)[0], at(t)[1], at(t)[0] + (t ? 30 : -30), y - 120]);
  for (const sx of [-1, 1]) {
    const [ex, ey] = at(sx < 0 ? 0 : 1);
    poly(c, [ex, ey, ex + sx * 26, ey - 4, ex + sx * 16, ey + bh / 2, ex + sx * 26, ey + bh + 4, ex, ey + bh]);
    fill(c, '#d8a010');
  }
  c.beginPath();
  for (let i = 0; i <= 20; i++) c.lineTo(...at(i / 20));
  for (let i = 20; i >= 0; i--) {
    const [bx, by] = at(i / 20);
    c.lineTo(bx, by + bh);
  }
  c.closePath();
  fill(
    c,
    lin(c, 0, y, 0, y + sag + bh, [
      [0, '#ffe46a'],
      [1, '#e8b018'],
    ]),
  );
  for (const dy of [3, bh - 3]) {
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const [bx, by] = at(i / 20);
      c.lineTo(bx, by + dy);
    }
    c.lineWidth = 2;
    c.strokeStyle = '#d9381e';
    c.stroke();
  }
  c.save();
  c.font = '900 21px Arial, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const n = text.length;
  for (let i = 0; i < n; i++) {
    if (text[i] === ' ') continue;
    const t = (i + 0.5) / n;
    const [lx, ly] = at(t);
    c.save();
    c.translate(lx, ly + bh / 2 + 1);
    c.rotate(Math.atan2(4 * sag * (1 - 2 * t), x1 - x0));
    c.fillStyle = PARTY[i % 4 === 1 ? 2 : i % 4 === 3 ? 3 : 0];
    c.fillText(text[i], 0, 0);
    c.restore();
  }
  c.restore();
}

/** The Big Top's canvas: red and cream panels fanning down from the peak, dim at night. */
function canopy(c: Ctx, w: number, wall: number): void {
  c.fillStyle = '#2a0e1c';
  c.fillRect(0, 0, w, wall);
  const px = w / 2;
  const py = -120;
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (0.08 + (0.84 * i) / n);
    const a1 = Math.PI * (0.08 + (0.84 * (i + 1)) / n);
    poly(c, [px, py, px + Math.cos(a0) * 900, py + Math.sin(a0) * 900, px + Math.cos(a1) * 900, py + Math.sin(a1) * 900]);
    fill(c, i % 2 ? '#7a1a24' : '#b89a84');
  }
  // the canvas sags between its seams, and the dark up toward the peak
  c.fillStyle = lin(c, 0, 0, 0, wall, [
    [0, 'rgba(10,4,18,0.9)'],
    [0.6, 'rgba(20,6,24,0.55)'],
    [1, 'rgba(20,6,24,0.35)'],
  ]);
  c.fillRect(0, 0, w, wall);
}

/** The tent's side wall behind the ring, with its scalloped valance, from `top` to the floor. */
function sideWall(c: Ctx, w: number, top: number, floor: number): void {
  for (let i = 0; i * 30 < w; i++) {
    poly(c, [i * 30, top, i * 30 + 30, top, i * 30 + 30, floor, i * 30, floor]);
    fill(c, i % 2 ? '#6a1620' : '#a08470');
  }
  c.fillStyle = lin(c, 0, top, 0, floor, [
    [0, 'rgba(20,6,24,0.55)'],
    [1, 'rgba(20,6,24,0.2)'],
  ]);
  c.fillRect(0, top, w, floor - top);
  // the valance
  c.fillRect(0, top - 4, w, 4);
  for (let i = 0; i * 40 < w + 40; i++) {
    c.beginPath();
    c.arc(i * 40 + 20, top, 20, 0, Math.PI);
    c.closePath();
    fill(c, i % 2 ? '#d9381e' : '#1d5fb8');
    c.beginPath();
    c.arc(i * 40 + 20, top, 20, 0, Math.PI);
    c.lineWidth = 3;
    c.strokeStyle = '#ffd23f';
    c.stroke();
  }
  stroke(c, '#ffd23f', 4, [0, top, w, top]);
}

/** The tent flap, tied back: the doorway out to the night, with THE CHEZ parked outside. */
function doorway(c: Ctx, x0: number, x1: number, top: number, floor: number): void {
  const mid = (x0 + x1) / 2;
  const opening = () => {
    c.beginPath();
    c.moveTo(x0, floor);
    c.lineTo(x0 + 6, top + 26);
    c.quadraticCurveTo(mid, top - 10, x1 - 6, top + 26);
    c.lineTo(x1, floor);
    c.closePath();
  };
  c.save();
  opening();
  c.clip();
  c.fillStyle = lin(c, 0, top, 0, floor, [
    [0, '#0a1034'],
    [1, '#2a3a6a'],
  ]);
  c.fillRect(x0, top - 20, x1 - x0, floor - top + 20);
  c.save();
  c.translate(x0, top);
  stars(c, x1 - x0, floor - top - 40, 24, 'teddy3-door');
  c.restore();
  ell(c, x1 - 34, top + 34, 11, 11);
  fill(c, '#fff4d0');
  glow(c, x1 - 34, top + 34, 40, '#fff0c0', 0.35);
  // Lookout Hill's grass, under the car
  blob(c, [x0 - 20, floor, x0, floor - 26, mid, floor - 34, x1, floor - 24, x1 + 20, floor]);
  fill(c, '#1a3a26');
  chez(c, mid - 1.75 * 40, floor - 4, 3.5);
  c.restore();
  opening();
  c.lineWidth = 4;
  c.strokeStyle = '#ffd23f';
  c.stroke();
  // the flaps, gathered back each side and tied with gold rope
  for (const sx of [-1, 1]) {
    const ex = sx < 0 ? x0 : x1;
    blob(c, [ex - sx * 4, top + 8, ex + sx * 22, top + 2, ex + sx * 18, top + 70, ex + sx * 30, floor, ex - sx * 14, floor, ex - sx * 2, top + 70]);
    fill(
      c,
      lin(c, ex - 14, 0, ex + 30, 0, [
        [0, '#5a1018'],
        [0.5, '#a82a30'],
        [1, '#5a1018'],
      ]),
    );
    stroke(c, '#ffd23f', 4, [ex - sx * 4, top + 74, ex + sx * 18, top + 70]);
  }
}

/** A spotlight's beam from the rigging, its light pooling on the sawdust. */
function beam(c: Ctx, x0: number, y0: number, x1: number, y1: number, spread: number, alpha: number): void {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = alpha;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * spread;
  const ny = (dx / len) * spread;
  poly(c, [x0 - nx * 0.08, y0 - ny * 0.08, x0 + nx * 0.08, y0 + ny * 0.08, x1 + nx, y1 + ny, x1 - nx, y1 - ny]);
  fill(
    c,
    lin(c, x0, y0, x1, y1, [
      [0, 'rgba(255,248,220,0.9)'],
      [1, 'rgba(255,240,200,0.25)'],
    ]),
  );
  c.restore();
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('teddy3-cover');
  const wall = 300; // the side wall's top (the valance)
  const floor = 404;
  canopy(c, w, wall);
  // the party lights strung from the peak
  for (const [ex, ey, sag] of [
    [0, 210, 40],
    [140, 300, 50],
    [460, 300, 50],
    [w, 210, 40],
  ])
    lights(c, w / 2, -6, ex, ey, sag, 12);
  lights(c, 0, 150, w, 150, 70, 22);
  sideWall(c, w, wall, floor);
  doorway(c, 430, 596, wall - 8, floor);
  // the sawdust floor and the ring's curb, red and white
  c.fillStyle = lin(c, 0, floor, 0, h, [
    [0, '#3a2014'],
    [1, '#1a0c08'],
  ]);
  c.fillRect(0, floor, w, h - floor);
  ell(c, w / 2, 572, 360, 160);
  fill(
    c,
    rad(c, 320, 560, 340, [
      [0, '#e8b070'],
      [0.5, '#b07840'],
      [1, '#5a3418'],
    ]),
  );
  c.save();
  ell(c, w / 2, 572, 360, 160);
  c.lineWidth = 16;
  c.setLineDash([34, 34]);
  c.strokeStyle = '#d9381e';
  c.stroke();
  c.lineDashOffset = 34;
  c.strokeStyle = '#fff4e0';
  c.stroke();
  c.restore();
  // the spotlights, all on Teddy
  beam(c, 70, -10, 330, 560, 120, 0.16);
  beam(c, 530, -10, 330, 560, 120, 0.16);
  beam(c, 300, -10, 320, 560, 90, 0.12);
  glow(c, 320, 572, 190, '#fff0c0', 0.32);
  // a hundred balloons, bumping about up in the canvas
  const cols = PARTY;
  for (let i = 0; i < 34; i++) {
    const side = i % 3;
    const bx = side === 0 ? r() * 170 + 14 : side === 1 ? 430 + r() * 156 : 170 + r() * 260;
    const by = side === 2 ? 14 + r() * 70 : 18 + r() * 200;
    balloon(c, bx, by, 13 + r() * 6, cols[i % cols.length], 20 + r() * 40);
  }
  banner(c, 156, 444, 240, -12, 'HAPPY BIRTHDAY TEDDY!');
  cake(c, 304, 486);
  docLeo(c, 210, 552, 0.6);
  // Gwinn, a bow on her head, nose to nose with the birthday boy
  const gx = 524;
  const gy = 548;
  const gs = 0.6;
  dog(c, gx, gy, gs, GWINN, true);
  bow(c, gx - gs * 62, gy - gs * 200, 0.9, '#ff5aa8', '#c02a78');
  dog(c, 318, 556, 1.05, TEDDY);
  // her present at his paws: her best bone, with a bow on it
  c.save();
  c.translate(446, 582);
  c.rotate(-0.12);
  for (const sx of [-1, 1])
    for (const sy of [-1, 1]) {
      ell(c, sx * 22, sy * 5, 8, 7);
      fill(c, '#f4ead8');
    }
  poly(c, [-22, -5, 22, -5, 22, 5, -22, 5]);
  fill(c, '#f4ead8');
  stroke(c, 'rgba(120,90,60,0.4)', 1.5, [-18, 4, 18, 4]);
  c.restore();
  bow(c, 446, 580, 0.55, '#1d5fb8', '#123a8a');
  // confetti everywhere: SURPRISE!
  for (let i = 0; i < 60; i++) {
    c.fillStyle = cols[i % cols.length];
    c.save();
    c.translate(r() * w, 230 + r() * 360);
    c.rotate(r() * 3);
    c.fillRect(-4, -2, 8, 4);
    c.restore();
  }
  finish(c, w, h, 'teddy3', 0.45);
};
export default paint;
