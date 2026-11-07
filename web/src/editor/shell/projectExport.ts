// Downloading a game of yours from the home page: its Download button and its ⋯ More menu's
// Download… item open the chooser (download.ts, loaded when pressed) for the stored project.
import { h, toast } from '../core/ui';
import { loadProject, saveProject } from '../../project/storage';
import { parseCompanion, setExportPreviews } from '../../project/companion';
import { parseGame, gameTitle } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { DownloadGame } from './download';
import { downloadButton } from './downloadButton';

/** The project as the chooser takes it, or undefined when it is gone from this browser. */
async function projectGame(id: string): Promise<DownloadGame | undefined> {
  const p = await loadProject(id);
  if (!p) {
    toast('That game is not in this browser any more.', 'error');
    return undefined;
  }
  // trimmed: authors padded the name with spaces to center it on the DOS menu
  const title = gameTitle(parseGame(p.files.get(p.record.gam)!)) || p.record.name;
  return {
    title,
    pocketContext: async () => {
      const { pocketProjectUid } = await import('../../export/pocketLibrary');
      const c = parseCompanion(p.record.companion);
      const uid = pocketProjectUid(c);
      p.record.companion = c;
      await saveProject(id, p.record.name, p.record.gam, p.files, c);
      const { isImported } = await import('./homeOrigin');
      return { uid, category: isImported(id) ? ['imported', 'unsorted'] : ['mine'] };
    },
    gam: p.record.gam,
    files: async () => p.files,
    project: true,
    companion: () => p.record.companion,
    // kept with the stored project, like the editor's own
    setPreviews: (on) => {
      const c = parseCompanion(p.record.companion);
      setExportPreviews(c, on);
      p.record.companion = c;
      void saveProject(id, p.record.name, p.record.gam, p.files, c);
    },
  };
}

/** Opens the chooser for a game of yours. */
async function downloadProject(id: string): Promise<void> {
  const game = await projectGame(id);
  if (game) await (await import('./download')).chooseDownload(game);
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
