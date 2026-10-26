// The pastry egg, like a jeweled imperial egg: rose glaze, piped icing, gold leaf, a nest of spun
// sugar and a clockwork baker on top. Its covering is wrapped and lit by eggShell.ts.
import { xorshift32 } from '../seededRandom';
import { canvas, drawShell, readLayer, wrap, type Box, type Shell } from './eggShell';
import { TEX_H, TEX_W } from './eggTexture';
let pastry: Shell | undefined;

/** The pastry egg's covering: rose glaze, white piping, gold leaf and a baked foot. */
function pastryShell(): Shell {
  if (pastry) return pastry;
  const layers = { color: canvas(TEX_W, TEX_H), height: canvas(TEX_W, TEX_H), metal: canvas(TEX_W, TEX_H) };
  const C = layers.color.getContext('2d')!;
  const Hh = layers.height.getContext('2d')!;
  const M = layers.metal.getContext('2d')!;
  Hh.fillStyle = M.fillStyle = '#000';
  Hh.fillRect(0, 0, TEX_W, TEX_H);
  M.fillRect(0, 0, TEX_W, TEX_H);
  const rand = xorshift32(1313);
  const V = (f: number) => TEX_H * f;
  // the glaze: rose, a touch deeper toward the foot, engine-turned like enamel
  const bg = C.createLinearGradient(0, 0, 0, TEX_H);
  bg.addColorStop(0, '#f7c6d2');
  bg.addColorStop(0.6, '#eda5b8');
  bg.addColorStop(1, '#de8ea4');
  C.fillStyle = bg;
  C.fillRect(0, 0, TEX_W, TEX_H);
  C.strokeStyle = 'rgba(160, 50, 90, 0.09)';
  C.lineWidth = 1;
  for (let k = 0; k < 90; k++) {
    C.beginPath();
    for (let x = 0; x <= TEX_W; x += 4) C.lineTo(x, k * 3 + Math.sin((x / TEX_W) * Math.PI * 24 + k * 0.6) * 3);
    C.stroke();
  }
  const piped = (draw: (g: CanvasRenderingContext2D) => void, w: number) =>
    wrap((dx) => {
      for (const g of [C, Hh]) {
        g.save();
        g.translate(dx, 0);
        g.lineCap = g.lineJoin = 'round';
        if (g === C) {
          g.strokeStyle = 'rgba(150, 70, 90, 0.35)';
          g.lineWidth = w + 1.5;
          g.save();
          g.translate(0.6, 1.2);
          draw(g);
          g.stroke();
          g.restore();
          g.strokeStyle = '#fff6ee';
          g.lineWidth = w;
          draw(g);
          g.stroke();
        } else {
          g.strokeStyle = '#555';
          g.lineWidth = w;
          draw(g);
          g.stroke();
          g.strokeStyle = '#bbb';
          g.lineWidth = w * 0.55;
          draw(g);
          g.stroke();
        }
        g.restore();
      }
    });
  const pearl = (x: number, y: number, r: number) =>
    wrap((dx) => {
      const px = x + dx;
      const c = C.createRadialGradient(px - r * 0.4, y - r * 0.4, 0, px, y, r * 1.3);
      c.addColorStop(0, '#ffffff');
      c.addColorStop(0.7, '#f6ece4');
      c.addColorStop(1, '#c99aa4');
      C.fillStyle = c;
      C.beginPath();
      C.ellipse(px, y, r * 1.3, r, 0, 0, Math.PI * 2);
      C.fill();
      const hgt = Hh.createRadialGradient(px, y, 0, px, y, r * 1.3);
      hgt.addColorStop(0, '#fff');
      hgt.addColorStop(1, '#000');
      Hh.fillStyle = hgt;
      Hh.beginPath();
      Hh.ellipse(px, y, r * 1.3, r, 0, 0, Math.PI * 2);
      Hh.fill();
    });
  const goldBand = (y0: number, y1: number) => {
    const grd = C.createLinearGradient(0, y0, 0, y1);
    grd.addColorStop(0, '#f6d77a');
    grd.addColorStop(0.5, '#d4a23a');
    grd.addColorStop(1, '#b98422');
    C.fillStyle = grd;
    C.fillRect(0, y0, TEX_W, y1 - y0);
    // the leaf's creases
    C.strokeStyle = 'rgba(120, 80, 10, 0.35)';
    C.lineWidth = 0.8;
    for (let x = 0; x < TEX_W; x += 7 + rand() * 9) {
      C.beginPath();
      C.moveTo(x, y0);
      C.lineTo(x + (rand() - 0.5) * 8, y1);
      C.stroke();
    }
    M.fillStyle = '#fff';
    M.fillRect(0, y0, TEX_W, y1 - y0);
    Hh.fillStyle = '#333';
    Hh.fillRect(0, y0, TEX_W, y1 - y0);
  };
  // the crown ring and the waist, in gold leaf
  goldBand(V(0.1), V(0.135));
  goldBand(V(0.53), V(0.575));
  // pearls along each band
  for (let x = 4; x < TEX_W; x += 10) {
    pearl(x, V(0.158), 3.2);
    pearl(x + 5, V(0.512), 2.8);
    pearl(x, V(0.594), 2.8);
    pearl(x + 5, V(0.865), 3);
  }
  // swags hanging from the crown, a rosette where each pair meets
  const swags = 8;
  for (let k = 0; k < swags; k++) {
    const x0 = (k / swags) * TEX_W;
    const x1 = ((k + 1) / swags) * TEX_W;
    piped((g) => {
      g.beginPath();
      g.moveTo(x0, V(0.19));
      g.quadraticCurveTo((x0 + x1) / 2, V(0.44), x1, V(0.19));
    }, 3.2);
    piped((g) => {
      g.beginPath();
      g.moveTo(x0 + 8, V(0.2));
      g.quadraticCurveTo((x0 + x1) / 2, V(0.36), x1 - 8, V(0.2));
    }, 2);
    // a pearl drop under each swag
    pearl((x0 + x1) / 2, V(0.34) + 2, 2.6);
    pearl((x0 + x1) / 2, V(0.38) + 2, 2.2);
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      pearl(x0 + Math.cos(a) * 5.2, V(0.2) + Math.sin(a) * 4, 2.2);
    }
    pearl(x0, V(0.2), 2);
  }
  // the trellis below the waist
  const top = V(0.62);
  const bottom = V(0.84);
  for (let x = -64; x < TEX_W + 64; x += 21.33) {
    piped((g) => {
      g.beginPath();
      g.moveTo(x, top);
      g.lineTo(x + (bottom - top) * 1.3, bottom);
      g.moveTo(x, top);
      g.lineTo(x - (bottom - top) * 1.3, bottom);
    }, 1.8);
  }
  for (let x = 0; x < TEX_W; x += 21.33) pearl(x, (top + bottom) / 2, 1.8);
  // the foot, where the glaze stops: baked pastry
  const crust = V(0.9);
  for (let y = Math.floor(crust); y < TEX_H; y++)
    for (let x = 0; x < TEX_W; x += 2) {
      const t = rand();
      C.fillStyle = t < 0.1 ? '#8a5522' : t < 0.4 ? '#c98a43' : '#d9a05a';
      C.fillRect(x, y, 2, 1);
    }
  Hh.fillStyle = '#1a1a1a';
  Hh.fillRect(0, crust, TEX_W, TEX_H - crust);
  // a drip edge of glaze over the crust
  C.fillStyle = '#de8ea4';
  for (let x = 0; x < TEX_W; x += 6) {
    const d = 2 + rand() * 7;
    C.beginPath();
    C.ellipse(x + 3, crust, 3.5, d, 0, 0, Math.PI * 2);
    C.fill();
  }
  // flecks of edible gold leaf, wherever they landed
  for (let f = 0; f < 90; f++) {
    const x = rand() * TEX_W;
    const y = V(0.22 + rand() * 0.62);
    const r = 1.5 + rand() * 3.5;
    const pts: [number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rand();
      pts.push([x + Math.cos(a) * r * (0.5 + rand()) * 1.3, y + Math.sin(a) * r * (0.5 + rand())]);
    }
    wrap((dx) => {
      for (const [g, col] of [
        [C, rand() < 0.5 ? '#e8bf55' : '#f4d98a'],
        [M, '#fff'],
      ] as const) {
        g.fillStyle = col;
        g.beginPath();
        pts.forEach(([px, py], i) => (i ? g.lineTo(px + dx, py) : g.moveTo(px + dx, py)));
        g.fill();
      }
    });
  }
  const metalF = readLayer(layers.metal);
  const metal = new Uint8Array(metalF.length);
  for (let i = 0; i < metal.length; i++) metal[i] = metalF[i] > 0.5 ? 1 : 0;
  pastry = { color: C.getImageData(0, 0, TEX_W, TEX_H), height: readLayer(layers.height), metal, shine: 0.85, gloss: 40, bump: 2.4 };
  return pastry;
}

type Thread = { rx: number; dy: number; tilt: number; a0: number; sweep: number; color: string; w: number; shine: boolean };
let nest: { cup: Thread[]; foot: { a: number; bend: number; color: string; w: number }[]; ring: Thread[] } | undefined;

function sugarThreads() {
  if (nest) return nest;
  const rand = xorshift32(2024);
  const amber = () => `hsla(${28 + rand() * 14}, ${82 + rand() * 16}%, ${32 + rand() * 26}%, ${0.25 + rand() * 0.4})`;
  const thread = (rx0: number, rx1: number): Thread => ({
    rx: rx0 + rand() * (rx1 - rx0),
    dy: (rand() - 0.5) * 0.5,
    tilt: (rand() - 0.5) * 0.25,
    a0: rand() * Math.PI * 2,
    sweep: 1.2 + rand() * 3.6,
    color: amber(),
    w: 0.6 + rand() * 1.1,
    shine: rand() < 0.35,
  });
  nest = {
    cup: Array.from({ length: 120 }, () => thread(0.82, 1.14)),
    foot: Array.from({ length: 70 }, () => ({ a: rand() * Math.PI * 2, bend: (rand() - 0.5) * 0.6, color: amber(), w: 0.6 + rand() * 0.9 })),
    ring: Array.from({ length: 40 }, () => thread(0.5, 0.7)),
  };
  return nest;
}

/**
 * The spun-sugar holder round an egg in `box`: `part` 'back' is drawn before the egg, 'front'
 * after it. It turns with the egg.
 */
function drawSugarNest(g: CanvasRenderingContext2D, box: Box, turn: number, part: 'back' | 'front'): void {
  const n = sugarThreads();
  const cx = box.x + box.w / 2;
  const cupY = box.y + box.h * 0.82;
  const R = box.w * 0.5;
  const squash = 0.26;
  const k = box.h / 300;
  const front = part === 'front';
  g.save();
  g.lineCap = 'round';
  const ellipse = (t: Thread, y0: number, R0: number) => {
    const pts: [number, number, boolean][] = [];
    const steps = Math.ceil(t.sweep * 10);
    for (let i = 0; i <= steps; i++) {
      const a = t.a0 + turn + (i / steps) * t.sweep;
      const x = Math.cos(a) * R0 * t.rx;
      const y = Math.sin(a) * R0 * t.rx * squash;
      // tilted a little out of true, as spun sugar is
      pts.push([cx + x, y0 + y + x * t.tilt + t.dy * R0 * 0.25, Math.sin(a) > 0]);
    }
    for (const pass of [0, 1]) {
      if (pass && !t.shine) break;
      g.strokeStyle = pass ? 'rgba(255, 244, 210, 0.75)' : t.color;
      g.lineWidth = Math.max(0.4, (pass ? 0.4 : t.w) * Math.min(1.2, k));
      g.beginPath();
      let pen = false;
      for (const [x, y, isFront] of pts) {
        if (isFront !== front) {
          pen = false;
          continue;
        }
        if (pen) g.lineTo(x, y);
        else g.moveTo(x, y);
        pen = true;
      }
      g.stroke();
    }
  };
  // the foot: threads flaring down from under the cup to a ring on the table
  const footY = box.y + box.h * 1.03;
  for (const f of n.foot) {
    const a = f.a + turn;
    const isFront = Math.sin(a) > 0;
    if (isFront !== front) continue;
    const x0 = cx + Math.cos(a) * R * 0.42;
    const y0 = cupY + Math.sin(a) * R * 0.42 * squash + R * 0.16;
    const x1 = cx + Math.cos(a + f.bend) * R * 0.62;
    const y1 = footY + Math.sin(a + f.bend) * R * 0.62 * squash;
    g.strokeStyle = f.color;
    g.lineWidth = Math.max(0.4, f.w * Math.min(1.2, k));
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo(cx + Math.cos(a) * R * 0.3, (y0 + y1) / 2 + R * 0.05, x1, y1);
    g.stroke();
  }
  for (const t of n.ring) ellipse(t, footY, R);
  for (const t of n.cup) ellipse(t, cupY, R);
  g.restore();
}

/**
 * The clockwork baker standing on a gold disc at (x, y) (the egg's crown), `s` tall,
 * turned `a` radians (0 faces you).
 */
function drawBaker(g: CanvasRenderingContext2D, x: number, y: number, s: number, a: number): void {
  const sa = Math.sin(a);
  const ca = Math.cos(a);
  // a point on the figure: `side` along its shoulders, `fwd` the way it faces
  const at = (side: number, fwd: number, up: number): [number, number, number] => [x + (side * ca + fwd * sa) * s, y - up * s, -side * sa + fwd * ca];
  g.save();
  // the turntable
  const disc = g.createLinearGradient(x - s * 0.3, 0, x + s * 0.3, 0);
  disc.addColorStop(0, '#fff0b0');
  disc.addColorStop(0.45, '#d6a23c');
  disc.addColorStop(1, '#7a5214');
  g.fillStyle = '#6e4a10';
  g.beginPath();
  g.ellipse(x, y + s * 0.03, s * 0.3, s * 0.08, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = disc;
  g.beginPath();
  g.ellipse(x, y, s * 0.3, s * 0.08, 0, 0, Math.PI * 2);
  g.fill();
  type Part = { z: number; draw: () => void };
  const parts: Part[] = [];
  const limb = (p0: [number, number, number], p1: [number, number, number], w: number, color: string) =>
    parts.push({
      z: (p0[2] + p1[2]) / 2,
      draw: () => {
        g.strokeStyle = color;
        g.lineWidth = w * s;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(p0[0], p0[1]);
        g.lineTo(p1[0], p1[1]);
        g.stroke();
      },
    });
  // legs in checked trousers
  for (const side of [-0.07, 0.07]) limb(at(side, 0, 0.02), at(side, 0, 0.24), 0.075, '#3b3550');
  // arms out front, holding a rolling pin
  for (const side of [-1, 1]) limb(at(side * 0.15, 0, 0.5), at(side * 0.11, 0.17, 0.38), 0.065, '#f5f2ea');
  const pinA = at(-0.24, 0.19, 0.38);
  const pinB = at(0.24, 0.19, 0.38);
  limb(pinA, pinB, 0.07, '#b0773a');
  limb(at(-0.3, 0.19, 0.38), pinA, 0.03, '#7a4c1e');
  limb(pinB, at(0.3, 0.19, 0.38), 0.03, '#7a4c1e');
  // the wind-up key in its back
  const key = at(0, -0.17, 0.42);
  parts.push({
    z: key[2],
    draw: () => {
      g.strokeStyle = '#b8862b';
      g.lineWidth = 0.025 * s;
      const [kx, ky] = key;
      const [bx] = at(0, -0.1, 0.42);
      g.beginPath();
      g.moveTo(bx, ky);
      g.lineTo(kx, ky);
      g.stroke();
      g.fillStyle = '#e0b04a';
      for (const d of [-1, 1]) {
        g.beginPath();
        g.ellipse(kx + (kx - bx) * 0.2, ky + d * 0.045 * s, Math.max(0.5, Math.abs(ca) * 0.045 * s + 0.01 * s), 0.04 * s, 0, 0, Math.PI * 2);
        g.fill();
      }
    },
  });
  // the body: a baker's white jacket, lit from the left
  parts.push({
    z: 0,
    draw: () => {
      const jacket = g.createLinearGradient(x - s * 0.18, 0, x + s * 0.18, 0);
      jacket.addColorStop(0, '#ffffff');
      jacket.addColorStop(0.6, '#e6e1d6');
      jacket.addColorStop(1, '#a9a396');
      g.fillStyle = jacket;
      g.beginPath();
      g.ellipse(x, y - s * 0.4, s * 0.17, s * 0.19, 0, 0, Math.PI * 2);
      g.fill();
      if (ca > 0) {
        // two rows of gold buttons, and the apron
        g.globalAlpha = Math.min(1, ca * 2);
        g.fillStyle = '#f1e7cf';
        g.beginPath();
        const ax = x + sa * 0.06 * s;
        g.moveTo(ax - 0.1 * s * ca, y - 0.36 * s);
        g.lineTo(ax + 0.1 * s * ca, y - 0.36 * s);
        g.lineTo(ax + 0.13 * s * ca, y - 0.2 * s);
        g.lineTo(ax - 0.13 * s * ca, y - 0.2 * s);
        g.fill();
        g.fillStyle = '#d4a23a';
        for (const side of [-0.05, 0.05])
          for (const up of [0.46, 0.53]) {
            const [bx, by] = at(side, 0.16, up);
            g.beginPath();
            g.arc(bx, by, 0.016 * s, 0, Math.PI * 2);
            g.fill();
          }
        g.globalAlpha = 1;
      }
    },
  });
  // the head, its mustache, and a tall pleated toque
  parts.push({
    z: 0.01,
    draw: () => {
      const hx = x;
      const hy = y - s * 0.68;
      const face = g.createRadialGradient(hx - s * 0.04, hy - s * 0.04, 0, hx, hy, s * 0.12);
      face.addColorStop(0, '#fbe0c2');
      face.addColorStop(1, '#d9a37a');
      g.fillStyle = face;
      g.beginPath();
      g.arc(hx, hy, s * 0.11, 0, Math.PI * 2);
      g.fill();
      if (ca > 0.05) {
        g.globalAlpha = Math.min(1, ca * 2);
        g.fillStyle = '#2a1a10';
        for (const side of [-0.04, 0.04]) {
          const [ex, ey] = at(side, 0.1, 0.7);
          g.beginPath();
          g.arc(ex, ey, 0.014 * s, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = '#e88c8c';
        for (const side of [-0.065, 0.065]) {
          const [ex, ey] = at(side, 0.09, 0.655);
          g.beginPath();
          g.arc(ex, ey, 0.02 * s, 0, Math.PI * 2);
          g.fill();
        }
        // a curled mustache
        g.strokeStyle = '#4a2c18';
        g.lineWidth = 0.022 * s;
        const [m0x, m0y] = at(-0.055, 0.1, 0.64);
        const [m1x, m1y] = at(0, 0.11, 0.645);
        const [m2x, m2y] = at(0.055, 0.1, 0.64);
        g.beginPath();
        g.moveTo(m0x, m0y - 0.015 * s);
        g.quadraticCurveTo((m0x + m1x) / 2, m1y + 0.012 * s, m1x, m1y);
        g.quadraticCurveTo((m1x + m2x) / 2, m1y + 0.012 * s, m2x, m2y - 0.015 * s);
        g.stroke();
        g.globalAlpha = 1;
      }
      const hat = g.createLinearGradient(hx - s * 0.12, 0, hx + s * 0.12, 0);
      hat.addColorStop(0, '#ffffff');
      hat.addColorStop(1, '#bdb8ad');
      g.fillStyle = hat;
      g.fillRect(hx - s * 0.09, hy - s * 0.2, s * 0.18, s * 0.11);
      for (const [dx, dy, r] of [
        [-0.07, -0.25, 0.07],
        [0.07, -0.25, 0.07],
        [0, -0.29, 0.085],
      ] as const) {
        g.beginPath();
        g.arc(hx + dx * s, hy + dy * s, r * s, 0, Math.PI * 2);
        g.fill();
      }
      // pleats that turn with it
      g.strokeStyle = 'rgba(120, 112, 100, 0.5)';
      g.lineWidth = 0.008 * s;
      for (let p = 0; p < 6; p++) {
        const ang = a + (p / 6) * Math.PI * 2;
        if (Math.cos(ang) < 0) continue;
        const px = hx + Math.sin(ang) * s * 0.09;
        g.beginPath();
        g.moveTo(px, hy - s * 0.09);
        g.lineTo(px, hy - s * 0.2);
        g.stroke();
      }
    },
  });
  for (const p of parts.sort((p, q) => p.z - q.z)) p.draw();
  g.restore();
}

/** The pastry egg on its sugar holder with the baker on top, all in `box` (the egg's own box). */
export function drawPastryEgg(g: CanvasRenderingContext2D, box: Box, turn: number, bakerTurn: number, res = 300): void {
  drawSugarNest(g, box, turn, 'back');
  drawShell(g, pastryShell(), turn, box, res);
  drawSugarNest(g, box, turn, 'front');
  drawBaker(g, box.x + box.w / 2, box.y + box.h * 0.025, box.h * 0.3, bakerTurn);
}
