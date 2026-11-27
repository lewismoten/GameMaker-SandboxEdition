// PLAYGAME checks Escape again after the exit fade to choose between restarting and quitting.
import { expect, it, vi } from 'vitest';
import { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { Recorder } from '@lewismoten/gamemaker-sandbox-engine/engine/recorder';
import { playScene, type Session } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { newCharInfo } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { MAXSCENELINKS } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { testGame } from '../editor/check/testGame';
import { GameFiles } from '../project/files';
import { headlessCanvas, WalkAudio } from '../walkthrough/runtime';

it.each([
  { escape: 'released during', held: false, link: MAXSCENELINKS },
  { escape: 'held through', held: true, link: MAXSCENELINKS + 1 },
])('returns link $link when Escape is $escape the exit fade', async ({ held, link }) => {
  const { game, files } = testGame(['##########', '#S......E#', '##########']);
  const m = new Machine(headlessCanvas(), new GameFiles(files), new WalkAudio(), { frames: 'manual', input: false });
  const exitFade = vi.spyOn(m, 'fadeAllTo');
  let time = 0;
  let sawExitFade = false;
  vi.spyOn(m, 'now').mockImplementation(() => time);
  vi.spyOn(m, 'frame').mockImplementation(async () => {
    time += 100;
    if (time > 5000) throw new Error('Scene did not finish');
    if (exitFade.mock.calls.length && !sawExitFade) {
      sawExitFade = true;
      const keys = s.lastWorld!.keydn;
      expect(keys[1]).toBe(1);
      if (!held) keys[1] = 0;
    }
  });
  const s: Session = {
    m,
    game,
    gameName: 'test',
    ci: newCharInfo(),
    colors: new Uint8Array(768),
    rec: new Recorder(),
    sndClock: 1,
    timerCounter: 1,
    soundOn: true,
    musicOn: false,
    speakerOnly: false,
    speed: {},
    onFrame: (world) => {
      world.keydn[1] = 1;
    },
  };
  try {
    const result = await playScene(s, 2, 0, 0);
    expect(sawExitFade).toBe(true);
    expect(result).toMatchObject({ ok: true, link });
  } finally {
    m.destroy();
  }
});
