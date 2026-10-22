// Tests: FLI playback between scenes (engine/showGraphic.ts playFli) waits the header's speed in
// retraces after each frame, and none for speed 0, as FLI::View did (code/Image/FLI/FLI.CPP).
import { describe, expect, it } from 'vitest';
import { playFli } from '../src/engine/showGraphic';
import { encodeFli } from '../src/formats/fli';
import type { Machine } from '../src/engine/machine';

function fakeMachine(bytes: Uint8Array) {
  let frames = 0;
  let draws = 0;
  const m = {
    files: new Map([['A.FLI', bytes]]),
    screen: {
      palette: new Uint8Array(768),
      pixels: new Uint8Array(64000),
      setPalette() {},
      drawImage() {
        draws++;
      },
    },
    frame: async () => {
      frames++;
    },
    checkAbort() {},
    now: () => performance.now(),
  };
  return { m: m as unknown as Machine, counts: () => ({ frames, draws }) };
}

const pictures = [0, 1, 2, 3].map((c) => new Uint8Array(64000).fill(c));

describe('FLI speed', () => {
  it('speed 0 draws every frame with no frame wait', async () => {
    const { m, counts } = fakeMachine(encodeFli(pictures, new Uint8Array(768), { speed: 0 }));
    expect(await playFli(m, 'A.FLI')).toBe(true);
    expect(counts()).toEqual({ frames: 0, draws: 4 });
  });

  it('a speed above 0 waits for frames after each one', async () => {
    const { m, counts } = fakeMachine(encodeFli(pictures, new Uint8Array(768), { speed: 1 }));
    expect(await playFli(m, 'A.FLI')).toBe(true);
    expect(counts().draws).toBe(4);
    expect(counts().frames).toBeGreaterThanOrEqual(4);
  });
});
