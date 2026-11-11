// The balloon cube's fold drawn at any moment, as svg markup: every piece of the sheet posed by balloonCubeFold.ts, seen from its camera,
// nearest last, with the face art on the pieces that carry it, folded edges outlined and soft shading. The fold viewer redraws the
// body each frame; the printable's step pictures and the progress shots use the same markup.
import { FACE, INK, RED, faceArt } from './balloonCubeArt';
import { L, OPS, PIECES, PLACEMENTS, PRECREASES, TUCKS, inside } from './balloonCubeModel';
import { ap, centroid, reflectOver, type V2, type V3 } from './balloonCubeSim';
import { FOCUS, LAST, creaseAt, isFace, normalOf, poseAt, stepAt, toView, tuckFocusAt, viewAt } from './balloonCubeFold';
import type { BalloonCubeItem } from './balloonCubeTypes';

const BACK = '#f3ecdb'; // the unprinted side
const PLAIN = '#ffffff'; // printed side, but nothing printed there (it ends up inside)
const LIGHT: V3 = [-0.35, -0.5, 0.8]; // view space: from the upper left, in front
const f2 = (n: number) => (Math.abs(n) < 5e-5 ? '0' : n.toFixed(2));
/** Sheet units to the static drawing units every piece is described in (y down). */
const S = (p: V2): V2 => [p[0] * 100, -p[1] * 100];
const staticPts = PIECES.map((p) => p.poly.map((q) => S(q).map(f2).join(',')).join(' '));
/** The same outline pushed out by a hair, so neighboring pieces' art overlaps instead of leaving a light seam. */
const grownPts = PIECES.map((p) => {
  const c = centroid(p.poly);
  return p.poly
    .map((q) => {
      const d = Math.hypot(q[0] - c[0], q[1] - c[1]);
      return S([q[0] + ((q[0] - c[0]) / d) * 0.003, q[1] + ((q[1] - c[1]) / d) * 0.003])
        .map(f2)
        .join(',');
    })
    .join(' ');
});
/** A color darkened toward the ink by `k` (0 to 1). */
const shadeColor = (hex: string, k: number) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const ink = [1, 3, 5].map((i) => parseInt(INK.slice(i, i + 2), 16));
  return `#${c
    .map((v, i) =>
      Math.round(v + (ink[i] - v) * k)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
};
const artOf = PIECES.map((p) => (isFace(p) ? PLACEMENTS.findIndex((pl) => inside(pl.clip, centroid(p.poly))) : -1));
const tuck = PIECES.map((p) => TUCKS.some((t) => inside(t, centroid(p.poly))));
/** Each edge's neighbor across it on the sheet (-1 on the cut edge): an edge is drawn when the paper is folded there. */
const neighbors = PIECES.map((p, i) =>
  p.poly.map((a, j) => {
    const b = p.poly[(j + 1) % p.poly.length];
    const m: V2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return PIECES.findIndex(
      (q, k) =>
        k !== i &&
        q.poly.some((c, n) => {
          const d = q.poly[(n + 1) % q.poly.length];
          const cr = (d[0] - c[0]) * (m[1] - c[1]) - (d[1] - c[1]) * (m[0] - c[0]);
          const t = ((m[0] - c[0]) * (d[0] - c[0]) + (m[1] - c[1]) * (d[1] - c[1])) / ((d[0] - c[0]) ** 2 + (d[1] - c[1]) ** 2);
          return Math.abs(cr) < 1e-12 && t > 0 && t < 1;
        }),
    );
  }),
);
const sideOuter = PIECES.map((p) => p.tags.has('R') && !p.tags.has('F') && (p.tags.has('fr') || p.tags.has('fl')));

/** The svg matrix that puts the 100-unit art on a placement's sheet frame (art 100 = one cube edge), in static units. */
function artMatrix(i: number): string {
  const { o, right, up } = PLACEMENTS[i].sheet;
  const k = L;
  return `matrix(${[k * right[0], -k * right[1], -k * up[0], k * up[1], o[0] * 100, -o[1] * 100].map((v) => v.toFixed(4)).join(' ')})`;
}

/** The svg defs a scene's body refers to: each placement's art and each art piece's clip (none without an item). */
export function sceneDefs(item: BalloonCubeItem | null, id: string): string {
  if (!item) return '';
  let out = '';
  out += PLACEMENTS.map((pl, i) => `<g id="${id}a${i}" transform="${artMatrix(i)}">${faceArt(item.faces[pl.face], pl.face === 'top')}</g>`).join('');
  out += PIECES.map((_, k) => (artOf[k] >= 0 ? `<clipPath id="${id}c${k}"><polygon points="${grownPts[k]}"/></clipPath>` : '')).join('');
  return out;
}

export interface SceneSize {
  w: number;
  h: number;
  /** Draw the face art (the defs must have been made with an item). */
  art: boolean;
  /** Override the camera's zoom (1 = fit). */
  zoom?: number;
  /** Force the pocket close-up (0 to 1) instead of the animation's own. */
  focus?: number;
  /** Draw an arrow for each fold of this step (the picture shows the paper before it). */
  arrows?: number;
}

/** The scene's body at a position along the steps: one group per piece, then the pre-crease lines while they show. */
export function sceneBody(pos: number, id: string, size: SceneSize): string {
  const poses = poseAt(pos);
  const view = viewAt(pos);
  const focus = size.focus ?? tuckFocusAt(pos);
  const blowing = stepAt(pos).step === LAST && pos > LAST - 1;
  // fit: the paper's 3D extent, which a turn of the camera does not change; the close-up zooms in on a pocket
  const all = poses.flatMap((p) => p.pts);
  const lo = [0, 1, 2].map((i) => Math.min(...all.map((v) => v[i])));
  const hi = [0, 1, 2].map((i) => Math.max(...all.map((v) => v[i])));
  const mid: V3 = [0, 1, 2].map((i) => (lo[i] + hi[i]) / 2) as V3;
  const radius = Math.max(0.05, Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2);
  const scale = ((Math.min(size.w, size.h) * 0.47) / radius) * (1 + 1.1 * focus) * (size.zoom ?? 1);
  const c0 = toView(mid, view);
  const cf = toView(FOCUS, view);
  const cx = c0[0] + (cf[0] - c0[0]) * focus;
  const cy = c0[1] + (cf[1] - c0[1]) * focus;
  const scr = (p: V3): V3 => {
    const q = toView(p, view);
    return [size.w / 2 + (q[0] - cx) * scale, size.h / 2 + (q[1] - cy) * scale, q[2]];
  };
  const camZ = Math.sign(toView([0, 0, 1], view)[2]) || 1;
  const normals = poses.map((p, k) => normalOf(p, PIECES[k].poly));
  const items = poses
    .map((p, k) => {
      const n = normals[k];
      const nv = toView(n, view);
      const vs = p.pts.map(scr);
      const key = blowing ? vs.reduce((s, v) => s + v[2], 0) / vs.length : (camZ * p.pts.reduce((s, v) => s + v[2], 0)) / p.pts.length;
      return { k, n, nv, vs, key };
    })
    .filter((it) => !blowing || (isFace(PIECES[it.k]) && it.nv[2] > 1e-6))
    .sort((a, b) => a.key - b.key);
  let out = '';
  for (const { k, nv, vs } of items) {
    const poly = PIECES[k].poly;
    // the affine map from static units to the screen, from three of the piece's points
    const [s0, s1, s2] = poly.map(S);
    const [p0, p1, p2] = vs;
    const det = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]);
    if (Math.abs(det) < 1e-9) continue;
    const ma = ((p1[0] - p0[0]) * (s2[1] - s0[1]) - (p2[0] - p0[0]) * (s1[1] - s0[1])) / det;
    const mc = ((p2[0] - p0[0]) * (s1[0] - s0[0]) - (p1[0] - p0[0]) * (s2[0] - s0[0])) / det;
    const mb = ((p1[1] - p0[1]) * (s2[1] - s0[1]) - (p2[1] - p0[1]) * (s1[1] - s0[1])) / det;
    const md = ((p2[1] - p0[1]) * (s1[0] - s0[0]) - (p1[1] - p0[1]) * (s2[0] - s0[0])) / det;
    const me = p0[0] - ma * s0[0] - mc * s0[1];
    const mf = p0[1] - mb * s0[0] - md * s0[1];
    if (Math.abs(ma * md - mb * mc) < 1e-4) continue; // edge-on: nothing to see
    const printed = nv[2] > 0;
    const lit = Math.max(0, (printed ? 1 : -1) * (nv[0] * LIGHT[0] + nv[1] * LIGHT[1] + nv[2] * LIGHT[2]));
    const shade = Math.min(0.24, (1 - Math.min(1, lit)) * 0.24);
    const art = size.art && printed && artOf[k] >= 0;
    const fill = shadeColor(!printed ? BACK : artOf[k] >= 0 ? FACE : PLAIN, shade);
    const opacity = sideOuter[k] && focus > 0 ? 1 - 0.55 * focus : 1;
    const ns = 'vector-effect="non-scaling-stroke"';
    let g = `<g transform="matrix(${[ma, mb, mc, md, me, mf].map((v) => v.toFixed(4)).join(' ')})"${opacity < 1 ? ` opacity="${opacity.toFixed(2)}"` : ''}>`;
    g += `<polygon points="${staticPts[k]}" fill="${fill}" stroke="${fill}" stroke-width="0.8" ${ns}/>`;
    if (art) {
      g += `<g clip-path="url(#${id}c${k})"><use href="#${id}a${artOf[k]}"/>`;
      if (shade > 0.005) g += `<polygon points="${grownPts[k]}" fill="${INK}" fill-opacity="${shade.toFixed(3)}"/>`;
      g += '</g>';
    }
    if (tuck[k] && printed) {
      // the tuck's own outline (not the cuts between its pieces), dashed
      const t = poly
        .map((a, j) =>
          neighbors[k][j] >= 0 && tuck[neighbors[k][j]]
            ? ''
            : `M${S(a).map(f2).join(' ')}L${S(poly[(j + 1) % poly.length])
                .map(f2)
                .join(' ')}`,
        )
        .join('');
      if (t) g += `<path d="${t}" fill="none" stroke="#a9a294" stroke-width="0.8" stroke-dasharray="3 2" ${ns}/>`;
    }
    // folded or cut edges
    const d = poly
      .map((a, j) => {
        const nb = neighbors[k][j];
        if (nb >= 0 && normals[nb][0] * normals[k][0] + normals[nb][1] * normals[k][1] + normals[nb][2] * normals[k][2] > 0.999) return '';
        const b = poly[(j + 1) % poly.length];
        return `M${S(a).map(f2).join(' ')}L${S(b).map(f2).join(' ')}`;
      })
      .join('');
    const hot = focus > 0 && PIECES[k].tags.has('T') && (PIECES[k].tags.has('fr') || PIECES[k].tags.has('fl'));
    if (d) g += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" ${ns}/>`;
    if (hot) g += `<polygon points="${staticPts[k]}" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linejoin="round" ${ns}/>`;
    out += g + '</g>';
  }
  if (size.arrows !== undefined) out += foldArrows(size.arrows, scr);
  const cr = creaseAt(pos);
  if (cr > 0) {
    out += `<g opacity="${cr.toFixed(2)}" fill="none" stroke-width="2.2">`;
    for (const c of PRECREASES) {
      const [a, b] = [scr([c.a[0], c.a[1], 0]), scr([c.b[0], c.b[1], 0])];
      out += `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" stroke="${c.kind === 'mountain' ? INK : RED}" stroke-dasharray="${c.kind === 'mountain' ? '10 4 2 4' : '8 5'}"/>`;
    }
    out += '</g>';
  }
  return out;
}

/** Curved red arrows from the far point of each fold's moving paper to where it lands, for the printed pictures. */
function foldArrows(step: number, scr: (p: V3) => V3): string {
  let out = '';
  OPS.forEach((op, i) => {
    if (op.step !== step || !op.fold) return;
    const [a, b] = op.fold.line;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let from: V2 | undefined;
    let far = 0;
    for (const p of PIECES) {
      if (!p.hist[i].moved) continue;
      for (const q of p.poly) {
        const v = ap(p.hist[i - 1].m, q);
        const d = Math.abs((b[0] - a[0]) * (v[1] - a[1]) - (b[1] - a[1]) * (v[0] - a[0])) / len;
        if (d > far + 1e-9) [far, from] = [d, v];
      }
    }
    if (!from) return;
    const to = ap(reflectOver(a, b), from);
    const [p, q] = [scr([from[0], from[1], 0.05]), scr([to[0], to[1], 0.05])];
    const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
    const c: V2 = [(p[0] + q[0]) / 2 + dy * 0.35, (p[1] + q[1]) / 2 - dx * 0.35];
    const [hx, hy] = [q[0] - c[0], q[1] - c[1]];
    const hl = Math.hypot(hx, hy) || 1;
    const [ux, uy] = [hx / hl, hy / hl];
    const head = [
      [q[0], q[1]],
      [q[0] - ux * 9 - uy * 5, q[1] - uy * 9 + ux * 5],
      [q[0] - ux * 9 + uy * 5, q[1] - uy * 9 - ux * 5],
    ];
    out += `<path d="M${f2(p[0])} ${f2(p[1])}Q${f2(c[0])} ${f2(c[1])} ${f2(q[0])} ${f2(q[1])}" fill="none" stroke="${RED}" stroke-width="2.4" stroke-linecap="round"/>`;
    out += `<polygon points="${head.map((h) => h.map(f2).join(',')).join(' ')}" fill="${RED}"/>`;
  });
  return out;
}

/** A whole svg of one moment (the printable's step pictures, progress shots). */
export function sceneSvg(item: BalloonCubeItem | null, pos: number, id: string, size: SceneSize, label: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size.w} ${size.h}" role="img" aria-label="${label}">` +
    `<defs>${sceneDefs(item, id)}</defs><rect width="${size.w}" height="${size.h}" fill="#fff"/>${sceneBody(pos, id, size)}</svg>`
  );
}
