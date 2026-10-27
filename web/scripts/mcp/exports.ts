// The MCP server's exports: the editor's own (src/export) run in Node. Each fetches the players
// and page templates from "where the app is served"; here that is a built site on disk (web/dist
// unless --app-dir names another), with web/public for the native players, read through a
// fetch that only answers for that one made-up address. Nothing goes on the network.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { GameFiles } from '../../src/project/files';
import type { PlayerPatches } from '../../src/dosPlayer/patchRules';
import { ToolError } from '../../src/assistant/tools/types';
import { REPO } from './roots';

const BASE = 'http://gamemaker-app.invalid/';

/** Answers requests for BASE from the app folders (the build first, then public/). */
function localFetch(dirs: string[]): typeof fetch {
  return async (input) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (!url.href.startsWith(BASE)) throw new Error(`No network: ${url.href} was not fetched.`);
    const rel = decodeURIComponent(url.pathname.slice(1));
    for (const d of dirs) {
      const p = resolve(d, rel);
      if (p.startsWith(resolve(d)) && existsSync(p)) return new Response(new Uint8Array(readFileSync(p)));
    }
    return new Response('not found', { status: 404 });
  };
}

export const EXPORT_FORMATS = ['dos', 'web_page', 'web_app', 'web_player', 'windows', 'mac', 'linux'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

interface ExportJob {
  files: GameFiles;
  gam: string;
  title: string;
  player: PlayerPatches;
  format: ExportFormat;
  /** The built site (default web/dist). */
  appDir?: string;
}

/** Builds one download; returns its file name and bytes. */
export async function buildExport(job: ExportJob): Promise<{ name: string; data: Uint8Array; note: string }> {
  const appDir = job.appDir ?? join(REPO, 'web', 'dist');
  if (!existsSync(join(appDir, 'standalone.html')) && job.format !== 'dos')
    throw new ToolError(
      `No built site at ${appDir} (it needs standalone.html). Run "npm run build" in web/, or pass --app-dir to a "vite build --outDir" folder.`,
    );
  if (job.format === 'web_player' && !existsSync(join(appDir, 'web-player.html')))
    throw new ToolError(`The built site at ${appDir} has no web-player.html; build it again (npm run build) to export the web player.`);
  const was = globalThis.fetch;
  globalThis.fetch = localFetch([appDir, join(REPO, 'web', 'public')]);
  try {
    const { title, gam, files, player } = job;
    const utf8 = (s: string) => new TextEncoder().encode(s);
    const base = { title, gam, appBase: BASE, player };
    switch (job.format) {
      case 'dos': {
        const { exportDos } = await import('../../src/export/exportDos');
        const r = await exportDos(files, base);
        return { name: r.name, data: r.zip, note: `In DOSBox, run ${r.exe} from the unzipped folder.` };
      }
      case 'web_page': {
        const { exportSinglePage } = await import('../../src/export/exportSinglePage');
        const r = await exportSinglePage(files, base);
        return { name: r.name, data: utf8(r.html), note: 'Open it in any browser to play.' };
      }
      case 'web_app': {
        const { exportWebApp } = await import('../../src/export/exportWebApp');
        const r = await exportWebApp(files, base);
        return { name: r.name, data: r.zip, note: 'Unzip it onto any static web host.' };
      }
      case 'web_player': {
        const { exportWebPlayer } = await import('../../src/export/exportWebPlayer');
        const r = await exportWebPlayer(files, base);
        return { name: r.name, data: r.zip, note: 'Unzip it onto a web host and open index.html there.' };
      }
      default:
        return await nativeExport(job, base);
    }
  } finally {
    globalThis.fetch = was;
  }
}

async function nativeExport(job: ExportJob, base: { title: string; gam: string; appBase: string; player: PlayerPatches }) {
  const [{ exportSinglePage }, { slug }, mac, audio] = await Promise.all([
    import('../../src/export/exportSinglePage'),
    import('../../src/export/exportWebApp'),
    import('../../src/export/macApp'),
    import('../../src/export/recordedAudio'),
  ]);
  const { html } = await exportSinglePage(job.files, base);
  const o = {
    title: job.title,
    id: slug(job.title),
    html,
    picture: mac.iconPicture(job.files, job.gam),
    audio: audio.recordedAudioNotice(audio.recordedClips(job.files)),
  };
  if (job.format === 'windows') {
    const win = await import('../../src/export/winApp');
    const player = await win.fetchWinPlayer('x64', BASE);
    return {
      name: win.exeName(job.title).replace(/\.exe$/, '.zip'),
      data: await win.winExeZip({ ...o, player }),
      note: 'Unzip it, then double-click the program.',
    };
  }
  if (job.format === 'mac') {
    const player = await mac.fetchMacPlayer(BASE);
    return {
      name: `${mac.appName(job.title).replace(/\.app$/, '')}.dmg`,
      data: await mac.macAppDmg({ ...o, player }),
      note: 'Open it and drag the game to Applications.',
    };
  }
  const linux = await import('../../src/export/linuxApp');
  const players = await linux.fetchLinuxPlayers(BASE);
  return { name: `${linux.folderName(job.title)}.tar.gz`, data: await linux.linuxTarGz({ ...o, players }), note: 'Extract it, then run play.sh.' };
}
