// Every price charged by a Starter stall must fit its one-digit price card.
import { expect, it } from 'vitest';
import { Book } from './book';
import { buildStarterPalette } from './palette';
import { addAwning, addStall } from './shop';

it.each([10, -1, 2.5])('rejects price %s before adding any shop blocks', (price) => {
  const pal = buildStarterPalette();
  const book = new Book('bbl');
  expect(() => addAwning(book, pal, price)).toThrow(RangeError);
  expect(() => addStall(book, pal, 'key', price)).toThrow(RangeError);
  expect(book.index.size).toBe(0);
});
