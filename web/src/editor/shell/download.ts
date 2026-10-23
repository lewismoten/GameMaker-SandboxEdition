// "Download": one button for a game, wherever it is shown or opened (the home page's panel,
// a game of yours' ⋯ More menu, the editor), and the chooser it opens. The chooser lists
// every way the game can leave the browser, with the visitor's own system chosen:
//
// - Windows: a program (.exe; or a .zip of it), src/export/winApp.ts;
// - Mac: an app on a disk image (.dmg; or a .zip), src/export/macApp.ts;
// - Linux: a folder with play.sh (.tar.gz), src/export/linuxApp.ts;
// - Web: the game and its player in one page (.html), exportSinglePage.ts; or a web app to
//   put on a web host (.zip), exportWebApp.ts;
// - DOS: the original Game-Maker files with the stand-alone player (.zip), exportDos.ts;
// - a game of yours also: its files as they are here (.zip), to keep safe or import again.
//
// Everything is built here in the browser when the visitor presses Download. Which games
// have the button is the caller's choice (catalogDownloadable for the catalog's).
import './download.css';
import { download, h, modal, toast } from '../core/ui';
import { plainError } from '../core/plainError';
import { icon } from './homeIcons';
import type { CatalogEntry, GameFiles } from '../../project/files';

export interface DownloadGame {
  title: string;
  gam: string;
  /** The game's files (fetched only once the visitor chooses). */
  files: () => Promise<GameFiles>;
  /** Names its folders and app ids; the title's slug when absent. */
  id?: string;
  author?: string;
  year?: number;
  /** An original game's box: the icons take its colors. */
  box?: { background?: string };
  /** A game of yours: its files can be downloaded as they are, too. */
  project?: boolean;
}

export type DownloadKind = 'windows' | 'mac' | 'linux' | 'web' | 'dos' | 'files';

interface Choice {
  kind: DownloadKind;
  name: string;
  format: string;
  /** The second format the same choice offers. */
  alt?: string;
  line: string;
  details?: string;
}

const CHOICES: Choice[] = [
  {
    kind: 'windows',
    name: 'Windows',
    format: '.exe',
    alt: '.zip',
    line: 'A program to double-click, for Windows 10 and 11. It is not code-signed, so the first time choose More info → Run anyway.',
    details: '#/windows',
  },
  {
    kind: 'mac',
    name: 'Mac',
    format: '.dmg',
    alt: '.zip',
    line: 'An app for macOS 11 or later, Apple silicon or Intel. It is not notarized, so the first time open it from System Settings → Privacy & Security.',
    details: '#/mac',
  },
  { kind: 'linux', name: 'Linux', format: '.tar.gz', line: 'A folder with play.sh, which plays it in a window with WebKitGTK (or in your browser).', details: '#/linux' },
  { kind: 'web', name: 'Web page', format: '.html', alt: '.zip', line: 'The game and its player in one file that opens in any browser, offline. The .zip is a web app to put on a web host.' },
  { kind: 'dos', name: 'DOS', format: '.zip', line: 'The original Game-Maker files with the stand-alone player (PLAYGAME, named after the game), for DOSBox or a real DOS PC.' },
  { kind: 'files', name: 'Game files', format: '.zip', line: 'Your game’s files just as they are here, to keep a copy safe or import it again.' },
];

/**
 * The catalog's games that may be downloaded: the gameware and this project's own games
 * (the Sandbox and Bard of Bizarre games), not the other authors' shareware, which may only
 * be played here.
 */
export function catalogDownloadable(e: Pick<CatalogEntry, 'gam' | 'kind' | 'original'>): boolean {
  return !!e.gam && (e.kind === 'gameware' || !!e.original);
}

/** The visitor's own system, to choose first: a phone or tablet gets the web page. */
export function visitorSystem(nav: Pick<Navigator, 'userAgent' | 'platform' | 'maxTouchPoints'> & { userAgentData?: { platform?: string } } = navigator): DownloadKind {
  const ua = `${nav.userAgentData?.platform ?? ''} ${nav.platform ?? ''} ${nav.userAgent ?? ''}`;
  if (/android|iphone|ipad|ipod|cros/i.test(ua)) return 'web';
  if (/windows|win32|win64/i.test(ua)) return 'windows';
  if (/linux|x11/i.test(ua)) return 'linux';
  if (/mac/i.test(ua)) return nav.maxTouchPoints > 1 ? 'web' : 'mac'; // an iPad asks for the desktop site as a Mac
  return 'web';
}

/** The Download button: `open` opens the chooser (chooseDownload) for the game. */
export function downloadButton(title: string, open: () => unknown): HTMLElement {
  return h(
    'button',
    {
      type: 'button',
      class: 'with-ico',
      'aria-haspopup': 'dialog',
      'aria-label': `Download ${title}`,
      title: 'Download it to play on Windows, a Mac, Linux, the web or DOS',
      onclick: () => void open(),
    },
    icon('inbox'),
    'Download',
  );
}

/** The chooser, then the download. */
export async function chooseDownload(game: DownloadGame): Promise<void> {
  const choices = CHOICES.filter((c) => c.kind !== 'files' || game.project);
  const first = visitorSystem();
  const picked = await modal<{ kind: DownloadKind; alt: boolean }>(`Download ${game.title}`, (close) => {
    let current = choices.find((c) => c.kind === first) ?? choices[0];
    const go = h('button', { type: 'submit', class: 'primary' });
    const alt = h('button', { type: 'button', onclick: () => close({ kind: current.kind, alt: true }) });
    const update = () => {
      go.textContent = `Download ${current.format}`;
      alt.hidden = !current.alt;
      alt.textContent = current.kind === 'web' ? 'Web app (.zip)' : current.alt ? `Zip (${current.alt})` : '';
    };
    const rows = choices.map((c) => {
      const id = `dl-${c.kind}`;
      const radio = h('input', {
        type: 'radio',
        name: 'download',
        id,
        value: c.kind,
        checked: c === current,
        autofocus: c === current,
        'aria-describedby': `${id}-line`,
        onchange: () => {
          current = c;
          update();
        },
      });
      const row = h(
        'div',
        { class: 'dl-choice' },
        radio,
        h('label', { for: id }, h('span', { class: 'dl-name' }, c.name), ' ', h('span', { class: 'dl-format' }, c.alt ? `${c.format} or ${c.alt}` : c.format)),
        h(
          'p',
          { class: 'dl-line', id: `${id}-line` },
          c.line,
          c.details ? [' ', h('a', { href: c.details, onclick: () => close(undefined), 'aria-label': `More details about the ${c.name} download` }, 'More details →')] : null,
        ),
      );
      // the whole row chooses (its link still goes to its page)
      row.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('a, input')) return;
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      });
      return row;
    });
    update();
    return h(
      'form',
      {
        method: 'dialog',
        class: 'download-chooser',
        onsubmit: (e: Event) => {
          e.preventDefault();
          close({ kind: current.kind, alt: false });
        },
      },
      h('fieldset', null, h('legend', null, 'Download it for'), ...rows),
      h('p', { class: 'meta' }, 'It is built right here in your browser. Saved games and high scores are kept on the computer it is played on.'),
      h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), alt, go),
    );
  });
  if (picked) await build(game, picked.kind, picked.alt);
}

/** The options the native downloads share. */
async function nativeOptions(game: DownloadGame, files: GameFiles) {
  const [{ exportSinglePage }, { slug }, mac] = await Promise.all([import('../../export/exportSinglePage'), import('../../export/exportWebApp'), import('../../export/macApp')]);
  const { html } = await exportSinglePage(files, { title: game.title, gam: game.gam });
  return {
    title: game.title,
    id: game.id ?? slug(game.title),
    html,
    author: game.author,
    year: game.year,
    picture: mac.iconPicture(files, game.gam),
    colors: mac.boxColors(game.box),
  };
}

const NAMES: Record<DownloadKind, string> = { windows: 'Windows program', mac: 'Mac app', linux: 'Linux download', web: 'web page', dos: 'DOS game', files: 'game files' };

async function build(game: DownloadGame, kind: DownloadKind, alt: boolean): Promise<void> {
  try {
    toast(`Building the ${kind === 'web' && alt ? 'web app' : NAMES[kind]} of ${game.title}…`);
    const files = await game.files();
    if (kind === 'windows') {
      const win = await import('../../export/winApp');
      const [o, player] = await Promise.all([nativeOptions(game, files), win.preferredArch().then((a) => win.fetchWinPlayer(a))]);
      const name = win.exeName(game.title);
      if (alt) save(name.replace(/\.exe$/, '.zip'), await win.winExeZip({ ...o, player }), 'application/zip', 'Unzip it, then double-click the program to play.');
      else save(name, await win.winExe({ ...o, player }), 'application/vnd.microsoft.portable-executable', 'Double-click it to play.');
    } else if (kind === 'mac') {
      const mac = await import('../../export/macApp');
      const [o, player] = await Promise.all([nativeOptions(game, files), mac.fetchMacPlayer()]);
      const base = mac.appName(game.title).replace(/\.app$/, '');
      if (alt) save(`${base}.zip`, await mac.macAppZip({ ...o, player }), 'application/zip', 'Unzip it and move the app to Applications.');
      else save(`${base}.dmg`, await mac.macAppDmg({ ...o, player }), 'application/x-apple-diskimage', 'Open it and drag the game to Applications.');
    } else if (kind === 'linux') {
      const linux = await import('../../export/linuxApp');
      const [o, players] = await Promise.all([nativeOptions(game, files), linux.fetchLinuxPlayers()]);
      save(`${linux.folderName(game.title)}.tar.gz`, await linux.linuxTarGz({ ...o, players }), 'application/gzip', 'Extract it, then run play.sh in the folder.');
    } else if (kind === 'web' && alt) {
      const { name, zip } = await (await import('../../export/exportWebApp')).exportWebApp(files, { title: game.title, gam: game.gam });
      save(name, zip, 'application/zip', 'Unzip it onto any static web host.');
    } else if (kind === 'web') {
      const { name, html } = await (await import('../../export/exportSinglePage')).exportSinglePage(files, { title: game.title, gam: game.gam });
      save(name, html, 'text/html', 'Open it in any browser to play, no internet needed.');
    } else if (kind === 'dos') {
      const { name, zip, exe } = await (await import('../../export/exportDos')).exportDos(files, { title: game.title, gam: game.gam });
      save(name, zip, 'application/zip', `In DOSBox, run ${exe} from the unzipped folder.`);
    } else {
      const { createZip } = await import('../../project/zip');
      const zip = await createZip(files.entries().map(([name, data]) => ({ name: name.toUpperCase(), data })));
      save(`${game.gam.replace(/\.gam$/i, '')}.zip`, zip, 'application/zip', 'Import it here again whenever you like.');
    }
  } catch (e) {
    toast(plainError(e), 'error');
  }
}

function save(name: string, data: Uint8Array | string, type: string, next: string): void {
  download(name, data, type);
  toast(`Saved ${name}. ${next}`);
}
