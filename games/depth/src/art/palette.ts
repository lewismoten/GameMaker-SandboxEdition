// A level's palette: Game-Maker's designer colors (0..8), the sprites' 64 (9..72, the same in
// every level), and 182 colors median-cut for that level's own rendered blocks (73..254).
import { Matcher, medianCut, putColors, type Col } from '../render/quant';
import { SPRITE_COUNT, SPRITE_FIRST } from '../sprites/sprites';

/** Game-Maker's designers look for these grays, reds, black and LCD green (kit PaletteBuilder); black first. */
const DESIGNER: Col[] = [
  [0, 0, 0],
  [33, 33, 33],
  [43, 0, 0],
  [28, 0, 0],
  [28, 28, 28],
  [23, 23, 23],
  [18, 18, 18],
  [53, 0, 0],
  [8, 48, 24],
].map((c) => c.map((v) => v * 4) as Col);

const LEVEL_FIRST = SPRITE_FIRST + SPRITE_COUNT;

interface LevelPalette {
  pal: Uint8Array;
  matcher: Matcher;
}

export function levelPalette(sprites: Col[], tiles: Uint8Array[]): LevelPalette {
  const pal = new Uint8Array(768);
  putColors(pal, 0, DESIGNER);
  putColors(pal, SPRITE_FIRST, sprites);
  const own = medianCut(tiles, 255 - LEVEL_FIRST);
  putColors(pal, LEVEL_FIRST, own);
  // blocks may use any color but 255 and the sprites' shadow color
  const allowed = Array.from({ length: 255 }, (_, i) => i).filter((i) => i !== SPRITE_FIRST);
  return { pal, matcher: new Matcher(pal, allowed) };
}
