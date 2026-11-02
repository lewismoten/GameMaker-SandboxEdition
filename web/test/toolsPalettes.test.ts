// Palette construction shares algorithms while callers retain their ramp colors and lighting choices.
import { expect, it } from 'vitest';
import { buildRampPalette } from '@lewismoten/gamemaker-sandbox-tools/kit/palRamps';
import { lightColor } from '@lewismoten/gamemaker-sandbox-tools/colors';
it('applies named replacements before color transforms and exposes the same builder', () => {
  const pal = buildRampPalette(
    [
      ['sky', 2, [0, 0, 0], [252, 252, 252]],
      ['glow', 2, [40, 80, 120], [120, 160, 200], undefined, true],
    ],
    {
      designerColors: false,
      overrides: {
        sky: [
          [252, 0, 0],
          [0, 0, 252],
        ],
      },
      transform: (_name, c, glows) => (glows ? c : lightColor(c, 'night')),
    },
  );
  const sky = pal.r('sky'),
    glow = pal.r('glow');
  expect([...pal.pal.slice(sky[0] * 3, sky[0] * 3 + 3)]).toEqual([63, 0, 0]);
  expect([...pal.pal.slice(sky[1] * 3, sky[1] * 3 + 3)]).toEqual([0, 0, 63]);
  expect([...pal.pal.slice(glow[0] * 3, glow[0] * 3 + 3)]).toEqual([10, 20, 30]);
  expect(pal.b.pal).toBe(pal.pal);
  expect(pal.c('glow', -5)).toBe(glow[0]);
  expect(pal.c('glow', 99)).toBe(glow[1]);
});
