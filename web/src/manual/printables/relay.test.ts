// The activity enters the existing box/Library path only for the reviewed public game.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import type { CatalogEntry } from '../../project/files';
import { typeOfPiece } from '../../library/shelf';
import { relayItem } from './relay';

const entry = (id: string, series?: string): CatalogEntry => ({ id, title: id, series, kind: 'shareware', path: '', gam: null, files: [] });

describe('navigator/player relay printable', () => {
  it('has a stable box opening and a Library paper classification', () => {
    const items = relayItem(entry('teddy'));
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'navigator-relay', title: 'Navigator/player relay' });
    expect(typeOfPiece('teddy', items[0].id)).toBe('letter');
  });

  it('adds nothing to another game, a Starter or any secret game', () => {
    expect(relayItem(entry('unknown'))).toEqual([]);
    expect(relayItem(entry('teddy', 'starter'))).toEqual([]);
    const games = new URL('../../../../games/', import.meta.url);
    for (const id of readdirSync(games)) {
      const file = new URL(`${id}/about.json`, games);
      if (!existsSync(file)) continue;
      const about = JSON.parse(readFileSync(file, 'utf8')) as { secret?: boolean; series?: string };
      if (about.secret || about.series === 'starter') expect(relayItem(entry(id, about.series))).toEqual([]);
    }
  });
});
