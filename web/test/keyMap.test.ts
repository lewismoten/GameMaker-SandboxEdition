import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GameFiles } from '../src/project/files';
import { describeSequence, direction, gameKeyMap } from '../src/editor/keyMap';
import { emptyFrame, newCharacter, serializeCharacter } from '../src/formats/character';
import { MONBL } from '../src/formats/blocks';

describe('direction', () => {
  it('names compass directions and ignores small drift', () => {
    expect(direction(-10, 0)?.word).toBe('left');
    expect(direction(10, -10)?.word).toBe('up-right');
    expect(direction(30, 2)?.word).toBe('right');
    expect(direction(0, 0)).toBeUndefined();
  });
});

describe('describeSequence', () => {
  const chr = newCharacter();
  const seq = chr.sequences[5];
  seq.key = 75 << 8;
  seq.frames[0] = { ...emptyFrame(), pic1: 0, pic2: 1, x: -8 };
  seq.frames[1] = { ...emptyFrame(), pic1: 0, pic2: 1, x: -8 };
  it('sees a move', () => {
    const a = describeSequence(chr, 5);
    expect(a.kind).toBe('move');
    expect(a.title).toBe('Move left');
    expect(a.short).toBe('←');
  });
  it('sees a jump (up then back down), or any upward move under gravity', () => {
    const c = newCharacter();
    const s = c.sequences[6];
    s.frames[0] = { ...emptyFrame(), pic1: 0, pic2: 1, y: -20 };
    s.frames[1] = { ...emptyFrame(), pic1: 0, pic2: 1, y: 20 };
    expect(describeSequence(c, 6).kind).toBe('jump');
    s.frames[1] = { ...emptyFrame(), pic1: 0, pic2: 1, y: -20 };
    expect(describeSequence(c, 6).kind).toBe('move');
    expect(describeSequence(c, 6, undefined, true).kind).toBe('jump');
  });
  it('sees firing, needed objects and limited uses', () => {
    const c = newCharacter();
    const s = c.sequences[7];
    s.frames[0] = { ...emptyFrame(), pic1: 12, pic2: MONBL };
    s.bloc = 140;
    c.meter[7] = 3;
    const a = describeSequence(c, 7, (b) => b === 140);
    expect(a.kind).toBe('fire');
    expect(a.fires).toEqual([12]);
    expect(a.needsBlock).toBe(140);
    expect(a.uses).toBe(3);
    expect(a.details.join(' ')).toMatch(/starts with it/);
  });
});

describe('gameKeyMap', () => {
  it('reads the characters in a folder without a game file', () => {
    const chr = newCharacter();
    chr.sequences[5].key = 57 << 8;
    chr.sequences[5].frames[0] = { ...emptyFrame(), pic1: 3, pic2: MONBL };
    const km = gameKeyMap(new GameFiles([['hero.chr', serializeCharacter(chr)]]));
    expect(km.keys.map((k) => k.name)).toEqual(['Space']);
    expect(km.keys[0].uses[0].action.kind).toBe('fire');
    expect(km.global.find((g) => g.name === 'F1')).toBeTruthy();
  });

  const dir = resolve(__dirname, '../../cd/gameware/nebula');
  it.skipIf(!existsSync(dir))('maps Nebula from its level characters', () => {
    const files = new GameFiles(readdirSync(dir).map((f) => [f, new Uint8Array(readFileSync(join(dir, f)))]));
    const km = gameKeyMap(files);
    const names = km.keys.map((k) => k.name);
    expect(names).toContain('Space');
    expect(names).toContain('P');
    expect(km.keys.find((k) => k.name === 'Space')!.uses.every((u) => u.action.kind === 'fire')).toBe(true);
    expect(km.instructions[0]?.kind).toBe('text');
  });
});
