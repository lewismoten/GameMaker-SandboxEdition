// Exercise budget collection with a missing map tab and an otherwise idle page.
import { expect, it, vi } from 'vitest';

vi.mock('./perfLib', () => {
  const tab = {
    allTextContents: () => ['Map'],
    first: () => tab,
    waitFor: vi.fn().mockResolvedValueOnce(undefined).mockRejectedValue(new Error('missing button')),
  };
  const page = {
    addInitScript: vi.fn(),
    goto: vi.fn().mockResolvedValue(undefined),
    waitForTimeout: vi.fn(),
    evaluate: () => ({ inp: 0, long: [] }),
    locator: () => tab,
  };
  const context = { newPage: () => page, newCDPSession: () => ({ send: () => ({ metrics: [] }) }) };
  return {
    arg: (name: string) => (name === 'budget' ? '1' : undefined),
    target: () => ({ base: '', stop: vi.fn() }),
    launch: () => ({ newContext: () => context, close: vi.fn() }),
    applySlowdown: vi.fn(),
    OBSERVE: '',
  };
});

it('fails a budget trace when the measured map tab is missing', async () => {
  await expect(import('./perfTasks')).rejects.toThrow('editor map: tab Map: missing button');
});
