// Snowbound's Plowed Street box: the cut shape of every part (outlines, joints, slots, holes). Engraving is in plowedArt.ts.
// Part coordinates are millimeters on the flat piece, y down. Outer panels are seen from outside; T and F from above.
import { jointOutline, outlineFromRects, rectPoly, type EdgeSpec, type Rect } from '@lewismoten/gamemaker-sandbox-tools/kit/laserJoints';
import { Part } from '@lewismoten/gamemaker-sandbox-tools/kit/laserLayout';
import type { Pt } from '@lewismoten/gamemaker-sandbox-tools/kit/laserSvg';
import { Di, Do, Ho, T, Wo, channelX, drawer, lug, plate, streetRects, maze, zShelf } from './plowedDims';

export interface Made {
  part: Part;
  qty: number;
  note: string;
}
export type Parts = Record<string, Made>;

const FIT = 0.05; // joint play per side
const rect = (x0: number, y0: number, x1: number, y1: number): Rect => [x0, y0, x1, y1];
const cubes = { cubeStart: true, cubeEnd: true } as const;
const E = {
  own: { parity: 'odd', ...cubes } as EdgeSpec,
  wallH: { parity: 'even', ends: true, ...cubes } as EdgeSpec,
  front: { parity: 'odd', ...cubes } as EdgeSpec,
  side: { parity: 'even', ...cubes } as EdgeSpec,
};
/** Where an interior z lands on an outer wall panel's sheet (y down, the base's thickness below z = 0). */
export const wallY = (z: number) => Ho - (z + T);
/** F's tabs along Y (the shelf), and its slot for the lug. */
export const shelfTabs: [number, number][] = [
  [8, 34],
  [58, 84],
];
export const dFit = 0.3; // clearance of the drawer in the front opening, per side

export function makeParts(kerf: number): Parts {
  const parts: Parts = {};
  const add = (name: string, w: number, h: number, qty: number, note: string, outline: Pt[]) => {
    const part = new Part(name, w, h, kerf);
    part.outline(outline);
    parts[name] = { part, qty, note };
    return part;
  };
  const wall = { top: E.wallH, bottom: E.wallH };

  // --- the outer box ---------------------------------------------------------------------------------------------
  const front = add('P', Wo, Ho, 1, 'front: drawer opening with a narrow slot above it for the lug', jointOutline(Wo, Ho, T, { ...wall, left: E.front, right: E.front }, FIT));
  const dx0 = T + drawer.x0 - dFit;
  const dx1 = T + drawer.x0 + drawer.w + dFit;
  front.hole(
    'drawer opening',
    outlineFromRects([
      rect(dx0, wallY(drawer.z0 + drawer.h + dFit), dx1, wallY(drawer.z0 - 0.3)),
      rect(T + lug.x - 3, wallY(lug.top + 0.4), T + lug.x + 3, wallY(drawer.z0 + drawer.h)),
    ]),
  );
  add('K', Wo, Ho, 1, 'back', jointOutline(Wo, Ho, T, { ...wall, left: E.front, right: E.front }, FIT));
  const slots = (mirror: boolean) =>
    shelfTabs.map(([a, b]) => {
      const x0 = mirror ? Do - (b + T) : a + T;
      const x1 = mirror ? Do - (a + T) : b + T;
      return rectPoly(rect(x0 - FIT, wallY(zShelf[1]) - FIT, x1 + FIT, wallY(zShelf[0]) + FIT));
    });
  for (const [name, mirror] of [
    ['L', false],
    ['R', true],
  ] as const) {
    const side = add(name, Do, Ho, 1, `${name === 'L' ? 'left' : 'right'} wall: two slots for the shelf's tabs`, jointOutline(Do, Ho, T, { ...wall, left: E.side, right: E.side }, FIT));
    slots(mirror).forEach((p, i) => side.hole(`shelf slot ${i + 1}`, p));
  }
  // the lid: the street map. Two identical sets of streets are cut out; the knobs ride in them.
  const lid = add('T', Wo, Do, 1, 'lid: two identical street maps, cut out as slots', jointOutline(Wo, Do, T, { top: E.own, bottom: E.own, left: E.own, right: E.own }, FIT));
  [0, maze.dyTwin].forEach((dy, i) => {
    const pts = outlineFromRects(streetRects(dy).map(([a, b, c, d]) => rect(a + T, b + T, c + T, d + T)));
    lid.hole(`streets ${i + 1}`, pts);
  });
  add('B', Wo, Do, 1, 'base', jointOutline(Wo, Do, T, { top: E.own, bottom: E.own, left: E.own, right: E.own }, FIT));

  // --- the shelf and the plate -----------------------------------------------------------------------------------
  const tabs = shelfTabs.flatMap(([a, b]) => [rect(0, a, T, b), rect(Wo - T, a, Wo, b)]);
  add(
    'F',
    Wo,
    Di,
    1,
    "shelf under the plate: tabs in the side walls, a slot open at the front for the drawer's lug",
    outlineFromRects([rect(T, 0, Wo - T, Di), ...tabs], [rect(T + lug.x - 3, lug.y - T / 2 - 0.5, T + lug.x + 3, Di)]),
  );
  const [bx0, by0, bx1, by1] = plate.bay;
  const ch = [channelX - plate.channelHalf, by1 - 0.01, channelX + plate.channelHalf, plate.d] as const;
  add('PL', plate.w, plate.d, 1, 'plate: a bay for the lug and one channel out of its front; the knobs stand on it', outlineFromRects([rect(0, 0, plate.w, plate.d)], [rect(bx0, by0, bx1, by1), rect(...ch)]));

  // --- the knobs --------------------------------------------------------------------------------------------------
  const disc = (name: string, d: number, qty: number, note: string) => {
    const p = new Part(name, d, d, kerf);
    p.outlineRound(d / 2, d / 2, d / 2);
    parts[name] = { part: p, qty, note };
  };
  disc('STEM', 5, 4, 'knob stem disc: glue two on each of the two marked spots on the plate, one on the other');
  disc('CAP', 14, 2, 'knob cap: glue on top of a stem, above the lid');
  add('RAIL', 56, 12, 2, 'drawer rail: glue on the base under each side of the drawer', rectPoly(rect(0, 0, 56, 12)));

  // --- the drawer -------------------------------------------------------------------------------------------------
  const open = { cubeStart: false, cubeEnd: true } as const;
  const dFront = { parity: 'odd', ...open } as EdgeSpec;
  const dSide = { parity: 'even', ...open } as EdgeSpec;
  const dBot = { parity: 'even', ends: true, ...cubes } as EdgeSpec;
  const { w, h, len } = drawer;
  const df = add('DF', w, h, 1, 'drawer front (a finger hole)', jointOutline(w, h, T, { bottom: dBot, left: dFront, right: dFront }, FIT));
  df.holeRound('finger hole', w / 2, h / 2 - 1, 5.5);
  const tab = lug.top - (drawer.z0 + h);
  const dk = new Part('DK', w, h + tab, kerf);
  const tx = lug.x - drawer.x0;
  const shape = jointOutline(w, h, T, { bottom: dBot, left: dFront, right: dFront }, FIT, [], [rect(tx - lug.w / 2, -tab, tx + lug.w / 2, 0)]);
  dk.outline(shape.map(([x, y]) => [x, y + tab] as Pt));
  parts.DK = { part: dk, qty: 1, note: 'drawer back: the lug tab on top is what the plate holds' };
  for (const n of ['DL', 'DR']) add(n, len, h, 1, 'drawer side wall', jointOutline(len, h, T, { bottom: dBot, left: dSide, right: dSide }, FIT));
  add('DB', w, len, 1, 'drawer floor', jointOutline(w, len, T, { top: E.own, bottom: E.own, left: E.own, right: E.own }, FIT));
  return parts;
}
