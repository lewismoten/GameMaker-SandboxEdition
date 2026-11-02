// Drawing helpers for blocks, sprites and screens: dithered shading, bevelled boxes,
// ASCII sprites, the PC's 8x8 font (at any scale) and a 3x5 font for silkscreen labels.
export { text, textWidth, outlined, centered } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
export { CLEAR, scaleBlit, outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
export { shadeAt, gradient, blob, bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';

import { createMicroText } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
import { microGlyphs } from '@lewismoten/gamemaker-sandbox-tools/microFont';
export const micro = createMicroText({
  glyphs: microGlyphs("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-./: !?'=><~", true),
  fallback: '?',
  trailingGap: true,
  glyphCase: false,
});
