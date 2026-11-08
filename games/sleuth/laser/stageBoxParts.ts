// Final Curtain's Stage Box: the cut shape of every part (outlines, joints, slots, holes). Engraving is in stageBoxArt.ts.
// Part coordinates are millimeters on the flat piece, y down; interior coordinates are in stageBoxDims.ts.
import { jointOutline, outlineFromRects, rectPoly, type EdgeSpec, type Rect } from '@lewismoten/gamemaker-sandbox-tools/kit/laserJoints';
import { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import type { Dims } from './stageBoxDims';

export interface Made {
  part: Part;
  qty: number;
  note: string;
  /** Where the pivot sits on the part (dagger and arm). */
  frame?: Pt;
}
export type Parts = Record<string, Made>;

const FIT = 0.05; // joint play per side
const rect = (x0: number, y0: number, x1: number, y1: number): Rect => [x0, y0, x1, y1];

/** Edge specs: the lid and base own the corner cubes; a wall is set in there. Front and back walls are flush on even cells, side walls on odd. */
const cubes = { cubeStart: true, cubeEnd: true } as const;
export const E = {
  own: { parity: 'odd', ...cubes } as EdgeSpec,
  wallH: { parity: 'even', ends: true, ...cubes } as EdgeSpec,
  front: { parity: 'odd', ...cubes } as EdgeSpec,
  side: { parity: 'even', ...cubes } as EdgeSpec,
};

/** Where the angle `deg` (from straight down, toward +x) points on the sheet. */
export const axis = (deg: number): { u: Pt; v: Pt } => {
  const a = (deg * Math.PI) / 180;
  return { u: [Math.sin(a), Math.cos(a)], v: [Math.cos(a), -Math.sin(a)] };
};

export function makeParts(d: Dims, kerf: number): Parts {
  const { t } = d;
  const parts: Parts = {};
  const add = (name: string, w: number, h: number, qty: number, note: string, outline: Pt[]) => {
    const part = new Part(name, w, h, kerf);
    part.outline(outline);
    parts[name] = { part, qty, note };
    return part;
  };
  const yz = (z: number) => d.Ho - d.zP(z); // an interior z on the front/back/side panels' sheet

  // --- the outer box -------------------------------------------------------------------------------------------
  const front = add(
    'P',
    d.Wo,
    d.Ho,
    1,
    'front: proscenium arch, apron, dagger pivot hole',
    jointOutline(d.Wo, d.Ho, t, { top: E.wallH, bottom: E.wallH, left: E.front, right: E.front }, FIT),
  );
  const w = d.window;
  const chord = w.x1 - w.x0;
  const sag = w.crown - w.z1;
  const rad = (chord * chord) / 4 / sag / 2 + sag / 2;
  const cz = w.crown - rad;
  const phi = Math.asin((w.z1 - cz) / rad);
  const xc = t + (w.x0 + w.x1) / 2;
  const arch: Pt[] = [];
  for (let i = 0; i <= 16; i++) {
    const th = Math.PI - phi - ((Math.PI - 2 * phi) * i) / 16;
    arch.push([xc + rad * Math.cos(th), yz(cz + rad * Math.sin(th))]);
  }
  front.hole('arch', [[t + w.x1, yz(w.z0)], [t + w.x0, yz(w.z0)], ...arch]);
  front.holeRound('pivot', t + d.lever.x, yz(d.lever.z), 5.2);

  add(
    'K',
    d.Wo,
    d.Ho,
    1,
    'back: drawer opening (open to the base), backstage engraving',
    jointOutline(d.Wo, d.Ho, t, { top: E.wallH, bottom: E.wallH, left: E.front, right: E.front }, FIT, [
      rect(t + d.drawer.x0 - 0.5, yz(d.drawer.top + 0.5), t + d.drawer.x0 + d.drawer.w + 0.5, d.Ho),
    ]),
  );
  const slotRects = (mirror: boolean) => {
    const yo = (y: number) => (mirror ? d.Do - y : y);
    const make = (y0: number, y1: number, z0: number, z1: number): Pt[] =>
      rectPoly(rect(Math.min(yo(y0), yo(y1)) - FIT, yz(z1) - FIT, Math.max(yo(y0), yo(y1)) + FIT, yz(z0) + FIT));
    return [...d.floorTabs.map(([a, b]) => make(a + t, b + t, -t, 0)), ...d.wTabs.map(([a, b]) => make(d.yW + t, d.yW + 2 * t, a, b))];
  };
  for (const [name, mirror] of [
    ['L', true],
    ['R', false],
  ] as const) {
    const side = add(
      name,
      d.Do,
      d.Ho,
      1,
      `${name === 'L' ? 'left' : 'right'} wall: slots for the floor, ceiling and backdrop tabs`,
      jointOutline(d.Do, d.Ho, t, { top: E.wallH, bottom: E.wallH, left: E.side, right: E.side }, FIT),
    );
    slotRects(mirror).forEach((p, i) => side.hole(`slot ${i + 1}`, p));
  }
  const lid = add(
    'T',
    d.Wo,
    d.Do,
    1,
    'lid: two slots for the curtain pulls',
    jointOutline(d.Wo, d.Do, t, { top: E.own, bottom: E.own, left: E.own, right: E.own }, FIT),
  );
  for (const y of [d.yD1, d.yD2])
    lid.hole(`pull ${y}`, rectPoly(rect(t + d.pull.x0 - d.travel - 0.3, y + t - d.slotW / 2, t + d.pull.x1 + 0.3, y + t + d.slotW / 2)));
  add('B', d.Wo, d.Do, 1, 'base', jointOutline(d.Wo, d.Do, t, { top: E.own, bottom: E.own, left: E.own, right: E.own }, FIT));

  // --- the stage: floor, ceiling, backdrop ------------------------------------------------------------------------
  const shelf = (name: string, note: string) => {
    const rs: Rect[] = [rect(t, 0, d.Wo - t, d.Di), ...d.floorTabs.flatMap(([a, b]) => [rect(0, a, t, b), rect(d.Wo - t, a, d.Wo, b)])];
    return add(name, d.Wo, d.Di, 1, note, outlineFromRects(rs));
  };
  const floor = shelf('FLOOR', 'stage floor: three skirt slots');
  for (const y of [d.yC, d.yD1, d.yD2])
    floor.hole(`skirt ${y}`, rectPoly(rect(t + d.skirt.x0 - d.travel - 0.3, y - d.slotW / 2, t + d.skirt.x1 + 0.3, y + d.slotW / 2)));
  add(
    'W',
    d.Wo,
    d.ceilZ,
    1,
    'backdrop behind the curtains',
    outlineFromRects([
      rect(t, 0, d.Wo - t, d.ceilZ),
      ...d.wTabs.flatMap(([a, b]) => [rect(0, d.ceilZ - b, t, d.ceilZ - a), rect(d.Wo - t, d.ceilZ - b, d.Wo, d.ceilZ - a)]),
    ]),
  );

  // --- the moving plates -------------------------------------------------------------------------------------------
  const pl = d.plate;
  const pw = pl.x1 - pl.x0;
  const top = d.pull.top;
  const zr = (x0: number, z0: number, x1: number, z1: number, ox: number, topZ: number): Rect => rect(x0 - ox, topZ - z1, x1 - ox, topZ - z0);
  const plateRects = (): Rect[] => [
    zr(pl.x0, 0, pl.x1, pl.h, pl.x0, top),
    zr(d.skirt.x0, d.skirt.z0, d.skirt.x1, 0, pl.x0, top),
    zr(d.pull.x0, pl.h, d.pull.x1, top, pl.x0, top),
  ];
  const pegSlot = (p: Part, z: [number, number]) =>
    p.hole('peg slot', rectPoly(zr(d.pegX - d.travel - 0.3 - d.play, z[0] - d.play, d.pegX + d.pegW + d.play, z[1] + d.play, pl.x0, top)));
  pegSlot(add('D1', pw, top - d.skirt.z0, 1, 'front curtain', outlineFromRects(plateRects())), d.pegZ);
  pegSlot(add('D2', pw, top - d.skirt.z0, 1, 'rear curtain', outlineFromRects(plateRects())), d.pegZ2);
  const c = d.cBar;
  const cPart = add(
    'C',
    c.x1 - c.x0,
    c.h - d.skirt.z0,
    1,
    "dagger bar (the dagger's post rides in its slot)",
    outlineFromRects([zr(c.x0, 0, c.x1, c.h, c.x0, c.h), zr(d.skirt.x0, d.skirt.z0, d.skirt.x1, 0, c.x0, c.h)]),
  );
  const lv = d.lever;
  const sw = Math.sin((lv.half * Math.PI) / 180);
  const postX = lv.x + lv.R * sw;
  const zHi = lv.z - lv.R * Math.cos((lv.half * Math.PI) / 180);
  const zLo = lv.z - lv.R;
  const ps = lv.post + 2 * d.play;
  cPart.hole('post slot', rectPoly(zr(postX - ps / 2, zLo - ps / 2, postX + ps / 2, zHi + ps / 2, c.x0, c.h)));

  // --- pegs, post, pin, comb ---------------------------------------------------------------------------------------
  add('PEG', d.pegW, 5, 4, 'peg blocks: glue two on top of each other (6 mm) to make each of the two pegs', rectPoly(rect(0, 0, d.pegW, 5)));
  const pin = new Part('PIN', 10, 10, kerf);
  pin.outlineRound(5, 5, 5);
  parts.PIN = { part: pin, qty: 1, note: 'pivot pin: sits in the front panel hole, dagger glued to its front, arm to its back' };
  const post = new Part('POST', 4, 4, kerf);
  post.outlineRound(2, 2, lv.post / 2);
  parts.POST = { part: post, qty: 1, note: 'round post at the arm tip, riding in the slot in C' };
  const combRects: Rect[] = [
    rect(d.spine[0] - d.tip, 0, d.spine[1] - d.tip, 28),
    rect(d.combTab[0] - d.tip, 28, d.combTab[1] - d.tip, 31),
    ...d.fingerY.map((y) => rect(0, y, d.spine[0] - d.tip, y + d.fingerW)),
  ];
  add('COMB', d.combTab[1] - d.tip, 31, 1, "the drawer's comb: three fingers lie in the gaps in front of the three skirts", outlineFromRects(combRects));

  // --- the lever: dagger (front), arm (behind the front panel) ---------------------------------------------------
  const { u, v } = axis(lv.half);
  const to = (a: number, b: number, o: Pt): Pt => [o[0] + a * u[0] + b * v[0], o[1] + a * u[1] + b * v[1]];
  const neg: Pt[] = [
    [-6, -3],
    [-4, -6],
    [4, -6],
    [6, -3],
    [15, -3],
    [15, -8],
    [18, -8],
    [18, -5],
    [33, -4.5],
    [38, 0],
  ];
  const pos: Pt[] = [
    [33, 4.5],
    [18, 5],
    [18, 8],
    [15, 8],
    [15, 3],
    [6, 3],
    [4, 6],
    [-4, 6],
    [-6, 3],
  ];
  const framed = (pts: [number, number][], pad: number) => {
    const raw = pts.map(([a, b]) => to(a, b, [0, 0]));
    const mx = Math.min(...raw.map((p) => p[0])) - pad;
    const my = Math.min(...raw.map((p) => p[1])) - pad;
    return { o: [-mx, -my] as Pt, w: Math.max(...raw.map((p) => p[0])) - mx + pad, h: Math.max(...raw.map((p) => p[1])) - my + pad };
  };
  const dg = [...neg, ...pos] as [number, number][];
  const fd = framed(dg, 0);
  parts.DAGGER = { part: new Part('DAGGER', fd.w, fd.h, kerf), qty: 1, note: 'prop dagger lever (outside the front panel, glued to the pin)' };
  parts.DAGGER.part.outline(dg.map(([a, b]) => to(a, b, fd.o)));
  const arm: [number, number][] = [
    [-6, -6],
    [lv.R + 6, -6],
    [lv.R + 6, 6],
    [-6, 6],
  ];
  const fa = framed(arm, 0);
  parts.ARM = { part: new Part('ARM', fa.w, fa.h, kerf), qty: 1, note: 'lever arm (inside, behind the front panel, glued to the pin)' };
  parts.ARM.part.outline(arm.map(([a, b]) => to(a, b, fa.o)));
  parts.DAGGER.frame = fd.o;
  parts.ARM.frame = fa.o;

  // --- the drawer -------------------------------------------------------------------------------------------------
  const dr = d.drawer;
  const open = { cubeStart: false, cubeEnd: true } as const;
  const dFront = { parity: 'odd', ...open } as EdgeSpec;
  const dSide = { parity: 'even', ...open } as EdgeSpec;
  const dBot = { parity: 'even', ends: true, ...cubes } as EdgeSpec;
  const notch = rect(d.combTab[0] - dr.x0, 0, d.combTab[1] - dr.x0, t);
  add(
    'DF',
    dr.w,
    dr.h,
    1,
    'drawer front wall (the comb sits in its notch)',
    jointOutline(dr.w, dr.h, t, { bottom: dBot, left: dFront, right: dFront }, FIT, [notch]),
  );
  const kd = add('DK', dr.w, dr.h, 1, 'drawer back: the trap-room pull', jointOutline(dr.w, dr.h, t, { bottom: dBot, left: dFront, right: dFront }, FIT));
  kd.holeRound('pull', 72, 9, 6);
  for (const n of ['DL', 'DR']) add(n, dr.len, dr.h, 1, 'drawer side wall', jointOutline(dr.len, dr.h, t, { bottom: dBot, left: dSide, right: dSide }, FIT));
  add('DB', dr.w, dr.len, 1, 'drawer floor', jointOutline(dr.w, dr.len, t, { top: E.own, bottom: E.own, left: E.own, right: E.own }, FIT));
  return parts;
}
