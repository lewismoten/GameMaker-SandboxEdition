// Tests for animClip.ts: clips built from block chains, monsters and character sequences.
import { describe, expect, it } from 'vitest';
import { newMonsterSet } from '../../../formats/monster';
import { bblClip, bblGroupClip, characterClips, clipTicks, monsterClips, monsterGroupClip, nextChange, stepAt, type Track } from './animClip';
import { groupOf } from './blockGroups';
import { parseCharacter } from '../../../formats/character';

const blk = (nextBl: number, ntime: number) => ({ nextBl, ntime });

describe('animation clips', () => {
  it('steps a looping track by its ticks', () => {
    const t: Track = {
      col: 0,
      row: 0,
      loopTo: 1,
      steps: [
        { block: 0, ticks: 2 },
        { block: 1, ticks: 3 },
        { block: 2, ticks: 1 },
      ],
    };
    expect([0, 1, 2, 3, 4, 5, 6, 9, 10].map((k) => stepAt(t, k))).toEqual([0, 0, 1, 1, 1, 2, 1, 2, 1]);
    const stops: Track = {
      col: 0,
      row: 0,
      loopTo: -1,
      steps: [
        { block: 0, ticks: 2 },
        { block: 1, ticks: Infinity },
      ],
    };
    expect(stepAt(stops, 500)).toBe(1);
  });

  it('follows background chains, alone and in a group', () => {
    const blocks = [blk(1, 4), blk(0, 4), blk(2, 0)];
    const c = bblClip(blocks, 0);
    expect(c.tracks[0].steps.map((s) => s.block)).toEqual([0, 1]);
    expect(clipTicks(c)).toBe(8);
    expect(nextChange(c, 0)).toBe(4);
    const g = bblGroupClip(blocks, groupOf('g', [0, 2], 2, 1, 3)!);
    expect(g.tracks.map((t) => [t.col, t.steps.length])).toEqual([
      [0, 2],
      [1, 1],
    ]);
  });

  it('plays monsters, and a group of monsters in step', () => {
    const [a, b] = newMonsterSet();
    a.used = 1;
    a.pic[0] = [10, 3];
    a.pic[1] = [11, 0];
    a.pic[2] = [100, 0];
    b.used = 1;
    b.pic[0] = [12, 3];
    b.pic[1] = [13, 0];
    b.pic[2] = [100, 0];
    const clips = monsterClips([a, b], 11);
    expect(clips.map((c) => c.label)).toEqual(['Monster 0']);
    expect(clips[0].tracks[0].steps.map((s) => s.ticks)).toEqual([3, 1]);
    const g = monsterGroupClip([a, b], groupOf('Bus', [11, 13], 2, 1, 100)!, 11);
    expect(g.tracks[1].steps.map((s) => s.block)).toEqual([12, 13]);
  });

  it('shows a character sequence top and bottom', () => {
    const chr = parseCharacter(new Uint8Array(3784 * 2));
    const s = chr.sequences[5];
    s.frames[0] = { ...s.frames[0], pic1: 1, pic2: 2, pause: 2, orient: 0x10 };
    s.frames[1] = { ...s.frames[1], pic1: 3, pic2: 4, pause: 2, orient: 0 };
    s.frames[2] = { ...s.frames[2], pic2: 51 };
    const clips = characterClips(chr, 4);
    expect(clips.map((c) => c.label)).toEqual(['Sequence 5']);
    expect(clips[0].tracks[1].steps.map((x) => [x.block, x.orient])).toEqual([
      [2, 1],
      [4, 0],
    ]);
  });
});
