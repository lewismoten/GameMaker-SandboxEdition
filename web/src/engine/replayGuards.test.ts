// Replay guards in runGame (engine/game.ts): while a demo plays back (rec.playing), the engine never
// tells the host about touches (tin hearts) or the end of play (scores, plays, achievements).
// A live player's run is the control: the same game and the same coin do fire both.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameFiles } from '../project/files';
import { testGame } from '../editor/check/testGame';
import { serializeRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { headlessCanvas, WalkAudio } from '../walkthrough/runtime';
import { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { simKeyPress } from '@lewismoten/gamemaker-sandbox-engine/engine/keys';
import { runGame, type RunOptions } from '@lewismoten/gamemaker-sandbox-engine/engine/game';

// prettier-ignore
const ROWS = [
  '##############################',
  '#............................#',
  '#.Sc..........................E#',
  '##############################',
];

beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
afterEach(() => vi.useRealTimers());

class TestMachine extends Machine {
  time = 0;
  override now(): number {
    return this.time;
  }
}

/** Right arrow held across the coin, then Esc: the demo quits play. */
const DEMO = serializeRecording([
  { delta: 10, key: 0x4d },
  { delta: 30, key: 0xcd },
  { delta: 10, key: 0x01 },
  { delta: 1, key: 0x81 },
]);

async function play(opts: RunOptions, live = false, total = 900) {
  const t = testGame(ROWS);
  const m = new TestMachine(headlessCanvas(), new GameFiles(t.files), new WalkAudio(), { frames: 'manual', input: false });
  let frames = 0;
  const touched: unknown[][] = [];
  const ends: unknown[][] = [];
  let playing: boolean | undefined;
  const ended = runGame(m, 'test.gam', {
    ...opts,
    onFrame: (w) => {
      if (!live) return;
      frames++;
      if (frames === 5) simKeyPress(w, 0x4d); // right arrow, into the coin
      if (frames === 20) simKeyPress(w, 0xcd);
      if (frames === 60) simKeyPress(w, 0x01); // Esc
    },
    onTouched: (...a) => touched.push(a),
    onPlayEnd: (...a) => ends.push(a),
    onSession: (s) => {
      const was = s.onScene;
      s.onScene = (n) => {
        playing ??= s.rec.playing;
        was?.(n);
      };
    },
  }).catch(() => undefined);
  for (let frame = 0; frame < total; frame++) {
    m.time += 1000 / 60;
    m.presentFrame(false);
    await vi.advanceTimersByTimeAsync(1000 / 60);
  }
  m.destroy();
  await ended;
  return { touched, ends, playing };
}

describe('replay guards in runGame', () => {
  it('control: a live player touching a coin and quitting is reported', async () => {
    const r = await play({ record: true }, true);
    expect(r.playing).toBe(false);
    expect(r.touched.length).toBeGreaterThan(0);
    expect(r.ends.length).toBe(1);
  });

  it('a demo playback never reports a touch', async () => {
    const r = await play({ playback: DEMO });
    expect(r.playing).toBe(true);
    expect(r.touched).toEqual([]);
  });

  it('a demo playback never reports the end of play', async () => {
    const r = await play({ playback: DEMO });
    expect(r.playing).toBe(true);
    expect(r.ends).toEqual([]);
  });
});
