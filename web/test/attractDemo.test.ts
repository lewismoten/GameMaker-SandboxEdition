// Tests: the made-up "attract mode" recording for games without a demo (media/attractDemo.ts).
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GameFiles } from '../src/project/files';
import { attractKeys, attractRecording, firstLevelCharacter } from '../src/media/attractDemo';
import { parseRecording } from '../src/formats/recording';
import { newGame, serializeGame } from '../src/formats/game';

const dir = resolve(__dirname, '../../cd/gameware/sample');
const files = new GameFiles(readdirSync(dir).map((f) => [f, new Uint8Array(readFileSync(join(dir, f)))] as [string, Uint8Array]));

describe('attract mode', () => {
  it('walks with the arrow keys the hero answers to, and fires', () => {
    const chr = firstLevelCharacter(files, 'sample.gam')!;
    expect(chr).toBeDefined();
    const k = attractKeys(chr);
    expect([k.left, k.right]).toEqual([0x4b, 0x4d]);
    expect(k.fire).toBeDefined();
  });

  it('makes a recording that presses and lets go of every key, ending with Esc', () => {
    const keys = parseRecording(attractRecording(files, 'sample.gam', 20)!);
    const ticks = keys.reduce((n, k) => n + k.delta, 0);
    expect(ticks).toBeGreaterThan(18 * 18);
    expect(ticks).toBeLessThan(40 * 18);
    const down = new Set<number>();
    for (const k of keys) {
      if (k.key < 0x80) down.add(k.key);
      else down.delete(k.key & 0x7f);
    }
    expect(down.size).toBe(0);
    expect(keys.at(-2)?.key).toBe(0x01);
  });

  it('has nothing to play for a game with no level', () => {
    const empty = new GameFiles([['x.gam', serializeGame(newGame('X'))]]);
    expect(attractRecording(empty, 'x.gam')).toBeUndefined();
  });
});
