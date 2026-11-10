// The disk list yields Escape to a nested layer and releases its capture handler on close.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, FakeEl, FakeWin } from '../../test/fakeDom';

vi.mock('../retro/dos/disks', () => ({ loadDisks: async () => [] }));
import { diskMenu } from './diskMenu';

afterEach(() => vi.unstubAllGlobals());

it('closes on its own Escape only, then frees the key listener and refocuses its button', async () => {
  const doc = new FakeDoc();
  const win = new FakeWin();
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', win);
  const host = { pc: () => undefined, on: async () => undefined, atPrompt: async () => undefined, command: async () => {}, say: () => {} };
  const menu = diskMenu(host);
  doc.body.append(menu.button as unknown as FakeEl);
  const dialog = doc.body.children.find((c) => c.tag === 'dialog')!;
  (menu.button as unknown as { fire(t: string): void }).fire('click');
  await vi.waitFor(() => expect(dialog.open).toBe(true));
  expect(win.count('keydown')).toBe(1);
  const nested = doc.createElement('dialog');
  win.fire('keydown', { key: 'Escape', target: { closest: () => nested }, preventDefault() {}, stopImmediatePropagation() {} });
  expect(dialog.open).toBe(true);
  win.fire('keydown', { key: 'Escape', target: { closest: () => dialog }, preventDefault() {}, stopImmediatePropagation() {} });
  expect(dialog.open).toBe(false);
  expect(win.count('keydown')).toBe(0);
  expect(doc.activeElement).toBe(menu.button);
});
