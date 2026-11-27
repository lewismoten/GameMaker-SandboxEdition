// Exercise the capture command with a separate storage map for each browser profile.
import { basename } from 'node:path';
import { expect, it, vi } from 'vitest';

const shots = vi.hoisted(() => new Map<string, number>());
vi.mock('./forceTheme', () => ({ forceTheme: vi.fn(), assertTheme: vi.fn() }));
vi.mock('./perfLib', () => ({
  arg: (key: string) => (key === 'out' ? '.' : undefined),
  launch: () => ({
    close: vi.fn(),
    newContext: () => {
      const storage = new Map<string, string>();
      function capture({ path }: { path: string }) {
        shots.set(basename(path), Object.keys(JSON.parse(storage.get('gm-eggs') ?? '{}') as Record<string, string>).length);
      }
      const el = { count: () => 1, boundingBox: () => ({ x: 0, y: 0, width: 20, height: 20 }), screenshot: capture };
      return {
        addInitScript: (run: (arg: unknown) => void, arg: unknown) => {
          vi.stubGlobal('localStorage', { setItem: storage.set.bind(storage) });
          try {
            run(arg);
          } finally {
            vi.unstubAllGlobals();
          }
        },
        newPage: () => ({
          route: vi.fn(),
          goto: vi.fn(),
          evaluate: () => [],
          close: vi.fn(),
          waitForTimeout: vi.fn(),
          waitForSelector: vi.fn(),
          screenshot: capture,
          locator: () => ({ first: () => el, ...el }),
        }),
        close: vi.fn(),
      };
    },
  }),
}));

it('populates the eggs only for the isolated perch close-up', async () => {
  await import('./deskDastShots');
  for (const size of ['wide', 'phone']) {
    expect(shots.get(`room-dark-${size}.png`)).toBe(0);
    expect(shots.get(`close-dark-${size}-gameshelf.png`)).toBe(0);
    expect(shots.get(`close-dark-${size}-eggperch.png`)).toBe(14);
  }
});
