// The BBS listings name only boards on the desk's TERMINAL, at the numbers it dials.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BBS_BOARDS } from '../go';
import { BBS_LISTINGS, SANDBOX_PHONE, SOFA_PHONE } from './bbsListings';

const src = (f: string) => readFileSync(join(__dirname, '../../../retro/bbs', f), 'utf8');

describe('the BBS listings', async () => {
  const pages = await BBS_LISTINGS.pages({ games: [], game: () => undefined });
  const json = JSON.stringify(pages);

  it('print the numbers TERMINAL dials', () => {
    expect(src('bbs.ts')).toContain(`const PHONE = '${SANDBOX_PHONE}'`);
    expect(src('sofa.ts')).toContain(`export const SOFA_PHONE = '${SOFA_PHONE}'`);
  });

  it('dial every board, and only those', () => {
    const dialed = new Set([...json.matchAll(/go:bbs\/(\w+)/g)].map((m) => m[1]));
    expect([...dialed].sort()).toEqual(BBS_BOARDS.filter(Boolean).sort());
    for (const board of BBS_BOARDS.filter(Boolean)) expect(src('bbs.ts')).toContain(`id: '${board.toUpperCase()}'`);
  });

  it('take two pages', () => expect(pages.length).toBe(2));
});
