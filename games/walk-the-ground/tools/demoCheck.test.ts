// Replay the title demo through the first door, releasing Right as Kit enters scene 3.
import { expect, it, vi } from 'vitest';
import { serializeRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { decodeKeys } from '../../../web/src/walkthrough/format';
import walk from '../walkthrough.json';

vi.mock('node:fs', async (load) => {
  const fs = await load<typeof import('node:fs')>();
  return {
    ...fs,
    readFileSync(...args: Parameters<typeof fs.readFileSync>) {
      const [path] = args;
      if (path instanceof URL && path.pathname.endsWith('/disk/demo.rec')) {
        return serializeRecording([...decodeKeys(walk.segments[0].keys), { delta: 1, key: 205 }, { delta: 1, key: 1 }, { delta: 2, key: 129 }]);
      }
      return fs.readFileSync(...args);
    },
  };
});

// This check reads Kit's position. Skip painting the pixels on the headless screen.
vi.mock('@lewismoten/gamemaker-sandbox-engine/engine/render', async (load) => ({
  ...(await load<typeof import('@lewismoten/gamemaker-sandbox-engine/engine/render')>()),
  renderWorld() {},
}));

it('rejects a recording cut at the transition to the trapdoor level', async () => {
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('demo rejected');
  });
  const log = vi.spyOn(console, 'log');
  const error = vi.spyOn(console, 'error');
  try {
    await expect(import('./demoCheck')).rejects.toThrow('demo rejected');
    expect(log).toHaveBeenCalledWith('demo: scenes entered 2 3; 0 keys unplayed');
    expect(error).toHaveBeenCalledWith('demoCheck: Kit never reached the tunnel floor inside the trapdoor shaft');
    expect(exit).toHaveBeenCalledWith(1);
  } finally {
    vi.restoreAllMocks();
  }
});
