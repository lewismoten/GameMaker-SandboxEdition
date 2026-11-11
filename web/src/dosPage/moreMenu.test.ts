// Choosing an item in the DOS page's ⋯ menu closes it and puts focus back on the ⋯ button,
// so a dialog the item opens returns there rather than to a removed item.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, FakeEl, FakeWin } from '../../test/fakeDom';
import { moreMenu } from './moreMenu';

afterEach(() => vi.unstubAllGlobals());

it('focuses the summary before an item runs, and on Escape', () => {
  const doc = Object.assign(new FakeDoc(), { addEventListener: () => {} });
  vi.stubGlobal('document', doc);
  vi.stubGlobal('addEventListener', () => {});
  vi.stubGlobal('window', new FakeWin());
  const item = doc.createElement('button');
  const menu = moreMenu('More', [item as unknown as HTMLElement]) as unknown as FakeEl;
  const [summary, panel] = menu.children;
  menu.open = true;
  doc.activeElement = item;
  panel.fire('click', { target: item });
  expect(menu.open).toBe(false);
  expect(doc.activeElement).toBe(summary);
  menu.open = true;
  doc.activeElement = item;
  menu.fire('keydown', { key: 'Escape' });
  expect(menu.open).toBe(false);
  expect(doc.activeElement).toBe(summary);
});
