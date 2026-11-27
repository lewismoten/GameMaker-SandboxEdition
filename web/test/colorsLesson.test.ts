// The playable lesson must hide the color-only clue but preserve the next level's shape clue.
import { readFileSync } from 'node:fs';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { describe, expect, it } from 'vitest';
import { deltaEBytes } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';
import { lessonPalette } from '../../games/colors/src/colorBlocks';
import { skyOf } from '../../games/kit/starter/palette';
import { buildGame } from '../../games/colors/src/game';
import { buildLevels } from '../../games/colors/src/levels';

const { book, pal, levels } = buildLevels();
const simulated = lessonPalette(pal);
const rgb = (index: number) => [0, 1, 2].map((k) => (simulated[index * 3 + k] << 2) | (simulated[index * 3 + k] >> 4)) as [number, number, number];

describe('Colors That Work during play', () => {
  it('uses the simulated scene palette through both playable lessons', () => {
    const scenes = buildGame(levels).scenes.slice(2);
    expect(scenes).toHaveLength(2);
    expect(scenes.every((s) => s.files[0] === 'alike.pal')).toBe(true);
  });

  levels.forEach((level, i) => {
    for (const [suffix, caption, line, palette] of [
      ['view', 'ORIGINAL COLORS', i === 0 ? 'THE PLATES DIFFER ONLY IN COLOR' : level.hint, pal.pal],
      ['alike', 'RED AND GREEN LOOK ALIKE', i === 0 ? 'THE PLATES LOOK THE SAME' : 'THE SPIKES STILL LOOK LIKE SPIKES', simulated],
    ] as const) {
      it(`shows the caption and palette for ${level.file}${suffix}.gif`, () => {
        const file = new URL(`../../games/colors/disk/${level.file}${suffix}.gif`, import.meta.url);
        const image = decodeGif(readFileSync(file));
        const expected = new Pixels(320, 48, pal.c('parch', 3));
        centered(expected, 10, caption, pal.c('ink', 0), 1);
        centered(expected, 28, line, pal.c('wood', 1));
        expect(image.palette).toEqual(palette);
        for (let y = 0; y < expected.h; y++) {
          const start = y * image.width + 20;
          const offset = 12 * image.width;
          expect(image.pixels.slice(offset + start, offset + start + 280)).toEqual(expected.px.slice(start, start + 280));
        }
      });
    }
  });

  it('keeps corresponding safe and harmful plate pixels exactly the same color', () => {
    const safe = book.pics.get('plateSafe')!.px;
    const hot = book.pics.get('plateHot')!.px;
    for (let i = 0; i < safe.length; i++) expect(deltaEBytes(rgb(safe[i]), rgb(hot[i]))).toBe(0);
    const blocks = book.finish();
    expect(blocks[book.n('plateSafe')].chHitPt).toBe(0);
    expect(blocks[book.n('plateHot')].chHitPt).toBe(-5);
  });

  it('gives the second lesson a different silhouette without changing the palette', () => {
    const safe = book.pics.get('plateStripe')!.px;
    const hot = book.pics.get('spikeRed')!.px;
    const sky = skyOf(pal);
    const different = [...safe].filter((pixel, i) => (pixel === sky) !== (hot[i] === sky)).length;
    expect(different / safe.length).toBeGreaterThan(0.2);
  });
});
