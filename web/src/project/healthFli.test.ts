// A renamed non-FLI file named .fli gets a plain message, at the usual error/warning levels.
import { describe, expect, it } from 'vitest';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { checkGame, type FileSource } from './health';

const enc = new TextEncoder();
const src = (files: Record<string, Uint8Array>): FileSource => ({ names: () => Object.keys(files), get: (n) => files[n] });

describe('FLI check', () => {
  it('says a foreign .fli is not an animation, as a warning when unused', () => {
    const issues = checkGame(src({ 'g.gam': serializeGame(newGame('G')), 'fake.fli': enc.encode('not an animation at all') }), 'g.gam', { deep: true });
    const i = issues.find((x) => x.file === 'fake.fli');
    expect(i?.severity).toBe('warning');
    expect(i?.message).toContain('doesn’t look like a Game-Maker animation (FLI)');
  });
});
