// "Export as one web page": one .html file with the player and every game file inside it.
// Double-click it to play — from disk, offline, no web server — or email / host it as is.
import type { PlayerAbout } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import type { GameFiles } from '../project/files';
import { slug } from './exportWebApp';
import { encodeGame, fillPage } from './singlePage';
import { titleImage } from './titleImage';
import { insideGame } from './insideGame';
import type { AboutGame } from '../project/aboutGame';
import { gameAbout } from './gameAbout';
import { recordedAudioNotice, recordedClips } from './recordedAudio';
import type { PlayerPatches } from '@lewismoten/gamemaker-sandbox-engine/player/patchRules';
import { withoutExtensions } from '@lewismoten/gamemaker-sandbox-engine/player/fileExtensions';

// Files a game writes while being played; exported pages start fresh.
const SAVE_DATA = /^(game\d\.sav|savnames\.dat|data\d+\.rec)$/;

interface SinglePageOptions {
  title: string;
  gam: string;
  /** Where the Game-Maker: Sandbox Edition app is served from (its standalone.html is the template). */
  appBase?: string;
  /** Our own games: made now, presented as a 1990s release (fiction.ts). */
  fiction?: string;
  /** The project's DOS player customizations, so the page shows XFERPLAY's screens as the DOS export does. */
  player?: PlayerPatches;
  /** "About this game" and the game's version (project/aboutGame.ts): visible credits and search-engine data on the page. */
  about?: AboutGame;
  version?: string;
  /** Animation and sound previews on the page; on unless false (project/companion.ts exportPreviewsOf). */
  previews?: boolean;
  /** An imported game's own About text and first build, so F10 shows what Play's does (dosPlayer/playerOrigin.ts). */
  playerAbout?: PlayerAbout;
}

export async function exportSinglePage(files: GameFiles, opts: SinglePageOptions): Promise<{ name: string; html: string }> {
  const base = opts.appBase ?? new URL('./', location.href).href;
  const res = await fetch(new URL('standalone.html', base)).catch(() => undefined);
  const template = res?.ok ? await res.text() : '';
  if (!template.includes('<!--GM:GAME-->')) {
    throw new Error('Could not load the one-page player (standalone.html). Reload Game-Maker: Sandbox Edition while online and try again.');
  }
  const id = slug(opts.title);
  const entries = files.entries().filter(([n]) => !SAVE_DATA.test(n));
  const { blurb, notice } = gameAbout(entries);
  // renamed file extensions are for the DOS download only
  const look = opts.player && withoutExtensions(opts.player);
  const player = look && Object.keys(look).length ? look : undefined;
  const about = opts.about ?? {};
  const inside = insideGame(entries, { title: opts.title, about, version: opts.version, previews: opts.previews });
  const game = await encodeGame(
    { id, title: opts.title, gam: opts.gam, notice, player, ...(opts.playerAbout ? { playerAbout: opts.playerAbout } : {}) },
    entries,
    inside.external,
  );
  return {
    name: `${id}.html`,
    html: fillPage(template, game, {
      blurb: about.description ?? blurb,
      author: about.author,
      company: about.company,
      year: /^\d{4}$/.test(about.year ?? '') ? Number(about.year) : undefined,
      about,
      version: opts.version,
      inside: inside.html,
      pictures: inside.pictures,
      fiction: opts.fiction,
      audio: recordedAudioNotice(recordedClips(files)),
      poster: await titleImage(files, opts.gam),
    }),
  };
}
