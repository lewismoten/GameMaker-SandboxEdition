// Drawing a felt egg: its covering is painted flat (a longitude x latitude texture: felt
// fibers, bands, a pattern, an appliqué and running stitches), then wrapped round an egg
// shape and lit, pixel by pixel, at any turn. Used small on the wall and large in the viewer.
import type { EggLook } from './eggs';

export const TEX_W = 512;
export const TEX_H = 256;

/** A small seeded random, so an egg's fibers (and a bonus egg's paint) come out the same each time. */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

const seedOf = (text: string) => [...text].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

/** The flat covering, TEX_W x TEX_H. A 1 px step across is about 0.77 of a step down. */
export function eggTexture(look: EggLook, seed = look.felt + look.motif): ImageData {
  const c = document.createElement('canvas');
  c.width = TEX_W;
  c.height = TEX_H;
  const g = c.getContext('2d')!;
  const rand = rng(seedOf(seed));
  g.fillStyle = look.felt;
  g.fillRect(0, 0, TEX_W, TEX_H);
  const stitch = (draw: () => void, color = look.thread, width = 2.2) => {
    g.save();
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineCap = 'round';
    g.setLineDash([7, 6]);
    g.beginPath();
    draw();
    g.stroke();
    g.restore();
  };
  // across the whole width, drawn three times so the seam at u = 0 / 1 closes
  const wrap = (draw: (dx: number) => void) => [-TEX_W, 0, TEX_W].forEach(draw);
  const scatter = (n: number, vMin: number, vMax: number, draw: (x: number, y: number, i: number) => void) => {
    for (let i = 0; i < n; i++) {
      const x = rand() * TEX_W;
      const y = TEX_H * (vMin + rand() * (vMax - vMin));
      // leave the appliqués clear
      if ([0.25, 0.75].some((u) => Math.abs(x - u * TEX_W) < 48 && Math.abs(y - TEX_H * 0.4) < 40)) continue;
      wrap((dx) => draw(x + dx, y, i));
    }
  };
  const waist = TEX_H * 0.62;
  // the band round the waist and a ring round the crown
  g.fillStyle = look.band;
  g.fillRect(0, waist - 12, TEX_W, 24);
  g.fillRect(0, TEX_H * 0.16 - 5, TEX_W, 10);
  switch (look.pattern) {
    case 'dots':
      scatter(46, 0.2, 0.95, (x, y, i) => {
        g.fillStyle = ['#e63946', '#f4a259', '#ffd23f', '#5cb85c', '#3a86ff', '#9b5de5'][i % 6];
        g.beginPath();
        g.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
        g.fill();
      });
      break;
    case 'stars':
    case 'snowflakes': {
      const arms = look.pattern === 'stars' ? 4 : 6;
      scatter(look.pattern === 'stars' ? 60 : 34, 0.08, 0.98, (x, y, i) => {
        g.strokeStyle = look.band;
        g.lineWidth = 1.6;
        const r = look.pattern === 'stars' ? 3 + (i % 3) * 1.5 : 7;
        g.beginPath();
        for (let a = 0; a < arms; a++) {
          const t = (a / arms) * Math.PI * 2 + i;
          g.moveTo(x, y);
          g.lineTo(x + Math.cos(t) * r * 1.3, y + Math.sin(t) * r);
        }
        g.stroke();
      });
      break;
    }
    case 'zigzag':
      for (const y of [waist, TEX_H * 0.86]) {
        g.strokeStyle = look.band;
        g.lineWidth = 4;
        g.beginPath();
        for (let x = 0; x <= TEX_W; x += 16) g.lineTo(x, y + ((x / 16) % 2 ? -9 : 9));
        g.stroke();
      }
      break;
    case 'scallops':
      g.fillStyle = look.band;
      g.fillRect(0, TEX_H * 0.86, TEX_W, TEX_H * 0.14);
      for (let x = 0; x < TEX_W; x += 32) {
        g.beginPath();
        g.arc(x + 16, TEX_H * 0.86, 16, Math.PI, 0);
        g.fill();
      }
      break;
    case 'checks':
      for (let x = 0; x < TEX_W; x += 12)
        for (let k = 0; k < 2; k++) {
          g.fillStyle = (x / 12 + k) % 2 ? look.band : look.felt;
          g.fillRect(x, waist - 12 + k * 12, 12, 12);
        }
      break;
    case 'waves':
      for (const v of [0.3, 0.48, 0.78, 0.9]) {
        g.strokeStyle = look.band;
        g.lineWidth = 2.5;
        g.beginPath();
        for (let x = 0; x <= TEX_W; x += 4) g.lineTo(x, TEX_H * v + Math.sin((x / TEX_W) * Math.PI * 16) * 5);
        g.stroke();
      }
      // sequins on the band
      for (let x = 6; x < TEX_W; x += 12) {
        g.fillStyle = (x / 12) % 2 ? '#ffffff' : '#9fb3c2';
        g.beginPath();
        g.arc(x, waist, 4, 0, Math.PI * 2);
        g.fill();
      }
      break;
    case 'circuit':
      g.strokeStyle = look.band;
      g.lineWidth = 2;
      scatter(40, 0.08, 0.95, (x, y, i) => {
        g.beginPath();
        g.moveTo(x, y);
        const l = 14 + (i % 4) * 8;
        g.lineTo(x + l, y);
        g.lineTo(x + l, y + (i % 2 ? 12 : -12));
        g.stroke();
        g.fillStyle = look.band;
        g.beginPath();
        g.arc(x, y, 3, 0, Math.PI * 2);
        g.fill();
      });
      for (let x = 4; x < TEX_W; x += 10) {
        g.fillStyle = '#e8e8e0';
        g.fillRect(x, waist - 4, 5, 8);
      }
      break;
    case 'ruled':
      // a notebook page: pale blue ruled lines, and a red margin down the front and back
      g.strokeStyle = '#a9c0dc';
      g.lineWidth = 1.5;
      for (let y = TEX_H * 0.2; y < TEX_H * 0.98; y += 11) {
        if (Math.abs(y - waist) < 14) continue;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(TEX_W, y);
        g.stroke();
      }
      g.strokeStyle = '#d9483b';
      g.lineWidth = 2;
      for (const u of [0.1, 0.6]) {
        g.beginPath();
        g.moveTo(u * TEX_W, TEX_H * 0.17);
        g.lineTo(u * TEX_W, TEX_H);
        g.stroke();
      }
      break;
    case 'pawprints':
      scatter(30, 0.12, 0.95, (x, y, i) => {
        g.fillStyle = look.thread;
        g.save();
        g.translate(x, y);
        g.rotate((i % 5) * 0.5 - 1);
        g.beginPath();
        g.ellipse(0, 3, 5, 4, 0, 0, Math.PI * 2);
        for (const [dx, dy] of [
          [-5, -3],
          [-2, -6],
          [2, -6],
          [5, -3],
        ])
          g.ellipse(dx, dy, 1.8, 2.2, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
      });
      // rickrack round the waist
      g.strokeStyle = look.thread;
      g.lineWidth = 3;
      g.beginPath();
      for (let x = 0; x <= TEX_W; x += 8) g.lineTo(x, waist + ((x / 8) % 2 ? -6 : 6));
      g.stroke();
      break;
    case 'grid': {
      // a checkerboard floor running away to the horizon (the waist), in chain stitch
      g.strokeStyle = look.band;
      g.lineWidth = 1.4;
      for (let k = 1; k < 9; k++) {
        const y = waist + 12 + (TEX_H - waist - 12) * (k / 8) ** 1.7;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(TEX_W, y);
        g.stroke();
      }
      for (let x = 0; x < TEX_W; x += 32)
        for (const dir of [-1, 1]) {
          g.beginPath();
          g.moveTo(x + 16, waist + 12);
          g.lineTo(x + 16 + dir * 30, TEX_H);
          g.stroke();
        }
      // a rainbow of floss above
      ['#ff5a5a', '#ffb347', '#ffe66d', '#7bd88f', '#5ab0ff', '#b48bff'].forEach((c, i) => {
        g.fillStyle = c;
        g.fillRect(0, TEX_H * 0.2 + i * 3, TEX_W, 2);
      });
      break;
    }
    case 'diamonds':
      // a herald's coat: gold lozenges, and a winding road of backstitch
      g.fillStyle = look.band;
      for (let x = 0; x < TEX_W; x += 28)
        for (const v of [0.86, 0.95]) {
          g.beginPath();
          g.moveTo(x + 14, TEX_H * v - 8);
          g.lineTo(x + 22, TEX_H * v);
          g.lineTo(x + 14, TEX_H * v + 8);
          g.lineTo(x + 6, TEX_H * v);
          g.fill();
        }
      stitch(
        () => {
          for (let x = 0; x <= TEX_W; x += 4) g.lineTo(x, TEX_H * 0.24 + Math.sin((x / TEX_W) * Math.PI * 6) * 6 + Math.sin((x / TEX_W) * Math.PI * 2) * 4);
        },
        '#8a5a2b',
        3,
      );
      break;
    case 'confetti': {
      // confetti French knots in every color, and gold rickrack round the waist
      const colors = ['#ffd23f', '#e8443a', '#3a8fe0', '#4fc06a', '#ff8a2a', '#ff7fb0', '#ffffff'];
      scatter(70, 0.08, 0.98, (x, y, i) => {
        g.fillStyle = colors[i % colors.length];
        g.beginPath();
        g.arc(x, y, 2.4, 0, Math.PI * 2);
        g.fill();
      });
      g.strokeStyle = look.thread;
      g.lineWidth = 3;
      g.beginPath();
      for (let x = 0; x <= TEX_W; x += 8) g.lineTo(x, waist + ((x / 8) % 2 ? -6 : 6));
      g.stroke();
      break;
    }
  }
  // running stitches along the bands' edges
  for (const y of [waist - 13, waist + 13, TEX_H * 0.16 - 6, TEX_H * 0.16 + 6])
    stitch(() => {
      g.moveTo(0, y);
      g.lineTo(TEX_W, y);
    });
  // the appliqué, front and back, a little above the waist
  for (const u of [0.25, 0.75]) drawMotif(g, look, u * TEX_W, TEX_H * 0.4, stitch);
  // felt: short fibers lighter and darker, every which way
  for (let i = 0; i < 9000; i++) {
    const x = rand() * TEX_W;
    const y = rand() * TEX_H;
    const t = rand() * Math.PI;
    const l = 1 + rand() * 3;
    g.strokeStyle = rand() < 0.5 ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.12)';
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(t) * l, y + Math.sin(t) * l);
    g.stroke();
  }
  return g.getImageData(0, 0, TEX_W, TEX_H);
}

/** A felt appliqué centered at (x, y): stretched 1.3x across, so it looks round on the egg. */
function drawMotif(g: CanvasRenderingContext2D, look: EggLook, x: number, y: number, stitch: (draw: () => void, color?: string, width?: number) => void): void {
  g.save();
  g.translate(x, y);
  g.scale(1.3, 1);
  g.fillStyle = look.patch;
  g.strokeStyle = look.thread;
  const blob = (path: () => void) => {
    g.beginPath();
    path();
    g.fill();
    stitch(path, look.thread, 1.6);
  };
  switch (look.motif) {
    case 'paw':
      blob(() => g.ellipse(0, 8, 16, 13, 0, 0, Math.PI * 2));
      for (const [dx, dy] of [
        [-18, -10],
        [-7, -20],
        [7, -20],
        [18, -10],
      ])
        blob(() => g.ellipse(dx, dy, 6, 7, 0, 0, Math.PI * 2));
      break;
    case 'castle':
      blob(() => {
        g.moveTo(-24, 24);
        g.lineTo(-24, -6);
        for (let i = 0; i < 4; i++) {
          g.lineTo(-24 + i * 12, -14);
          g.lineTo(-18 + i * 12, -14);
          g.lineTo(-18 + i * 12, -6);
          g.lineTo(-12 + i * 12, -6);
        }
        g.lineTo(24, -14);
        g.lineTo(24, 24);
        g.closePath();
      });
      g.fillStyle = '#ff7fb0';
      g.beginPath();
      g.moveTo(0, -14);
      g.lineTo(0, -32);
      g.lineTo(12, -27);
      g.lineTo(0, -22);
      g.fill();
      g.fillStyle = 'rgba(0,0,0,0.45)';
      g.fillRect(-5, 10, 10, 14);
      break;
    case 'mitten':
      blob(() => {
        g.moveTo(-14, 24);
        g.lineTo(-14, -8);
        g.quadraticCurveTo(-14, -26, 2, -26);
        g.quadraticCurveTo(16, -26, 16, -8);
        g.lineTo(16, 24);
        g.closePath();
      });
      blob(() => g.ellipse(-18, 0, 6, 10, -0.5, 0, Math.PI * 2));
      g.fillStyle = look.felt;
      g.fillRect(-16, 18, 34, 9);
      break;
    case 'bolt':
      blob(() => {
        g.moveTo(6, -28);
        g.lineTo(-14, 4);
        g.lineTo(0, 4);
        g.lineTo(-8, 28);
        g.lineTo(16, -6);
        g.lineTo(2, -6);
        g.closePath();
      });
      break;
    case 'planet':
      blob(() => g.arc(0, 0, 16, 0, Math.PI * 2));
      g.strokeStyle = '#ffd23f';
      g.lineWidth = 4;
      g.beginPath();
      g.ellipse(0, 0, 28, 7, -0.35, 0, Math.PI * 2);
      g.stroke();
      break;
    case 'mask':
      g.fillStyle = look.patch;
      blob(() => {
        g.moveTo(-20, -18);
        g.quadraticCurveTo(0, -26, 20, -18);
        g.quadraticCurveTo(22, 14, 0, 24);
        g.quadraticCurveTo(-22, 14, -20, -18);
      });
      g.fillStyle = '#1a1a1a';
      for (const dx of [-9, 9]) {
        g.beginPath();
        g.ellipse(dx, -6, 5, 3.5, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = '#1a1a1a';
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 6, 9, 0.2, Math.PI - 0.2);
      g.stroke();
      break;
    case 'rocket':
      g.fillStyle = '#ff9f1c';
      g.beginPath();
      g.moveTo(-6, 18);
      g.lineTo(0, 34);
      g.lineTo(6, 18);
      g.fill();
      g.fillStyle = look.patch;
      blob(() => {
        g.moveTo(0, -30);
        g.quadraticCurveTo(12, -14, 9, 18);
        g.lineTo(-9, 18);
        g.quadraticCurveTo(-12, -14, 0, -30);
      });
      g.fillStyle = '#c8e6ff';
      g.beginPath();
      g.arc(0, -8, 4.5, 0, Math.PI * 2);
      g.fill();
      break;
    case 'bug':
      g.strokeStyle = '#111';
      g.lineWidth = 2;
      g.beginPath();
      for (const s of [-1, 1])
        for (const dy of [-6, 2, 10]) {
          g.moveTo(0, dy);
          g.lineTo(s * 20, dy + (dy - 2) * 0.6);
        }
      g.stroke();
      blob(() => g.ellipse(0, 4, 12, 15, 0, 0, Math.PI * 2));
      g.fillStyle = '#111';
      g.beginPath();
      g.arc(0, -14, 7, 0, Math.PI * 2);
      g.fill();
      break;
    case 'bookworm': {
      // a green bookworm curled in a hump, in red reading glasses
      const segs: [number, number][] = [
        [-22, 14],
        [-14, 6],
        [-6, -2],
        [2, -4],
        [10, 2],
        [16, 10],
      ];
      for (const [sx, sy] of segs) blob(() => g.ellipse(sx, sy, 7, 7, 0, 0, Math.PI * 2));
      blob(() => g.ellipse(20, -6, 9, 9, 0, 0, Math.PI * 2));
      g.strokeStyle = '#d23a2e';
      g.lineWidth = 1.8;
      g.beginPath();
      g.arc(17, -7, 3.2, 0, Math.PI * 2);
      g.moveTo(26.2, -7);
      g.arc(23, -7, 3.2, 0, Math.PI * 2);
      g.moveTo(20.2, -7);
      g.lineTo(19.8, -7);
      g.stroke();
      g.fillStyle = '#1a1a1a';
      for (const ex of [17, 23]) {
        g.beginPath();
        g.arc(ex, -7, 1.2, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = '#1a1a1a';
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(20, -2, 3, 0.3, Math.PI - 0.3);
      g.stroke();
      // the ribbon bookmark under it
      g.fillStyle = '#c8241e';
      g.fillRect(-4, 18, 5, 14);
      break;
    }
    case 'bone':
      blob(() => {
        g.moveTo(-18, -5);
        g.lineTo(18, -5);
        g.arc(22, -7, 6, Math.PI * 0.9, Math.PI * 0.4, false);
        g.arc(22, 7, 6, -Math.PI * 0.4, Math.PI * 1.1, false);
        g.lineTo(-18, 5);
        g.arc(-22, 7, 6, Math.PI * 0.1, Math.PI * 1.6, false);
        g.arc(-22, -7, 6, Math.PI * 0.6, Math.PI * 0.1, false);
        g.closePath();
      });
      // a red bow round its middle
      g.fillStyle = '#d23a2e';
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(s * 9, -8);
        g.lineTo(s * 9, 8);
        g.closePath();
        g.fill();
      }
      g.fillRect(-2.5, -4, 5, 8);
      break;
    case 'cube': {
      // a cube in three shades, so it reads as solid
      const top = [
        [0, -24],
        [22, -12],
        [0, 0],
        [-22, -12],
      ];
      const left = [
        [-22, -12],
        [0, 0],
        [0, 26],
        [-22, 14],
      ];
      const right = [
        [22, -12],
        [0, 0],
        [0, 26],
        [22, 14],
      ];
      const face = (pts: number[][], color: string) => {
        g.fillStyle = color;
        g.beginPath();
        pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
        g.closePath();
        g.fill();
        stitch(
          () => {
            pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
            g.closePath();
          },
          look.thread,
          1.2,
        );
      };
      face(top, '#b89cf2');
      face(left, look.patch);
      face(right, '#43287f');
      break;
    }
    case 'sword':
      // a scrap of treasure map, the sword laid over it
      g.save();
      g.rotate(-0.12);
      g.fillStyle = '#e9d7a8';
      g.fillRect(-24, -18, 48, 36);
      g.strokeStyle = '#a03a2a';
      g.lineWidth = 2;
      g.setLineDash([4, 3]);
      g.beginPath();
      g.moveTo(-18, 12);
      g.quadraticCurveTo(-4, -14, 14, 6);
      g.stroke();
      g.setLineDash([]);
      g.beginPath();
      g.moveTo(11, 3);
      g.lineTo(17, 9);
      g.moveTo(17, 3);
      g.lineTo(11, 9);
      g.stroke();
      g.restore();
      g.save();
      g.rotate(0.7);
      blob(() => {
        g.moveTo(0, -32);
        g.lineTo(4, -26);
        g.lineTo(4, 14);
        g.lineTo(-4, 14);
        g.lineTo(-4, -26);
        g.closePath();
      });
      g.fillStyle = look.band;
      g.fillRect(-11, 14, 22, 4);
      g.fillStyle = '#5a3216';
      g.fillRect(-2.5, 18, 5, 10);
      g.fillStyle = look.band;
      g.beginPath();
      g.arc(0, 30, 3.5, 0, Math.PI * 2);
      g.fill();
      g.restore();
      break;
    case 'cake':
      // a birthday cake: a frosted layer with a cream drip, and three yarn candles lit
      blob(() => g.rect(-22, -6, 44, 26));
      g.fillStyle = '#fff4fa';
      g.fillRect(-22, -6, 44, 5);
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(-16.5 + k * 11, -1, 5.5, 0, Math.PI);
        g.fill();
      }
      ['#3a8fe0', '#ffd23f', '#e8443a'].forEach((col, i) => {
        const cx = -12 + i * 12;
        g.fillStyle = col;
        g.fillRect(cx - 2, -22, 4, 16);
        g.fillStyle = '#ffb02e';
        g.beginPath();
        g.ellipse(cx, -26, 2.6, 4, 0, 0, Math.PI * 2);
        g.fill();
      });
      break;
  }
  g.restore();
}

/** The egg's half-width at height y (-1 top .. 1 bottom), as a fraction of its half-height. */
export const radiusAt = (y: number) => 0.76 * Math.sqrt(Math.max(0, 1 - y * y)) * (1 + 0.13 * y);

/**
 * Draws the egg turned by `turn` radians (0 shows the front appliqué) into a w x h box at
 * (x, y) of the given context, through an offscreen buffer of at most `res` rows.
 */
export function drawEgg(g: CanvasRenderingContext2D, tex: ImageData, turn: number, box: { x: number; y: number; w: number; h: number }, res = 300): void {
  const H = Math.max(16, Math.min(res, Math.round(box.h)));
  const W = Math.max(12, Math.round((H * box.w) / box.h));
  const img = new ImageData(W, H);
  const out = img.data;
  const src = tex.data;
  const half = H / 2;
  const cx = W / 2;
  // light from the upper left, in front
  const L = [-0.45, -0.55, 0.7];
  const ln = Math.hypot(L[0], L[1], L[2]);
  for (let py = 0; py < H; py++) {
    const y = (py + 0.5 - half) / half;
    const R = radiusAt(y);
    if (R <= 0) continue;
    const dR = (radiusAt(y + 0.002) - radiusAt(y - 0.002)) / 0.004;
    const v = Math.min(TEX_H - 1, Math.max(0, Math.floor(((y + 1) / 2) * TEX_H)));
    for (let px = 0; px < W; px++) {
      const x = (px + 0.5 - cx) / half;
      const edge = (R - Math.abs(x)) * half; // pixels inside the outline
      if (edge <= -0.5) continue;
      const xr = Math.min(R, Math.abs(x)) * Math.sign(x);
      const z = Math.sqrt(Math.max(0, R * R - xr * xr));
      const theta = Math.atan2(xr, z) + turn + Math.PI / 2;
      let u = theta / (Math.PI * 2);
      u -= Math.floor(u);
      const ti = (v * TEX_W + Math.min(TEX_W - 1, Math.floor(u * TEX_W))) * 4;
      // the surface normal of a shape turned on a lathe
      let nx = xr / R;
      let nz = z / R;
      const ny = -dR;
      const nl = Math.hypot(nx, ny, nz);
      nx /= nl;
      nz /= nl;
      const d = Math.max(0, (nx * L[0] + (ny / nl) * L[1] + nz * L[2]) / ln);
      // felt has no shine: a soft wrap of light, and a fuzzy rim
      const shade = 0.38 + 0.72 * d + 0.12 * Math.pow(1 - nz, 3);
      const o = (py * W + px) * 4;
      out[o] = Math.min(255, src[ti] * shade);
      out[o + 1] = Math.min(255, src[ti + 1] * shade);
      out[o + 2] = Math.min(255, src[ti + 2] * shade);
      out[o + 3] = Math.max(0, Math.min(1, edge + 0.5)) * 255;
    }
  }
  const buf = document.createElement('canvas');
  buf.width = W;
  buf.height = H;
  buf.getContext('2d')!.putImageData(img, 0, 0);
  g.save();
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(buf, box.x, box.y, box.w, box.h);
  g.restore();
}

/** The egg's width for a given height. */
export const EGG_ASPECT = 0.76 * 1.06;
