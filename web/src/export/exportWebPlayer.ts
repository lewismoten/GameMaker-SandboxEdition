// The web player download (docs/web-player.md): the one page that plays Game-Maker game
// folders on any web host (web-player.html, built by scripts/hostedPlayerBuild.ts), alone or
// in a zip ready to unpack onto a host: the page as index.html, a games.json listing this
// game, and the game's folder with its files under their DOS names (as exportDos.ts writes them).
import { createZip, type ZipEntry } from '../project/zip';
import type { GameFiles } from '../project/files';
import { REPO_URL } from '../seo/site';
import { dosNames, WEB_ONLY } from './exportDos';
import { PROJECT } from './notices';
import { recordedAudioNotice, recordedClips } from './recordedAudio';

const utf8 = (text: string) => new TextEncoder().encode(text);

interface WebPlayerOptions {
  title: string;
  gam: string;
  author?: string;
  year?: number;
  /** Where the Game-Maker: Sandbox Edition app is served from (its web-player.html is used). */
  appBase?: string;
}

/** The web player page, as the site serves it. */
export async function fetchWebPlayer(appBase = new URL('./', location.href).href): Promise<string> {
  const res = await fetch(new URL('web-player.html', appBase)).catch(() => undefined);
  if (!res?.ok) throw new Error('The web player is not part of this build (it is made by the site’s build).');
  return res.text();
}

/** games.json for the zip: this game alone, in its folder. */
export function playerGameList(opts: Pick<WebPlayerOptions, 'title' | 'gam' | 'author' | 'year'>, folder: string): string {
  const game = {
    title: opts.title,
    folder: `${folder}/`,
    gam: opts.gam.toUpperCase(),
    ...(opts.author ? { author: opts.author } : {}),
    ...(opts.year ? { year: opts.year } : {}),
  };
  return `${JSON.stringify({ title: opts.title, games: [game] }, null, 1)}\n`;
}

export async function exportWebPlayer(files: GameFiles, opts: WebPlayerOptions): Promise<{ name: string; zip: Uint8Array }> {
  const html = await fetchWebPlayer(opts.appBase);
  const folder = opts.gam.replace(/\.gam$/i, '').toLowerCase();
  const renamed = dosNames(files, opts.gam);
  const stored = files.names().filter((n) => !WEB_ONLY.test(n));
  const audio = recordedAudioNotice(recordedClips(files));
  const entries: ZipEntry[] = [
    { name: 'index.html', data: utf8(html) },
    { name: 'games.json', data: utf8(playerGameList(opts, folder)) },
    ...stored.map((n) => ({ name: `${folder}/${(renamed.get(n) ?? n).toUpperCase()}`, data: files.get(n)! })),
    { name: 'README.txt', data: utf8(readme(opts.title)) },
    { name: 'LICENSE.txt', data: utf8(audio ? `${audio}\n\n${'-'.repeat(78)}\n\n${PROJECT}\n` : `${PROJECT}\n`) },
  ];
  return { name: `${folder}-web-player.zip`, zip: await createZip(entries) };
}

function readme(title: string): string {
  return `${title}, in the Game-Maker web player

index.html is the web player: one page that plays the Game-Maker game folders beside it.
games.json lists them, and the game's folder holds its files as they were on a DOS disk.

Put the three on any web host, as they are, and open index.html there. Opened straight
from a disk, the browser does not let the page read the folder; a local server such as
"python3 -m http.server" works for trying it out. Add more game folders and list them in
games.json to play those too.

How to host it: ${REPO_URL}/blob/master/docs/web-player.md
`;
}
