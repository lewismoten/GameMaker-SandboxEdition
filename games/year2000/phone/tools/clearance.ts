// Lead and solder clearance for the phone's printed parts. Every pad on these boards is a plated through-hole, so a part mounted
// on one face has its trimmed lead and solder fillet sticking out of the other. The viewer's models leave those stubs out, so
// this adds them: a LEAD mm long wire (radius WIRE_R) on a FILLET mm tall solder cone (cylinder of radius LEAD_R) on the face opposite the part at every pad (positions from
// kicad/placement.json). It measures how close each printed part's surface comes to a stub, and to any part body (its box in
// viewer/parts.json). shell.ts fails the build below MIN_GAP and writes viewer/clearance.json; clearance.test.ts runs the same
// function on the generated files. Units mm, viewer coordinates (y = height above the board; board faces at FRONT_Y, BACK_Y).
//
// LEAD = 2.5 mm is an ASSUMPTION: IPC-A-610 (Class 2) allows a through-hole lead to protrude 0.5 mm at least and 1.5 mm at most
// from boards up to 2.3 mm thick (quoted from memory, not checked against the standard), and the fillet adds a little. A hand
// soldering hobbyist trims to about 1 to 2 mm, so 2.5 leaves slack for a long snip.

export const LEAD = 2.5;
export const LEAD_R = 0.9;
export const WIRE_R = 0.3;
export const FILLET = 1.0;
export const MIN_GAP = 1.0;
export const FRONT_Y = 1.585;
export const BACK_Y = -0.075;
const SEARCH = 3.0;

export interface Lead {
  ref: string;
  x: number;
  z: number;
  /** The face the stub sticks out of. */
  face: 'front' | 'back';
}
export interface Body {
  id: string;
  bbox: number[];
}
export interface MeshIn {
  id: string;
  pos: ArrayLike<number>;
  idx: ArrayLike<number>;
}
export interface Gap {
  gap: number;
  at: [number, number, number];
  other: string;
}
export interface PartGap {
  id: string;
  lead: Gap;
  body: Gap;
  /** Closest approach per named region of the part (the tray's floor, the cam's lowest tooth), for the report. */
  regions: Record<string, Gap>;
}

/** Pairs that touch on purpose: the cams press the pulse and off-normal switches, the button caps cover theirs. */
const CONTACT: Record<string, string[]> = { 'dial-cam': ['SW2', 'SW3'], 'cap-talk': ['SW4'], 'cap-clear': ['SW5'] };
const isExempt = (part: string, body: string) => (CONTACT[part] ?? []).some((r) => body === r || body.startsWith(`${r}.`));

/** One stub per pad: a back-side part's lead comes out the front, a front-side part's out the back. */
export function leadsFrom(placement: Record<string, { side: string; pads: Record<string, [number, number]> }>): Lead[] {
  const out: Lead[] = [];
  for (const [ref, p] of Object.entries(placement))
    if (p?.pads)
      for (const [x, z] of Object.values(p.pads)) out.push({ ref, x, z, face: p.side === 'B' ? 'front' : 'back' });
  return out;
}

const far: Gap = { gap: Infinity, at: [0, 0, 0], other: '' };
const better = (g: Gap, gap: number, p: number[], other: string) => {
  if (gap < g.gap) {
    g.gap = gap;
    g.at = [p[0], p[1], p[2]];
    g.other = other;
  }
};

function leadDist(l: Lead, p: number[]): number {
  // the fillet (a stub of radius LEAD_R and FILLET mm) and the trimmed wire (radius WIRE_R) above it
  const out = l.face === 'front' ? 1 : -1;
  const base = l.face === 'front' ? FRONT_Y : BACK_Y;
  const seg = (len: number) => {
    const lo = Math.min(base, base + out * len);
    const hi = Math.max(base, base + out * len);
    return Math.hypot(Math.hypot(p[0] - l.x, p[2] - l.z), Math.max(lo - p[1], 0, p[1] - hi));
  };
  return Math.min(seg(FILLET) - LEAD_R, seg(LEAD) - WIRE_R);
}
function boxDist(b: number[], p: number[]): number {
  return Math.hypot(Math.max(b[0] - p[0], 0, p[0] - b[3]), Math.max(b[1] - p[1], 0, p[1] - b[4]), Math.max(b[2] - p[2], 0, p[2] - b[5]));
}

/** Closest approach of every mesh to the lead stubs and to the bodies, from the triangles' corners, edge midpoints and centers
 *  (so a coarse mesh is not flattered). Only approaches closer than SEARCH are searched for; farther reads as Infinity. */
export function measure(meshes: MeshIn[], leads: Lead[], bodies: Body[], regionOf: (id: string, minY: number, p: number[]) => string | null): PartGap[] {
  const cell = 4;
  const key = (i: number, j: number) => `${i},${j}`;
  const grid = new Map<string, Lead[]>();
  for (const l of leads) {
    const k = key(Math.floor(l.x / cell), Math.floor(l.z / cell));
    (grid.get(k) ?? grid.set(k, []).get(k)!).push(l);
  }
  const reach = SEARCH + LEAD_R;
  return meshes.map((m) => {
    const res: PartGap = { id: m.id, lead: { ...far }, body: { ...far }, regions: {} };
    let minY = Infinity;
    for (let i = 1; i < m.pos.length; i += 3) minY = Math.min(minY, m.pos[i]);
    const P = (a: number) => [m.pos[a * 3], m.pos[a * 3 + 1], m.pos[a * 3 + 2]];
    const near = bodies.filter((b) => !isExempt(m.id, b.id));
    for (let t = 0; t < m.idx.length; t += 3) {
      const A = P(m.idx[t]);
      const B = P(m.idx[t + 1]);
      const C = P(m.idx[t + 2]);
      const lo = [0, 1, 2].map((k) => Math.min(A[k], B[k], C[k]) - reach);
      const hi = [0, 1, 2].map((k) => Math.max(A[k], B[k], C[k]) + reach);
      const cand: Lead[] = [];
      for (let i = Math.floor(lo[0] / cell); i <= Math.floor(hi[0] / cell); i++)
        for (let j = Math.floor(lo[2] / cell); j <= Math.floor(hi[2] / cell); j++) cand.push(...(grid.get(key(i, j)) ?? []));
      const bs = near.filter((b) => b.bbox[3] >= lo[0] && b.bbox[0] <= hi[0] && b.bbox[4] >= lo[1] && b.bbox[1] <= hi[1] && b.bbox[5] >= lo[2] && b.bbox[2] <= hi[2]);
      if (!cand.length && !bs.length) continue;
      const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
      const pts = [A, B, C, mid(A, B), mid(B, C), mid(C, A), [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3]];
      for (const p of pts) {
        const region = regionOf(m.id, minY, p);
        for (const l of cand) {
          const g = leadDist(l, p);
          better(res.lead, g, p, l.ref);
          if (region) better((res.regions[region] ??= { ...far }), g, p, l.ref);
        }
        for (const b of bs) better(res.body, boxDist(b.bbox, p), p, b.id);
      }
    }
    return res;
  });
}

/** Names the part regions the report singles out: the back tray's floor (the slab at its lowest) and the cam's lowest tooth. */
export function regionOf(id: string, minY: number, p: number[]): string | null {
  if (id === 'back-tray' && p[1] < minY + 2.45) return 'floor';
  if (id === 'dial-cam' && p[1] < minY + 0.4) return 'lowest tooth';
  return null;
}
