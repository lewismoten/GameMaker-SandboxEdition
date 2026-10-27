// The flat layout of a retail box, measured from The Game Crafter's Large Retail Box template
// (https://www.thegamecrafter.com, templates/large-retail-box.png: 3975 x 4725 pixels at 300 dpi,
// used for the lid and again for the bottom of a two-piece box). It is a reference for the
// layout's measurements only; nothing of its art is copied. In inches:
//
//   - the sheet 13.25 x 15.75, the trim 13 x 15.5 inside a 1/8 bleed;
//   - the face 9.375 x 11.875 in the middle;
//   - a wall 1.125 deep on each side of the face, then a 0.6875 turn-in that folds inside;
//   - the long (left and right) walls carry a 1/2 inch glue tab at each end, cut at a slant on
//     the face's side so it tucks in, which glues inside the short walls;
//   - the safe line 1/8 inside every fold and cut of the face and walls.
import { BLEED, SAFE, rect, type DieLines, type Pt, type Shape } from './dieLines';

export const BOX = {
  sheet: [13.25, 15.75] as [number, number],
  face: [9.375, 11.875] as [number, number],
  wall: 1.125,
  turnIn: 0.6875,
  tab: 0.5,
  /** The tab's slanted corner: across, then down from its end. */
  slant: [0.094, 0.375] as [number, number],
} as const;

/** A panel's rectangle in inches: x, y, w, h. */
export type Rect = [x: number, y: number, w: number, h: number];

/** The fold and cut positions across (xs) and down (ys): outer trim, turn-in fold, wall fold, wall fold, turn-in fold, outer trim. */
export function boxStops(): { xs: number[]; ys: number[] } {
  const stops = (face: number) => {
    const a = BLEED;
    const b = a + BOX.turnIn;
    const c = b + BOX.wall;
    const d = c + face;
    const e = d + BOX.wall;
    return [a, b, c, d, e, e + BOX.turnIn];
  };
  return { xs: stops(BOX.face[0]), ys: stops(BOX.face[1]) };
}

/** Each panel of the flat box. */
export function boxPanels(): Record<'face' | 'top' | 'bottom' | 'left' | 'right' | 'topIn' | 'bottomIn' | 'leftIn' | 'rightIn', Rect> {
  const { xs, ys } = boxStops();
  const r = (x0: number, y0: number, x1: number, y1: number): Rect => [x0, y0, x1 - x0, y1 - y0];
  return {
    face: r(xs[2], ys[2], xs[3], ys[3]),
    top: r(xs[2], ys[1], xs[3], ys[2]),
    bottom: r(xs[2], ys[3], xs[3], ys[4]),
    left: r(xs[1], ys[2], xs[2], ys[3]),
    right: r(xs[3], ys[2], xs[4], ys[3]),
    topIn: r(xs[2], ys[0], xs[3], ys[1]),
    bottomIn: r(xs[2], ys[4], xs[3], ys[5]),
    leftIn: r(xs[0], ys[2], xs[1], ys[3]),
    rightIn: r(xs[4], ys[2], xs[5], ys[3]),
  };
}

/** The die lines: one outline round the whole box, a slit beside each glue tab, the folds and the safe lines. */
export function boxDie(bleed = true): DieLines {
  const { xs, ys } = boxStops();
  const [sx, sy] = BOX.slant;
  const tTop = ys[2] - BOX.tab;
  const tBot = ys[3] + BOX.tab;
  // clockwise from the top turn-in's top left
  const pts: Pt[] = [
    [xs[2], ys[0]],
    [xs[3], ys[0]],
    [xs[3], tTop + sy],
    [xs[3] + sx, tTop],
    [xs[4], tTop],
    [xs[4], ys[2]],
    [xs[5], ys[2]],
    [xs[5], ys[3]],
    [xs[4], ys[3]],
    [xs[4], tBot],
    [xs[3] + sx, tBot],
    [xs[3], tBot - sy],
    [xs[3], ys[5]],
    [xs[2], ys[5]],
    [xs[2], tBot - sy],
    [xs[2] - sx, tBot],
    [xs[1], tBot],
    [xs[1], ys[3]],
    [xs[0], ys[3]],
    [xs[0], ys[2]],
    [xs[1], ys[2]],
    [xs[1], tTop],
    [xs[2] - sx, tTop],
    [xs[2], tTop + sy],
  ];
  const v = (x: number, y0: number, y1: number): Pt[] => [
    [x, y0],
    [x, y1],
  ];
  const h = (y: number, x0: number, x1: number): Pt[] => [
    [x0, y],
    [x1, y],
  ];
  const p = boxPanels();
  const inset = ([x, y, w, hh]: Rect): Shape => rect(x + SAFE, y + SAFE, w - 2 * SAFE, hh - 2 * SAFE);
  return {
    w: BOX.sheet[0],
    h: BOX.sheet[1],
    bleed: bleed ? BLEED : 0,
    cuts: [{ kind: 'poly', pts, closed: true }],
    // the tabs part from the short walls along the face's sides
    slits: [v(xs[2], tTop + sy, ys[2]), v(xs[3], tTop + sy, ys[2]), v(xs[2], ys[3], tBot - sy), v(xs[3], ys[3], tBot - sy)],
    folds: [
      v(xs[1], ys[2], ys[3]),
      v(xs[2], ys[2], ys[3]),
      v(xs[3], ys[2], ys[3]),
      v(xs[4], ys[2], ys[3]),
      h(ys[1], xs[2], xs[3]),
      h(ys[2], xs[2], xs[3]),
      h(ys[3], xs[2], xs[3]),
      h(ys[4], xs[2], xs[3]),
      // the glue tabs
      h(ys[2], xs[1], xs[2]),
      h(ys[2], xs[3], xs[4]),
      h(ys[3], xs[1], xs[2]),
      h(ys[3], xs[3], xs[4]),
    ],
    safe: [p.face, p.top, p.bottom, p.left, p.right].map(inset),
  };
}
