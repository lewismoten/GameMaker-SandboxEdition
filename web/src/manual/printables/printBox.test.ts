// Observe the title at the point the browser receives each print request.
import { afterEach, expect, it, vi } from 'vitest';
import { titleAfterPrint } from '../printTitle';
import { printBox } from './printBox';

afterEach(() => {
  titleAfterPrint();
  vi.unstubAllGlobals();
});

it('prints consecutive pieces from one box with their own titles', () => {
  const titles: string[] = [];
  vi.stubGlobal('document', { title: 'The desk' });
  vi.stubGlobal('window', { print: () => titles.push(document.title) });
  const manual = 'Game manual';
  const card = { title: 'Key card' };
  const booklet = { title: 'Hint book', pages: async () => [] };
  for (const item of [card, booklet]) {
    printBox('item', manual, item);
    titleAfterPrint();
  }
  printBox('booklet', manual, booklet);
  printBox('booklet', manual, card);
  printBox('all', manual, booklet);
  expect(titles).toEqual(['Key card', 'Hint book', 'Hint book', manual, manual]);
});
