// Download cards always link to the images emitted by the build.
import { expectTypeOf, test } from 'vitest';
import type { CdCatalogEntry } from './cdGames';
import type { cardPictures } from './downloadsList';

test('card pictures take only the catalog and CD root', () => {
  expectTypeOf<typeof cardPictures>().parameters.toEqualTypeOf<[CdCatalogEntry[], string]>();
});
