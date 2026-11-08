// The lean catalog (games/catalog.json has no `files` or `sizes`): they come from games/catalog-files.json, only when something asks.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGameFile, hydrateFiles, loadLeanCatalogList, loadCatalogList, withFiles, type CatalogEntry } from './files';

const lean = (id: string): CatalogEntry => ({ id, title: id, kind: 'gameware', path: `games/${id}/`, gam: `${id}.gam` });
const lists = { a: { files: ['a.gam', 'a.rec'], sizes: [10, 20] }, b: { files: ['b.gam'], sizes: [5] } };

function serve(urls: string[], base: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      urls.push(url);
      const body = url === `${base}catalog.json` ? [lean('a'), lean('b')] : url === `${base}catalog-files.json` ? lists : undefined;
      return body
        ? { ok: true, headers: new Headers({ 'content-type': 'application/json' }), json: async () => body }
        : { ok: false, headers: new Headers(), json: async () => [] };
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('lean catalog', () => {
  it('loads the list without fetching the file lists', async () => {
    const urls: string[] = [];
    serve(urls, './lean1/');
    const list = await loadLeanCatalogList('./lean1/');
    expect(list.map((g) => g.files)).toEqual([undefined, undefined]);
    expect(urls.some((u) => u.endsWith('catalog-files.json'))).toBe(false);
  });

  it('fills files and sizes in place on demand, with one fetch for any number of entries', async () => {
    const urls: string[] = [];
    serve(urls, './lean2/');
    const list = await loadLeanCatalogList('./lean2/');
    const a = await withFiles(list[0], './lean2/');
    expect(a.files).toEqual(['a.gam', 'a.rec']);
    expect(list[0].sizes).toEqual([10, 20]); // the entry itself, shared by every holder of the list
    await hydrateFiles(list, './lean2/');
    expect(list[1].files).toEqual(['b.gam']);
    expect(urls.filter((u) => u.endsWith('catalog-files.json'))).toHaveLength(1);
  });

  it('loadCatalogList (the default) hands out entries that have their files', async () => {
    const urls: string[] = [];
    serve(urls, './lean3/');
    const list = await loadCatalogList('./lean3/');
    expect(list.map((g) => g.files)).toEqual([lists.a.files, lists.b.files]);
  });

  it('a file fetch asks for the list first: a name the game lacks is undefined, without a request for it', async () => {
    const urls: string[] = [];
    serve(urls, './lean4/games/');
    await expect(fetchGameFile(lean('a'), 'nope.gam', './lean4/')).resolves.toBeUndefined();
    expect(urls).toEqual(['./lean4/games/catalog-files.json']);
  });
});
