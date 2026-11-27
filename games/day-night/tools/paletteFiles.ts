// Check the palette bytes shared across stages.
import type { Palettes } from '../src/palettes';

export function checkPaletteFiles(files: Palettes, fail: (message: string) => void) {
  const { pal } = files;
  for (const k of ['day', 'dusk', 'night'] as const) if (files[k].length !== 768) fail(`${k}.pal is ${files[k].length} bytes`);
  if (Buffer.compare(files.day, files.dusk) === 0 || Buffer.compare(files.day, files.night) === 0 || Buffer.compare(files.dusk, files.night) === 0)
    fail('two palettes are the same');
  for (let i = 0; i < 9 * 3; i++) if (files.day[i] !== files.night[i] || files.day[i] !== files.dusk[i]) fail(`a designer color changed at byte ${i}`);
  for (const other of [files.dusk, files.night])
    for (const name of ['menublue', 'plum', 'hot'])
      for (const id of pal.r(name)) for (let k = 0; k < 3; k++) if (files.day[id * 3 + k] !== other[id * 3 + k]) fail(`text color ${name} changed`);
}
