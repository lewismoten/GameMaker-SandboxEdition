// Entry point of the one-page player (built into standalone.html, see scripts/singlePageBuild.ts).
// It reads the game embedded in the page and plays it; high scores and saved games go to
// localStorage, keyed by the game's id, because the page may be opened from file://.
import { mountPlayer } from '../player/player';
import { GameFiles } from '../project/files';
import { decodeGame, fromBase64, GAME_ELEMENT_ID, toBase64, type SinglePageGame } from './singlePage';

const root = document.querySelector<HTMLElement>('#player')!;
document.documentElement.style.cssText = 'height:100%;background:#000';
document.body.style.cssText = 'margin:0;height:100%;background:#000';
root.style.cssText = 'width:100%;height:100%;color:#ccc;font:16px system-ui';

const saveKey = (id: string) => `gamemaker-web:saves:${id}`;

function loadSaves(id: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(saveKey(id)) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function writeSave(id: string, name: string, bytes: Uint8Array): void {
  try {
    const saves = loadSaves(id);
    saves[name] = toBase64(bytes);
    localStorage.setItem(saveKey(id), JSON.stringify(saves));
  } catch (e) {
    console.warn('Could not store save data', e);
  }
}

async function main(): Promise<void> {
  root.textContent = 'Loading…';
  const el = document.getElementById(GAME_ELEMENT_ID);
  if (!el) {
    root.textContent = 'This page has no game in it. Export one from Game-Maker Web (Save & share → Export as one web page).';
    return;
  }
  const game = JSON.parse(el.textContent ?? '') as SinglePageGame;
  el.remove(); // the parsed copy is all we need; free the text
  const files = new GameFiles(await decodeGame(game));
  for (const [name, b64] of Object.entries(loadSaves(game.id))) files.set(name, fromBase64(b64));
  document.title = game.title;
  const start = () =>
    mountPlayer(root, files, game.gam, {
      title: game.title,
      onFileWrite: (name, bytes) => writeSave(game.id, name, bytes),
      onQuit: () => false, // "Quit" shows the game's menu again
      onExit: start,
    });
  start();
}

main().catch((e: Error) => {
  console.error(e);
  root.textContent = `The game could not start: ${e.message}`;
});
