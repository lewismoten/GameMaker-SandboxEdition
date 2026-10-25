// The plain backdrop the instruction and level cards are shown over: light paper with a thin
// frame round the 16 text lines, in its own small palette with a deep purple (the color
// PLAYGAME writes text in, engine/showGraphic.ts) and a red (its "MORE..."), so the text always
// reads well, whatever the game's colors (the level check's text-contrast).
import { encodeGif } from '../../../formats/gif';

const SCENE_W = 320;
const SCENE_H = 200;
const PAPER = 0;
const INK = 1;
const PURPLE = 2;
const RED = 3;
const FRAME = 4;

function palette(): Uint8Array {
  const p = new Uint8Array(768);
  p.set([63, 62, 56], PAPER * 3);
  p.set([12, 8, 20], INK * 3);
  p.set([50, 10, 50], PURPLE * 3);
  p.set([63, 10, 10], RED * 3);
  p.set([44, 38, 54], FRAME * 3);
  return p;
}

/** The backdrop as a 320 × 200 GIF: paper, a frame just outside the text and its MORE... (x 32..295, y 32..178). */
export function cardBackdrop(): Uint8Array {
  const px = new Uint8Array(SCENE_W * SCENE_H).fill(PAPER);
  const rect = (x0: number, y0: number, x1: number, y1: number, c: number) => {
    for (let x = x0; x <= x1; x++) px[y0 * SCENE_W + x] = px[y1 * SCENE_W + x] = c;
    for (let y = y0; y <= y1; y++) px[y * SCENE_W + x0] = px[y * SCENE_W + x1] = c;
  };
  rect(30, 30, 297, 180, FRAME);
  rect(32, 32, 295, 178, FRAME);
  // the outer edge of the screen, a band of ink
  for (let y = 0; y < SCENE_H; y++) for (let x = 0; x < SCENE_W; x++) if (x < 6 || y < 6 || x >= SCENE_W - 6 || y >= SCENE_H - 6) px[y * SCENE_W + x] = INK;
  return encodeGif({ width: SCENE_W, height: SCENE_H, pixels: px, palette: palette() });
}
