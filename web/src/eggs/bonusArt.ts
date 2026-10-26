// Drawing the rotten egg kept apart from the felt eggs (bonus.ts): mottled, pitted, cracking a
// little more with every tap, stench rising; the IOU note inside it (for the diamond heart,
// diamondHeart.ts); and the glass cake stand that holds it and the pastry egg (pastryEgg.ts).
// The shells are wrapped and lit by eggShell.ts.
import { EGG_ASPECT } from './eggArt';
import { xorshift32 } from '../seededRandom';
import { canvas, drawShell, fbm, noise, readLayer, wrap, type Shell } from './eggShell';
import { TEX_H, TEX_W } from './eggTexture';
import { drawPastryEgg } from './pastryEgg';

// ---- the rotten egg -----------------------------------------------------------------------

let rottenBase: { color: ImageData; height: Float32Array } | undefined;

function rottenBaseLayers() {
  if (rottenBase) return rottenBase;
  const n1 = noise(31);
  const n2 = noise(77);
  const n3 = noise(5);
  const rand = xorshift32(1776);
  const color = new ImageData(TEX_W, TEX_H);
  const height = new Float32Array(TEX_W * TEX_H);
  const mix = (a: number[], b: number[], t: number) => a.map((x, i) => x + (b[i] - x) * Math.max(0, Math.min(1, t)));
  const grey = [146, 150, 124];
  const olive = [98, 110, 70];
  const sick = [186, 176, 104];
  const brown = [104, 82, 50];
  const bile = [70, 92, 48];
  for (let y = 0; y < TEX_H; y++) {
    const v = y / TEX_H;
    for (let x = 0; x < TEX_W; x++) {
      const u = x / TEX_W;
      const a = fbm(n1, u, v, 6);
      const b = fbm(n2, u, v, 4);
      const fine = n3(u, v, 96, 48);
      let c = mix(grey, olive, (a - 0.38) * 3);
      c = mix(c, sick, (b - 0.6) * 4);
      c = mix(c, brown, (0.36 - b) * 4);
      // what settled at the bottom
      c = mix(c, bile, (v - 0.72) * 2.6 + (a - 0.5));
      const grain = (fine - 0.5) * 22;
      let pit = 0;
      if (rand() < 0.0035) pit = 1;
      const i = (y * TEX_W + x) * 4;
      color.data[i] = c[0] + grain - pit * 60;
      color.data[i + 1] = c[1] + grain - pit * 60;
      color.data[i + 2] = c[2] + grain - pit * 50;
      color.data[i + 3] = 255;
      height[y * TEX_W + x] = a * 0.35 + fine * 0.12 - pit * 0.4;
    }
  }
  rottenBase = { color, height };
  return rottenBase;
}

type Crack = { pts: [number, number][]; branches: [number, number][][] };
let cracks: Crack[] | undefined;

function crackPaths(): Crack[] {
  if (cracks) return cracks;
  const rand = xorshift32(1313);
  cracks = [];
  for (let k = 0; k < 13; k++) {
    // the first cracks start on the side that faces you
    const u0 = k < 4 ? TEX_W * (0.18 + rand() * 0.14) : rand() * TEX_W;
    let x = u0;
    let y = TEX_H * (0.22 + rand() * 0.55);
    let a = rand() * Math.PI * 2;
    const pts: [number, number][] = [[x, y]];
    const branches: [number, number][][] = [];
    const steps = 7 + Math.floor(rand() * 6);
    for (let s = 0; s < steps; s++) {
      // eggshell cracks run straight, then turn sharply
      a += (rand() - 0.5) * 1.7;
      const len = 9 + rand() * 10;
      x += Math.cos(a) * len * 1.3;
      y = Math.max(TEX_H * 0.08, Math.min(TEX_H * 0.94, y + Math.sin(a) * len));
      pts.push([x, y]);
      if (rand() < 0.13) {
        let bx = x;
        let by = y;
        let ba = a + (rand() < 0.5 ? 1 : -1) * (0.6 + rand() * 0.8);
        const br: [number, number][] = [[bx, by]];
        for (let j = 0; j < 2 + rand() * 2; j++) {
          ba += (rand() - 0.5) * 1.4;
          const l = 4 + rand() * 7;
          bx += Math.cos(ba) * l * 1.3;
          by += Math.sin(ba) * l;
          br.push([bx, by]);
        }
        branches.push(br);
      }
    }
    cracks.push({ pts, branches });
  }
  return cracks;
}

const rottenCache = new Map<number, Shell>();

/** The rotten egg after `taps` taps (0 .. 13): more cracks each time, flakes off near the end. */
export function rottenShell(taps: number): Shell {
  const stage = Math.max(0, Math.min(13, Math.floor(taps)));
  const hit = rottenCache.get(stage);
  if (hit) return hit;
  const base = rottenBaseLayers();
  const col = canvas(TEX_W, TEX_H);
  const cg = col.getContext('2d')!;
  cg.putImageData(base.color, 0, 0);
  const dent = canvas(TEX_W, TEX_H);
  const dg = dent.getContext('2d')!;
  dg.fillStyle = '#000';
  dg.fillRect(0, 0, TEX_W, TEX_H);
  const rand = xorshift32(99);
  const all = crackPaths();
  const path = (g: CanvasRenderingContext2D, pts: [number, number][], upto: number, dx: number) => {
    const n = Math.max(2, Math.round(pts.length * upto));
    g.beginPath();
    pts.slice(0, n).forEach(([x, y], i) => (i ? g.lineTo(x + dx, y) : g.moveTo(x + dx, y)));
  };
  for (let k = 0; k < Math.min(stage, all.length); k++) {
    // a crack runs on a little further with every tap after it opened
    const grow = Math.min(1, 0.35 + (stage - k) * 0.22);
    const { pts, branches } = all[k];
    const w = 1.1 + Math.min(1.6, (stage - k) * 0.16);
    wrap((dx) => {
      cg.lineJoin = dg.lineJoin = 'round';
      cg.lineCap = dg.lineCap = 'round';
      // a chipped light edge under the dark line
      cg.strokeStyle = 'rgba(226, 222, 190, 0.5)';
      cg.lineWidth = w + 1.2;
      cg.save();
      cg.translate(0.8, 1);
      path(cg, pts, grow, dx);
      cg.stroke();
      cg.restore();
      cg.strokeStyle = '#1b1d12';
      cg.lineWidth = w;
      path(cg, pts, grow, dx);
      cg.stroke();
      dg.strokeStyle = '#fff';
      dg.lineWidth = w + 1;
      path(dg, pts, grow, dx);
      dg.stroke();
      if (grow > 0.7)
        for (const br of branches) {
          cg.lineWidth = w * 0.6;
          path(cg, br, 1, dx);
          cg.stroke();
          dg.lineWidth = w * 0.6 + 0.8;
          path(dg, br, 1, dx);
          dg.stroke();
        }
    });
  }
  // near the end, flakes of shell fall away: dark inside, and something glinting in there
  if (stage >= 8) {
    const flakes = (stage - 7) * 3;
    const r2 = xorshift32(4242);
    for (let f = 0; f < flakes; f++) {
      const c = all[f % all.length];
      const [px, py] = c.pts[Math.floor(r2() * c.pts.length)];
      const r = 4 + r2() * 6 + (stage - 8) * 0.8;
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + r2();
        const rr = r * (0.55 + r2() * 0.6);
        pts.push([px + Math.cos(a) * rr * 1.3, py + Math.sin(a) * rr]);
      }
      wrap((dx) => {
        cg.fillStyle = '#16180f';
        path(cg, [...pts, pts[0]], 1, dx);
        cg.fill();
        cg.strokeStyle = 'rgba(214, 208, 170, 0.6)';
        cg.lineWidth = 1;
        cg.stroke();
        dg.fillStyle = '#fff';
        path(dg, [...pts, pts[0]], 1, dx);
        dg.fill();
        if (rand() < 0.7) {
          cg.fillStyle = ['#ffffff', '#ffe7f0', '#d8f0ff'][f % 3];
          cg.fillRect(px + dx - 0.5, py - 0.5, 1.6, 1.6);
        }
      });
    }
  }
  const sunk = readLayer(dent);
  const height = new Float32Array(base.height.length);
  for (let i = 0; i < height.length; i++) height[i] = base.height[i] - sunk[i] * 0.55;
  const shell: Shell = { color: cg.getImageData(0, 0, TEX_W, TEX_H), height, shine: 0.16, gloss: 10, bump: 1.6 };
  rottenCache.set(stage, shell);
  return shell;
}

/** A puff of stench, painted once: many soft blobs of sickly green. */
export function stinkPuff(seed: number): HTMLCanvasElement {
  const c = canvas(128, 128);
  const g = c.getContext('2d')!;
  const rand = xorshift32(seed * 7919 + 3);
  const tints = ['164, 196, 92', '128, 170, 72', '196, 206, 120', '98, 140, 60', '176, 186, 96'];
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.pow(rand(), 0.7) * 24;
    const x = 64 + Math.cos(a) * d * 1.1;
    const y = 64 + Math.sin(a) * d * 0.85;
    const r = 10 + rand() * 24;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const t = tints[Math.floor(rand() * tints.length)];
    const al = 0.06 + rand() * 0.1;
    grd.addColorStop(0, `rgba(${t}, ${al})`);
    grd.addColorStop(0.6, `rgba(${t}, ${al * 0.5})`);
    grd.addColorStop(1, `rgba(${t}, 0)`);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

/** A few shards of rotten shell lying where they fell, around a spot on the floor. */
export function drawRestingShards(g: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  const rand = xorshift32(1301);
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1;
    const x = cx + side * size * (0.28 + rand() * 0.5);
    const y = cy + (rand() - 0.4) * size * 0.1;
    const r = size * (0.05 + rand() * 0.06);
    g.save();
    g.translate(x, y);
    g.rotate((rand() - 0.5) * 1.4);
    // a curved bit of shell: outside mottled, the inner edge pale
    const grd = g.createLinearGradient(0, -r, 0, r * 0.5);
    grd.addColorStop(0, '#9aa07e');
    grd.addColorStop(1, '#5d6744');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(-r, 0);
    g.quadraticCurveTo(-r * 0.4, -r * (0.7 + rand() * 0.5), r * (0.6 + rand() * 0.5), -r * 0.2);
    g.lineTo(r * 0.7, r * 0.15);
    g.quadraticCurveTo(0, -r * 0.2, -r, 0);
    g.fill();
    g.strokeStyle = 'rgba(222, 216, 182, 0.7)';
    g.lineWidth = Math.max(0.6, size * 0.006);
    g.stroke();
    g.restore();
  }
}

/**
 * The little glass cake stand beside the shadow box, `w` x `h`, holding whichever of
 * 'rotten', 'iou' (the rotten egg tapped open) and 'pastry' have been found (left to right); the rotten egg cracked by
 * `taps` taps (0 .. 12).
 */
export function drawCakeStand(g: CanvasRenderingContext2D, w: number, h: number, items: ('rotten' | 'iou' | 'pastry')[], taps = 0): void {
  const plateY = h * 0.7;
  const cx = w / 2;
  // the foot and stem, pressed glass
  const glass = (fill: string) => {
    g.fillStyle = fill;
    g.fill();
    g.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    g.lineWidth = Math.max(0.6, w * 0.012);
    g.stroke();
  };
  g.beginPath();
  g.ellipse(cx, h * 0.94, w * 0.24, h * 0.04, 0, 0, Math.PI * 2);
  glass('rgba(200, 226, 240, 0.45)');
  g.beginPath();
  g.moveTo(cx - w * 0.05, plateY);
  g.quadraticCurveTo(cx - w * 0.02, h * 0.82, cx - w * 0.09, h * 0.93);
  g.lineTo(cx + w * 0.09, h * 0.93);
  g.quadraticCurveTo(cx + w * 0.02, h * 0.82, cx + w * 0.05, plateY);
  glass('rgba(200, 226, 240, 0.4)');
  // the plate's underside, then what stands on it, then its rim
  g.beginPath();
  g.ellipse(cx, plateY, w * 0.47, h * 0.06, 0, 0, Math.PI * 2);
  glass('rgba(210, 232, 244, 0.42)');
  const n = Math.max(1, items.length);
  items.forEach((item, i) => {
    const ex = n === 1 ? cx : w * (0.3 + (0.4 * i) / (n - 1));
    if (item === 'iou') {
      // the note propped against a shard of its shell
      const s = Math.min(w * 0.42, h * 0.62);
      drawRestingShards(g, ex, plateY - h * 0.01, s * 0.7);
      drawIouNote(g, ex, plateY - s * 0.36, s, 0.35);
      return;
    }
    const eh = item === 'pastry' ? (plateY - h * 0.04) / 1.34 : Math.min(h * 0.44, (w * 0.34) / EGG_ASPECT);
    const ew = eh * EGG_ASPECT;
    const box = { x: ex - ew / 2, y: item === 'pastry' ? plateY - eh * 1.04 : plateY - eh * 0.98, w: ew, h: eh };
    if (item === 'pastry') drawPastryEgg(g, box, 0.2, 0.5, Math.max(40, Math.round(eh * 2)));
    else drawShell(g, rottenShell(taps), 0.4, box, Math.max(40, Math.round(eh * 2)));
  });
  g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  g.lineWidth = Math.max(0.6, w * 0.014);
  g.beginPath();
  g.ellipse(cx, plateY, w * 0.47, h * 0.06, 0, 0.1, Math.PI - 0.1);
  g.stroke();
}

// ---- the IOU in the rotten egg -------------------------------------------------------------

/**
 * What the rotten egg holds now: a little folded note on yellowed onionskin, "IOU one (1)
 * diamond heart", signed by Mystery Robot Joe with a rivet. `size` is its width, centered at
 * (cx, cy); `turn` swings it about its upright axis (its back is plain paper and the rivet).
 */
export function drawIouNote(g: CanvasRenderingContext2D, cx: number, cy: number, size: number, turn: number): void {
  const w = size;
  const h = size * 0.64;
  const c = Math.cos(turn);
  const sx = Math.max(0.06, Math.abs(c));
  const front = c >= 0;
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.06);
  g.scale(sx, 1);
  // the paper, a little tented along its fold, and its shadow side
  const paper = g.createLinearGradient(0, -h / 2, 0, h / 2);
  paper.addColorStop(0, front ? '#f3e7bf' : '#e6d7a8');
  paper.addColorStop(0.5, front ? '#eadba9' : '#dccb97');
  paper.addColorStop(1, front ? '#e2cf96' : '#d3c08a');
  g.fillStyle = paper;
  g.beginPath();
  g.moveTo(-w / 2, -h / 2 + h * 0.02);
  g.lineTo(w / 2, -h / 2);
  g.lineTo(w / 2 - w * 0.01, h / 2);
  g.lineTo(-w / 2 + w * 0.012, h / 2 - h * 0.015);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(120, 96, 40, 0.55)';
  g.lineWidth = Math.max(0.6, w * 0.006);
  g.stroke();
  // the fold across the middle, and a stain where the egg sat on it
  g.strokeStyle = 'rgba(140, 116, 60, 0.45)';
  g.beginPath();
  g.moveTo(-w / 2, 0);
  g.lineTo(w / 2, -h * 0.01);
  g.stroke();
  const stain = g.createRadialGradient(w * 0.3, h * 0.22, 0, w * 0.3, h * 0.22, w * 0.18);
  stain.addColorStop(0, 'rgba(130, 150, 70, 0.28)');
  stain.addColorStop(1, 'rgba(130, 150, 70, 0)');
  g.fillStyle = stain;
  g.fillRect(-w / 2, -h / 2, w, h);
  // the rivet it is signed with: tin, with a highlight
  const rivet = (x: number, y: number, r: number) => {
    const t = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    t.addColorStop(0, '#f4f6f8');
    t.addColorStop(0.5, '#a9b0b8');
    t.addColorStop(1, '#5d646c');
    g.fillStyle = t;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  };
  if (!front) {
    rivet(0, 0, w * 0.045);
    g.restore();
    return;
  }
  // the writing: a careful robot's hand
  g.fillStyle = '#2b2a4a';
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.font = `bold ${Math.round(h * 0.3)}px Georgia, 'Times New Roman', serif`;
  g.fillText('IOU', 0, -h * 0.12);
  g.font = `italic ${Math.max(6, Math.round(h * 0.12))}px Georgia, 'Times New Roman', serif`;
  g.fillText('one (1) diamond heart', 0, h * 0.12);
  g.fillText('ask for it back: Joe', -w * 0.04, h * 0.33);
  rivet(w * 0.38, h * 0.3, w * 0.035);
  g.restore();
}
