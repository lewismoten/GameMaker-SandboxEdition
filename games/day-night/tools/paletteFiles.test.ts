// A damaged dusk palette must fail the same checks as a damaged night palette.
import { expect, it, vi } from 'vitest';
import { buildPalettes } from '../src/palettes';
import { checkPaletteFiles } from './paletteFiles';

it('rejects a copy of night at dusk', () => {
  const files = buildPalettes();
  files.dusk.set(files.night);
  const fail = vi.fn();
  checkPaletteFiles(files, fail);
  expect(fail).toHaveBeenCalledWith('two palettes are the same');
});

it('rejects a changed dusk text color', () => {
  const files = buildPalettes();
  files.dusk[files.pal.c('plum', 1) * 3 + 2] ^= 1;
  const fail = vi.fn();
  checkPaletteFiles(files, fail);
  expect(fail).toHaveBeenCalledWith('text color plum changed');
});
