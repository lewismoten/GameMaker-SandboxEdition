// Exercise the command with a blocked hall route and a viewport that would pass its landmark check.
import { afterEach, expect, it, vi } from 'vitest';
import { ORIGIN } from '../../kit/starter/map';

const { walk } = vi.hoisted(() => ({ walk: vi.fn() }));
vi.mock('../../kit/starter/bot', () => ({
  StarterBot: class {
    walk = walk;
    wait = vi.fn();
    px = { x: 0, y: 0 };
  },
}));
vi.mock('./sim', () => ({
  GameSim: class {
    scene = 2;
    game = { scenes: [{}, {}, { files: ['as.pal'] }] };
    files = new Map();
    w = { my: ORIGIN + 6, scroll: { ny: 4, littleShifty: 0 } };
    press = vi.fn();
    release = vi.fn();
    releaseAll = vi.fn();
    tick = vi.fn();
  },
}));
vi.mock('@lewismoten/gamemaker-sandbox-engine/engine/render', () => ({ renderWorld: vi.fn(), VISIBLE_H: 196, VISIBLE_W: 312 }));

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

it.each([
  ['--hall', 'walk stopped', /walk stopped/],
  ['--hall', undefined, /column 6.*0/],
  ['--view', undefined, /no link fired/],
  ['--view', 'link', /scene 3.*scene 2/],
] as const)('rejects an unreached viewpoint (%s, %s)', async (mode, result, diagnostic) => {
  vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'viewShots', mode, '0']);
  walk.mockResolvedValue(result);
  await expect(import('./viewShots')).rejects.toThrow(diagnostic);
});
