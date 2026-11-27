// Either road cell should demonstrate the destination change in the editing exercise.
import { expect, it } from 'vitest';
import manual from './manual.json';

it('directs the reader to change both south gate links in Make it yours', () => {
  const exercise = manual.pages.find((page) => page.head === 'Make it yours');
  expect(exercise?.html).toMatch(/change the <b>To<\/b> of both south gate links to the world's first cell/i);
});
