// Entry point of the web player (built into one file, web-player.html, by
// scripts/hostedPlayerBuild.ts; docs/web-player.md). Put beside old Game-Maker game folders on
// any web host, it reads games.json (or ?list=), lists the games, and plays one (?game=<id>,
// or a folder's name) from the files in its folder. Saves go to IndexedDB (saves.ts).
import '../export/credit.css';
import './hosted.css';
import { mountPlayer } from '../player/player';
import { GameFiles } from '../project/files';
import { gameAbout } from '../export/gameAbout';
import { notTrueDosNotice } from '../linkIn/notice';
import { CREDIT } from '../export/pageSeo';
import { findGame, listUrl, parseGameList, type GameList, type ListedGame } from './list';
import { loadListedGame } from './load';
import { loadSaves, writeSave } from './saves';
import { listHref, renderFront } from './page';

const root = document.getElementById('wp-root')!;
const params = new URLSearchParams(location.search);
const listParam = params.get('list');

/** The list beside the page; undefined when there is none, an Error when it is broken. */
async function fetchList(): Promise<GameList | Error | undefined> {
  const url = listUrl(listParam, location.href);
  let res: Response;
  try {
    res = await fetch(url, { cache: 'no-cache' });
  } catch {
    return location.protocol === 'file:'
      ? new Error('Opened from a file, the player cannot read its game folders. Put it on a web host (or a local web server) with them.')
      : undefined;
  }
  if (!res.ok) return listParam ? new Error(`The game list ${listParam} could not be loaded (the server answered ${res.status}).`) : undefined;
  try {
    return parseGameList(await res.text(), url);
  } catch (e) {
    return new Error(`${(e as Error).message} (${url})`);
  }
}

/** "Made with …" in the corner while the start screen shows, as on an exported page. */
function showCredit(): void {
  const link = (href: string, text: string) => Object.assign(document.createElement('a'), { href, textContent: text, target: '_blank', rel: 'noopener' });
  const credit = document.createElement('aside');
  credit.className = 'gm-made-with';
  credit.setAttribute('aria-label', 'Credit');
  credit.append(link(CREDIT.site, CREDIT.text), ' · ', link(CREDIT.repo, 'source'));
  document.body.append(credit);
  const update = () => (credit.hidden = !root.querySelector('.gm-start'));
  new MutationObserver(update).observe(root, { childList: true });
  update();
}

async function play(game: ListedGame): Promise<void> {
  document.body.className = 'wp-playing';
  root.setAttribute('role', 'main'); // the game and its links are the page's main content
  document.title = game.title;
  root.textContent = `Loading ${game.title}…`;
  const { gam, entries } = await loadListedGame(game, (done, total) => (root.textContent = `Loading ${game.title}… ${done} of ${total} files`));
  const files = new GameFiles(entries);
  for (const [name, bytes] of Object.entries(await loadSaves(game.id))) files.set(name, bytes);
  const { notice } = gameAbout(entries);
  const start = () =>
    mountPlayer(root, files, gam, {
      title: game.title,
      notice,
      back: { href: listHref(listParam), label: '← All games' },
      onFileWrite: (name, bytes) => void writeSave(game.id, name, bytes),
      onQuit: () => false, // "Quit" shows the game's menu again
      onExit: start,
    });
  start();
  showCredit();
  void notTrueDosNotice();
}

async function main(): Promise<void> {
  const fetched = await fetchList();
  const list = fetched instanceof Error ? undefined : fetched;
  const listProblem = fetched instanceof Error ? fetched.message : undefined;
  const wanted = params.get('game');
  if (wanted) {
    const game = findGame(wanted, list, location.href);
    if (game) {
      try {
        await play(game);
      } catch (e) {
        console.error(e);
        root.removeAttribute('role');
        renderFront(root, list, listParam, `${game.title} could not start: ${(e as Error).message}`);
      }
      return;
    }
    renderFront(root, list, listParam, listProblem ?? `No game called “${wanted}” is here.`);
    return;
  }
  renderFront(root, list, listParam, listProblem);
}

main().catch((e: Error) => {
  console.error(e);
  root.textContent = `The player could not start: ${e.message}`;
});
