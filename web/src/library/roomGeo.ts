// The Library room's one perspective (roomArt.ts, roomObjects.ts, libraryRoom.ts): a camera at eye height just
// inside the door of an octagonal room, looking at the far wall. Everything in the room (floor, walls, books,
// objects, visitors) is placed in meters on the floor plan with `proj`, so they share one vanishing point at
// the horizon (`HORIZON`), and the drawing's 1000 x 500 box is shown at a fixed 2:1 shape so nothing stretches.

/** The picture's size in drawing units (the page shows it at 2:1). */
export const VB_W = 1000;
export const VB_H = 500;
/** Meters from the room's center to the middle of each wall. */
export const APOTHEM = 8;
/** Half a wall's length, in meters. */
export const HALF_SIDE = APOTHEM * Math.tan(Math.PI / 8);
/** Wall height and the camera's eye height, in meters. */
export const WALL_H = 3;
const EYE = 1.4;
/** How far behind the room's center the camera stands, and its focal length in drawing units. */
const BACK = 7;
const FOCAL = 1000;
/** The horizon's height in the drawing (where every line running away from the camera meets). */
export const HORIZON = 165;

export type Pt = [number, number];

/** Where the point (x right, y up, z away from the door, from the room's center) lands in the drawing. */
export function proj(x: number, y: number, z: number): Pt {
  const d = z + BACK;
  return [VB_W / 2 + (FOCAL * x) / d, HORIZON + (FOCAL * (EYE - y)) / d];
}

/** Drawing units per meter at floor-plan depth z. */
export const scaleAt = (z: number) => FOCAL / (z + BACK);

/** Percent of the room's width and height for a drawing point or length, to place a button over the art. */
export const pctX = (u: number) => (u / VB_W) * 100;
export const pctY = (u: number) => (u / VB_H) * 100;

export interface Faces {
  /** The face toward the door. */
  front: Pt[];
  /** The top, when the camera sees it (the box is lower than the eye). */
  top: Pt[] | undefined;
  /** The side turned toward the middle of the room, if the box is not across the middle. */
  side: Pt[] | undefined;
}

/** The faces of a box from x0 to x1, z0 (door side) to z1 and height y0 to y1, in the shared perspective. */
export function box(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number): Faces {
  const P = (x: number, y: number, z: number) => proj(x, y, z);
  const front = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)];
  const top = y1 < EYE ? [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)] : undefined;
  let side: Pt[] | undefined;
  if (x1 <= 0) side = [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)];
  else if (x0 >= 0) side = [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)];
  return { front, top, side };
}

/** A polygon's points as an SVG attribute. */
export const pts = (list: Pt[]) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
