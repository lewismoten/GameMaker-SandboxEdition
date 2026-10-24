// What an exported game page (one web page, or a web app's index.html) tells search
// engines and link previews: its description, Open Graph / Twitter tags, schema.org
// VideoGame data saying it was made with Game-Maker: Sandbox Edition (with links to the
// site and its source code), and readable text for crawlers and browsers without
// JavaScript. Shareware keeps its author's notice; the only addition is the credit.
import { PRODUCT } from '../edition';
import { escapeHtml, gameDescription, gameJsonLd, jsonLdScript, metaTags, REPO_URL, SITE_URL, type GameSeo } from '../seo/site';

export interface ExportMeta extends GameSeo {
  /** Shareware: the author's notice (readme / order form). */
  notice?: string;
  /** Our own games: made now, presented as a 1990s release (fiction.ts). */
  fiction?: string;
}

/** The page still needs a web engine: a browser, or the one a Windows, Mac or Linux download wraps it in. */
export const PAGE_CAVEAT =
  'It plays offline, but it still runs on a web engine (a browser, or the one built into Windows, macOS or Linux), so a future change to browsers or web standards could break or change it. The DOS download, in DOSBox, is the most future-proof.';

/** Tags for the page <head> (the <title> is already there). */
export function exportHead(m: ExportMeta): string {
  const description = gameDescription(m);
  return [
    metaTags({ title: m.title, description, siteName: m.title }),
    `<meta name="generator" content="${escapeHtml(PRODUCT)}" />`,
    jsonLdScript([gameJsonLd(m)]),
  ].join('\n');
}

/** Text in the page body until the game starts (and for browsers without JavaScript). */
export function exportAbout(m: ExportMeta): string {
  const p = (s: string) => `<p>${s}</p>`;
  return [
    `<div class="gm-about" style="max-width:40rem;margin:0 auto;padding:24px 16px;font:16px/1.5 system-ui,sans-serif;color:#ccc">`,
    `<h1 style="font:bold 1.6rem monospace;color:#ff5">${escapeHtml(m.title)}</h1>`,
    p(escapeHtml(gameDescription(m))),
    `<noscript>${p('<strong>This game runs in your browser: please turn on JavaScript to play.</strong>')}</noscript>`,
    m.notice
      ? `<details><summary>Shareware: the author’s notice</summary><pre style="white-space:pre-wrap;font:13px monospace">${escapeHtml(m.notice)}</pre></details>`
      : '',
    m.fiction ? p(`<small>${escapeHtml(m.fiction)}</small>`) : '',
    p(`<small>${escapeHtml(PAGE_CAVEAT)}</small>`),
    p(
      `<small>Made with <a style="color:#9cf" href="${SITE_URL}">${escapeHtml(PRODUCT)}</a>` +
        ` · <a style="color:#9cf" href="${REPO_URL}">source code</a></small>`,
    ),
    `</div>`,
  ].join('');
}

/** "Made with …" for the corner of the start screen. */
export const CREDIT = { text: `Made with ${PRODUCT}`, site: SITE_URL, repo: REPO_URL } as const;
