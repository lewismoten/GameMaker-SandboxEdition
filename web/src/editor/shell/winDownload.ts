// "Download for Windows": asks .exe or .zip, says how to run a program Windows SmartScreen
// does not know, then builds the Windows program here in the browser (src/export/winApp.ts)
// and saves it. The dialog shares the Mac one's look (macDownload.css).
import './macDownload.css';
import { download, h, modal, toast } from '../core/ui';
import { plainError } from '../core/plainError';
import type { MacGame } from './macDownload';

/** The same as a Mac download needs: title, files, and optionally id, author, year and box colors. */
export type WinGame = MacGame;

type Format = 'exe' | 'zip';

/** The dialog, then the download. `load` gets the game's files once a format is chosen. */
export async function winDownload(title: string, load: () => Promise<WinGame>): Promise<void> {
  const format = await modal<Format>(`Download ${title} for Windows`, (close) =>
    h(
      'div',
      { class: 'mac-dialog win-dialog' },
      h('p', null, `${title} as a Windows program: one file that plays offline in its own window, on Windows 10 and 11. It is built right here in your browser.`),
      h(
        'ol',
        null,
        h('li', null, 'Double-click the downloaded program to play (unzip the .zip first). Nothing is installed.'),
        h('li', null, 'Windows may say “Windows protected your PC”, because the program is not code-signed. Click ', h('kbd', null, 'More info'), ', then ', h('kbd', null, 'Run anyway'), '.'),
      ),
      h('p', { class: 'meta' }, 'Saved games and high scores are kept on the PC. ', h('a', { href: '#/windows', onclick: () => close(undefined) }, 'More details →')),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close('zip'), title: 'A .zip with the program inside: unzip it, then double-click the program' }, 'Zip (.zip)'),
        h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close('exe'), title: 'The program itself: double-click it to play' }, 'Program (.exe)'),
      ),
    ),
  );
  if (!format) return;
  try {
    toast(`Building the Windows program of ${title}…`);
    const [win, { exportSinglePage }, mac, game] = await Promise.all([import('../../export/winApp'), import('../../export/exportSinglePage'), import('../../export/macApp'), load()]);
    const { slug } = await import('../../export/exportWebApp');
    const [{ html }, player] = await Promise.all([exportSinglePage(game.files, { title: game.title, gam: game.gam }), win.preferredArch().then((arch) => win.fetchWinPlayer(arch))]);
    const options = {
      title: game.title,
      id: game.id ?? slug(game.title),
      html,
      player,
      author: game.author,
      year: game.year,
      picture: mac.iconPicture(game.files, game.gam),
      colors: mac.boxColors(game.box),
    };
    const name = win.exeName(game.title);
    const base = name.replace(/\.exe$/, '');
    if (format === 'exe') download(name, await win.winExe(options), 'application/vnd.microsoft.portable-executable');
    else download(`${base}.zip`, await win.winExeZip(options), 'application/zip');
    toast(`Saved ${format === 'exe' ? name : `${base}.zip`}. ${format === 'exe' ? 'Double-click it to play.' : 'Unzip it, then double-click the program to play.'}`);
  } catch (e) {
    toast(plainError(e), 'error');
  }
}
