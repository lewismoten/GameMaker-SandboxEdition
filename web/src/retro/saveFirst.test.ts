// The save question returns the keyboard to the opener and lets go of its window listener.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, FakeEl, FakeWin } from '../../test/fakeDom';
import { askSaveFirst } from './saveFirst';

afterEach(() => vi.unstubAllGlobals());

it('Escape answers null, focuses the opener and removes its key listener', async () => {
  const doc = new FakeDoc();
  const win = new FakeWin();
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', win);
  vi.stubGlobal('HTMLElement', FakeEl);
  const opener = doc.createElement('button');
  opener.isConnected = true;
  doc.activeElement = opener;
  const other = doc.createElement('div');
  const d = { title: 'map', work: { curfile: 'TEST.MAP', folder: { drive: 'C', parts: ['GM'] } }, contents: () => [{ ext: 'map' }] };
  const p = askSaveFirst(d as unknown as Parameters<typeof askSaveFirst>[0]);
  other.focus();
  expect(win.count('keydown')).toBe(1);
  win.fire('keydown', { key: 'Escape', target: other, stopImmediatePropagation() {}, preventDefault() {} });
  expect(await p).toBeNull();
  expect(doc.activeElement).toBe(opener);
  expect(win.count('keydown')).toBe(0);
});
