// What an exported game page (one web page, or a web app's index.html) tells search
// engines and link previews: its description, Open Graph / Twitter tags, schema.org
// VideoGame data saying it was made with Game-Maker: Sandbox Edition (with links to the
// site and its source code), and readable text for crawlers and browsers without
// JavaScript. Shareware keeps its author's notice; the only addition is the credit. The page's
// player is MIT licensed, so its notice rides in the <head> as a comment, and a Bard game's
// voice clips, which aren't MIT, are named in the readable text (recordedAudio.ts).
import { PRODUCT } from '../edition';
import { PROJECT } from './notices';
import { escapeHtml, gameDescription, gameJsonLd, jsonLdScript, metaTags, REPO_URL, SITE_URL, type GameSeo } from '../seo/site';

export interface ExportMeta extends GameSeo {
  /** Shareware: the author's notice (readme / order form). */
  notice?: string;
  /** Our own games: made now, presented as a 1990s release (fiction.ts). */
  fiction?: string;
  /** A Bard of Bizarre game's non-commercial voice clips (recordedAudio.ts recordedAudioNotice). */
  audio?: string;
  /** The title screen as a PNG data: URL, shown while no script runs (a Files preview) and until the game starts. */
  poster?: string;
}

/** The page still needs a web engine: a browser, or the one a Windows, Mac or Linux download wraps it in. */
const PAGE_CAVEAT =
  'It plays offline, but it still runs on a web engine (a browser, or the one built into Windows, macOS or Linux), so a future change to browsers or web standards could break or change it. The DOS download, in DOSBox, is the most future-proof.';

/** Shown only where scripts don't run (a Files or Mail preview, or JavaScript turned off). */
const NO_SCRIPT_NOTICE =
  'This preview can’t run the game. Open the file in a full browser to play it. On iPhone or iPad, save it to Files if it isn’t there yet, then tap Share and choose Safari if it is offered, or open it from a browser’s own file picker.';

/** Tags for the page <head> (the <title> is already there). */
export function exportHead(m: ExportMeta): string {
  const description = gameDescription(m);
  return [
    `<!--\n${PROJECT}\n-->`,
    metaTags({ title: m.title, description, siteName: m.title }),
    `<meta name="generator" content="${escapeHtml(PRODUCT)}" />`,
    jsonLdScript([gameJsonLd(m)]),
  ].join('\n');
}

/** Text in the page body until the game starts (and for browsers without JavaScript). */
export function exportAbout(m: ExportMeta): string {
  const p = (s: string) => `<p>${s}</p>`;
  return [
    `<main class="gm-about" style="max-width:40rem;margin:0 auto;padding:24px 16px;font:16px/1.5 system-ui,sans-serif;color:#ccc">`,
    `<h1 style="font:bold 1.6rem monospace;color:#ff5">${escapeHtml(m.title)}</h1>`,
    m.poster
      ? `<img src="${m.poster}" width="320" height="200" alt="${escapeHtml(`${m.title}: the game's title screen`)}" style="display:block;width:100%;max-width:640px;height:auto;aspect-ratio:8/5;margin:0 auto 16px;image-rendering:pixelated;image-rendering:crisp-edges" />`
      : '',
    p(escapeHtml(gameDescription(m))),
    `<noscript><div role="note" style="border:2px solid #ff5;border-radius:6px;padding:8px 14px;margin:0 0 16px;color:#fff;background:#222">${p(`<strong>${escapeHtml(NO_SCRIPT_NOTICE)}</strong>`)}</div></noscript>`,
    m.notice
      ? `<details><summary>Shareware: the author’s notice</summary><pre style="white-space:pre-wrap;font:13px monospace">${escapeHtml(m.notice)}</pre></details>`
      : '',
    m.fiction ? p(`<small>${escapeHtml(m.fiction)}</small>`) : '',
    m.audio ? p(`<small>${escapeHtml(m.audio.replace(/\s+/g, ' '))}</small>`) : '',
    p(`<small>${escapeHtml(PAGE_CAVEAT)}</small>`),
    p(
      `<small>Made with <a style="color:#9cf" href="${SITE_URL}">${escapeHtml(PRODUCT)}</a>` +
        ` · <a style="color:#9cf" href="${REPO_URL}">source code</a>` +
        ` · the player is <a style="color:#9cf" href="${REPO_URL}/blob/master/LICENSE">MIT licensed</a></small>`,
    ),
    `</main>`,
  ].join('');
}

/** "Made with …" for the corner of the start screen. */
export const CREDIT = { text: `Made with ${PRODUCT}`, site: SITE_URL, repo: REPO_URL } as const;
