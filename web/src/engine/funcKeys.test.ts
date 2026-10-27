// Tests for F1 (funcKeys.ts helpScreen): XFERPLAY never reads GMHELP.TXT; PLAYGAME shows it first.
import { describe, expect, it } from 'vitest';
import { helpScreen } from './funcKeys';
import type { Machine } from './machine';
import type { World } from './world';

/** A Machine whose screen keeps the words written on it, and whose waits end at once. */
function fakeMachine(files: Record<string, string> = {}): { m: Machine; words: string[] } {
  const words: string[] = [];
  const bytes = new Map(Object.entries(files).map(([n, t]) => [n, Uint8Array.from(t, (c) => c.charCodeAt(0))]));
  const m = {
    files: { get: (n: string) => bytes.get(n), has: (n: string) => bytes.has(n) },
    screen: {
      box: () => undefined,
      write: (_x: number, _y: number, _c: number, t: string) => void words.push(t),
      snapshot: () => new Uint8Array(),
      restore: () => undefined,
    },
    flushKeys: () => undefined,
    pauseTimeKey: async () => undefined,
  } as unknown as Machine;
  return { m, words };
}

const world = { palette: new Uint8Array(768) } as unknown as World;
const GMHELP = '   G E N E R A L   H E L P\r\n';

describe('helpScreen (F1)', () => {
  it('stand-alone (XFERPLAY) leaves out a gmhelp.txt the game carries', async () => {
    const { m, words } = fakeMachine({ 'gmhelp.txt': GMHELP });
    await helpScreen(m, world, undefined);
    expect(words).toEqual(['No game-specific help included.']);
  });

  it('in Game-Maker (PLAYGAME) shows its GMHELP.TXT first', async () => {
    const { m, words } = fakeMachine();
    await helpScreen(
      m,
      world,
      undefined,
      Uint8Array.from(GMHELP, (c) => c.charCodeAt(0)),
    );
    expect(words).toEqual(['   G E N E R A L   H E L P', 'No game-specific help included.']);
  });
});
