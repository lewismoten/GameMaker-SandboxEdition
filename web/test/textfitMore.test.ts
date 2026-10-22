// Every text PLAYGAME draws over these Sandbox games' pictures lands on plain paper and reads
// (games/kit/textfit.ts), as in textfit.test.ts for the others.
import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { checkTextScreen, readDisk, textScreens } from '../../games/kit/textfit';

const GAMES = ['year2000', 'brief', 'teddy2', 'depth', 'realm'];

describe('text fit', () => {
  for (const id of GAMES)
    it(`${id}: no text over art`, () => {
      const screens = textScreens(readDisk(join(__dirname, '..', '..', 'games', id, 'disk')));
      expect(screens.length).toBeGreaterThan(5);
      expect(screens.flatMap((s) => checkTextScreen(s)).map((i) => `${i.screen} "${i.text}": ${i.problems.join(', ')}`)).toEqual([]);
    });
});
