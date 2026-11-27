// The public downloads page lists only released games: no Starter (an example, not a download) and
// no Special, even when it carries a pack the way a game does.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, expect, it } from 'vitest';
import type { CdCatalogEntry } from './cdGames';
import { downloadsPageHtml } from './seoDownloads';

const root = mkdtempSync(join(tmpdir(), 'downloads-'));
afterAll(() => rmSync(root, { recursive: true, force: true }));

const entry = (id: string, series?: string): CdCatalogEntry => ({
  id,
  title: `Title of ${id}`,
  kind: 'gameware',
  path: `games/originals/${id}/`,
  gam: `${id.toUpperCase()}.GAM`,
  files: [],
  sizes: [],
  bytes: 0,
  original: {},
  series,
  pack: `${id}.zip`,
});

it('leaves a Starter and a Special out of the downloads page and keeps a released game', () => {
  const html = downloadsPageHtml([entry('released-one'), entry('starter-one', 'starter'), entry('special-one', 'special')], root);
  expect(html).toContain('released-one.zip');
  expect(html).not.toContain('starter-one');
  expect(html).not.toContain('special-one');
});
