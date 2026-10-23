// "Download for Linux": says what is in the download and what it needs, then builds the
// game's folder here in the browser (src/export/linuxApp.ts) and saves it as a .tar.gz.
// The dialog shares the Mac one's look (macDownload.css).
import './macDownload.css';
import { download, h, modal, toast } from '../core/ui';
import { plainError } from '../core/plainError';
import type { MacGame } from './macDownload';

/** The dialog, then the download. `load` gets the game's files once the visitor goes ahead. */
export async function linuxDownload(title: string, load: () => Promise<MacGame>): Promise<void> {
  const go = await modal<boolean>(`Download ${title} for Linux`, (close) =>
    h(
      'div',
      { class: 'mac-dialog linux-dialog' },
      h('p', null, `${title} for Linux: a folder that plays offline in a window of its own, on x86_64 and Arm (aarch64) PCs. It is built right here in your browser.`),
      h(
        'ol',
        null,
        h('li', null, 'Extract the .tar.gz, open the folder and run ', h('kbd', null, 'play.sh'), '. Run ', h('kbd', null, 'install.sh'), ' to add it to your applications menu.'),
        h('li', null, 'It uses WebKitGTK, which most desktops have. Without it, the game opens in your web browser instead.'),
      ),
      h('p', { class: 'meta' }, 'Saved games and high scores are kept on the PC. ', h('a', { href: '#/linux', onclick: () => close(undefined) }, 'More details →')),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close(true), title: 'A .tar.gz with the game folder inside' }, 'Download (.tar.gz)'),
      ),
    ),
  );
  if (!go) return;
  try {
    toast(`Building the Linux download of ${title}…`);
    const [linux, { exportSinglePage }, mac, game] = await Promise.all([import('../../export/linuxApp'), import('../../export/exportSinglePage'), import('../../export/macApp'), load()]);
    const { slug } = await import('../../export/exportWebApp');
    const [{ html }, players] = await Promise.all([exportSinglePage(game.files, { title: game.title, gam: game.gam }), linux.fetchLinuxPlayers()]);
    const name = `${linux.folderName(game.title)}.tar.gz`;
    const tgz = await linux.linuxTarGz({
      title: game.title,
      id: game.id ?? slug(game.title),
      html,
      players,
      author: game.author,
      year: game.year,
      picture: mac.iconPicture(game.files, game.gam),
      colors: mac.boxColors(game.box),
    });
    download(name, tgz, 'application/gzip');
    toast(`Saved ${name}. Extract it, then run play.sh in the folder.`);
  } catch (e) {
    toast(plainError(e), 'error');
  }
}
