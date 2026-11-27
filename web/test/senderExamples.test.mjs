// Exercise both published senders with the same reusable popup and deferred file reads.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.useRealTimers());

describe.each(['embed.md', 'examples/send-game.html'])('%s', (path) => {
  const source = readFileSync(new URL('../../docs/' + path, import.meta.url), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];

  function sender() {
    vi.useFakeTimers();
    const listeners = new Set();
    const gm = { postMessage: vi.fn() };
    let click;
    const control = { elements: { in: { value: 'web' }, mode: { value: 'play' } }, addEventListener: (_, fn) => (click = fn) };
    const elements = { send: control, form: control, files: {}, log: {}, site: {} };
    runInNewContext(source, {
      document: { getElementById: (id) => elements[id] },
      window: { open: () => gm },
      location: { origin: 'https://example.org', search: '' },
      URL,
      URLSearchParams,
      setTimeout,
      clearTimeout,
      addEventListener: (_, fn) => listeners.add(fn),
      removeEventListener: (_, fn) => listeners.delete(fn),
    });
    return {
      submit(name, arrayBuffer = () => new ArrayBuffer(1)) {
        elements.files.files = [{ name, arrayBuffer }];
        click({ preventDefault() {} });
      },
      ready: () => Promise.all([...listeners].map((fn) => fn({ source: gm, origin: 'https://lewismoten.github.io', data: { type: 'gm-ready' } }))),
      gm,
      listeners,
      log: elements.log,
    };
  }

  it.each([false, true])('only sends the retry (first ready: %s)', async (alreadyReady) => {
    const s = sender();
    let finish;
    const pending = new Promise((resolve) => (finish = resolve));
    s.submit('first.gam', () => pending);
    const first = alreadyReady && s.ready();
    s.submit('second.gam');
    finish(new ArrayBuffer(1));
    await first;
    await s.ready();
    expect(s.gm.postMessage.mock.calls.map(([msg]) => Object.keys(msg.files))).toEqual([['second.gam']]);
  });

  it('shows when the wait expires and ignores late replies', async () => {
    const s = sender();
    s.submit('first.gam');
    vi.advanceTimersByTime(60000);
    expect(s.log.textContent).toMatch(/timed out/i);
    await s.ready();
    expect(s.listeners.size).toBe(0);
    expect(s.gm.postMessage).not.toHaveBeenCalled();
  });
});
