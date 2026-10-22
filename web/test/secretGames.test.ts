// Tests: secret games stay out of the catalog until every egg is found (project/secretGames.ts),
// and the build lists them only in games/extra.json (scripts/cdGames.ts).
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const found = { all: false };
vi.mock('../src/eggs/eggState', () => ({
  eggStates: async () => Array.from({ length: 8 }, (_, i) => ({ found: found.all || i < 7 })),
}));

import { isOldSecret, secretsListed, withSecretGames } from '../src/project/secretGames';
import { cdCatalog, cdSecretCatalog, slimCatalog } from '../scripts/cdGames';

const list = [{ id: 'teddy' }, { id: 'logic' }];
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

describe('secret games', () => {
  const fetches: string[] = [];
  let extra: Response | undefined;
  beforeEach(() => {
    found.all = false;
    fetches.length = 0;
    extra = json([{ id: 'brief' }]);
    vi.stubGlobal('fetch', async (url: string) => {
      fetches.push(url);
      return extra ?? new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } });
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('leaves them out, and fetches nothing, while any egg is missing', async () => {
    expect(await withSecretGames(list)).toBe(list);
    expect(fetches).toEqual([]);
    expect(secretsListed()).toBe(false);
  });

  it('adds games/extra.json once all eight eggs are found', async () => {
    found.all = true;
    expect((await withSecretGames(list)).map((g) => g.id)).toEqual(['teddy', 'logic', 'brief']);
    expect(fetches).toEqual(['./games/extra.json']);
    expect(secretsListed()).toBe(true);
  });

  it('copes with a dev server from before games/extra.json', async () => {
    extra = undefined;
    const old = [...list, { id: 'brief' }];
    expect(isOldSecret('brief')).toBe(true);
    expect(isOldSecret('teddy')).toBe(false);
    expect((await withSecretGames(old)).map((g) => g.id)).toEqual(['teddy', 'logic']);
    found.all = true;
    expect(await withSecretGames(old)).toBe(old);
  });

  it('does not list one twice', async () => {
    found.all = true;
    expect((await withSecretGames([...list, { id: 'brief' }])).map((g) => g.id)).toEqual(['teddy', 'logic', 'brief']);
  });
});

describe('the build and secret games', () => {
  const cd = resolve(__dirname, '../../cd');
  const games = resolve(__dirname, '../../games');
  const secret = existsSync(games)
    ? readdirSync(games).filter((d) => existsSync(resolve(games, d, 'about.json')) && JSON.parse(readFileSync(resolve(games, d, 'about.json'), 'utf8')).secret === true)
    : [];

  it.skipIf(!existsSync(cd) || !secret.length)('lists them only in the secret catalog', () => {
    const open = JSON.stringify(slimCatalog(cdCatalog(cd))) + JSON.stringify(cdCatalog(cd));
    for (const id of secret) {
      expect(cdSecretCatalog(cd).map((e) => e.id)).toContain(id);
      expect(cdCatalog(cd).map((e) => e.id)).not.toContain(id);
      expect(open).not.toContain(`/${id}/`);
    }
  });
});
