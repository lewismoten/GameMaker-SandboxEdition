// Complete recordings can keep moving toward an exit long after their last key event.
import { expect, it } from 'vitest';
import { GameFiles } from '../../../project/files';
import { encodeKeys, WALKTHROUGH_FPS, type Walkthrough } from '../../../walkthrough/format';
import { RIGHT, testGame } from '../testGame';
import { SceneSim, startCharInfo, TICKS_PER_SECOND } from '../sim';
import { verifyWalk } from './verify';

it.each([false, true])('waits for a complete held-key route while bounding partial playback (partial: %s)', async (partial) => {
  const t = testGame([
    '#'.repeat(50),
    '#' + '.'.repeat(48) + '#',
    '#' + '.'.repeat(48) + '#',
    '#S' + '.'.repeat(37) + 'E' + '.'.repeat(9) + '#',
    '#'.repeat(50),
  ]);
  const oracle = new SceneSim(t.game, 2, t, { x: 1, y: 3 }, startCharInfo(), 1);
  oracle.hold([RIGHT]);
  let exit: number | undefined;
  let ticks = 0;
  for (; ticks < 600; ticks++) {
    const end = await oracle.tick();
    expect(end).not.toBe('dead');
    if (end && typeof end === 'object') {
      exit = end.link;
      break;
    }
  }
  expect(exit).toBe(0);
  expect(ticks + 1).toBeGreaterThan(5 * TICKS_PER_SECOND);
  const walk: Walkthrough = {
    version: 1,
    game: 'test',
    rand: { seed: 1, per: 'scene' },
    bot: true,
    partial,
    segments: [{ scene: 2, keys: encodeKeys([{ delta: 1, key: RIGHT }]), ...(partial ? { incomplete: 'stopped' } : {}) }],
    chapters: [],
    timeline: { fps: WALKTHROUGH_FPS, frames: 0, chapters: [] },
  };
  const result = await verifyWalk(new GameFiles(t.files), 'test.gam', walk, { maxMinutes: 2 });
  expect(result.error).toBeUndefined();
  expect(result.keysLeft).toBe(0);
  expect(result.won).toBe(!partial);
  if (partial) expect(result.frames).toBeLessThan(12 * WALKTHROUGH_FPS);
  else expect(result.frames).toBeGreaterThan(5 * WALKTHROUGH_FPS);
});
