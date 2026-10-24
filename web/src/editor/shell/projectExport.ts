// Downloading a game of yours from the home page: its Download button and its ⋯ More menu's
// Download… item open the chooser (download.ts) for the stored project.
import { h, toast } from '../core/ui';
import { loadProject } from '../../project/storage';
import { parseGame } from '../../formats/game';
import { chooseDownload, downloadButton, type DownloadGame } from './download';

/** The project as the chooser takes it, or undefined when it is gone from this browser. */
async function projectGame(id: string): Promise<DownloadGame | undefined> {
  const p = await loadProject(id);
  if (!p) {
    toast('That game is not in this browser any more.', 'error');
    return undefined;
  }
  const title = parseGame(p.files.get(p.record.gam)!).scenes[0]?.desc || p.record.name;
  return { title, gam: p.record.gam, files: async () => p.files, project: true, companion: () => p.record.companion };
}

/** Opens the chooser for a game of yours. */
export async function downloadProject(id: string): Promise<void> {
  const game = await projectGame(id);
  if (game) await chooseDownload(game);
}

/** The Download button for a game of yours (the panel at the top of the home page). */
export function projectDownloadButton(id: string, title: string): HTMLElement {
  return downloadButton(title, () => downloadProject(id));
}

/** The ⋯ More menu's item. */
export function projectDownloadItem(id: string): HTMLElement {
  return h(
    'button',
    { 'aria-haspopup': 'dialog', onclick: () => void downloadProject(id), title: 'Download it to play on Windows, a Mac, Linux, the web or DOS, or its files' },
    'Download…',
  );
}
