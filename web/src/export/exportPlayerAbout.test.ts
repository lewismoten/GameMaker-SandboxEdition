// The one-page and web-app exports carry an imported player's About lines and first build (only
// those, never the companion); a game that was not imported exports byte for byte as before.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameFiles } from '../project/files';
import { exportSinglePage } from './exportSinglePage';
import { GAME_ELEMENT_ID } from './singlePage';

const template = '<!doctype html><title><!--GM:TITLE--></title><!--GM:GAME-->';
const files = () => new GameFiles([['nebula.gam', new Uint8Array([1, 2, 3])]]);
const opts = { title: 'Nebula', gam: 'nebula.gam', appBase: 'https://example.com/' };
const embedded = (html: string) => JSON.parse(new RegExp(`id="${GAME_ELEMENT_ID}">(.*?)</script>`).exec(html)![1].replace(/\\u003c/g, '<'));

describe('the one-page export and an imported player’s About', () => {
  afterEach(() => vi.unstubAllGlobals());
  const stub = () =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(template)),
    );

  it('is unchanged when the game was not imported', async () => {
    stub();
    const plain = await exportSinglePage(files(), opts);
    const undef = await exportSinglePage(files(), { ...opts, playerAbout: undefined });
    expect(undef.html).toBe(plain.html);
    expect(embedded(plain.html)).not.toHaveProperty('playerAbout');
  });

  it('carries only the About pages and the origin line when imported', async () => {
    stub();
    const playerAbout = { pages: [[[40, 'NEBULA SOFTWARE']] as [number, string][]], origin: ['Originally made with', 'Game-Maker 2.02.'] };
    const { html } = await exportSinglePage(files(), { ...opts, playerAbout });
    expect(embedded(html).playerAbout).toEqual(playerAbout);
    expect(html).not.toMatch(/companion/i);
  });
});
