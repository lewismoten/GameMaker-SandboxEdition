// Tests for groupGuess.ts: block groups guessed from the maps, monsters and character frames.
import { describe, expect, it } from 'vitest';
import { MLEN, newMap } from '../../../formats/map';
import { newMonsterSet } from '../../../formats/monster';
import { parseCharacter } from '../../../formats/character';
import { guessCharacterGroups, guessMapGroups, guessMonsterGroups } from './groupGuess';

describe('guessing groups', () => {
  it('finds blocks that always sit together on the maps', () => {
    const m = newMap().blocks;
    const sign = (x: number, y: number) => {
      m[y * MLEN + x] = 10;
      m[y * MLEN + x + 1] = 11;
      m[(y + 1) * MLEN + x] = 12;
      m[(y + 1) * MLEN + x + 1] = 13;
    };
    sign(5, 5);
    sign(40, 20);
    // 20 and 21 are side by side once, but 21 also sits alone
    m[50 * MLEN + 50] = 20;
    m[50 * MLEN + 51] = 21;
    m[60 * MLEN + 60] = 21;
    const s = guessMapGroups([m], 150);
    expect(s.map((x) => x.group)).toEqual([{ name: 'Blocks 10, 11, 12, 13', cols: 2, rows: 2, cells: [10, 11, 12, 13] }]);
    expect(s[0].why).toContain('2 times');
  });

  it('finds monsters placed side by side that move as one, frame by frame', () => {
    const mons = newMonsterSet();
    const set = (i: number, pics: number[]) => {
      mons[i].used = 1;
      pics.forEach((b, k) => (mons[i].pic[k] = [b, 4]));
      mons[i].pic[pics.length] = [100, 0];
    };
    set(0, [1, 2]);
    set(1, [5, 6]);
    set(2, [9]); // a different timing: not part of it
    const placed = newMap().monsters;
    placed[0] = { ...placed[0], monnum: 0, curx: 3, cury: 3 };
    placed[1] = { ...placed[1], monnum: 1, curx: 4, cury: 3 };
    placed[2] = { ...placed[2], monnum: 2, curx: 3, cury: 4 };
    const s = guessMonsterGroups(mons, [placed], 100);
    expect(s.map((x) => x.group.cells)).toEqual([
      [1, 5],
      [2, 6],
    ]);
    expect(s[0].group.name).toBe('Monsters 0, 1 · frame 1');
  });

  it('pairs a character frame’s top and bottom', () => {
    const chr = parseCharacter(new Uint8Array(3784 * 2));
    const f = chr.sequences[6].frames;
    f[0] = { ...f[0], pic1: 1, pic2: 2, orient: 0 };
    f[1] = { ...f[1], pic1: 1, pic2: 2, orient: 0 };
    f[2] = { ...f[2], pic1: 3, pic2: 4, orient: 2 };
    f[3] = { ...f[3], pic2: 51 };
    const s = guessCharacterGroups(chr);
    expect(s.map((x) => x.group.cells)).toEqual([[1, 2]]);
  });
});
