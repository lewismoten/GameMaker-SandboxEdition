// Escape ends play immediately. The key state after the exit fade selects restart or quit.
import { expect, it, vi } from 'vitest';
import { Machine } from '@lewismoten/gamemaker-sandbox-engine/engine/machine';
import { Recorder } from '@lewismoten/gamemaker-sandbox-engine/engine/recorder';
import { playScene } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { newCharInfo } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { MAXSCENELINKS } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { testGame } from '../editor/check/testGame';
import { GameFiles } from '../project/files';
import { WalkAudio, headlessCanvas } from '../walkthrough/runtime';

it.each([
  { release: true, link: MAXSCENELINKS },
  { release: false, link: MAXSCENELINKS + 1 },
])('checks Escape after the scene fade (release = $release)', async ({ release, link }) => {
  const t = testGame(['##########', '#S......E#', '##########']);
  const m = new Machine(headlessCanvas(), new GameFiles(t.files), new WalkAudio(), { frames: 'manual', input: false });
  let time = 0;
  vi.spyOn(m, 'now').mockImplementation(() => time);
  const frame = m.frame.bind(m);
  vi.spyOn(m, 'frame').mockImplementation(() => {
    if (time > 10000) throw new Error('Scene did not finish within ten seconds of simulated time');
    const waiting = frame();
    queueMicrotask(() => {
      time += 1000 / 60;
      m.presentFrame(false);
    });
    return waiting;
  });
  const fade = m.fadeAllTo.bind(m);
  vi.spyOn(m, 'fadeAllTo').mockImplementation((...args) => {
    const fading = fade(...args);
    if (release) m.keyboard.inject(1, false);
    return fading;
  });
  try {
    const result = await playScene(
      {
        m,
        game: t.game,
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
        onFrame: () => m.keyboard.inject(1, true),
      },
      2,
      0,
      0,
    );
    expect(result.link).toBe(link);
  } finally {
    m.destroy();
  }
});
