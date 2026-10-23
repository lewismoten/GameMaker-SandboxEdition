// play.html: full-window player.
//   play.html?game=<id>   a game from ./games/ (the CD's gameware and shareware, the new games)
//   play-<id>.html         the same, the game named by the page (<meta name="gm:game">)
//   play.html?project=<id> a project from the editor (IndexedDB)
//   exported web apps     ./game/manifest.json lists the bundled game files
import { mountPlayer } from './player/player';
import { watchForUpdates } from './devReload';
import { GameFiles, loadCatalogList, withDetails, type CatalogEntry } from './project/files';
import { streamHostedGame } from './project/streamGame';
import { loadProject, loadSaveData, writeSaveFile } from './project/storage';
import { registerServiceWorker } from './offline';
import { playAchievements, playWrote } from './achievements';

interface BundleManifest {
  id: string;
  title: string;
  gam: string;
  files: string[];
}

const root = document.querySelector<HTMLElement>('#player')!;
/** A game's own page (play-<id>.html) names its game; its title is already the right one. */
const pageGame = document.querySelector<HTMLMetaElement>('meta[name="gm:game"]')?.content || null;
document.documentElement.style.cssText = 'height:100%;background:#000';
document.body.style.cssText = 'margin:0;height:100%;background:#000';
root.style.cssText = 'width:100%;height:100%';

async function loadBundle(): Promise<{ id: string; title: string; gam: string; files: GameFiles } | undefined> {
  const res = await fetch('./game/manifest.json').catch(() => undefined);
  // A dev server answers a missing file with index.html (status 200): only JSON is a bundle.
  if (!res?.ok || !res.headers.get('content-type')?.includes('json')) return undefined;
  const m: BundleManifest = await res.json();
  const files = new GameFiles();
  await Promise.all(
    m.files.map(async (name) => {
      const r = await fetch(`./game/${name}`);
      if (r.ok) files.set(name, new Uint8Array(await r.arrayBuffer()));
    }),
  );
  return { id: `bundle:${m.id}`, title: m.title, gam: m.gam, files };
}

/** A shot of the game's first level, for the start screen (drawn while you read it). */
async function posterOf(entry: CatalogEntry): Promise<string | undefined> {
  const { renderShot } = await import('./desk/boxes/boxArt');
  const c = document.createElement('canvas');
  c.width = 320;
  c.height = 200;
  return (await renderShot(entry, c, 16, 10)) ? c.toDataURL() : undefined;
}

async function choose(): Promise<
  { id: string; title: string; gam: string; files: GameFiles; back?: string; notice?: string; poster?: Promise<string | undefined> } | undefined
> {
  const params = new URLSearchParams(location.search);
  const gameId = params.get('game') ?? pageGame;
  const projectId = params.get('project');
  if (projectId) {
    const p = await loadProject(projectId);
    if (p) return { id: `project:${projectId}`, title: p.record.name, gam: p.record.gam, files: p.files, back: './' };
  }
  if (gameId) {
    // the short catalog: the play page needs no manuals; a shareware game's notice comes on its own
    const listed = (await loadCatalogList()).find((g) => g.id === gameId && g.gam);
    const entry = listed?.kind === 'shareware' ? await withDetails(listed) : listed;
    if (entry) {
      // the game starts once its .gam is in; the rest arrive while it plays, as needed (streamGame.ts)
      const streamed = streamHostedGame(entry);
      await streamed.started;
      return {
        id: `game:${entry.id}`,
        title: entry.title,
        gam: entry.gam!,
        files: streamed.files,
        back: './',
        poster: posterOf(entry).catch(() => undefined),
        notice: entry.kind === 'shareware' ? entry.notice || 'This game is shareware, copyrighted by its author.' : undefined,
      };
    }
  }
  return loadBundle();
}

async function main(): Promise<void> {
  root.textContent = 'Loading…';
  root.style.color = '#ccc';
  root.style.font = '16px system-ui';
  const game = await choose();
  if (!game) {
    location.replace('./');
    return;
  }
  if (!pageGame) document.title = game.title;
  // the page's heading, for screen readers (the game's screen is the page)
  // (in a header: the player's <main> is replaced as each game starts)
  const heading = document.createElement('header');
  heading.append(Object.assign(document.createElement('h1'), { textContent: game.title }));
  heading.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap';
  document.body.prepend(heading);
  for (const [name, bytes] of Object.entries(await loadSaveData(game.id))) game.files.set(name, bytes);
  const start = () =>
    mountPlayer(root, game.files, game.gam, {
      title: game.title,
      notice: game.notice,
      poster: game.poster,
      back: game.back ? { href: game.back, label: '← All games' } : undefined,
      onFileWrite: (name, bytes) => (playWrote(game.id, name), void writeSaveFile(game.id, name, bytes)),
      saveId: game.id,
      ...playAchievements(game.id),
      onQuit: () => !game.back, // stand-alone apps go back to their menu
      onExit: () => {
        if (game.back) location.href = game.back;
        else start();
      },
    });
  start();
}

void main();

registerServiceWorker();

watchForUpdates();
