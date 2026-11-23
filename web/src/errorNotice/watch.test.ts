// Which failures raise the generic error box: a part of the site that failed to load is left to
// the load-failure notice (offline/loadFailure.ts), and every other error still shows the box.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const showError = vi.fn();
vi.mock('./notice', () => ({ showError }));

let win: EventTarget;

beforeEach(() => {
  vi.resetModules();
  showError.mockClear();
  win = new EventTarget();
  vi.stubGlobal('window', win);
  vi.stubGlobal('addEventListener', win.addEventListener.bind(win));
  vi.stubGlobal('navigator', { onLine: true });
});

afterEach(() => vi.unstubAllGlobals());

/** Both watchers as an entry point starts them (registerServiceWorker() sets up the first). */
async function start() {
  const shown: string[] = [];
  (await import('../offline/loadFailure')).watchLoadFailures((text) => shown.push(text));
  (await import('./watch')).watchErrors();
  return shown;
}

/** What Vite's preload helper does when a chunk fails: the event, then the same error rethrown. */
function failChunk(err: unknown) {
  win.dispatchEvent(Object.assign(new Event('vite:preloadError', { cancelable: true }), { payload: err }));
  win.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: err }));
}

/** Lets the watcher's dynamic import of the notice settle. */
const settle = () => new Promise((r) => setTimeout(r, 0));

it('leaves a chunk replaced by a deploy to the Reload notice', async () => {
  const shown = await start();
  failChunk(new TypeError('Failed to fetch dynamically imported module: https://x.test/assets/creditsPage-DIAjGxZi.js'));
  await settle();
  expect(shown).toEqual(['Part of the page could not be loaded. Reload to try again.']);
  expect(showError).not.toHaveBeenCalled();
});

it('leaves a part missing from the offline copy to the offline notice', async () => {
  vi.stubGlobal('navigator', { onLine: false });
  const shown = await start();
  failChunk(new Error('Unable to preload CSS for /assets/desk-abc.css'));
  await settle();
  expect(shown[0]).toMatch(/^Not in your offline copy\./);
  expect(showError).not.toHaveBeenCalled();
});

it('still shows the box for an ordinary runtime error', async () => {
  await start();
  win.dispatchEvent(
    Object.assign(new Event('error'), {
      message: 'x is undefined',
      error: new TypeError('x is undefined'),
      filename: 'https://x.test/assets/main.js',
      lineno: 1,
      colno: 2,
    }),
  );
  await settle();
  expect(showError).toHaveBeenCalledWith({ message: 'x is undefined', at: 'main.js:1:2' });
});

it('still shows the box for a rejection that is not the reported load failure', async () => {
  const shown = await start();
  failChunk(new TypeError('Failed to fetch dynamically imported module: https://x.test/assets/a.js'));
  // the same words, but not the error Vite reported: not covered by the load-failure notice
  win.dispatchEvent(
    Object.assign(new Event('unhandledrejection'), { reason: new TypeError('Failed to fetch dynamically imported module: https://x.test/assets/a.js') }),
  );
  // what code after a failed import might throw next
  win.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: new TypeError("Cannot destructure property 'open' of undefined") }));
  await settle();
  expect(shown).toHaveLength(1);
  expect(showError.mock.calls.map(([info]) => (info as { message: string }).message)).toEqual([
    'Failed to fetch dynamically imported module: https://x.test/assets/a.js',
    "Cannot destructure property 'open' of undefined",
  ]);
});

it('still shows the box when a part fails without the load-failure event (the dev server)', async () => {
  await start();
  win.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: new TypeError('Failed to fetch dynamically imported module: /src/x.ts') }));
  await settle();
  expect(showError).toHaveBeenCalledOnce();
});
