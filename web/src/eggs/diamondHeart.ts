// The diamond heart: cut with facets, caged in gold filigree, turning. It is what the rotten egg's
// IOU note promises (bonusArt.ts) and Mystery Robot Joe's trophy for the tin heart hunt
// (tinHearts/trophy.ts), so it is drawn on its own, with no egg code.

type V3 = [number, number, number];
interface Face {
  pts: V3[];
  table?: boolean;
}

const HEART_N = 32;
let heartMesh: { faces: Face[]; girdle: V3[]; scrolls: V3[][]; beads: V3[]; bail: V3[] } | undefined;

function heartOutline(): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < HEART_N; i++) {
    const t = (i / HEART_N) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push([x / 17, (y + 2) / 17]);
  }
  return pts;
}

function buildHeart() {
  if (heartMesh) return heartMesh;
  const out = heartOutline();
  const girdle: V3[] = out.map(([x, y]) => [x, y, 0]);
  const mid = (i: number, k: number, z: number): V3 => {
    const a = out[i];
    const b = out[(i + 1) % HEART_N];
    return [((a[0] + b[0]) / 2) * k, ((a[1] + b[1]) / 2) * k + 0.04 * (1 - k), z];
  };
  // the crown: star facets from the girdle up to a ring, then kites up to the table
  const crown = out.map((_, i) => mid(i, 0.8, 0.12));
  const table: V3[] = out.map(([x, y]) => [x * 0.5, y * 0.5 + 0.02, 0.21]);
  const pav = out.map((_, i) => mid(i, 0.5, -0.26));
  const culet: V3 = [0, 0.1, -0.4];
  const faces: Face[] = [];
  for (let i = 0; i < HEART_N; i++) {
    const j = (i + 1) % HEART_N;
    const p = (i + HEART_N - 1) % HEART_N;
    faces.push({ pts: [girdle[i], girdle[j], crown[i]] });
    faces.push({ pts: [crown[p], girdle[i], crown[i]] });
    faces.push({ pts: [crown[p], crown[i], table[i]] });
    faces.push({ pts: [table[i], crown[i], table[j]] });
    faces.push({ pts: [girdle[j], girdle[i], pav[i]] });
    faces.push({ pts: [girdle[i], pav[p], pav[i]] });
    faces.push({ pts: [pav[i], pav[p], culet] });
  }
  faces.push({ pts: [...table], table: true });
  // gold scrolls round the outside, in the heart's own plane, and a bead at each
  const scrolls: V3[][] = [];
  const beads: V3[] = [];
  for (let i = 2; i < HEART_N; i += 4) {
    const [x, y] = out[i];
    const [ax, ay] = out[(i + HEART_N - 1) % HEART_N];
    const [bx, by] = out[(i + 1) % HEART_N];
    let tx = bx - ax;
    let ty = by - ay;
    const tl = Math.hypot(tx, ty);
    tx /= tl;
    ty /= tl;
    // outward: the tangent turned a quarter (the outline runs clockwise on screen)
    const ox = ty;
    const oy = -tx;
    beads.push([x + ox * 0.06, y + oy * 0.06, 0]);
    for (const side of [1, -1]) {
      const pts: V3[] = [];
      for (let k = 0; k <= 18; k++) {
        const a = (k / 18) * Math.PI * 1.6;
        const r = 0.085 * (1 - k / 26);
        const cxs = 0.13;
        const ca = Math.cos(a) * r;
        const sa = Math.sin(a) * r * side;
        pts.push([x + ox * (cxs - ca) + tx * (sa + side * 0.05), y + oy * (cxs - ca) + ty * (sa + side * 0.05), 0]);
      }
      scrolls.push(pts);
    }
  }
  const bail: V3[] = [];
  for (let k = 0; k <= 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    bail.push([Math.cos(a) * 0.075, out[0][1] - 0.13 + Math.sin(a) * 0.075, 0]);
  }
  heartMesh = { faces, girdle, scrolls, beads, bail };
  return heartMesh;
}

/**
 * The diamond heart, turned by `turn` about its upright axis, `size` across, centered at
 * (cx, cy). `time` (seconds) makes the sparkles twinkle; pass a fixed time to hold them still.
 */
export function drawHeart(g: CanvasRenderingContext2D, cx: number, cy: number, size: number, turn: number, time: number): void {
  const mesh = buildHeart();
  const tilt = -0.22;
  const ct = Math.cos(turn);
  const st = Math.sin(turn);
  const cxl = Math.cos(tilt);
  const sxl = Math.sin(tilt);
  const s = size / 2;
  const view = (p: V3): V3 => {
    const x = p[0] * ct + p[2] * st;
    const z0 = -p[0] * st + p[2] * ct;
    const y = p[1] * cxl - z0 * sxl;
    const z = p[1] * sxl + z0 * cxl;
    return [x, y, z];
  };
  const proj = (v: V3): [number, number] => {
    const f = 4 / (4 - v[2]);
    return [cx + v[0] * f * s, cy + v[1] * f * s];
  };
  type Drawn = { scr: [number, number][]; n: V3; z: number; table?: boolean };
  const drawn: Drawn[] = mesh.faces.map((f) => {
    const vs = f.pts.map(view);
    const a = vs[0];
    const b = vs[1];
    const c = vs[2];
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2];
    const wx = c[0] - a[0],
      wy = c[1] - a[1],
      wz = c[2] - a[2];
    let n: V3 = [uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx];
    const nl = Math.hypot(...n) || 1;
    n = [n[0] / nl, n[1] / nl, n[2] / nl];
    // outward: away from the heart's middle
    const m = vs.reduce<V3>((acc, p) => [acc[0] + p[0] / vs.length, acc[1] + p[1] / vs.length, acc[2] + p[2] / vs.length], [0, 0, 0]);
    const c0 = view([0, 0.05, 0]);
    if (n[0] * (m[0] - c0[0]) + n[1] * (m[1] - c0[1]) + n[2] * (m[2] - c0[2]) < 0) n = [-n[0], -n[1], -n[2]];
    return { scr: vs.map(proj), n, z: m[2], table: f.table };
  });
  const fill = (d: Drawn) => {
    g.beginPath();
    d.scr.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  };
  // gold behind and in front of the stone, split at the heart's plane
  const gold = (front: boolean) => {
    const line = (pts: V3[], w: number, closed = false) => {
      const vs = pts.map(view);
      const runs: [number, number][][] = [];
      let run: [number, number][] | undefined;
      for (let i = 0; i < vs.length - (closed ? 0 : 1); i++) {
        const a = vs[i];
        const b = vs[(i + 1) % vs.length];
        if (a[2] + b[2] >= 0 !== front) {
          run = undefined;
          continue;
        }
        if (!run) runs.push((run = [proj(a)]));
        run.push(proj(b));
      }
      for (const [col, k] of [
        ['#7a5414', 1],
        ['#d9a63c', 0.62],
        ['#fff0b8', 0.22],
      ] as const) {
        g.strokeStyle = col;
        g.lineWidth = Math.max(0.6, w * k);
        for (const r of runs) {
          g.beginPath();
          r.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
          g.stroke();
        }
      }
    };
    g.lineCap = 'round';
    g.lineJoin = 'round';
    line(
      mesh.girdle.map(([x, y, z]) => [x * 1.025, y * 1.025, z] as V3),
      size * 0.04,
      true,
    );
    for (const sc of mesh.scrolls) line(sc, size * 0.016);
    line(mesh.bail, size * 0.022, true);
    for (const b of mesh.beads) {
      const v = view(b);
      if (v[2] >= 0 !== front) continue;
      const [x, y] = proj(v);
      const r = size * 0.022;
      const grd = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      grd.addColorStop(0, '#fff6cf');
      grd.addColorStop(0.5, '#e0b048');
      grd.addColorStop(1, '#6e4a10');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
  };
  g.save();
  gold(false);
  // the far facets, seen through the stone (and through the table): hard light and dark, with fire
  const glints: [number, number, number][] = [];
  drawn.forEach((d, i) => {
    if (d.n[2] > 0) return;
    const [nx, ny] = d.n;
    const b = Math.pow(0.5 + 0.5 * Math.sin(nx * 9 + ny * 6 + turn * 1.5 + i * 0.7), 3);
    const [fr, fg, fb] = hsl(((((nx + ny) * 0.8 + turn * 0.2 + i * 0.13) % 1) + 1) % 1, 0.85, 0.62);
    const r = Math.round(40 + 215 * b * 0.75 + fr * 0.25 * b);
    const gg = Math.round(50 + 205 * b * 0.75 + fg * 0.25 * b);
    const bb = Math.round(80 + 175 * b * 0.75 + fb * 0.25 * b);
    fill(d);
    g.fillStyle = `rgba(${r}, ${gg}, ${bb}, 0.85)`;
    g.fill();
  });
  // looking down through the table: the pavilion's facets, folded back on themselves
  const kaleidoscope = (t: Drawn) => {
    const mx = t.scr.reduce((a, p) => a + p[0], 0) / t.scr.length;
    const my = t.scr.reduce((a, p) => a + p[1], 0) / t.scr.length;
    g.save();
    fill(t);
    g.clip();
    g.fillStyle = 'rgb(40, 44, 70)';
    g.fill();
    drawn.forEach((d, i) => {
      if (d.table || d.n[2] > 0) return;
      const b = Math.pow(0.5 + 0.5 * Math.sin(i * 2.1 + turn * 3), 4);
      const [fr, fg, fb] = hsl((i * 0.071 + turn * 0.1) % 1, 0.9, 0.62);
      const k = 0.25 * (1 - b);
      g.fillStyle = `rgb(${Math.round((50 + 205 * b) * (1 - k) + fr * k)}, ${Math.round((54 + 200 * b) * (1 - k) + fg * k)}, ${Math.round((80 + 175 * b) * (1 - k) + fb * k)})`;
      g.beginPath();
      d.scr.forEach(([x, y], j) => {
        // turned half round and drawn smaller, as a reflection would be
        const px = mx - (x - mx) * 0.62;
        const py = my - (y - my) * 0.62;
        if (j) g.lineTo(px, py);
        else g.moveTo(px, py);
      });
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      g.lineWidth = Math.max(0.5, size * 0.003);
      g.stroke();
    });
    g.restore();
    fill(t);
    g.fillStyle = 'rgba(255, 236, 244, 0.12)';
    g.fill();
    g.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    g.lineWidth = Math.max(0.5, size * 0.005);
    g.stroke();
  };
  // the near facets: a studio's bright strips and dark gaps, a blush of rose, a little fire
  for (const d of drawn.filter((d) => d.n[2] > 0).sort((a, b) => a.z - b.z)) {
    if (d.table) {
      kaleidoscope(d);
      continue;
    }
    const [nx, ny, nz] = d.n;
    const rx = 2 * nz * nx;
    const ry = 2 * nz * ny;
    let env = ry < -0.3 ? 0.92 : 0.5 + 0.5 * Math.sin(rx * 8 + ry * 4 + 1.3 + turn * 0.5);
    env = Math.max(0, Math.min(1, env));
    const b = 0.15 + 0.85 * Math.pow(env, 1.6);
    const hue = (((nx * 1.7 + ny * 2.3 + turn * 0.25) % 1) + 1) % 1;
    const fire = 0.28 * (1 - b * 0.5);
    const [fr, fg, fb] = hsl(hue, 0.9, 0.6);
    const lo = [44, 46, 74];
    const hi = [255, 236, 244];
    const mixc = (k: number) => Math.round((lo[k] + (hi[k] - lo[k]) * b) * (1 - fire) + [fr, fg, fb][k] * fire);
    fill(d);
    g.fillStyle = `rgba(${mixc(0)}, ${mixc(1)}, ${mixc(2)}, ${d.table ? 0.28 : 0.8})`;
    g.fill();
    g.strokeStyle = `rgba(255, 255, 255, ${0.2 + b * 0.35})`;
    g.lineWidth = Math.max(0.5, size * 0.004);
    g.stroke();
    if (b > 0.85 && !d.table) glints.push([d.scr[0][0], d.scr[0][1], b]);
  }
  gold(true);
  // sparkles: a few of the brightest corners twinkle in turn
  g.globalCompositeOperation = 'lighter';
  glints.slice(0, 7).forEach(([x, y], i) => {
    const tw = Math.pow(Math.max(0, Math.sin(time * 2.6 + i * 1.9)), 6);
    if (tw < 0.05) return;
    star(g, x, y, size * 0.09 * tw, tw);
  });
  g.restore();
}

function star(g: CanvasRenderingContext2D, x: number, y: number, r: number, a: number): void {
  const grd = g.createRadialGradient(x, y, 0, x, y, r * 0.5);
  grd.addColorStop(0, `rgba(255, 255, 255, ${a})`);
  grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
  g.fillStyle = grd;
  g.beginPath();
  g.arc(x, y, r * 0.5, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = `rgba(255, 255, 255, ${a * 0.9})`;
  g.lineWidth = Math.max(0.6, r * 0.05);
  g.beginPath();
  g.moveTo(x - r, y);
  g.lineTo(x + r, y);
  g.moveTo(x, y - r);
  g.lineTo(x, y + r);
  g.stroke();
}

function hsl(h: number, s: number, l: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}
