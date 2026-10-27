// RunOptions.skipTitle, the editor's Play Level test: play starts at once in the level the test
// copy's start link leads to, at its spot, with a new game's character; without it the title and
// menu come first, as in PLAYGAME.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../project/files';
import { testGame } from '../editor/check/testGame';
import { startingAtSpot } from '../editor/editors/integrator/startAt';
import { parseCharacter, serializeCharacter } from '../formats/character';
import { serializeGame } from '../formats/game';
import { headlessCanvas, WalkAudio } from '../walkthrough/runtime';
import { Machine } from './machine';
import { runGame, type RunOptions } from './game';
import type { World } from './world';

// prettier-ignore
const ROWS = [
  '##############################',
  '#............................#',
  '#S...........................#',
  '##############################',
];

/** A machine on a clock of the test's own, stepped a frame at a time. */
class TestMachine extends Machine {
  time = 0;
  override now(): number {
    return this.time;
  }
}

/** Runs the test game (started at `spot` in its level) for `frames` frames; what it showed. */
async function run(opts: RunOptions, frames = 120) {
  const t = testGame(ROWS);
  // a character whose starting values differ from the defaults
  const chr = parseCharacter(t.files.get('test.chr')!);
  chr.meter[0] = 37;
  chr.meter[1] = 5;
  chr.inv[0] = 2;
  t.files.set('test.chr', serializeCharacter(chr));
  t.files.set('test.gam', serializeGame(startingAtSpot(t.game, 2, { x: 9, y: 2 })));
  const m = new TestMachine(headlessCanvas(), new GameFiles(t.files), new WalkAudio(), { frames: 'manual', input: false });
  const scenes: number[] = [];
  let first: { frame: number; x: number; y: number; hitpts: number; lives: number; inv: number[] } | undefined;
  let frame = 0;
  const onFrame = (w: World) => {
    first ??= { frame, x: w.chr.x[0], y: w.chr.y[0], hitpts: w.ci.hitpts, lives: w.ci.lives, inv: [...w.ci.inv] };
  };
  const ended = runGame(m, 'test.gam', { ...opts, onFrame, onSession: (s) => (s.onScene = (n) => scenes.push(n)) }).catch(() => undefined);
  for (; frame < frames; frame++) {
    m.time += 1000 / 60;
    m.presentFrame(false);
    await new Promise((r) => setTimeout(r, 0));
  }
  m.destroy();
  await ended;
  return { scenes, first, chr };
}

describe('skipTitle', () => {
  it('starts play in the level at the spot, with a new game character', async () => {
    const r = await run({ skipTitle: true });
    expect(r.scenes[0]).toBe(2);
    expect(r.first).toBeDefined();
    expect(r.first!.x).toBe(9);
    expect(r.first!.y).toBe(2);
    expect(r.first!.hitpts).toBe(37);
    expect(r.first!.lives).toBe(5);
    expect(r.first!.inv).toEqual([...r.chr.inv]);
  });

  it('leaves a normal run on the title and menu', async () => {
    const r = await run({});
    expect(r.scenes).toEqual([]);
    expect(r.first).toBeUndefined();
  });
});
