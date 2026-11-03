// The toy box's listing (toyBoxList.ts): secret games never appear, games without trinkets drop out.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { toyBoxGames } from './toyBoxList';
import { isOldSecret } from '../project/secretGames';
import type { TrinketItem } from '../desk/boxes/trinketData';

const item = (id: string): TrinketItem => ({
  id,
  title: id,
  blurb: '',
  file: `${id}.stl`,
  triangles: 1,
  bytes: 1,
  mm: [1, 1, 1],
  overhangMm2: 0,
  supports: null,
  colors: { file: `${id}.3mf`, bytes: 1, palette: [[0, 0, 0]] },
});

const loadFrom = (have: Record<string, string[]>) => async (id: string) => (have[id] ?? []).map(item);

describe('toyBoxGames', () => {
  const entries = [
    { id: 'zed', title: 'Zed' },
    { id: 'ada', title: 'Ada' },
    { id: 'plain', title: 'Plain' },
    { id: 'hush', title: 'Hush' },
  ];

  it('groups by game, sorted by title, leaving out games with none', async () => {
    const got = await toyBoxGames(entries, loadFrom({ zed: ['a', 'b'], ada: ['c'], hush: ['d'] }), () => false);
    expect(got.map((g) => g.id)).toEqual(['ada', 'hush', 'zed']);
    expect(got[2].items).toHaveLength(2);
  });

  it('never lists a secret game, nor loads its files', async () => {
    const asked: string[] = [];
    const load = async (id: string) => (asked.push(id), [item('x')]);
    const got = await toyBoxGames(entries, load, (id) => id === 'hush');
    expect(got.map((g) => g.id)).not.toContain('hush');
    expect(asked).not.toContain('hush');
  });

  it('a failed load drops that game only', async () => {
    const load = async (id: string) => {
      if (id === 'ada') throw new Error('x');
      return [item('x')];
    };
    expect((await toyBoxGames(entries, load, () => false)).map((g) => g.id)).not.toContain('ada');
  });

  it('every game marked secret in about.json is secret to the default rule', async () => {
    const dir = new URL('../../../games/', import.meta.url);
    const secret = readdirSync(dir)
      .filter((d) => existsSync(new URL(`${d}/about.json`, dir)))
      .filter((d) => (JSON.parse(readFileSync(new URL(`${d}/about.json`, dir), 'utf8')) as { secret?: boolean }).secret)
      .map((d) => ({ id: d, title: d }));
    expect(secret.length).toBeGreaterThan(0);
    expect(secret.every((e) => isOldSecret(e.id))).toBe(true);
    expect(await toyBoxGames(secret, async () => [item('x')])).toEqual([]);
  });
});
