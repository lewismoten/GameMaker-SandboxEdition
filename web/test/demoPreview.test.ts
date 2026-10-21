// Tests: finding a game's title demo for the home page previews (media/demoPreview.ts).
import { describe, expect, it } from 'vitest';
import { demoFileName } from '../src/media/demoPreview';
import { newGame, serializeGame } from '../src/formats/game';

describe('title demo', () => {
  const gam = (demo: string) => {
    const g = newGame('Test');
    g.scenes[0].files[11] = demo;
    return serializeGame(g);
  };

  it('finds the demo the title scene names, in any case', () => {
    expect(demoFileName(gam('DEMO.REC'), ['test.gam', 'demo.rec'])).toBe('demo.rec');
  });

  it('has none when the slot is empty or the file is missing', () => {
    expect(demoFileName(gam(''), ['demo.rec'])).toBeUndefined();
    expect(demoFileName(gam('demo.rec'), ['test.gam'])).toBeUndefined();
    expect(demoFileName(new Uint8Array(3), ['demo.rec'])).toBeUndefined();
  });
});
