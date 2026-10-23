// The tin heart: a small recurring object Lewis tucks into the games, a nod to the Tin Man
// and the heart that ticks. A riveted tin heart, silver-grey with a highlight and a little
// clock face in the middle, drawn into a 20x20 block in any game's palette; its frames move a
// glint across the tin (a gentle shine). Touching one gives a small bonus. Its sound is a soft,
// steady tick-tock on the PC speaker (`TICK_TOCK`, never a .VOC, so it never cuts a voice clip),
// where a game has a sound slot to spare for it.
import { Pixels } from './pixels';
import { speaker } from './sound';

/** The colors it is drawn in, as palette indices of the game's own ramps. */
export interface TinColors {
  /** The outline. */
  ink: number;
  /** Tin, dark to light (at least three shades). */
  tin: number[];
  /** The glint and the clock face. */
  white: number;
  /** The clock hands and rivet shadows. */
  dark: number;
}

/** Frames of the shine: 0 is the plain heart; 1..SHINE_FRAMES-1 move a glint across it. */
export const SHINE_FRAMES = 4;

/** Inside the heart (two lobes over a point), 20x20, centered a little high. */
function inside(x: number, y: number): boolean {
  const px = x + 0.5;
  const py = y + 0.5;
  if (Math.hypot(px - 6.3, py - 6.6) <= 3.9 || Math.hypot(px - 13.7, py - 6.6) <= 3.9) return true;
  // the lower point: from the lobes' widest row down to (10, 17)
  if (py >= 6.6 && py <= 17.4) {
    const half = 7.6 * (1 - (py - 6.6) / 10.8);
    return Math.abs(px - 10) <= half;
  }
  return false;
}

/**
 * Draws the tin heart onto `p` (a 20x20 block: the heart over whatever is there already).
 * `frame` 0 is plain; 1..3 move a glint from the left lobe down across the right.
 */
export function drawTinHeart(p: Pixels, c: TinColors, frame = 0, dx = 0, dy = 0): Pixels {
  const t = c.tin;
  const lo = t[0];
  const mid = t[Math.floor((t.length - 1) / 2)];
  const hi = t[t.length - 1];
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < 20 && y < 20 && inside(x, y);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (at(x, y)) {
        // lit from the upper left: light on the upper-left edge, dark on the lower right
        const shade = (x - 10) * 0.08 + (y - 9) * 0.1;
        p.set(x + dx, y + dy, shade < -0.55 ? hi : shade > 0.5 ? lo : mid);
      } else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) p.set(x + dx, y + dy, c.ink);
    }
  // a seam across the middle and the rivets along the rim
  for (const [x, y] of [
    [3, 6], [6, 3], [13, 3], [16, 6], [14, 11], [5, 11],
  ] as [number, number][]) {
    p.set(x + dx, y + dy, hi);
    if (at(x + 1, y + 1)) p.set(x + dx + 1, y + dy + 1, c.dark);
  }
  // the highlight on the left lobe
  p.set(5 + dx, 5 + dy, c.white).set(6 + dx, 5 + dy, hi).set(5 + dx, 6 + dy, hi);
  // the little clock face in the middle, its hands at ten past ten
  p.disc(10 + dx, 9.5 + dy, 2.4, c.ink);
  p.disc(10 + dx, 9.5 + dy, 1.6, c.white);
  p.set(10 + dx, 9 + dy, c.dark).set(10 + dx, 8 + dy, c.dark).set(11 + dx, 9 + dy, c.dark);
  // the shine: a glint that crosses the tin
  if (frame > 0) {
    const gx = [0, 5, 9, 14][frame] ?? 14;
    const gy = [0, 9, 13, 8][frame] ?? 8;
    for (const [x, y] of [
      [gx, gy], [gx - 1, gy], [gx + 1, gy], [gx, gy - 1], [gx, gy + 1],
    ] as [number, number][])
      if (at(x, y)) p.set(x + dx, y + dy, x === gx && y === gy ? c.white : hi);
  }
  return p;
}

/** A tin heart on its own (CLEAR around it), for a sprite set. */
export function tinHeartSprite(c: TinColors, clear: number, frame = 0): Pixels {
  return drawTinHeart(new Pixels(20, 20, clear), c, frame);
}

/** A soft, steady tick-tock on the PC speaker: tick, tock, tick, tock. */
export const TICK_TOCK = (): Uint16Array => speaker((i) => (i % 9 < 2 ? (i % 18 < 9 ? 1760 : 1320) : 0));

/** A line an NPC can say about it. */
export const TIN_HEART_LINE = 'Found it! Ticks like it means it.';
