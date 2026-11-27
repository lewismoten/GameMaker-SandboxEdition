// Exercise the showcase controls while replacing rendering and the idle scheduler.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { showcase } from './homeShowcase';
import type { HomeNav } from './home';
import { demoInPicture } from './homeCards';
import { deferHomeDemo } from './homeDemoStart';

const controls = new Map<string, EventTarget>();
vi.mock('../core/ui', () => ({
  clear: vi.fn(),
  h: (_tag: string, attrs: { class: string }) => {
    const el = Object.assign(new EventTarget(), {
      dataset: {},
      classList: { toggle: vi.fn() },
      replaceChildren: vi.fn(),
      setAttribute: vi.fn(),
      isConnected: true,
    });
    controls.set(attrs.class, el);
    return el;
  },
}));
vi.mock('./gameHealth', () => ({}));
vi.mock('./homeDemoStart', async (load) => ({
  ...(await load<typeof import('./homeDemoStart')>()),
  deferHomeDemo: vi.fn(() => vi.fn()),
  mayStartHomeDemo: () => true,
}));
vi.mock('./homeCards', () => ({ demoInPicture: vi.fn(() => ({ stop: vi.fn() })), demoDialogButton: () => null, gameActions: () => [] }));
vi.mock('../../walkthrough/button', () => ({ walkthroughButton: () => null }));
vi.mock('../../saves/button', () => ({ savesButton: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('document', { hidden: false });
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function show(hasDemo: () => Promise<boolean>) {
  const panel = showcase({} as HomeNav, () => Promise.resolve());
  panel.show(
    {
      key: 'my:test',
      kind: 'mine',
      title: 'Test game',
      byline: '',
      search: '',
      gam: 'GAME.GAM',
      files: () => Promise.reject(new Error('Unexpected file read')),
      drawShot: () => Promise.resolve(false),
      drawTitle: () => Promise.resolve(true),
      hasDemo,
    },
    {},
  );
}

it('shares a pending Watch demo check and retries on the next click after failure', async () => {
  const hasDemo = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(true);
  show(hasDemo);
  const click = () => controls.get('sc-demo-btn')!.dispatchEvent(new Event('click'));
  click();
  click();
  await vi.advanceTimersByTimeAsync(0);
  expect(hasDemo).toHaveBeenCalledOnce();
  expect(demoInPicture).not.toHaveBeenCalled();
  click();
  await vi.advanceTimersByTimeAsync(0);
  expect(hasDemo).toHaveBeenCalledTimes(2);
  expect(demoInPicture).toHaveBeenCalledOnce();
});

it('reschedules an automatic start when inspection finishes in a hidden tab', async () => {
  let finish!: (available: boolean) => void;
  const hasDemo = vi.fn(() => new Promise<boolean>((resolve) => (finish = resolve)));
  show(hasDemo);
  const scheduled = vi.mocked(deferHomeDemo).mock.calls;
  scheduled[0][3]();
  const page = { hidden: true };
  vi.stubGlobal('document', page);
  finish(true);
  await vi.advanceTimersByTimeAsync(0);
  expect(demoInPicture).not.toHaveBeenCalled();
  expect(scheduled).toHaveLength(2);
  page.hidden = false;
  scheduled[1][3]();
  await vi.advanceTimersByTimeAsync(0);
  expect(hasDemo).toHaveBeenCalledOnce();
  expect(demoInPicture).toHaveBeenCalledOnce();
});
