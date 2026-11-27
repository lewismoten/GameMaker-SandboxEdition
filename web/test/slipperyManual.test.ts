// Check the wind-column instructions in the Slippery and Bouncy manual.
import { expect, it } from 'vitest';
import manual from '../../games/slippery-and-bouncy/manual.json';

it('uses matching verbs for Kit rising and leaving the wind column', () => {
  const page = manual.pages.find(({ html }) => html.includes('<h1>How level 3 is made</h1>'));
  expect(page?.html).toContain('They speed up as they rise, then leave the top of the column');
});
