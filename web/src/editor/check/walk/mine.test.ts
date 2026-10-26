// The author's own play of a scene in the walkthrough: a take is cut from the keys the game
// applied (from the scene's last entry, a key pressed twice kept once), plays in place of the
// bot's keys when it still reaches an exit, and the bot plays the scene when it doesn't.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../../project/files';
import { decodeKeys } from '../../../walkthrough/format';
import { RIGHT, testGame } from '../testGame';
import { autoWalk } from './autoWalk';
import { SceneTakes, TakeRecorder, takeOf } from './takes';
import { verifyWalk } from './verify';

// prettier-ignore
const ROWS = [
  '##############',
  '#............#',
  '#............#',
  '#S.......^..E#',
  '##############',
];

describe('a take of a scene', () => {
  it('counts ticks from the entry and leaves out repeats', () => {
    const t = takeOf(
      2,
      3,
      [
        { tick: 105, key: RIGHT },
        { tick: 106, key: RIGHT },
        { tick: 110, key: RIGHT | 0x80 },
        { tick: 111, key: RIGHT | 0x80 },
      ],
      100,
    );
    expect(t).toMatchObject({ scene: 2, next: 3, ticks: 10 });
    expect(decodeKeys(t.keys)).toEqual([
      { delta: 5, key: RIGHT },
      { delta: 5, key: RIGHT | 0x80 },
    ]);
  });

  it('is the last try: a death starts it over, leaving the scene ends it', () => {
    const rec = new TakeRecorder();
    rec.initRecord();
    const takes = new SceneTakes(2, rec);
    const tick = (n: number) => {
      for (let i = 0; i < n; i++) rec.doPlayback();
    };
    expect(takes.enter(2)).toBeUndefined();
    tick(3);
    rec.doRecord(RIGHT);
    tick(5);
    expect(takes.enter(2)).toBeUndefined(); // died: in again
    tick(2);
    rec.doRecord(RIGHT);
    tick(4);
    const take = takes.enter(3)!;
    expect(take.next).toBe(3);
    expect(decodeKeys(take.keys)).toEqual([{ delta: 2, key: RIGHT }]);
  });
});

describe('my play in the walkthrough', () => {
  it('plays my keys in place of the bot’s, and the engine agrees', async () => {
    const t = testGame(ROWS);
    const bot = await autoWalk(t.game, t, 'test');
    const keys = bot.walk!.segments[0].keys;
    const r = await autoWalk(t.game, t, 'test', { mine: { 2: keys } });
    expect(r.scenes[0]).toMatchObject({ scene: 2, strategy: 'mine', mine: 'used', tried: [] });
    expect(r.walk!.segments[0].keys).toBe(keys);
    const v = await verifyWalk(new GameFiles(t.files), 'test.gam', r.walk!, { maxMinutes: 2 });
    expect(v.won).toBe(true);
  }, 30_000);

  it('lets the bot play a scene my play no longer gets through', async () => {
    const t = testGame(ROWS);
    // standing still: no exit is reached
    const r = await autoWalk(t.game, t, 'test', { mine: { 2: '' } });
    expect(r.scenes[0].mine).toBe('broke');
    expect(r.scenes[0].strategy).toBe('runner');
    expect(r.won).toBe(true);
  }, 30_000);
});
