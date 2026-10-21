// Tests: each bundled game's own play page (scripts/seoBuild.ts) and its preview picture (scripts/ogImage.ts).
import { describe, expect, it } from 'vitest';
import { inflateSync } from 'node:zlib';
import type { CdCatalogEntry } from '../scripts/cdGames';
import { gamePageHtml } from '../scripts/seoBuild';
import { CARD_H, CARD_W, encodePng, gameCard, wrap } from '../scripts/ogImage';
import { SITE_URL } from '../src/seo/site';

const game: CdCatalogEntry = {
  id: 'nebula',
  title: 'Nebula <&>',
  kind: 'gameware',
  path: 'games/gameware/nebula/',
  gam: 'nebula.gam',
  files: ['nebula.gam'],
  sizes: [1],
  bytes: 1,
  author: 'Andy Stone',
  year: 1991,
};

const play = `<html><head><title>Play</title><!--seo:head--><meta name="description" content="generic" /><!--/seo:head-->
<script type="module" src="./assets/play-x.js"></script></head><body><div id="player"><!--seo:body--><main>all games</main><!--/seo:body--></div></body></html>`;

describe('game pages', () => {
  const html = gamePageHtml(play, game);

  it('bakes in the game title, canonical address, picture and which game to play', () => {
    expect(html).toContain('<title>Nebula &#60;&#38;&#62; · play in your browser');
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}play-nebula.html" />`);
    expect(html).toContain(`<meta property="og:image" content="${SITE_URL}og/nebula.png" />`);
    expect(html).toContain('<meta name="gm:game" content="nebula" />');
    expect(html).toContain('"@type":"VideoGame"');
    expect(html).not.toContain('generic');
    expect(html).not.toContain('all games');
  });

  it('keeps the built player', () => {
    expect(html).toContain('<script type="module" src="./assets/play-x.js"></script>');
  });
});

describe('preview picture', () => {
  it('is a 1200 x 630 PNG', () => {
    const png = encodePng(gameCard(game, { width: 4, height: 2, data: new Uint8Array(24).fill(200) }));
    const dv = new DataView(png.buffer, png.byteOffset);
    expect([...png.subarray(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
    expect([dv.getUint32(16), dv.getUint32(20)]).toEqual([CARD_W, CARD_H]);
    const idatLen = dv.getUint32(33);
    expect(inflateSync(png.subarray(41, 41 + idatLen)).length).toBe((CARD_W * 3 + 1) * CARD_H);
  });

  it('wraps titles on words', () => {
    expect(wrap('Woman Warrior and the Outer Limits', 10)).toEqual(['Woman', 'Warrior', 'and the', 'Outer', 'Limits']);
  });
});
