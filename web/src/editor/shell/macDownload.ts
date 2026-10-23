// "Download for Mac": asks .dmg or .zip, says how to open an app Apple has not notarized,
// then builds the Mac app here in the browser (src/export/macApp.ts) and saves it.
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
  const { MAC_FIRST_OPEN } = await import('../../export/macApp');
  const format = await modal<Format>(`Download ${title} for Mac`, (close) => [
    h('p', null, `A Mac app of ${title} that plays offline, in its own window. It runs on Apple silicon and Intel Macs with macOS 11 Big Sur or later. It is built right here in your browser.`),
    h(
      'ol',
      { class: 'mac-steps' },
      h('li', null, 'Open the downloaded disk image and drag the game onto Applications (or unzip the .zip and move the app there).'),
      h('li', null, MAC_FIRST_OPEN),
    ),
    h('p', { class: 'meta' }, 'Saved games and high scores stay on the Mac, in the app.'),
    h(
      'div',
      { class: 'buttons' },
      h('button', { type: 'button', onclick: () => close('zip'), title: 'A .zip with the app inside: double-click it to unzip' }, 'Zip (.zip)'),
      h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close('dmg'), title: 'A disk image: open it and drag the game to Applications' }, 'Disk image (.dmg)'),
    ),
  ]);
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
