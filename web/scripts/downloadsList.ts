// The game list of downloads.html, dressed up: one card per game with its real title screen and a
// level picture (the build's games/shots/<id>-title.png and <id>-16x10.png, 320 x 200 each) above
// its ZIP link, and the page's styles. Pictures are used only when the build draws them; never a
// stand-in. The secret games are listed here too (Lewis's choice, this page only): their pictures
// are inlined, as the build writes no games/shots/ file for them.
import type { CdCatalogEntry } from './cdGames';
import { builtShotPath } from '../src/gfx/levelPicture';
import { builtTitlePath } from '../src/gfx/titlePicture';
import { cdFiles } from './cdGames';
import { gameShots } from './gameShots';

/** A card's pictures, as image sources: a games/shots/ path, or a data URL for a secret game. */
export interface CardPictures {
  title?: string;
  level?: string;
}

/** Each game's title and level pictures, drawn by the same call that emits games/shots/ (`inline`: as data URLs). */
export function cardPictures(games: CdCatalogEntry[], cdRoot: string, inline = false): Map<string, CardPictures> {
  const files = cdFiles(cdRoot);
  return new Map(
    games.map((g) => {
      const disk = new Map(g.files.flatMap((n) => (files.get(`${g.path}${n}`) ? [[n, files.get(`${g.path}${n}`)!] as [string, string]] : [])));
      const shots = gameShots(g.id, g.gam, disk);
      const src = (path: string) => {
        const png = shots.get(path);
        if (!png) return undefined;
        return inline ? `data:image/png;base64,${Buffer.from(png).toString('base64')}` : `./${path}`;
      };
      return [g.id, { title: src(builtTitlePath(g.id)), level: src(builtShotPath(g.id, 16, 10)) }];
    }),
  );
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Styles for the cards, in the page's colors (light and dark). */
export const DOWNLOADS_STYLE = `<style>
      .seo-static .dl-list { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 14px; }
      .seo-static .dl-card { display: grid; gap: 10px; padding: 12px; border: 2px solid #3a3a66; border-radius: 6px; background: #1a1a38; }
      .seo-static .dl-pics { display: grid; grid-template-columns: repeat(2, minmax(0, 20rem)); gap: 8px; }
      .seo-static .dl-card img { display: block; width: 100%; height: auto; border: 1px solid #55558a; background: #000; image-rendering: pixelated; }
      .seo-static .dl-card h3 { font: bold 1.05rem monospace; margin: 0 0 4px; }
      .seo-static .dl-card p { margin: 4px 0; }
      .seo-static .dl-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
      .seo-static .dl-links a { display: inline-block; min-height: 24px; padding: 6px 12px; border: 2px solid #9cf; border-radius: 4px; text-decoration: none; font-weight: bold; }
      .seo-static .dl-links a:first-child { background: #9cf; color: #12122a; }
      .seo-static .dl-links a:hover, .seo-static .dl-links a:focus-visible { outline: 2px solid #ff5; outline-offset: 2px; }
      @media (prefers-color-scheme: light) {
        .seo-static { background: #f4f4fb; color: #1a1a2e; }
        .seo-static a { color: #0b4f9c; }
        .seo-static h1 { color: #6b5a00; }
        .seo-static h2 { color: #0a6b1c; }
        .seo-static small, .seo-static .seo-note { color: #555570; }
        .seo-static .dl-card { background: #fff; border-color: #c4c4dc; }
        .seo-static .dl-card img { border-color: #c4c4dc; }
        .seo-static .dl-links a { border-color: #0b4f9c; }
        .seo-static .dl-links a:first-child { background: #0b4f9c; color: #fff; }
        .seo-static .dl-links a:hover, .seo-static .dl-links a:focus-visible { outline-color: #1a1a2e; }
      }
    </style>`;

/** One game's card (`playHref` undefined: no play page, as for a secret game). `first` pictures load at once; the rest are lazy. */
export function downloadCard(g: CdCatalogEntry, version: string | undefined, playHref: string | undefined, first: boolean, pics: CardPictures = {}): string {
  const img = (src: string | undefined, alt: string) =>
    src ? `<img src="${esc(src)}" width="320" height="200" alt="${esc(alt)}"${first ? '' : ' loading="lazy"'} decoding="async" />` : '';
  const pictures = [img(pics.title, `The title screen of ${g.title}`), img(pics.level, `A level from ${g.title}`)].filter(Boolean).join('');
  const blurb = g.blurb ? `<p>${esc(g.blurb.length > 160 ? `${g.blurb.slice(0, 159).trimEnd()}…` : g.blurb)}</p>` : '';
  const play = playHref ? ` <a href="${esc(playHref)}">Play ${esc(g.title)} in your browser</a>` : '';
  return `          <li class="dl-card" id="game-${esc(g.id)}">
            ${pictures ? `<div class="dl-pics">${pictures}</div>` : ''}
            <div>
              <h3>${esc(g.title)}${version ? ` <small>version ${esc(version)}</small>` : ''}</h3>
              ${blurb}
              <div class="dl-links"><a href="./${esc(g.path + g.pack)}">Download ${esc(g.title)} (ZIP)</a>${play}</div>
            </div>
          </li>`;
}
