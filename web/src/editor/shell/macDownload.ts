// "Download for Mac": asks .dmg or .zip, says how to open an app Apple has not notarized,
// then builds the Mac app here in the browser (src/export/macApp.ts) and saves it.
import './macDownload.css';
import { download, h, modal, toast } from '../core/ui';
import { plainError } from '../core/plainError';
import type { GameFiles } from '../../project/files';

export interface MacGame {
  title: string;
  gam: string;
  files: GameFiles;
  /** Bundle identifier suffix (com.lewismoten.gamemaker.<id>); the title's slug when absent. */
  id?: string;
  author?: string;
  year?: number;
  /** An original game's box: the icon takes its colors. */
  box?: { background?: string };
}

type Format = 'dmg' | 'zip';

/** The dialog, then the download. `load` gets the game's files once a format is chosen. */
export async function macDownload(title: string, load: () => Promise<MacGame>): Promise<void> {
  const format = await modal<Format>(`Download ${title} for Mac`, (close) =>
    h(
      'div',
      { class: 'mac-dialog' },
      h('p', null, `${title} as a Mac app: it plays offline in its own window, on Apple silicon and Intel Macs with macOS 11 Big Sur or later. It is built right here in your browser.`),
      h(
        'ol',
        null,
        h('li', null, 'Open the disk image and drag the game onto Applications (or unzip the .zip and move the app there).'),
        h(
          'li',
          null,
          'The first time you open it, macOS warns that it cannot check the app: it is not notarized by Apple (that takes a paid Apple developer account). Click ',
          h('kbd', null, 'Done'),
          ', then open System Settings → Privacy & Security and click ',
          h('kbd', null, 'Open Anyway'),
          '. On macOS 14 or earlier you can instead Control-click the app and choose ',
          h('kbd', null, 'Open'),
          '. After that it opens like any app.',
        ),
      ),
      h('p', { class: 'meta' }, 'Saved games and high scores are kept on the Mac.'),
      h(
        'div',
        { class: 'buttons' },
        h('button', { type: 'button', onclick: () => close('zip'), title: 'A .zip with the app inside: double-click it to unzip' }, 'Zip (.zip)'),
        h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close('dmg'), title: 'A disk image: open it and drag the game to Applications' }, 'Disk image (.dmg)'),
      ),
    ),
  );
  if (!format) return;
  try {
    toast(`Building the Mac app of ${title}…`);
    const [mac, { exportSinglePage }, game] = await Promise.all([import('../../export/macApp'), import('../../export/exportSinglePage'), load()]);
    const { slug } = await import('../../export/exportWebApp');
    const [{ html }, player] = await Promise.all([exportSinglePage(game.files, { title: game.title, gam: game.gam }), mac.fetchMacPlayer()]);
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
    const base = mac.appName(game.title).replace(/\.app$/, '');
    if (format === 'dmg') download(`${base}.dmg`, await mac.macAppDmg(options), 'application/x-apple-diskimage');
    else download(`${base}.zip`, await mac.macAppZip(options), 'application/zip');
    toast(`Saved ${base}.${format}. ${format === 'dmg' ? 'Open it and drag the game to Applications.' : 'Unzip it and move the app to Applications.'}`);
  } catch (e) {
    toast(plainError(e), 'error');
  }
}
