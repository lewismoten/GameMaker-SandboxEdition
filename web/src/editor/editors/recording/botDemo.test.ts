// A demo the bot records replays on the real engine to the same end: the keys taken from the
// walkthrough's run, played back the way the title screen plays a .REC, leave the hero in the
// same place with the same score at the demo's last tick.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../../project/files';
import { parseRecording, RECLEN } from '../../../formats/recording';
import { testGame } from '../../check/testGame';
import { autoWalk } from '../../check/walk/autoWalk';
import { demoKeys, runDemo, walkToDemo } from './botDemo';

// prettier-ignore
const ROWS = [
  '##############################',
  '#............................#',
  '#............................#',
  '#S......c.......^...c.......E#',
  '##############################',
];

describe('a demo the bot plays', () => {
  it('replays on the engine to the same end', async () => {
    const t = testGame(ROWS);
    const r = await autoWalk(t.game, t, 'test');
    expect(r.walk).toBeDefined();
    const files = new GameFiles(t.files);
    const demo = await walkToDemo(files, 'test.gam', r.walk!, 2, 3, false);
    expect(demo.rec).toBeDefined();
    expect(demo.keys).toBeGreaterThan(0);
    expect(demo.sceneAt).toBe(0);
    expect(demo.ticks).toBe(Math.round(3 * 18.2));
    // the title screen's way: the .REC alone, from Play
    const replay = await runDemo(files, 'test.gam', r.walk!, { tick: demo.ticks }, { playback: demo.rec });
    expect(replay.error).toBeUndefined();
    expect(replay.state).toBe(demo.state);
    // the hero went somewhere (it is not just standing at the start both times)
    const still = await runDemo(files, 'test.gam', r.walk!, { tick: demo.ticks }, { playback: new Uint8Array(0) });
    expect(still.state).not.toBe(demo.state);
  }, 60_000);

  it('ends back on the title with Esc', async () => {
    const t = testGame(ROWS);
    const r = await autoWalk(t.game, t, 'test');
    const files = new GameFiles(t.files);
    const demo = await walkToDemo(files, 'test.gam', r.walk!, 2, 2, true);
    const keys = parseRecording(demo.rec!);
    expect(keys.slice(-2).map((k) => k.key)).toEqual([0x01, 0x81]);
    const replay = await runDemo(files, 'test.gam', r.walk!, { tick: demo.ticks + 60 }, { playback: demo.rec });
    expect(replay.ended).toBe(true);
  }, 60_000);
});

describe('the keys of a demo', () => {
  it('counts ticks between keys and lets go of what is held', () => {
    const d = demoKeys(
      [
        { t: 5, key: 0x4d },
        { t: 9, key: 0x39 },
        { t: 12, key: 0xb9 },
        { t: 40, key: 0x4b },
      ],
      20,
      true,
    );
    expect(d.keys).toEqual([
      { delta: 5, key: 0x4d },
      { delta: 4, key: 0x39 },
      { delta: 3, key: 0xb9 },
      { delta: 8, key: 0xcd },
      { delta: 1, key: 0x01 },
      { delta: 2, key: 0x81 },
    ]);
    expect(d.truncated).toBe(false);
  });

  it('lets go of an extended key with its prefix', () => {
    const d = demoKeys(
      [
        { t: 1, key: 0xe0 },
        { t: 1, key: 0x4d },
      ],
      3,
      false,
    );
    expect(d.keys.slice(2)).toEqual([
      { delta: 2, key: 0xe0 },
      { delta: 0, key: 0xcd },
    ]);
  });

  it('keeps within the 1000 key events a recording holds', () => {
    const many = Array.from({ length: 1500 }, (_, i) => ({ t: i, key: i % 2 ? 0xcd : 0x4d }));
    const d = demoKeys(many, 2000, true);
    expect(d.keys.length).toBeLessThanOrEqual(RECLEN);
    expect(d.truncated).toBe(true);
    // every key pressed is let go
    let down = 0;
    for (const k of d.keys)
      if (k.key === 0x4d) down++;
      else if (k.key === 0xcd) down--;
    expect(down).toBe(0);
  });
});
