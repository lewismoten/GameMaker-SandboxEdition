// Where PLAYGAME writes on a game's load and save pictures (web/src/engine/scene.ts,
// funcKeys.ts pickSaveSlot): ten names of up to 20 letters at x 80, y 40 + 14i, in the
// palette's nearest yellow, a 6x5 red marker at x 60 beside the chosen one, and a message in
// the nearest blue at y 185 ("This game has not been saved!" from x 40, "Game Saved!" from
// x 112). Yellow only reads on a dark ground and blue only on a light one, so a picture needs
// a dark strip under each name and a light strip under the message. The boxes below leave
// the textfit check's 2 pixel margin (kit/textfit.ts) clear of any edge.
import type { Pixels } from './pixels';

/** The dark strip under name i (0..9): the marker and the 20 letters with their margin. */
export const SLOT = { x: 54, w: 196, h: 14, y: (i: number) => 37 + i * 14 } as const;
/** The light strip under the message line. */
export const STATUS = { x: 34, y: 181, w: 246, h: 15 } as const;

/** Paints the ten name strips in `fill` (an optional 1 pixel `edge` round each), and the message strip. */
export function saveSlots(p: Pixels, fill: number, status: number, edge?: number): Pixels {
  for (let i = 0; i < 10; i++) {
    p.rect(SLOT.x, SLOT.y(i), SLOT.w, SLOT.h, fill);
    if (edge !== undefined) p.frame(SLOT.x, SLOT.y(i), SLOT.w, SLOT.h, edge);
  }
  p.rect(STATUS.x, STATUS.y, STATUS.w, STATUS.h, status);
  return p;
}
