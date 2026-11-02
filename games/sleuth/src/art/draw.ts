// Drawing helpers for blocks, sprites and screens: dithered shading, lumps, the PC's 8x8
// font (scaled, outlined) and a 3x5 font small enough to letter a door plate on one block.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

export { CLEAR } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
export { shadeAt } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
export { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
export { speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
export { gradient } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
export { pool } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';

import { microWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
export { microWidth };

/** Micro text centered on cx. */
export function microC(p: Pixels, cx: number, y: number, s: string, col: number, scale = 1): void {
  micro(p, Math.round(cx - microWidth(s, scale) / 2), y, s, col, scale);
}
export { asciiArt as art } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
export { scaleBlitTransparent as scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';

import { createMicroText } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
import { microGlyphs } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { createPcText } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
export const { text, outlined, centered } = createPcText({ codePointWidth: true, shadowPixels: (scale) => [[scale + 1, scale + 1]] });
export const micro = createMicroText({
  glyphs: microGlyphs('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$&-!.\' :/,"?#+', false),
  fallback: ' ',
  trailingGap: false,
  glyphCase: false,
});
