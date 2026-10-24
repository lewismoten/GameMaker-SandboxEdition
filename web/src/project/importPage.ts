// Opening a game that was saved with "Export as one web page" (or an exported web app's
// index.html): the page carries every game file in its <script id="gm-game">, so it can
// come back as an ordinary Game-Maker project.
import { decodeGame, readSinglePage } from '../export/singlePage';
import { GameFiles } from './files';

interface PageGame {
  title: string;
  gam: string;
  files: GameFiles;
}

/** The game inside an exported page's HTML, or undefined if the page has none. */
export async function gameFromPageHtml(html: string): Promise<PageGame | undefined> {
  const game = readSinglePage(html);
  if (!game) return undefined;
  const files = new GameFiles(await decodeGame(game));
  const gam = files.mainGame(game.gam) ?? game.gam;
  return { title: game.title, gam, files };
}

/** The first picked/dropped .html file that holds a game. */
export async function gameFromPageFiles(list: File[]): Promise<PageGame | undefined> {
  for (const f of list) {
    if (!/\.html?$/i.test(f.name)) continue;
    const found = await gameFromPageHtml(await f.text());
    if (found) return found;
  }
  return undefined;
}
