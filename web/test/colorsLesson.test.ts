// The playable lesson must hide the color-only clue but preserve the next level's shape clue.
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
