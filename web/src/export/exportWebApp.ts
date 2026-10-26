// Builds a stand-alone web app for one game: the one-page player with the game inside
// (index.html), icons, a web app manifest and an offline service worker, plus a copy of the
// game's files, zipped up and ready to unpack onto any static web host (GitHub Pages,
// Netlify, an S3 bucket…). index.html also plays straight from disk.
import { createZip, type ZipEntry } from '../project/zip';
import type { GameFiles } from '../project/files';
import { hashText, serviceWorkerSource } from './serviceWorker';
import { encodeGame, fillPage, GAME_MARK } from './singlePage';
import { gameAbout } from './gameAbout';
import { gameDescription, REPO_URL, SITE_URL } from '../seo/site';
import { PRODUCT } from '../edition';
import { recordedAudioNotice, recordedClips } from './recordedAudio';
import { PROJECT } from './notices';

export interface ExportOptions {
  title: string;
  gam: string;
  /** Short name for the home screen / dock (defaults to the title). */
  shortName?: string;
  themeColor?: string;
  /** Where the Game-Maker: Sandbox Edition app is served from (its standalone.html player is used). */
  appBase?: string;
  /** Our own games: made now, presented as a 1990s release (fiction.ts). */
  fiction?: string;
}

const ICONS = ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'icon.svg', 'apple-touch-icon.png'];
// Files a game writes while being played; exported apps start fresh.
const SAVE_DATA = /^(game\d\.sav|savnames\.dat|data\d+\.rec)$/;

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch ${url} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

export function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'game'
  );
}

export async function exportWebApp(files: GameFiles, opts: ExportOptions): Promise<{ name: string; zip: Uint8Array }> {
  const base = opts.appBase ?? new URL('./', location.href).href;
  // The player is the one-page player (standalone.html): one file with the engine, styles
  // and music worklet inside, built by the production build and served on demand by the
  // dev server. (Older versions copied the hashed build files listed in player-files.json,
  // which the dev server does not have: it answered with index.html, hence
  // "Unexpected token '<'" when that was read as JSON.)
  const res = await fetch(new URL('standalone.html', base)).catch(() => undefined);
  const template = res?.ok ? await res.text() : '';
  if (!template.includes(GAME_MARK)) {
    throw new Error('Could not load the game player (standalone.html). Reload Game-Maker: Sandbox Edition while online and try again.');
  }

  const entries: ZipEntry[] = [];
  const enc = new TextEncoder();
  const id = slug(opts.title);
  const theme = opts.themeColor ?? '#000000';

  const gameEntries = files.entries().filter(([n]) => !SAVE_DATA.test(n));
  const { blurb, notice } = gameAbout(gameEntries);
  const game = await encodeGame({ id, title: opts.title, gam: opts.gam, notice }, gameEntries);
  const audio = recordedAudioNotice(recordedClips(files), 78, '  ');
  entries.push({ name: 'index.html', data: enc.encode(customizePage(fillPage(template, game, { blurb, fiction: opts.fiction, audio }), theme)) });

  for (const icon of ICONS) {
    try {
      entries.push({ name: icon, data: await fetchBytes(new URL(icon, base).href) });
    } catch {
      /* optional */
    }
  }
  // The game's own files too, as a DOS-ready copy (index.html carries its own).
  for (const [name, data] of gameEntries) entries.push({ name: `game/${name.toUpperCase()}`, data });

  const manifest = {
    name: opts.title,
    short_name: (opts.shortName ?? opts.title).slice(0, 12),
    description: gameDescription({ title: opts.title, blurb }),
    start_url: './',
    scope: './',
    display: 'fullscreen',
    orientation: 'any',
    background_color: '#000000',
    theme_color: theme,
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  entries.push({ name: 'manifest.webmanifest', data: enc.encode(JSON.stringify(manifest, null, 2)) });

  const precache = ['./', ...entries.filter((e) => !e.name.startsWith('game/')).map((e) => e.name)];
  const version = hashText(entries.map((e) => `${e.name}:${e.data.length}`).join('|') + Date.now());
  entries.push({ name: 'sw.js', data: enc.encode(serviceWorkerSource(version, precache)) });
  entries.push({ name: 'README.txt', data: enc.encode(readme(opts.title, audio)) });
  entries.push({ name: 'LICENSE.txt', data: enc.encode(`${PROJECT}\n`) });

  return { name: `${id}-webapp.zip`, zip: await createZip(entries) };
}

function customizePage(html: string, theme: string): string {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const head = [
    '<link rel="manifest" href="./manifest.webmanifest" />',
    '<link rel="icon" href="./icon.svg" type="image/svg+xml" />',
    '<link rel="apple-touch-icon" href="./apple-touch-icon.png" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    // Offline: only over http(s); a page opened from disk has no service worker.
    "<script>if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('./sw.js').catch(function(){});</script>",
  ].join('\n    ');
  return html
    .replace(/<meta name="theme-color" content="[^"]*"\s*\/?>/, `<meta name="theme-color" content="${esc(theme)}" />`)
    .replace('</head>', `    ${head}\n  </head>`);
}

function readme(title: string, audio?: string): string {
  return `${title}
${'='.repeat(title.length)}

This folder is a complete, offline-capable web app made with
${PRODUCT}: ${SITE_URL}
(source code: ${REPO_URL}).

Publish it
  Upload the contents of this folder to any static web host (GitHub Pages,
  Netlify, Cloudflare Pages, an S3 bucket, your own server). It must be served
  over http(s); opening index.html straight from disk will not work.

Try it locally
  npx serve .        (or: python3 -m http.server)
  then open the address it prints.

Install it
  Open the site in Chrome, Edge or Safari and choose "Install" / "Add to Dock" /
  "Add to Home Screen". After the first visit it works without a network.

Controls
  Use the keys listed in the game's instructions. F1 help, F2 status,
  F3 music on/off, F4 sound on/off, F5 save, F6 load, Esc leaves a level.
  Game controllers work through the browser's Gamepad API. On phones and
  tablets on-screen buttons appear; turn the device either way.

The game folder
  game/ holds the game's original files, which also play in the DOS
  Game-Maker / PLAYGAME. index.html carries its own copy of them.

License
  The player (index.html, sw.js) is MIT licensed: see LICENSE.txt, which
  must stay with it when you share or publish it.
${audio ? `\nThe game's voice clips\n${audio}\n` : ''}`;
}
