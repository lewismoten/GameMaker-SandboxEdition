// Builds a stand-alone web app for one game: the player (from the deployed build),
// the game's files, a web app manifest and an offline service worker, zipped up and
// ready to unpack onto any static web host (GitHub Pages, Netlify, an S3 bucket…).
import { createZip, type ZipEntry } from '../project/zip';
import type { GameFiles } from '../project/files';
import { hashText, serviceWorkerSource } from './serviceWorker';

export interface ExportOptions {
  title: string;
  gam: string;
  /** Short name for the home screen / dock (defaults to the title). */
  shortName?: string;
  themeColor?: string;
  /** Where the built Game-Maker Web app is served from (its player is copied). */
  appBase?: string;
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
  const listRes = await fetch(new URL('player-files.json', base)).catch(() => undefined);
  if (!listRes?.ok) {
    throw new Error('Exporting needs the built app (run "npm run build" and "npm run preview", or use the GitHub Pages site).');
  }
  const { files: playerFiles }: { files: string[] } = await listRes.json();

  const entries: ZipEntry[] = [];
  const enc = new TextEncoder();
  const id = slug(opts.title);
  const theme = opts.themeColor ?? '#000000';

  for (const f of playerFiles) {
    let data = await fetchBytes(new URL(f, base).href);
    if (f === 'play.html') {
      data = enc.encode(customizePage(new TextDecoder().decode(data), opts.title, theme));
      entries.push({ name: 'index.html', data });
    } else entries.push({ name: f, data });
  }
  for (const icon of ICONS) {
    try {
      entries.push({ name: icon, data: await fetchBytes(new URL(icon, base).href) });
    } catch {
      /* optional */
    }
  }

  const gameFiles = files.names().filter((n) => !SAVE_DATA.test(n));
  for (const name of gameFiles) entries.push({ name: `game/${name}`, data: files.get(name)! });
  entries.push({ name: 'game/manifest.json', data: enc.encode(JSON.stringify({ id, title: opts.title, gam: opts.gam, files: gameFiles }, null, 1)) });

  const manifest = {
    name: opts.title,
    short_name: (opts.shortName ?? opts.title).slice(0, 12),
    description: `${opts.title} — a Game-Maker game.`,
    start_url: './',
    scope: './',
    display: 'fullscreen',
    orientation: 'landscape',
    background_color: '#000000',
    theme_color: theme,
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  entries.push({ name: 'manifest.webmanifest', data: enc.encode(JSON.stringify(manifest, null, 2)) });

  const precache = ['./', ...entries.map((e) => e.name)];
  const version = hashText(entries.map((e) => `${e.name}:${e.data.length}`).join('|') + Date.now());
  entries.push({ name: 'sw.js', data: enc.encode(serviceWorkerSource(version, precache)) });
  entries.push({ name: 'README.txt', data: enc.encode(readme(opts.title)) });

  return { name: `${id}-webapp.zip`, zip: await createZip(entries) };
}

function customizePage(html: string, title: string, theme: string): string {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
  const head = [
    '<link rel="manifest" href="./manifest.webmanifest" />',
    '<link rel="icon" href="./icon.svg" type="image/svg+xml" />',
    '<link rel="apple-touch-icon" href="./apple-touch-icon.png" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
  ].join('\n    ');
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="theme-color" content="[^"]*"\s*\/?>/, `<meta name="theme-color" content="${esc(theme)}" />`)
    .replace('</head>', `    ${head}\n  </head>`);
}

function readme(title: string): string {
  return `${title}
${'='.repeat(title.length)}

This folder is a complete, offline-capable web app made with Game-Maker Web.

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
  Game controllers work through the browser's Gamepad API.
`;
}
