// Checks the first differing page in the host comparison's diagnostic.
import { expect, it } from 'vitest';
import { cardDifference } from './pocketCardDifference';

it.each<[string[], string[], string]>([
  [['same'], ['same', 'missing'], '<end of list> | missing'],
  [['same', 'extra'], ['same'], 'extra | <end of list>'],
  [['a'], ['b'], 'a | b'],
])('reports the first difference', (actual, expected, difference) => {
  expect(cardDifference(actual, expected)).toBe(difference);
});
