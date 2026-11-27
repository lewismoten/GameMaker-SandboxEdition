// Both DOS lessons explain how many keys the two-key door spends.
import { expect, it } from 'vitest';
import { HOWTO, WON } from '../../games/keys-and-doors/src/text';

it.each([
  ['how-to', HOWTO],
  ['winning lesson', WON],
])('%s explains that the two-key door takes both keys', (_, page) => {
  expect(page.replace(/\s+/g, ' ')).toMatch(/takes both keys/i);
});
