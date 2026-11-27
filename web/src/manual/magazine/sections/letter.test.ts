// The editor's letter describes the passengers shown in its car illustration.
import { expect, it } from 'vitest';
import { magContext } from '../games';
import { LETTER } from './letter';

it('describes Teddy at the passenger window in THE CHEZ illustration', async () => {
  const [page] = await LETTER.pages(magContext([]));
  const pictures = page.blocks.flatMap((block) => (block.t === 'grid' ? block.cells.flat() : [block]));
  const car = pictures.find((block) => block.t === 'art' && block.art === 'chez');
  expect(car).toMatchObject({ alt: expect.stringMatching(/Teddy.*passenger window/i) });
});
