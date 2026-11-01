// What every level's block set shares: a fresh book and palette helpers, the instruments to
// pick up (each its preset picture in a gold frame, glinting), the way out of a neighborhood
// (a door that opens only when its whole family is found), and the floating notes that ring
// a pitch when Teddy touches them (the sound slots as a keyboard, sound/sounds.ts).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '../../../snowbound/src/art/draw';
import { BlockBook, SOLID } from '../../../snowbound/src/blocks/book';
import { pickupPic } from '../art/icons';
import type { Pal } from '../art/pal';
import { CTR } from '../ids';

export { BlockBook, SOLID };
/** Solid on top only: stand on it, hop up through it. */
export const LEDGE = 1;
export const GRAV = { none: 0, up: 1, right: 2, down: 4, left: 8 } as const;
/** How long each frame of an instrument's glint shows (ticks). */
const GLINT = 6;

export interface Kit {
  book: BlockBook;
  pal: Pal;
  c: Pal['c'];
  R: Pal['r'];
  /** A fresh 20x20 picture filled with `fill`. */
  P: (fill?: number) => Pixels;
}

export function kit(pal: Pal): Kit {
  return { book: new BlockBook(), pal, c: pal.c, R: pal.r, P: (fill = 0) => new Pixels(20, 20, fill) };
}

/**
 * The instruments of a neighborhood, to pick up: block `pick-<id>` (two glinting frames) over
 * nothing (the frame fills its tile). Each is one found (counter 22, ringing slot 7) and 50
 * points, and leaves `after` (its block, or a block for each) behind.
 */
export function pickups(k: Kit, ids: string[], after: string | ((id: string) => string)): void {
  for (const id of ids) {
    const a = `pick-${id}`;
    const b = `pick-${id}.1`;
    const hit = { effect: CTR.found, eamt: 1, score: 50, touch: typeof after === 'string' ? after : after(id), ntime: GLINT };
    k.book.add(a, pickupPic(id, 0), { ...hit, next: b });
    k.book.add(b, pickupPic(id, 2), { ...hit, next: a });
  }
}

/**
 * The way out: `door` is shut and solid, and opens (into `door.open`) for a touch only when
 * all `need` instruments are found (counter 22 can give them up: a touch that would leave it
 * empty is refused). `door.top` is the frame above it.
 */
export function door(k: Kit, back: Pixels, need: number, sign: (p: Pixels) => void): void {
  const { c } = k;
  const frame = (p: Pixels) => p.rect(1, 0, 2, 20, c('wood', 1)).rect(17, 0, 2, 20, c('wood', 1));
  const shut = new Pixels(20, 20).blit(back, 0, 0);
  frame(shut).rect(3, 0, 14, 20, c('wood', 3));
  for (let y = 2; y < 20; y += 6) shut.rect(4, y, 12, 4, c('wood', 2));
  shut.disc(14, 11, 1.4, c('gold', 2));
  const open = new Pixels(20, 20).blit(back, 0, 0);
  frame(open).rect(3, 0, 14, 20, c('ink', 1));
  open.rect(3, 0, 3, 20, c('wood', 2));
  const top = new Pixels(20, 20).blit(back, 0, 0);
  top.rect(0, 12, 20, 8, c('wood', 1)).rect(3, 14, 14, 6, c('wood', 3));
  sign(top);
  k.book.add('door', shut, { solid: SOLID, effect: CTR.found, eamt: -need, touch: 'door.open' });
  k.book.add('door.open', open);
  k.book.add('door.top', top, { solid: SOLID });
}

/** The kinds of change that ring each sound slot, for a note block (sounds.ts STAIR_NOTES order). */
const RING: { hp?: number; effect?: number; eamt?: number; score?: number }[] = [
  { hp: 1 }, // slot 0: hit points up
  { effect: 3, eamt: 1 }, // slot 2: money up
  { score: 10 }, // slot 5: score up
  { score: -1 }, // slot 6: score down
  { effect: CTR.stairs, eamt: 1 }, // slot 7: a counter up
  { effect: CTR.down, eamt: -1 }, // slot 8: a counter down (it starts at DOWN_START)
];

/**
 * Floating notes over `back`, one for each pitch of the scale (`note0`..`note5`, low to high),
 * which ring that pitch when touched and turn into `note.played` (the note gone pale).
 */
export function notes(k: Kit, back: Pixels, colors: number[]): void {
  const { c } = k;
  const draw = (col: number, pale: boolean) => {
    const p = new Pixels(20, 20).blit(back, 0, 0);
    const ink = pale ? c('cloud', 1) : c('ink', 0);
    // an eighth note: a round head, a stem and a flag
    blob(p, 8, 14, 3.4, 2.6, [ink, pale ? c('cloud', 2) : col, pale ? c('cloud', 2) : col], 0, 2);
    p.rect(11, 3, 1, 11, ink);
    p.line(12, 3, 15, 7, ink).line(12, 4, 15, 8, ink);
    if (!pale) p.set(7, 13, c('cloud', 2));
    return p;
  };
  RING.forEach((ring, i) => k.book.add(`note${i}`, draw(colors[i % colors.length], false), { ...ring, touch: 'note.played' }));
  k.book.add('note.played', draw(0, true));
}
