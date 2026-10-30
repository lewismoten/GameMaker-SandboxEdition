// Color vision must remain useful without a visible level and never borrow unrelated colors.
import { describe, expect, it } from 'vitest';
import { newBlockSet, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { GameFiles } from '../src/project/files';
import { includesColors, visiblePicture, visionFallback } from '../src/editor/editors/palette/visionFallback';

describe('Color vision fallback', () => {
  const pal = new Uint8Array(768);
  pal[3] = 63;
  pal[6] = 3;
  it('recognizes black and near-black filler without hiding opaque index 255', () => {
    expect(visiblePicture(Uint8Array.of(0, 2), pal)).toBe(false);
    expect(visiblePicture(Uint8Array.of(1), pal)).toBe(true);
    const opaque = pal.slice();
    opaque[255 * 3] = 63;
    expect(visiblePicture(Uint8Array.of(255), opaque)).toBe(true);
  });
  it('uses artwork associated with this palette and leaves native bytes unchanged', () => {
    const blocks = newBlockSet('cbl');
    blocks[4].pixels[17] = 1;
    const bytes = serializeBlocks(blocks);
    const files = new GameFiles([['hero.cbl', bytes]]);
    const project = { files, paletteFor: () => ({ palette: pal, source: 'game.pal' }) };
    const picture = visionFallback(project, 'GAME.PAL', pal);
    expect(picture.label).toBe('HERO.CBL block pictures');
    expect(picture.pixels[17]).toBe(1);
    expect(picture.pixels.includes(255)).toBe(false);
    expect(files.get('hero.cbl')).toBe(bytes);
    expect(visionFallback(project, 'other.pal', pal).label).toBe('Palette colors');
  });
  it('shows all 256 entries without usable art or when highlighted colors are absent', () => {
    const blocks = newBlockSet('bbl');
    blocks[0].pixels.fill(1);
    const project = { files: new GameFiles([['room.bbl', serializeBlocks(blocks)]]), paletteFor: () => ({ palette: pal, source: 'game.pal' }) };
    const picture = visionFallback(project, 'game.pal', pal, [1, 80]);
    expect(picture.label).toBe('Palette colors');
    expect(new Set(picture.pixels).size).toBe(256);
    expect(includesColors(picture.pixels, [0, 255, 80])).toBe(true);
    expect(visionFallback({ ...project, files: new GameFiles() }, 'game.pal', pal).label).toBe('Palette colors');
  });
});
