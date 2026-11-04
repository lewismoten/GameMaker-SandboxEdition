// The one-page export keeps pictures and text screens as page content and rebuilds every game file from the
// page byte for byte; its schema.org data is valid; and its growth over the old export is reported.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Ajv from 'ajv';
import { GameFiles } from '../src/project/files';
import { exportSinglePage } from '../src/export/exportSinglePage';
import { decodeGame, readSinglePage, ABOUT_MARK, GAME_MARK, HEAD_MARK, TITLE_MARK } from '../src/export/singlePage';
import { gameFromPageHtml } from '../src/project/importPage';
import { bytesFromText, textFromBytes } from '../src/export/insideText';
import { readExternalHtml } from '../src/export/insideRead';

const TEMPLATE = `<!doctype html><html lang="en"><head><title>${TITLE_MARK}</title>${HEAD_MARK}</head><body><div id="player">${ABOUT_MARK}</div>${GAME_MARK}<script>run()</script></body></html>`;
const GAMES = ['sandcast', 'goat', 'first-steps'] as const;
const root = new URL('../../games/', import.meta.url);
const have = (id: string) => existsSync(new URL(`${id}/disk/`, root));

function load(id: string): { files: GameFiles; gam: string } {
  const dir = new URL(`${id}/disk/`, root);
  const names = readdirSync(dir);
  const files = new GameFiles(names.map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(new URL(n, dir)))] as [string, Uint8Array]));
  return { files, gam: files.names().find((n) => n.endsWith('.gam'))! };
}

const ABOUT = {
  title: 'Sample',
  author: 'Doc Leo',
  company: 'Sandbox Software',
  year: '1994',
  description: 'A sample game for the export test.',
  story: 'Once upon a time.\n\nThe end.',
  genre: 'Platform',
  website: 'https://example.com/sample',
  license: 'Shareware',
  credits: [{ role: 'Music', name: 'Pat' }],
};

async function exportOne(id: string, about?: typeof ABOUT) {
  const { files, gam } = load(id);
  vi.stubGlobal('fetch', async () => new Response(TEMPLATE));
  const { html } = await exportSinglePage(files, { title: `Game ${id}`, gam, appBase: 'http://localhost/', about, version: '1.2' });
  return { files, html, gam };
}

describe('Inside this game', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('text round trips only when it is byte for byte', () => {
    const dos = Uint8Array.from([0x48, 0x69, 0x0d, 0x0a, 0xc9, 0xcd, 0xbb, 0x0d, 0x0a, 0x1a]);
    const t = textFromBytes(dos)!;
    expect(t.text).toBe('Hi\n╔═╗\n');
    expect(bytesFromText(t.text, t.layout)).toEqual(dos);
    expect(textFromBytes(Uint8Array.from([0x41, 0x0d, 0x42]))).toBeUndefined(); // a lone CR
    expect(textFromBytes(Uint8Array.from([0x41, 0x0d, 0x0a, 0x42, 0x0a]))).toBeUndefined(); // mixed line ends
    expect(textFromBytes(Uint8Array.from([0x41, 0x01]))).toBeUndefined(); // a control byte
  });

  for (const id of GAMES) {
    it.skipIf(!have(id))(`${id}: every file comes back from the page byte for byte`, async () => {
      const { files, html } = await exportOne(id, ABOUT);
      const got = await gameFromPageHtml(html);
      expect(got).toBeDefined();
      expect(got!.files.names().sort()).toEqual(files.names().sort());
      for (const n of files.names()) expect(got!.files.get(n), n).toEqual(files.get(n));
      // the pictures are on the page once: as <img>, not also in the gzip data
      const game = readSinglePage(html)!;
      const gifs = files.names().filter((n) => n.endsWith('.gif'));
      expect(game.ext!.map(([n]) => n)).toEqual(expect.arrayContaining(gifs));
      expect(game.files.map(([n]) => n).some((n) => n.endsWith('.gif'))).toBe(false);
      expect((await decodeGame(game)).length).toBe(files.names().length);
      // real text, folded, visible credits
      expect(html).toContain('<details>');
      expect(html).toContain('Inside this game');
      expect(html).toContain('<dd>Pat</dd>');
      expect(readExternalHtml(html).size).toBe(game.ext!.length);
    });
  }

  it.skipIf(!have('goat'))('previews animations and sounds, and keeps the originals', async () => {
    const { html, files } = await exportOne('goat');
    expect(html).toMatch(/<audio controls preload="none" src="data:audio\/wav/);
    expect(html).toMatch(/\(animation preview\)/);
    expect(html).toMatch(/GOAT\.CMF|\.CMF, music/);
    const got = await gameFromPageHtml(html);
    for (const n of files.names().filter((x) => /\.(fli|voc|cmf)$/.test(x))) expect(got!.files.get(n), n).toEqual(files.get(n));
  });

  it('the JSON-LD is a valid VideoGame', async () => {
    if (!have('sandcast')) return;
    const { html } = await exportOne('sandcast', ABOUT);
    const ld = JSON.parse(/<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)![1]) as {
      '@context': string;
      '@graph': Record<string, unknown>[];
    };
    expect(ld['@context']).toBe('https://schema.org');
    const game = ld['@graph'][0];
    const str = { type: 'string', minLength: 1 };
    const named = { type: 'object', required: ['@type', 'name'], properties: { '@type': str, name: str } };
    const schema = {
      type: 'object',
      required: ['@type', 'name', 'description', 'author', 'genre', 'screenshot', 'abstract', 'softwareVersion', 'license', 'sameAs', 'contributor'],
      properties: {
        '@type': { const: 'VideoGame' },
        name: str,
        description: str,
        genre: str,
        license: str,
        softwareVersion: { const: '1.2' },
        datePublished: { const: '1994' },
        sameAs: { type: 'string', pattern: '^https?://' },
        abstract: str,
        author: { type: 'array', minItems: 2, items: named },
        contributor: { type: 'array', minItems: 1, items: { ...named, required: ['@type', 'name', 'jobTitle'] } },
        screenshot: {
          type: 'array',
          minItems: 1,
          maxItems: 8,
          items: {
            type: 'object',
            required: ['@type', 'caption', 'width', 'height'],
            properties: { '@type': { const: 'ImageObject' }, width: { type: 'integer' }, height: { type: 'integer' } },
          },
        },
      },
    };
    const ajv = new Ajv({ strict: false });
    const ok = ajv.validate(schema, game);
    expect(ajv.errorsText()).toBe('No errors');
    expect(ok).toBe(true);
  });

  it('reports how much the page grows per game', async () => {
    const rows: string[] = [];
    for (const id of GAMES) {
      if (!have(id)) continue;
      const { files, html } = await exportOne(id, ABOUT);
      // the same page without the inside section: every file in the gzip data, as before
      const { encodeGame, fillPage } = await import('../src/export/singlePage');
      const game = await encodeGame({ id: 'x', title: `Game ${id}`, gam: 'x.gam' }, files.entries());
      const old = fillPage(TEMPLATE, game);
      rows.push(`${id}: ${old.length} -> ${html.length} bytes (+${html.length - old.length}, ${(html.length / old.length).toFixed(2)}x)`);
    }
    console.warn(`Page size growth\n${rows.join('\n')}`);
    expect(rows.length).toBeGreaterThan(0);
  });
});
