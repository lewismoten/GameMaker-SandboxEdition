// Tests: secret games stay out of the catalog until every egg is found (project/secretGames.ts).
import { describe, expect, it, vi, beforeEach } from 'vitest';

const found = { all: false };
vi.mock('../src/eggs/eggState', () => ({
  eggStates: async () => Array.from({ length: 8 }, (_, i) => ({ found: found.all || i < 7 })),
}));

import { hideSecretGames, isSecretGame, SECRET_GAMES } from '../src/project/secretGames';

const list = [{ id: 'teddy' }, { id: 'brief' }, { id: 'logic' }];

describe('secret games', () => {
  beforeEach(() => {
    found.all = false;
  });

  it('lists the ninth game as secret', () => {
    expect(SECRET_GAMES).toContain('brief');
    expect(isSecretGame('brief')).toBe(true);
    expect(isSecretGame('teddy')).toBe(false);
  });

  it('hides it while any egg is missing', async () => {
    expect((await hideSecretGames(list)).map((g) => g.id)).toEqual(['teddy', 'logic']);
  });

  it('shows it once all eight eggs are found', async () => {
    found.all = true;
    expect((await hideSecretGames(list)).map((g) => g.id)).toEqual(['teddy', 'brief', 'logic']);
  });

  it('leaves a list without secrets alone', async () => {
    const plain = [{ id: 'teddy' }];
    expect(await hideSecretGames(plain)).toBe(plain);
  });
});
