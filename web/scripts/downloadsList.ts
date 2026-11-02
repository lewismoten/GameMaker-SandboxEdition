// The game list of downloads.html, dressed up: one card per game with its real level picture
// (the build's games/shots/<id>-16x10.png, 320 x 200) beside its ZIP link, and the page's styles.
// Pictures are used only when the build drew them (the catalog's `shots`); never a stand-in.
import type { CdCatalogEntry } from './cdGames';
import { builtShotPath } from '../src/gfx/levelPicture';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Styles for the cards, in the page's colors (light and dark). */
export const DOWNLOADS_STYLE = `<style>
      .seo-static .dl-list { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 14px; }
      .seo-static .dl-card { display: grid; grid-template-columns: minmax(0, 9.5rem) 1fr; gap: 14px; padding: 12px; border: 2px solid #3a3a66; border-radius: 6px; background: #1a1a38; }
      .seo-static .dl-nopic { grid-template-columns: 1fr; }
      .seo-static .dl-card img { display: block; width: 100%; height: auto; border: 1px solid #55558a; background: #000; image-rendering: pixelated; }
      .seo-static .dl-card h3 { font: bold 1.05rem monospace; margin: 0 0 4px; }
      .seo-static .dl-card p { margin: 4px 0; }
      .seo-static .dl-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
      .seo-static .dl-links a { display: inline-block; min-height: 24px; padding: 6px 12px; border: 2px solid #9cf; border-radius: 4px; text-decoration: none; font-weight: bold; }
      .seo-static .dl-links a:first-child { background: #9cf; color: #12122a; }
      .seo-static .dl-links a:hover, .seo-static .dl-links a:focus-visible { outline: 2px solid #ff5; outline-offset: 2px; }
      @media (max-width: 30rem) { .seo-static .dl-card { grid-template-columns: 1fr; } .seo-static .dl-card img { max-width: 20rem; } }
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

/** One game's card. `first` pictures load at once; the rest are lazy. */
export function downloadCard(g: CdCatalogEntry, version: string | undefined, playHref: string, first: boolean): string {
  const picture = g.shots
    ? `<img src="./${esc(builtShotPath(g.id, 16, 10))}" width="320" height="200" alt="${esc(`A level from ${g.title}`)}"${first ? '' : ' loading="lazy"'} decoding="async" />`
    : '';
  const blurb = g.blurb ? `<p>${esc(g.blurb.length > 160 ? `${g.blurb.slice(0, 159).trimEnd()}…` : g.blurb)}</p>` : '';
  return `          <li class="dl-card${picture ? '' : ' dl-nopic'}" id="game-${esc(g.id)}">
            ${picture}
            <div>
              <h3>${esc(g.title)}${version ? ` <small>version ${esc(version)}</small>` : ''}</h3>
              ${blurb}
              <div class="dl-links"><a href="./${esc(g.path + g.pack)}">Download ${esc(g.title)} (ZIP)</a> <a href="${esc(playHref)}">Play ${esc(g.title)} in your browser</a></div>
            </div>
          </li>`;
}
