// Lettering for screens and signs: the PC's 8x8 font (scaled, outlined) and a 3x5 font
// small enough to paint "PHONE" across one 20x20 block.
export { textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';

export { microAdvance as microWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';

import { createMicroText } from '@lewismoten/gamemaker-sandbox-tools/kit/microText';
import { microGlyphs } from '@lewismoten/gamemaker-sandbox-tools/microFont';
import { createPcText } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
export const { text, outlined } = createPcText({ codePointWidth: true, shadowOffsets: [[1, 2]] });
export const micro = createMicroText({
  glyphs: microGlyphs('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$&-!.\' :/,"?()¢>+=*', false),
  fallback: ' ',
  trailingGap: false,
  glyphCase: false,
});
