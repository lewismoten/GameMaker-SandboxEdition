// The cast in 3D: Count Polygon and his low-poly henchmen, the friends who wander the scenes
// (Teddy the corgi, Gwinn, Doc Leo with his rubber chicken) and the odds and ends (the shot,
// a de-render burst, a teapot's steam). Each model stands in a 1x1 cell, floor at z = 0,
// facing the camera (south, +y); `f` is the animation frame.
import { MAT } from '../render/look';
import { Cylinder, Moved, Sdf, Sphere, add, hull, mix, mul, rgb, sd, type Material, type Shape, type V } from '../render/tracer';
import { F, around, model } from './parts';
import { rayModel } from './ray';

const glow = (c: V, k = 0.8): Material => ({ color: c, diffuse: 0.3, emit: [c[0] * k, c[1] * k, c[2] * k], noShadow: true });

/** Edges of a solid as capsules, turned `a` about z. */
function wireframe(verts: V[], edges: [number, number][], c: V, a: number, mat: Material, r = 0.022): Shape {
  const rot = (p: V): V => [c[0] + Math.cos(a) * p[0] - Math.sin(a) * p[1], c[1] + Math.sin(a) * p[0] + Math.cos(a) * p[1], c[2] + p[2]];
  const vs = verts.map(rot);
  const ext = Math.max(...verts.map((v) => Math.hypot(...v))) + r + 0.02;
  return new Sdf(
    around(c, ext),
    (x, y, z) => {
      let d = Infinity;
      for (const [i, j] of edges) d = Math.min(d, sd.capsule(x, y, z, vs[i], vs[j], r));
      return d;
    },
    [mat],
  );
}

const CUBE_V: V[] = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) CUBE_V.push([x, y, z]);
const CUBE_E: [number, number][] = [];
for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if ([0, 1, 2].filter((k) => CUBE_V[i][k] !== CUBE_V[j][k]).length === 1) CUBE_E.push([i, j]);

/** A wireframe cube with two eyes: an unrendered thing. */
export function wire(f: number, color: V = rgb(80, 255, 110)): Shape[] {
  const c: V = [0.5, 0.6, 0.36];
  const s = 0.2;
  const a = (f * Math.PI) / 8;
  const eyes: Shape[] = [-1, 1].map((k) => new Sphere([c[0] + k * 0.07, c[1] + 0.12, c[2] + 0.05], 0.045, glow(rgb(255, 255, 255), 1)));
  const pupils: Shape[] = [-1, 1].map((k) => new Sphere([c[0] + k * 0.07, c[1] + 0.16, c[2] + 0.05], 0.022, { color: rgb(10, 10, 20) }));
  return [
    wireframe(
      CUBE_V.map((v) => mul(v, s)),
      CUBE_E,
      c,
      a,
      glow(color, 0.9),
    ),
    ...eyes,
    ...pupils,
  ];
}

const PHI = (1 + Math.sqrt(5)) / 2;
const ICO: V[] = [];
for (const a of [-1, 1]) for (const b of [-PHI, PHI]) ICO.push([0, a, b], [a, b, 0], [b, 0, a]);
const OCTA: V[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];
const TETRA: V[] = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
];

const turn = (p: V, a: number, tilt = 0.35): V => {
  const x = Math.cos(a) * p[0] - Math.sin(a) * p[1];
  const y = Math.sin(a) * p[0] + Math.cos(a) * p[1];
  return [x, Math.cos(tilt) * y - Math.sin(tilt) * p[2], Math.sin(tilt) * y + Math.cos(tilt) * p[2]];
};

/** A faceted solid, its faces shaded a little apart (flat-shaded polygons). */
function gem(points: V[], c: V, size: number, a: number, base: V, facet = 0.25): Shape {
  const n = Math.max(...points.map((p) => Math.hypot(...p)));
  const pts = points.map((p) => add(c, mul(turn(p, a), size / n)));
  return hull(pts, (face) => ({ color: mix(base, [1, 1, 1], (((face * 37) % 7) / 7) * facet), diffuse: 0.8, spec: 1.2, shine: 70, fresnel: 0.3 }));
}

/** A rendered crystal: what a wireframe becomes when your ray hits it. Touch it for points. */
export function crystal(f: number): Shape[] {
  return [gem(OCTA, [0.5, 0.6, 0.3], 0.2, f * 0.5 + 0.3, rgb(240, 90, 220), 0.35)];
}

/** Count Polygon: twenty faces of vampire, losing faces with every hit. */
export function count(stage: number, f: number): Shape[] {
  const c: V = [0.5, 0.58, 0.42 - stage * 0.03];
  const purple = rgb(165, 85, 245);
  const sizes = [0.3, 0.26, 0.24, 0.22, 0.09];
  const body: Shape[] = [];
  const a = f * 0.4 + 0.2;
  if (stage === 0) body.push(gem(ICO, c, sizes[0], a, purple));
  else if (stage === 1) body.push(gem(OCTA, c, sizes[1], a, purple));
  else if (stage === 2) body.push(gem(TETRA, c, sizes[2], a + 0.6, purple));
  else if (stage === 3) {
    const t = sizes[3];
    body.push(
      hull(
        [
          // tipped back toward the light, so the camera above sees a triangle, not an edge
          add(c, [-t, t * 0.55, -t * 0.45]),
          add(c, [t, t * 0.55, -t * 0.45]),
          add(c, [0, -t * 0.55, t * 0.6]),
          add(c, [-t, t * 0.55 - 0.04, -t * 0.45 - 0.03]),
          add(c, [t, t * 0.55 - 0.04, -t * 0.45 - 0.03]),
          add(c, [0, -t * 0.55 - 0.04, t * 0.6 - 0.03]),
        ],
        { color: purple, diffuse: 0.8, spec: 1.2, shine: 60 },
      ),
    );
  } else body.push(new Sphere(c, sizes[4], glow(rgb(200, 120, 255), 1.2)));
  // the cape: two dark red sails behind him, flapping
  const cape: Material = { color: rgb(215, 45, 80), diffuse: 0.9, spec: 0.6, shine: 30, emit: rgb(40, 5, 12) };
  const w = (stage === 4 ? 0.12 : 0.3) * (f ? 1.1 : 1);
  if (stage < 4)
    for (const k of [-1, 1])
      body.push(
        hull(
          [
            add(c, [k * 0.05, -0.08, 0.15]),
            add(c, [k * w, -0.12, 0.05 + (f ? 0.05 : 0)]),
            add(c, [k * w * 0.8, -0.1, -0.3]),
            add(c, [k * 0.05, -0.1, 0.15]),
            add(c, [k * w, -0.14, 0.05 + (f ? 0.05 : 0)]),
          ],
          cape,
        ),
      );
  // eyes and fangs on the front
  const s = stage === 4 ? 0.4 : 1;
  const front = sizes[Math.min(stage, 3)] * 0.75;
  for (const k of [-1, 1]) {
    body.push(new Sphere([c[0] + k * 0.07 * s, c[1] + front, c[2] + 0.06 * s], 0.035 * s, glow(rgb(255, 40, 40), 1.3)));
    if (stage < 4)
      body.push(
        hull(
          [
            [c[0] + k * 0.04 - 0.015, c[1] + front + 0.02, c[2] - 0.05],
            [c[0] + k * 0.04 + 0.015, c[1] + front + 0.02, c[2] - 0.05],
            [c[0] + k * 0.04, c[1] + front + 0.03, c[2] - 0.13],
            [c[0] + k * 0.04, c[1] + front - 0.01, c[2] - 0.05],
          ],
          { color: rgb(250, 250, 240), diffuse: 1, spec: 0.8, shine: 40 },
        ),
      );
  }
  return body;
}

/** The last polygon: a gold tetrahedron, all the Count has left. */
export function crown(f: number): Shape[] {
  return [gem(TETRA, [0.5, 0.6, 0.32], 0.17, f * 0.8, rgb(255, 200, 60), 0.3)];
}

/** The blue lens the Count swallowed: glass in a gold ring, bobbing where he dropped it. */
export function stolenLens(f: number): Shape[] {
  const x = 0.5;
  const y = 0.58;
  const z = 0.3 + f * 0.05;
  const blue = rgb(50, 90, 255);
  // lying flat, tipped a little toward the camera, so it reads as a round blue lens from above
  return [
    new Sdf(
      [
        [x - 0.25, y - 0.25, z - 0.1],
        [x + 0.25, y + 0.25, z + 0.1],
      ],
      (px, py, pz) => sd.ellipsoid(px - x, py - y, pz - z, 0.2, 0.2, 0.05),
      [{ color: rgb(130, 175, 255), diffuse: 0.5, spec: 1.4, shine: 120, emit: mul(blue, 0.9) }],
    ),
    new Sdf(
      [
        [x - 0.28, y - 0.28, z - 0.06],
        [x + 0.28, y + 0.28, z + 0.06],
      ],
      (px, py, pz) => sd.torus(px - x, py - y, pz - z, 0.22, 0.035),
      [MAT.gold],
    ),
  ];
}

/** A shard the Count throws: a spinning purple triangle. */
export function shard(f: number): Shape[] {
  const c: V = [0.5, 0.55, 0.3];
  const a = f * 1.2;
  const p = (ang: number): V => [c[0] + Math.cos(ang + a) * 0.15, c[1] + Math.sin(ang + a) * 0.15, c[2]];
  return [
    hull([p(0), p(2.09), p(4.19), add(p(0), [0, 0, 0.04]), add(p(2.09), [0, 0, 0.04]), add(p(4.19), [0, 0, 0.04])], {
      color: rgb(230, 140, 255),
      diffuse: 0.7,
      emit: rgb(120, 40, 160),
      spec: 1,
      shine: 50,
    }),
  ];
}

/** A polygon bat: a black tetrahedron on two flapping triangle wings. */
export function bat(f: number): Shape[] {
  const c: V = [0.5, 0.6, 0.45];
  const up = f ? 0.15 : -0.08;
  // lit violet wings with a glow of their own, so a bat shows up on the darkest grid
  const wing: Material = { color: rgb(205, 120, 255), diffuse: 0.8, spec: 0.9, shine: 40, emit: rgb(70, 30, 110) };
  const out: Shape[] = [gem(TETRA, c, 0.11, 0.8, rgb(150, 110, 210))];
  for (const k of [-1, 1])
    out.push(hull([add(c, [k * 0.04, 0.02, 0]), add(c, [k * 0.04, -0.06, 0.02]), add(c, [k * 0.38, -0.02, up]), add(c, [k * 0.04, 0.02, 0.02])], wing));
  for (const k of [-1, 1]) out.push(new Sphere([c[0] + k * 0.035, c[1] + 0.09, c[2] + 0.02], 0.022, glow(rgb(255, 230, 60), 1.2)));
  return out;
}

/** A jaggy: an aliased staircase on the hop, with a row of teeth. */
export function jaggy(f: number): Shape[] {
  const hop = f ? 0.08 : 0;
  const red: Material = { color: rgb(240, 70, 50), diffuse: 0.85, spec: 0.9, shine: 50 };
  const step = 0.15;
  const parts: Shape[] = [];
  const cells: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
    [1, 1],
    [2, 1],
    [2, 2],
  ];
  for (const [i, j] of cells) {
    const x = 0.28 + i * step;
    const z = hop + j * step;
    parts.push(
      new Sdf(
        around([x + step / 2, 0.62, z + step / 2], step / 2 + 0.01),
        (px, py, pz) => sd.box(px - x - step / 2, py - 0.62, pz - z - step / 2, step / 2, step / 2, step / 2, 0.015),
        [red],
      ),
    );
  }
  for (const k of [0, 1]) parts.push(new Sphere([0.37 + k * 0.1, 0.7, hop + 0.24], 0.035, { color: rgb(255, 255, 255), diffuse: 0.6, emit: rgb(80, 80, 80) }));
  for (const k of [0, 1]) parts.push(new Sphere([0.37 + k * 0.1, 0.73, hop + 0.24], 0.017, { color: rgb(0, 0, 0) }));
  return parts;
}

/** A puff of steam from a teapot, growing. */
export function steam(f: number): Shape[] {
  const r = 0.1 + f * 0.04;
  const c: V = [0.5, 0.6, 0.35 + f * 0.04];
  const mat: Material = { color: rgb(240, 245, 255), diffuse: 1, spec: 0.2, shine: 10, emit: rgb(40, 40, 50) };
  return [
    model(
      [
        { d: F.sphere(c, r), mat },
        { d: F.sphere(add(c, [r * 0.8, 0.02, r * 0.3]), r * 0.75), mat },
        { d: F.sphere(add(c, [-r * 0.7, 0, r * 0.45]), r * 0.7), mat },
      ],
      around(c, r * 2.2),
      0.05,
    ),
  ];
}

/** Your shot: a ray of light. */
export function shot(): Shape[] {
  return [
    new Sdf(around([0.5, 0.5, 0.3], [0.4, 0.1, 0.1]), (x, y, z) => sd.capsule(x, y, z, [0.15, 0.5, 0.3], [0.85, 0.5, 0.3], 0.07, 0.05), [
      glow(rgb(255, 250, 190), 1.4),
    ]),
    new Sdf(around([0.5, 0.5, 0.3], [0.45, 0.12, 0.12]), (x, y, z) => sd.capsule(x, y, z, [0.1, 0.5, 0.3], [0.9, 0.5, 0.3], 0.025), [
      glow(rgb(255, 255, 255), 2),
    ]),
  ];
}

/** A de-render burst: shards flying apart. */
export function pop(f: number): Shape[] {
  const out: Shape[] = [];
  const c: V = [0.5, 0.6, 0.3];
  for (let i = 0; i < 7; i++) {
    const a = i * 0.9 + f;
    const r = 0.1 + f * 0.12;
    const p: V = [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.8, c[2] + Math.sin(i * 2.1) * r * 0.6];
    out.push(new Sphere(p, 0.05 - f * 0.012, glow(i % 2 ? rgb(120, 255, 140) : rgb(255, 255, 255), 1.2)));
  }
  return out;
}

/** The dark double in the Hall of Mirrors. */
export function double(f: number): Shape[] {
  const s = rayModel('y', (f * Math.PI) / 8, rgb(255, 40, 60));
  return s;
}

// ---------------------------------------------------------------- friends

/** Teddy, the Pembroke Welsh corgi: red-gold, white blaze and chest, ears up. Built
 * for a camera high above: big head in front, ears up, the body behind it. */
export function teddy(f: number): Shape[] {
  const fur = rgb(220, 128, 52);
  const white = rgb(252, 248, 238);
  const furMat: Material = {
    color: (p) => {
      // the white blaze up the face, the white muzzle and chest
      if (p[1] > 0.7 && Math.abs(p[0] - 0.5) < 0.04 && p[2] > 0.33) return white;
      if (p[1] > 0.72 && p[2] < 0.32) return white;
      return fur;
    },
    diffuse: 1,
    spec: 0.25,
    shine: 12,
  };
  const black: Material = { color: rgb(15, 12, 12), diffuse: 0.6, spec: 1.2, shine: 80 };
  const legs = f % 2 ? 0.025 : -0.025;
  const parts = [
    { d: F.ell([0.5, 0.42, 0.2], 0.17, 0.2, 0.12), mat: furMat },
    { d: F.sphere([0.5, 0.66, 0.34], 0.16), mat: furMat },
    { d: F.ell([0.5, 0.82, 0.29], 0.08, 0.08, 0.065), mat: { color: white, diffuse: 1, spec: 0.2, shine: 10 } },
    { d: F.sphere([0.5, 0.9, 0.31], 0.03), mat: black },
    { d: F.cap([0.4, 0.62, 0.44], [0.31, 0.6, 0.62], 0.065, 0.012), mat: furMat }, // the ears, a matched pair
    { d: F.cap([0.6, 0.62, 0.44], [0.69, 0.6, 0.62], 0.065, 0.012), mat: furMat },
    { d: F.sphere([0.445, 0.79, 0.4], 0.026), mat: black },
    { d: F.sphere([0.555, 0.79, 0.4], 0.026), mat: black },
    { d: F.cap([0.41, 0.74 + legs, 0.12], [0.41, 0.76 + legs, 0.02], 0.045), mat: { color: white, diffuse: 1 } },
    { d: F.cap([0.59, 0.74 - legs, 0.12], [0.59, 0.76 - legs, 0.02], 0.045), mat: { color: white, diffuse: 1 } },
  ];
  if (f >= 2) parts.push({ d: F.ell([0.5, 0.88, 0.22], 0.03, 0.05, 0.015), mat: { color: rgb(240, 110, 130), diffuse: 1, spec: 0.6, shine: 30 } });
  return [
    model(
      parts,
      [
        [0.2, 0.2, 0],
        [0.8, 0.98, 0.72],
      ],
      0.03,
    ),
  ];
}

/** Gwinn: a lean chocolate pit-lab mix with amber eyes, floppy ears and a pink collar, sitting pretty. */
export function gwinn(f: number): Shape[] {
  const coat = rgb(118, 64, 40);
  const coatMat: Material = {
    color: (p) => (p[1] > 0.74 && p[2] < 0.3 && Math.abs(p[0] - 0.5) < 0.05 ? rgb(240, 230, 220) : coat),
    diffuse: 1,
    spec: 0.5,
    shine: 30,
  };
  const pink: Material = { color: rgb(255, 110, 180), diffuse: 0.9, spec: 0.7, shine: 40 };
  const amber: Material = { color: rgb(245, 175, 40), diffuse: 0.6, spec: 1.4, shine: 90, emit: rgb(60, 35, 0) };
  const ear = f % 2 ? 0.03 : 0;
  const parts = [
    { d: F.ell([0.5, 0.5, 0.24], 0.15, 0.17, 0.2), mat: coatMat }, // sitting
    { d: F.sphere([0.5, 0.68, 0.42], 0.14), mat: coatMat },
    { d: F.ell([0.5, 0.82, 0.37], 0.07, 0.08, 0.06), mat: coatMat },
    { d: F.sphere([0.5, 0.9, 0.39], 0.028), mat: { color: rgb(95, 42, 36), diffuse: 0.7, spec: 1, shine: 60 } },
    { d: F.ell([0.36, 0.66, 0.4 + ear], 0.05, 0.035, 0.1), mat: coatMat },
    { d: F.ell([0.64, 0.66, 0.4 - ear], 0.05, 0.035, 0.1), mat: coatMat },
    { d: F.sphere([0.45, 0.79, 0.47], 0.025), mat: amber },
    { d: F.sphere([0.55, 0.79, 0.47], 0.025), mat: amber },
    { d: F.torus([0.5, 0.66, 0.29], 0.1, 0.03), mat: pink },
    { d: F.cap([0.42, 0.74, 0.18], [0.42, 0.77, 0.02], 0.04), mat: coatMat },
    { d: F.cap([0.58, 0.74, 0.18], [0.58, 0.77, 0.02], 0.04), mat: coatMat },
  ];
  if (f >= 2) parts.push({ d: F.ell([0.5, 0.88, 0.31], 0.03, 0.045, 0.014), mat: { color: rgb(240, 110, 130), diffuse: 1 } });
  return [
    model(
      parts,
      [
        [0.2, 0.25, 0],
        [0.8, 0.98, 0.62],
      ],
      0.025,
    ),
  ];
}

/**
 * Doc Leo, hobo clown: gray fedora, white face paint round his eyes and mouth, his own nose
 * sunburned pink, painted stubble, navy corduroy jacket, purple shirt, green tie, red sneakers,
 * and the rubber chicken on its leash.
 */
export function docLeo(f: number): Shape[] {
  const navy: Material = { color: rgb(36, 48, 100), diffuse: 1, spec: 0.2, shine: 10 };
  const shirt: Material = {
    color: (p) => (Math.abs(p[0] - 0.5) < 0.02 ? rgb(40, 160, 110) : rgb(130, 60, 170)),
    diffuse: 1,
    spec: 0.3,
    shine: 15,
  };
  const skin: Material = {
    color: (p) => {
      const front = p[1] > 0.66;
      if (front && p[2] < 0.66 && Math.abs(p[0] - 0.5) < 0.05) return rgb(250, 250, 250); // the white mouth
      // white round each eye, the eye dark in the middle
      const ex = Math.abs(Math.abs(p[0] - 0.5) - 0.035);
      const ez = p[2] - 0.695;
      if (front && ex * ex + ez * ez < 0.0006) return ex * ex + ez * ez < 0.00008 ? rgb(30, 26, 30) : rgb(250, 250, 250);
      if (p[2] < 0.65) return rgb(90, 90, 110); // painted stubble
      return rgb(240, 196, 170);
    },
    diffuse: 1,
    spec: 0.2,
    shine: 10,
  };
  const red: Material = { color: rgb(230, 30, 40), diffuse: 0.8, spec: 1.2, shine: 80 };
  const hat: Material = { color: rgb(80, 80, 88), diffuse: 1, spec: 0.3, shine: 15 };
  const step = f % 2 ? 0.02 : 0;
  const parts = [
    { d: F.ell([0.43, 0.66 + step, 0.04], 0.05, 0.08, 0.04), mat: red },
    { d: F.ell([0.57, 0.66 - step, 0.04], 0.05, 0.08, 0.04), mat: red },
    { d: F.cap([0.44, 0.62, 0.06], [0.46, 0.6, 0.3], 0.045), mat: { color: rgb(50, 46, 50), diffuse: 1 } },
    { d: F.cap([0.56, 0.62, 0.06], [0.54, 0.6, 0.3], 0.045), mat: { color: rgb(50, 46, 50), diffuse: 1 } },
    { d: F.ell([0.5, 0.6, 0.42], 0.13, 0.09, 0.15), mat: navy },
    { d: F.ell([0.5, 0.645, 0.45], 0.05, 0.05, 0.1), mat: shirt },
    { d: F.cap([0.38, 0.6, 0.5], [0.34, 0.66, 0.32], 0.035), mat: navy },
    { d: F.cap([0.62, 0.6, 0.5], [0.67, 0.68, 0.36], 0.035), mat: navy },
    { d: F.sphere([0.5, 0.6, 0.66], 0.095), mat: skin },
    { d: F.sphere([0.5, 0.69, 0.665], 0.025), mat: { color: rgb(236, 140, 130), diffuse: 1, spec: 0.3, shine: 20 } }, // his own nose, sunburned
    { d: F.cyl([0.5, 0.6, 0.745], 0.15, 0.008, 0.004), mat: hat },
    { d: F.cyl([0.5, 0.6, 0.79], 0.085, 0.045, 0.02), mat: hat },
  ];
  const out: Shape[] = [
    model(
      parts,
      [
        [0.28, 0.48, 0],
        [0.72, 0.78, 0.84],
      ],
      0.01,
    ),
  ];
  // the rubber chicken on a red dog leash
  const ck: V = [0.8, 0.78, 0.07];
  out.push(
    model(
      [
        { d: F.ell(ck, 0.05, 0.08, 0.04), mat: { color: rgb(250, 220, 40), diffuse: 0.9, spec: 0.9, shine: 50 } },
        { d: F.sphere(add(ck, [0, 0.07, 0.04]), 0.025), mat: { color: rgb(250, 220, 40), diffuse: 0.9 } },
        { d: F.torusY(add(ck, [0, 0, 0.0]), 0.05, 0.01), mat: red },
        { d: F.cap([0.68, 0.69, 0.33], add(ck, [0, 0, 0.03]), 0.008), mat: red },
      ],
      [
        [0.66, 0.66, 0],
        [0.88, 0.9, 0.36],
      ],
      0.005,
    ),
  );
  return out;
}

/** A Utah teapot (white porcelain), the most rendered object there is. */
export function teapotModel(c: V, s: number, tint: V = rgb(246, 244, 240)): Shape {
  const china: Material = { color: tint, diffuse: 0.95, spec: 1.1, shine: 90, fresnel: 0.3 };
  const p = (dx: number, dy: number, dz: number): V => [c[0] + dx * s, c[1] + dy * s, c[2] + dz * s];
  return model(
    [
      { d: (x, y, z) => sd.ellipsoid(x - c[0], y - c[1], z - (c[2] + 0.3 * s), 0.42 * s, 0.42 * s, 0.3 * s), mat: china },
      { d: F.ell(p(0, 0, 0.58), 0.22 * s, 0.22 * s, 0.07 * s), mat: china },
      { d: F.sphere(p(0, 0, 0.69), 0.06 * s), mat: china },
      { d: F.cap(p(0.32, 0, 0.28), p(0.66, 0, 0.6), 0.1 * s, 0.045 * s), mat: china },
      { d: F.torusY(p(-0.44, 0, 0.36), 0.14 * s, 0.035 * s), mat: china },
    ],
    [p(-0.65, -0.45, -0.02), p(0.75, 0.45, 0.8)],
    0.03 * s,
  );
}

export function sweep(n: number, r: number, z: number, c: V): V[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, z];
  });
}

export { Cylinder, MAT };

/** Shapes grown (or shrunk) by s about a point on the floor. */
export function scaled(shapes: Shape[], s: number, pivot: V = [0.5, 0.62, 0]): Shape[] {
  return shapes.map((sh) => new Moved(sh, [1, 0, 0, 0, 1, 0, 0, 0, 1], [pivot[0] * (1 - s), pivot[1] * (1 - s), pivot[2] * (1 - s)], s));
}

/** Shapes turned about the upright axis through a point on the floor, so a model built facing the
 * camera faces right, three-quarters on (the face still shows): for a sprite that walks, mirrored
 * for left. */
export function sideOn(shapes: Shape[], turn = Math.PI / 4, pivot: V = [0.5, 0.6, 0]): Shape[] {
  // world = R * local + at, R turning the +y side (toward the camera) toward +x
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  const rot = [c, s, 0, -s, c, 0, 0, 0, 1];
  return shapes.map((sh) => new Moved(sh, rot, [pivot[0] - (c * pivot[0] + s * pivot[1]), pivot[1] - (-s * pivot[0] + c * pivot[1]), 0]));
}
