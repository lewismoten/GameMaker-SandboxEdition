// Play overlays use a game's own title; absent or damaged artwork leaves the Play button usable.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { encodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { titlePoster } from '../src/gfx/titlePoster';

afterEach(() => vi.unstubAllGlobals());

describe('title posters', () => {
  it('paints the actual title at native size without changing any game files', () => {
    const game = newGame('Title test');
    game.scenes[0].files[0] = 'title.gif';
    const palette = new Uint8Array(768);
    palette[3] = 63;
    const pixels = Uint8Array.from({ length: 320 * 200 }, (_, i) => i % 2);
    const files = new Map([
      ['test.gam', serializeGame(game)],
      ['title.gif', encodeGif({ width: 320, height: 200, palette, pixels })],
    ]);
    const before = structuredClone(files);
    let painted: ImageData | undefined;
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: (image: ImageData) => {
          painted = image;
        },
      }),
      toDataURL: () => 'data:image/png;base64,title',
    };
    vi.stubGlobal('document', { createElement: () => canvas });
    expect(titlePoster(files, 'test.gam')).toBe('data:image/png;base64,title');
    expect([canvas.width, canvas.height]).toEqual([320, 200]);
    expect(painted!.data.slice(0, 8)).toEqual(Uint8ClampedArray.from([0, 0, 0, 255, 255, 0, 0, 255]));
    expect(files).toEqual(before);
  });

  it('returns no poster for missing, empty or unreadable title data', () => {
    const g = newGame('No title');
    const files = new Map([['test.gam', serializeGame(g)]]);
    expect(titlePoster(files, 'missing.gam')).toBeUndefined();
    expect(titlePoster(files, 'test.gam')).toBeUndefined();
    files.set('test.gam', Uint8Array.of(1, 2));
    expect(titlePoster(files, 'test.gam')).toBeUndefined();
  });
});
