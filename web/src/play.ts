// play.html: full-window player.
//   play.html?game=<id>   a sample game from ./games/ (the CD's gameware)
//   play.html?project=<id> a project from the editor (IndexedDB)
//   exported web apps     ./game/manifest.json lists the bundled game files
import { mountPlayer } from './player/player';
import { GameFiles, loadCatalog, loadHostedGame } from './project/files';
import { loadProject, loadSaveData, writeSaveFile } from './project/storage';

interface BundleManifest {
  id: string;
  title: string;
  gam: string;
  files: string[];
}

const root = document.querySelector<HTMLElement>('#player')!;
document.documentElement.style.cssText = 'height:100%;background:#000';
document.body.style.cssText = 'margin:0;height:100%;background:#000';
root.style.cssText = 'width:100%;height:100%';

async function loadBundle(): Promise<{ id: string; title: string; gam: string; files: GameFiles } | undefined> {
  const res = await fetch('./game/manifest.json').catch(() => undefined);
  if (!res?.ok) return undefined;
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

async function choose(): Promise<{ id: string; title: string; gam: string; files: GameFiles; back?: string } | undefined> {
  const params = new URLSearchParams(location.search);
  const gameId = params.get('game');
  const projectId = params.get('project');
  if (projectId) {
    const p = await loadProject(projectId);
    if (p) return { id: `project:${projectId}`, title: p.record.name, gam: p.record.gam, files: p.files, back: './' };
  }
  if (gameId) {
    const entry = (await loadCatalog()).find((g) => g.id === gameId && g.gam);
    if (entry) return { id: `game:${entry.id}`, title: entry.title, gam: entry.gam!, files: await loadHostedGame(entry), back: './' };
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
  document.title = game.title;
  for (const [name, bytes] of Object.entries(await loadSaveData(game.id))) game.files.set(name, bytes);
  const start = () =>
    mountPlayer(root, game.files, game.gam, {
      title: game.title,
      onFileWrite: (name, bytes) => void writeSaveFile(game.id, name, bytes),
      onQuit: () => !game.back, // stand-alone apps go back to their menu
      onExit: () => {
        if (game.back) location.href = game.back;
        else start();
      },
    });
  start();
}

void main();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
}
