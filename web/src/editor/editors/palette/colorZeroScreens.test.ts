// The screens drawn on color 0 (colorZeroScreens.ts): each draws with the engine's functions in
// the colors its selectors match, and the project's DOS player patches change what they match.
import { describe, expect, it } from 'vitest';
import { Screen } from '../../../gfx/screen';
import { playerLook } from '../../../engine/playerLook';
import { matchedColors, ZERO_SCREENS } from './colorZeroScreens';

function offscreen(): Screen {
  const image = { data: new Uint8ClampedArray(320 * 200 * 4), width: 320, height: 200 };
  const ctx = { createImageData: () => image, putImageData: () => undefined };
  return new Screen({ getContext: () => ctx } as unknown as HTMLCanvasElement);
}

/** Gray at 0, red at 12, blue at 9, yellow at 14, green at 10. */
function palette(): Uint8Array {
  const pal = new Uint8Array(768);
  pal.set([33, 33, 33], 0);
  pal.set([8, 8, 60], 9 * 3);
  pal.set([8, 60, 8], 10 * 3);
  pal.set([60, 8, 8], 12 * 3);
  pal.set([60, 60, 4], 14 * 3);
  return pal;
}

describe('the screens drawn on color 0', () => {
  it('draws each one in only color 0 and the colors its selectors match', () => {
    const pal = palette();
    const look = playerLook();
    for (const s of ZERO_SCREENS) {
      const screen = offscreen();
      screen.clear(0);
      s.draw(screen, pal, look);
      const used = new Set(screen.pixels);
      const matched = matchedColors(s, pal, look).map((m) => m.index);
      expect(
        [...used].filter((c) => c !== 0 && !matched.includes(c)),
        s.id,
      ).toEqual([]);
      expect(used.size, s.id).toBeGreaterThan(1);
    }
  });

  it('names the name prompt’s targets and what they matched', () => {
    const prompt = ZERO_SCREENS.find((s) => s.id === 'newHiscore')!;
    expect(matchedColors(prompt, palette(), playerLook())).toEqual([
      { label: 'New high score: Congratulations and prompt', target: 'hsRed', rgb: [63, 10, 10], index: 12 },
      { label: 'New high score: place line and name', target: 'hsBlue', rgb: [10, 10, 63], index: 9 },
    ]);
  });

  it('follows the DOS player patches', () => {
    const patches = { 'color.select.hsPrompt': 'hsGreen' };
    const prompt = ZERO_SCREENS.find((s) => s.id === 'newHiscore')!;
    const [m] = matchedColors(prompt, palette(), playerLook(patches), patches);
    expect(m).toMatchObject({ target: 'hsGreen', rgb: [10, 63, 10], index: 10 });
  });
});
