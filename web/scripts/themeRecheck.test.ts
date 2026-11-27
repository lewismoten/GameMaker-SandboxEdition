// Exercise the audit verdict with a clean axe result on the wrong screen.
import { afterEach, expect, it, vi } from 'vitest';

const { options, click, destination, measure } = vi.hoisted(() => ({
  options: { only: 'recording-keys', themes: 'light', widths: '390', out: '../.tmp/theme-test' },
  click: vi.fn(),
  destination: vi.fn(),
  measure: vi.fn(),
}));
vi.mock('./forceTheme', () => ({ forceTheme: vi.fn(), assertTheme: vi.fn() }));
vi.mock('./perfLib', () => {
  const page = {
    goto: vi.fn(),
    waitForLoadState: async () => undefined,
    waitForTimeout: vi.fn(),
    click,
    locator: () => ({ first: () => ({ evaluate: click }) }),
    waitForSelector: destination,
    evaluate: measure,
    addScriptTag: vi.fn(),
    screenshot: vi.fn(),
    close: vi.fn(),
  };
  const ctx = { addInitScript: vi.fn(), newPage: () => page, close: vi.fn() };
  return {
    arg: (name: keyof typeof options) => options[name],
    target: () => ({ base: '', stop: vi.fn() }),
    launch: () => ({ newContext: () => ctx, close: vi.fn() }),
  };
});

const originalExit = process.exitCode;
afterEach(() => {
  options.only = 'recording-keys';
  options.widths = '390';
  process.exitCode = originalExit;
  vi.resetModules();
  vi.resetAllMocks();
});

it.each(['missing click', 'collapsed disclosure'])('fails before measuring a recording with a %s', async (failure) => {
  if (failure === 'missing click') click.mockRejectedValue(new Error('missing click'));
  else {
    click.mockResolvedValue(undefined);
    destination.mockRejectedValue(new Error('collapsed disclosure'));
  }
  measure.mockResolvedValueOnce(0).mockResolvedValueOnce([]);
  await import('./themeRecheck');
  expect(process.exitCode).toBe(1);
  expect(measure).not.toHaveBeenCalled();
  if (failure === 'collapsed disclosure')
    expect(destination).toHaveBeenCalledWith(expect.stringContaining('.rec-raw[open]'), expect.objectContaining({ state: 'visible' }));
});

it('measures an opened recording and accepts a clean result', async () => {
  click.mockResolvedValue(undefined);
  destination.mockResolvedValue(undefined);
  measure.mockResolvedValueOnce(0).mockResolvedValueOnce([]);
  await import('./themeRecheck');
  expect(measure).toHaveBeenCalledTimes(2);
  expect(process.exitCode).toBe(originalExit);
});

it.each([
  ['privacy,typo', '390', /unknown.*typo/i],
  ['typo', '390', /unknown.*typo/i],
  ['assets-compact', '390', /no.*cases/i],
])('rejects --only %s at width %s', async (only, widths, message) => {
  options.only = only;
  options.widths = widths;
  await expect(import('./themeRecheck')).rejects.toThrow(message);
});
