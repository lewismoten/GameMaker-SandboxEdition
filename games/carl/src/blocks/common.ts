// What both block sets share: Game-Maker's block attributes as Carl's world uses them. A fly
// doesn't fall, so every bit of open air has no gravity: Carl hovers wherever he stops. Only the
// gusts in the backyard push him (gravity to the left, coming and going).
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';

export { BlockBook, SOLID };
/** Solid on top only: land on it, fly up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, right: 2, down: 4, left: 8 } as const;
/** Open air: no gravity (a fly hovers). */
export const AIR = { grav: GRAV.none } as const;
/** The lives counter (an extra life). */
export const LIFE = 1;
