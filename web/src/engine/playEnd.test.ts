// The engine's end-of-play listener (Session.onPlayEnd, for the desk's score trophies): it hears
// the final score as play ends, and never during a demo's or walkthrough's playback.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../project/files';
import { testGame } from '../editor/check/testGame';
import { autoWalk } from '../editor/check/walk/autoWalk';
import { headlessCanvas, WalkRun } from '../walkthrough/runtime';

// prettier-ignore
const ROWS = [
  '##############################',
  '#............................#',
  '#S......c.......c...........E#',
  '##############################',
];

/** Plays the bot's walkthrough of the test game; `real` makes play look like a player's at the end. */
async function playThrough(real: boolean): Promise<{ ends: [number, string, number][]; score: number; won: boolean }> {
  const t = testGame(ROWS);
  const r = await autoWalk(t.game, t, 'test');
  const run = new WalkRun(headlessCanvas(), new GameFiles(t.files), 'test.gam', { ...r.walk!, story: false });
  await run.start();
  const s = run.session!;
  const ends: [number, string, number][] = [];
  s.onPlayEnd = (score, how, gained) => ends.push([score, how, gained]);
  let won = false;
  const onScene = s.onScene!;
  s.onScene = (n) => {
    // a walkthrough plays back like a demo; from the won scene on, `real` says it is not
    if (n === 1) {
      won = true;
      if (real) Object.defineProperty(s.rec, 'playing', { get: () => false });
    }
    onScene(n);
  };
  // (a real player's end goes on to the high score table, waiting for a name: stop there)
  while (run.frame < 20 * 60 * 60 && !ends.length && (await run.step(false)));
  run.stop();
  return { ends, score: s.ci.score, won };
}

describe('the end of play', () => {
  it('is told the final score and how play ended', async () => {
    const p = await playThrough(true);
    expect(p.won).toBe(true);
    expect(p.score).toBeGreaterThan(0);
    expect(p.ends).toEqual([[p.score, 'won', p.score]]); // nothing loaded: all its own
  }, 60_000);

  it('is never told during playback', async () => {
    const p = await playThrough(false);
    expect(p.won).toBe(true);
    expect(p.ends).toEqual([]);
  }, 60_000);
});
