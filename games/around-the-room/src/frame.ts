// The four rooms are one idea turned: a path with a surface under the hero. This file says where each place is.
// A place is `u` (steps along the path, the hero walks toward bigger u) and `h` (blocks out from the surface the
// hero stands on; the surface itself is h = -1, the wall behind it h = -2). Each room puts that on the screen turned
// another quarter:
//   room 0 floor:      the hero walks left,  the surface is the bottom
//   room 1 left wall:  the hero walks up,    the surface is on the left
//   room 2 ceiling:    the hero walks right, the surface is the top
//   room 3 right wall: the hero walks down,  the surface is on the right
// so one lap of the four rooms goes clockwise around a box, and the hero's head always points away from the surface.
import { PULL } from '../../kit/starter/book';

export type Room = 0 | 1 | 2 | 3;
/** Blocks from the surface to the far side of the room (h from -2 up to ACROSS - 3). */
export const ACROSS = 14;

export interface Frame {
  readonly k: Room;
  /** Steps along the path (u from -1, the hedge at the start, to n, the hedge at the end). */
  readonly n: number;
  /** The room's width and height in blocks. */
  readonly w: number;
  readonly h: number;
  /** The level block (x, y) of place (u, h). */
  at(u: number, h: number): [number, number];
  /** The place (u, h) of level pixels (x, y), the top-left corner of the hero's block. */
  place(x: number, y: number): { u: number; h: number };
  /** Which way blocks of air pull: toward the surface. */
  readonly pull: number;
  /** The unit steps on the screen of walking forward and of leaving the surface. */
  readonly forward: [number, number];
  readonly away: [number, number];
}

export function frameOf(k: Room, n: number): Frame {
  const len = n + 2;
  const alongW = k === 0 || k === 2;
  const w = alongW ? len : ACROSS;
  const h = alongW ? ACROSS : len;
  const at = (u: number, hh: number): [number, number] => {
    const a = u + 1;
    const c = hh + 2;
    switch (k) {
      case 0:
        return [len - 1 - a, ACROSS - 1 - c];
      case 1:
        return [c, len - 1 - a];
      case 2:
        return [a, c];
      default:
        return [ACROSS - 1 - c, a];
    }
  };
  const place = (x: number, y: number) => {
    const bx = x / 20;
    const by = y / 20;
    switch (k) {
      case 0:
        return { u: len - 1 - bx - 1, h: ACROSS - 1 - by - 2 };
      case 1:
        return { u: len - 1 - by - 1, h: bx - 2 };
      case 2:
        return { u: bx - 1, h: by - 2 };
      default:
        return { u: by - 1, h: ACROSS - 1 - bx - 2 };
    }
  };
  const pull = [PULL.down, PULL.left, PULL.up, PULL.right][k];
  const forward: [number, number][] = [
    [-1, 0],
    [0, -1],
    [1, 0],
    [0, 1],
  ];
  const away: [number, number][] = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  return { k, n, w, h, at, place, pull, forward: forward[k], away: away[k] };
}
