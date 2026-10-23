// The painted Easter egg (games/kit/easterEgg.ts) in colors of its own for the cast page: its
// card picture (castArt.ts) and its frames on the stage (castSprites.ts): the four patterns as
// it wobbles round on its way on, then the glint sliding down its shell.
import type { Pixels } from '../../games/kit/pixels';
import { EGG_SHINE_FRAMES, easterEggSprite, type EggColors, type EggPattern } from '../../games/kit/easterEgg';

const CLEAR = 255;

/** Its colors (6-bit VGA), index 0 unused: ink, a rose shell, blue paint, a yellow accent, white. */
export const EGG_PAL: [number, number, number][] = [
  [0, 0, 0],
  [12, 6, 12], // 1 ink
  [44, 18, 30], // 2 shell shadow
  [55, 30, 42], // 3 shell
  [62, 44, 52], // 4 shell light
  [10, 22, 48], // 5 paint dark
  [22, 38, 60], // 6 paint
  [63, 54, 18], // 7 accent
  [63, 63, 63], // 8 white
];
const COLORS: EggColors = { ink: 1, shell: [2, 3, 4], paint: [5, 6], accent: 7, white: 8 };
const PATTERNS: EggPattern[] = ['zigzag', 'bands', 'dots', 'stars'];

/** Turning round on the way on: each painted side in turn. */
export const eggTurning = (): Pixels[] => PATTERNS.map((p) => easterEggSprite(COLORS, CLEAR, p, 0));

/** Standing still: the glint sliding down its shell, then a rest. */
export const eggShine = (): Pixels[] => [...Array.from({ length: EGG_SHINE_FRAMES }, (_, f) => easterEggSprite(COLORS, CLEAR, 'zigzag', f)), ...Array(5).fill(0).map(() => easterEggSprite(COLORS, CLEAR, 'zigzag', 0))];
