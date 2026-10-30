// Drawing helpers shared by the blocks, sprites and screens: dithered shading, lumps,
// textures, ASCII sprites, the PC's 8x8 font and a 3x5 font for tiny signs.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { P } from './pal';
import { CLEAR } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';

export { textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
export { CLEAR, over, recolor } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
export { shadeAt, gradient, blob, speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
export { asciiSprite as sprite } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { outline as outlineSprite } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
export const outline = (src: Pixels, ink: number) => outlineSprite(src, ink, { ignoreInk: true });

/**
 * The Clown Club letters the O of CLOWN as a round red rubber nose. In art (signs, titles,
 * cartoons) NOSE draws it at capital height and NOSE_SMALL at lowercase height; plain text
 * (the .TXT pages) keeps an ordinary O.
 */
export const NOSE = '\u25cf';
export const NOSE_SMALL = '\u2022';

/**
 * The noses in the PC font's cell: # red, d its shaded side, w the shine, from the upper left
 * like every lump. The three Teddy games' palettes put these ramps at the same indexes.
 */
const NOSE_GLYPHS: Record<string, string[]> = {
  [NOSE]: ['..###...', '.#w###..', '#w#####.', '#######.', '######d.', '.####d..', '..ddd...', '........'],
  [NOSE_SMALL]: ['........', '........', '..###...', '.#w###..', '.#####..', '.####d..', '..ddd...', '........'],
};
const NOSE_INK: Record<string, number> = { '#': P.c('red', 2), d: P.c('red', 0), w: P.c('paint', 3) };

/** Turns every "CLOWN CLUB" (any case) into its sign spelling, the O a red nose. */
export function clubArt(s: string): string {
  return s.replace(/(cl)(o)(wn\s+club)/gi, (_, a: string, o: string, b: string) => a + (o === 'O' ? NOSE : NOSE_SMALL) + b);
}

/** The nose in the 3x5 letters: as tall as they are and a little wider, to read round. */
const MICRO_NOSE = ['.###.', '#w###', '#####', '####d', '.ddd.'];
const isNose = (ch: string) => ch === NOSE || ch === NOSE_SMALL;

import { microAdvance } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
export const microWidth = (s: string, scale = 1) => ([...s].filter(isNose).length * 2 + microAdvance(s)) * scale;
export { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';

import { createMicroText } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
import { microGlyphs } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { createPcText } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
const pc = createPcText({
  codePointWidth: true,
  shadowOffsets: [[1, 2]],
  custom: (ch, col, flat) => {
    const rows = NOSE_GLYPHS[ch];
    return rows ? new Pixels(8, 8, CLEAR).draw(0, 0, rows, flat ? { '#': col, d: col, w: col } : NOSE_INK) : undefined;
  },
});
export const { text, outlined, centered } = pc;
const microNose = new Pixels(5, 5, CLEAR).draw(0, 0, MICRO_NOSE, NOSE_INK);
export const micro = createMicroText({
  glyphs: microGlyphs("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$&-!.' :/,?+><()", false),
  fallback: ' ',
  trailingGap: false,
  glyphCase: false,
  custom: (ch) => (isNose(ch) ? microNose : undefined),
});
