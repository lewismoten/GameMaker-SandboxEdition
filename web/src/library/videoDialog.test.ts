// Exercise playback status through the Library dialog's controls and connection events.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, FakeWin } from '../../test/fakeDom';
import { openVideo } from './videoDialog';
afterEach(() => vi.unstubAllGlobals());
it('announces an offline refusal and restores playback status on reconnection', async () => {
  const doc = new FakeDoc(),
    win = new FakeWin(),
    network = { onLine: false };
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', win);
  vi.stubGlobal('navigator', network);
  const closed = openVideo('fixture', 'Video', undefined);
  const dlg = doc.body.children[0],
    [header, screen, note] = dlg.children;
  expect(note.attrs.role).toBe('status');
  expect(note.textContent).toContain('offline');
  const play = screen.children[0];
  play.fire('click');
  expect(note.textContent).toContain('press Play again');
  network.onLine = true;
  win.fire('online', {});
  play.fire('click');
  network.onLine = false;
  win.fire('offline', {});
  play.fire('click');
  expect(note.textContent).toContain('selected time');
  network.onLine = true;
  win.fire('online', {});
  expect(note.textContent).toContain('Playing from YouTube');
  header.children[1].fire('click');
  await closed;
  expect(win.count('online') + win.count('offline')).toBe(0);
});
