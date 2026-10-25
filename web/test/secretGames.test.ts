// Tests: secret games stay out of the catalog until what reveals each is found, every felt egg or
// every tin heart (project/secretGames.ts), and the build lists them only in games/extra.json
// (scripts/cdGames.ts). The hearts' game is never named here: its id is read from its about.json.
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const found = { all: false, hearts: false };
vi.mock('../src/eggs/eggState', () => ({
  eggStates: async () => Array.from({ length: 12 }, (_, i) => ({ found: found.all || i < 11 })),
}));
vi.mock('../src/tinHearts/tinHearts', () => ({
  MANIFEST: { hearts: { teddy: {}, logic: {}, brief: {} }, pending: [] },
  heartStates: async (games: { id: string }[]) => games.map((g, i) => ({ id: g.id, found: found.hearts || i < games.length - 1 })),
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
    found.hearts = false;
    fetches.length = 0;
    extra = json([{ id: 'bakers' }]);
    vi.stubGlobal('fetch', async (url: string) => {
      fetches.push(url);
      return extra ?? new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } });
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('leaves them out, and fetches nothing, while any egg is missing', async () => {
    expect(await withSecretGames(list)).toBe(list);
    expect(fetches).toEqual([]);
    expect(secretsListed()).toBe(0);
  });

  it('adds the felt eggs’ file once every felt egg is found, and fetches no other', async () => {
    found.all = true;
    expect((await withSecretGames(list)).map((g) => g.id)).toEqual(['teddy', 'logic', 'bakers']);
    expect(fetches).toEqual(['./games/extra-1.json']);
    expect(secretsListed()).toBe(1);
  });

  it('copes with a dev server from before games/extra-<gate>.json', async () => {
    extra = undefined;
    const old = [...list, { id: 'bakers' }];
    expect(isOldSecret('bakers')).toBe(true);
    expect(isOldSecret('brief')).toBe(false);
    expect(isOldSecret('teddy')).toBe(false);
    expect((await withSecretGames(old)).map((g) => g.id)).toEqual(['teddy', 'logic']);
    found.all = true;
    expect(await withSecretGames(old)).toBe(old);
  });

  it('does not list one twice', async () => {
    found.all = true;
    expect((await withSecretGames([...list, { id: 'bakers' }])).map((g) => g.id)).toEqual(['teddy', 'logic', 'bakers']);
  });
});

// the secret games and what reveals each, from their about.json (so no id is written here)
const gamesDir = resolve(__dirname, '../../games');
const secrets = existsSync(gamesDir)
  ? readdirSync(gamesDir).flatMap((d) => {
      const about = resolve(gamesDir, d, 'about.json');
      if (!existsSync(about)) return [];
      const a = JSON.parse(readFileSync(about, 'utf8')) as { secret?: boolean; unlock?: string };
      return a.secret === true ? [{ id: d, gate: a.unlock === 'hearts' ? 'hearts' : 'eggs' }] : [];
    })
  : [];
const byHearts = secrets.filter((s) => s.gate === 'hearts').map((s) => s.id);
const byEggs = secrets.filter((s) => s.gate === 'eggs').map((s) => s.id);

describe('secret games revealed by the tin hearts', () => {
  const fetches: string[] = [];
  beforeEach(() => {
    found.all = false;
    found.hearts = false;
    fetches.length = 0;
    vi.stubGlobal('fetch', async (url: string) => {
      fetches.push(url);
      return json(secrets.map((s) => ({ id: s.id })));
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it.skipIf(!byHearts.length || !byEggs.length)('knows every secret game as secret', () => {
    for (const s of secrets) expect(isOldSecret(s.id), s.gate).toBe(true);
  });

  it.skipIf(!byHearts.length || !byEggs.length)('shows the hearts’ games for the hearts, and the eggs’ for the eggs', async () => {
    expect(await withSecretGames(list)).toBe(list);
    expect(fetches).toEqual([]);
    found.hearts = true;
    const hearts = (await withSecretGames(list)).map((g) => g.id);
    for (const id of byHearts) expect(hearts).toContain(id);
    for (const id of byEggs) expect(hearts).not.toContain(id);
    expect(secretsListed()).toBe(2);
    found.hearts = false;
    found.all = true;
    const eggs = (await withSecretGames(list)).map((g) => g.id);
    for (const id of byEggs) expect(eggs).toContain(id);
    for (const id of byHearts) expect(eggs).not.toContain(id);
    found.hearts = true;
    const both = (await withSecretGames(list)).map((g) => g.id);
    for (const s of secrets) expect(both).toContain(s.id);
    expect(secretsListed()).toBe(3);
  });

  it.skipIf(!byHearts.length)('drops one an older dev server lists while its hearts are missing', async () => {
    found.all = true;
    const old = [...list, ...byHearts.map((id) => ({ id }))];
    vi.stubGlobal('fetch', async () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }));
    expect((await withSecretGames(old)).map((g) => g.id)).toEqual(['teddy', 'logic']);
  });
});

describe('the build and secret games', () => {
  it.skipIf(!existsSync(resolve(__dirname, '../../games/brief/about.json')))('lists KEEP IT BRIEF! in the open', () => {
    expect(JSON.parse(readFileSync(resolve(__dirname, '../../games/brief/about.json'), 'utf8')).secret).not.toBe(true);
  });

  const cd = resolve(__dirname, '../../cd');
  const games = resolve(__dirname, '../../games');
  const secret = existsSync(games)
    ? readdirSync(games).filter(
        (d) => existsSync(resolve(games, d, 'about.json')) && JSON.parse(readFileSync(resolve(games, d, 'about.json'), 'utf8')).secret === true,
      )
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
