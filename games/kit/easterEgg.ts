// The decorated Easter egg: a small recurring object hidden like the tin heart (TIN-HEARTS.md),
// a dyed egg with painted bands, zigzags, dots or stars, drawn into a 20x20 block in any game's
// palette and over any ground. Its frames move a glint across the shell. Like the tin heart it
// is just a block: touching it gives a few points (no sound or id of its own in Game-Maker).
import { Pixels } from './pixels';

/** The colors it is painted in, as palette indices of the game's own ramps. */
export interface EggColors {
  /** The outline. */
  ink: number;
  /** The dyed shell, dark to light (at least three shades). */
  shell: number[];
  /** The painted pattern, dark to light (one or more shades). */
  paint: number[];
  /** A second paint for the dots, stars or the middle band (default: the lightest shell shade). */
  accent?: number;
  /** The glint. */
  white: number;
}

export type EggPattern = 'bands' | 'zigzag' | 'dots' | 'stars';

/** Frames of the shine: 0 plain; 1..SHINE_FRAMES-1 move a glint down the shell. */
export const EGG_SHINE_FRAMES = 3;

/** Inside the egg: an upright oval, wider below the middle, 13 wide and 17 high, standing on row 18. */
function inside(x: number, y: number): boolean {
  const px = x + 0.5 - 10;
  const py = y + 0.5 - 10.4;
  const rx = 6.4 * (1 + 0.1 * Math.max(-1, Math.min(1, py / 8.4)));
  return (px / rx) ** 2 + (py / 8.4) ** 2 <= 1;
}

/**
 * Draws the Easter egg onto `p` (a 20x20 block: the egg over whatever is there already).
 * `pattern` picks its decoration; `frame` 0 is plain, 1..2 move a glint down the left side.
 */
export function drawEasterEgg(p: Pixels, c: EggColors, pattern: EggPattern = 'zigzag', frame = 0, dx = 0, dy = 0): Pixels {
  const s = c.shell;
  const lo = s[0];
  const mid = s[Math.floor((s.length - 1) / 2)];
  const hi = s[s.length - 1];
  const paint = (k: number) => c.paint[Math.max(0, Math.min(c.paint.length - 1, k))];
  const accent = c.accent ?? hi;
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < 20 && y < 20 && inside(x, y);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if (at(x, y)) {
        // lit from the upper left
        const shade = (x - 10) * 0.12 + (y - 10) * 0.07;
        let v = shade < -0.5 ? hi : shade > 0.55 ? lo : mid;
        // the decoration, in bands across the shell
        if (pattern === 'bands') {
          if (y === 7 || y === 13) v = paint(1);
          else if (y === 10) v = accent;
        } else if (pattern === 'zigzag') {
          const z = Math.abs(((x + 40) % 4) - 2);
          if (y === 8 + z || y === 13 + z) v = paint(shade > 0.3 ? 0 : 1);
          else if (y === 11 && x % 2 === 0) v = accent;
        } else if (pattern === 'dots') {
          if ((x + (y % 6 < 3 ? 0 : 2)) % 4 === 0 && y % 3 === 1) v = (x + y) % 8 < 4 ? paint(1) : accent;
          if (y === 10) v = paint(0);
        } else if (pattern === 'stars') {
          if (y === 9 || y === 12) v = paint(0);
          for (const [sx, sy] of [[7, 5], [12, 6], [9, 15], [13, 15], [6, 14]])
            if ((x === sx && Math.abs(y - sy) <= 1) || (y === sy && Math.abs(x - sx) <= 1)) v = accent;
        }
        p.set(x + dx, y + dy, v);
      } else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) p.set(x + dx, y + dy, c.ink);
    }
  // the highlight near the top left
  p.set(7 + dx, 5 + dy, c.white).set(7 + dx, 6 + dy, hi).set(8 + dx, 4 + dy, hi);
  // the shine: a glint sliding down the left side
  if (frame > 0) {
    const gy = [0, 9, 13][frame] ?? 13;
    for (const [x, y] of [[5, gy], [5, gy - 1], [6, gy], [5, gy + 1]] as [number, number][]) if (at(x, y)) p.set(x + dx, y + dy, x === 5 && y === gy ? c.white : hi);
  }
  return p;
}

/** An Easter egg on its own (CLEAR around it), for a sprite set. */
export function easterEggSprite(c: EggColors, clear: number, pattern: EggPattern = 'zigzag', frame = 0): Pixels {
  return drawEasterEgg(new Pixels(20, 20, clear), c, pattern, frame);
}

/** A line an NPC can say about it. */
export const EASTER_EGG_LINE = 'Somebody painted this one by hand. Zigzags!';
