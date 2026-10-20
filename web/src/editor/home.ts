// Home page: your projects, importing original game folders, and the CD's sample games.
import { h, clear, download, pickFiles, toast, promptText, confirmDialog, modal } from './ui';
import { Project } from './project';
import { GameFiles, IGNORED_FILE, loadCatalog, loadFileList, loadHostedGame, type CatalogEntry } from '../project/files';
import { deleteProject, listProjects, loadProject } from '../project/storage';
import { createZip, crc32, isZip, readZip } from '../project/zip';
import { exportWebApp } from '../export/exportWebApp';
import { exportDos } from '../export/exportDos';
import { parseGame } from '../formats/game';

export interface HomeNav {
  openProject(id: string): void;
}

export async function renderHome(root: HTMLElement, nav: HomeNav): Promise<void> {
  const projects = h('div', { class: 'cards' });
  const samples = h('div', { class: 'cards' }, h('p', { class: 'meta' }, 'Loading…'));
  const shareware = h('div', { class: 'cards' });
  const drop = h('div', { class: 'dropzone' }, 'Drop a game folder, its files, or a .zip here');

  clear(
    root,
    h(
      'main',
      { class: 'home' },
      h(
        'section',
        null,
        h('p', { class: 'lead' }, 'Design arcade and adventure games the way Game-Maker 3.0 did in 1994 — blocks, monsters, characters, maps, sounds and scenes — using the original file formats. Play games from the original CD, and publish your own as installable web apps that work offline.'),
      ),
      h(
        'section',
        null,
        h('h2', null, 'Your games'),
        h(
          'div',
          { class: 'toolbar', style: 'margin-bottom:12px' },
          h('button', { class: 'primary', onclick: () => void newGame(nav) }, '+ New game'),
          h('button', { onclick: () => void importPicked(nav, { directory: true }) }, 'Open game folder…'),
          h('button', { onclick: () => void importPicked(nav, {}) }, 'Open files or .zip…'),
        ),
        drop,
        h('div', { style: 'height:12px' }),
        projects,
      ),
      h('section', null, h('h2', null, 'Sample games from the Game-Maker CD'), h('p', { class: 'lead' }, 'The free “gameware” that came with Game-Maker. Play them, or edit a copy to see how they were made and reuse their pictures, monsters and sounds in your own games.'), samples),
      h(
        'section',
        null,
        h('h2', null, 'Shareware games from the Game-Maker CD'),
        h('p', { class: 'lead' }, 'Games other people made with Game-Maker, as distributed on the CD. They are copyrighted by their authors and can only be played here, exactly as released. If you enjoy one, read its notice to see how the author asked to be registered or thanked.'),
        shareware,
      ),
      h(
        'section',
        null,
        h('h2', null, 'Keys while playing'),
        h('p', { class: 'lead' }, 'Each game defines its own keys (usually the arrows plus a few others). F1 help · F2 status · F3 music · F4 sound · F5 save · F6 load · Esc leaves a level. Gamepads work as joysticks.'),
      ),
    ),
  );

  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    void importDropped(nav, e.dataTransfer!);
  });

  await renderProjects(projects, nav);
  try {
    const catalog = await loadCatalog();
    const gameware = catalog.filter((g) => g.kind !== 'shareware');
    clear(samples, ...gameware.map((g) => sampleCard(g, nav)));
    clear(shareware, ...catalog.filter((g) => g.kind === 'shareware' && g.gam).map(sharewareCard));
    if (!gameware.length) clear(samples, h('p', { class: 'meta' }, 'No sample games were bundled with this build.'));
  } catch {
    clear(samples, h('p', { class: 'meta' }, 'Sample games are unavailable offline until they have been opened once.'));
  }
}

async function renderProjects(host: HTMLElement, nav: HomeNav): Promise<void> {
  const list = await listProjects().catch(() => []);
  if (!list.length) {
    clear(host, h('p', { class: 'meta' }, 'No games yet. Create one, open an original game folder, or copy a sample game below.'));
    return;
  }
  clear(
    host,
    ...list.map((p) =>
      h(
        'div',
        { class: 'card' },
        h('h3', null, p.name),
        h('div', { class: 'meta' }, `${p.gam} · edited ${new Date(p.updated).toLocaleString()}`),
        h(
          'div',
          { class: 'actions' },
          h('button', { class: 'primary', onclick: () => nav.openProject(p.id) }, 'Open'),
          h('a', { href: `./play.html?project=${encodeURIComponent(p.id)}` }, h('button', null, 'Play')),
          h('button', { onclick: () => void downloadProject(p.id) }, 'Download .zip'),
          h('button', { onclick: () => void exportProject(p.id) }, 'Export web app'),
          h('button', { onclick: () => void exportProjectForDos(p.id) }, 'Export for DOS'),
          h(
            'button',
            {
              class: 'danger',
              onclick: async () => {
                if (await confirmDialog('Delete game', `Delete “${p.name}” from this browser? Download it first if you want to keep it.`, 'Delete')) {
                  await deleteProject(p.id);
                  await renderProjects(host, nav);
                }
              },
            },
            'Delete',
          ),
        ),
      ),
    ),
  );
}

function sampleCard(g: CatalogEntry, nav: HomeNav): HTMLElement {
  const copy = async (name: string) => {
    toast(`Copying ${g.title}…`);
    const files = await loadHostedGame(g);
    const p = Project.fromFiles(files, name);
    if (g.gam) p.gam = g.gam;
    await p.saveNow();
    nav.openProject(p.id);
  };
  return h(
    'div',
    { class: 'card' },
    h('h3', null, g.gam ? g.title : `${g.id} (pictures, monsters and sounds)`),
    h('div', { class: 'meta' }, `${g.id}/ · ${g.files.length} files`),
    h(
      'div',
      { class: 'actions' },
      g.gam && h('a', { href: `./play.html?game=${encodeURIComponent(g.id)}` }, h('button', { class: 'primary' }, '▶ Play')),
      g.gam
        ? h('button', { onclick: () => void copy(g.title) }, 'Edit a copy')
        : h(
            'button',
            {
              onclick: async () => {
                const name = await promptText('New game', 'Title (shown on the menu screen)', 'My Game');
                if (name) await copy(name);
              },
            },
            'Start a game with these',
          ),
    ),
  );
}

function sharewareCard(g: CatalogEntry): HTMLElement {
  return h(
    'div',
    { class: 'card' },
    h('h3', null, g.title),
    h('div', { class: 'meta' }, 'Shareware · play only'),
    h(
      'div',
      { class: 'actions' },
      h('a', { href: `./play.html?game=${encodeURIComponent(g.id)}` }, h('button', { class: 'primary' }, '▶ Play')),
      h('button', { onclick: () => void showNotice(g) }, 'Shareware notice'),
    ),
  );
}

export function showNotice(g: CatalogEntry): Promise<unknown> {
  return modal(`${g.title}: shareware notice`, (close) => [
    h('pre', { style: 'white-space:pre-wrap;max-height:60vh;overflow:auto;font:13px/1.4 ui-monospace,monospace' }, g.notice || 'This game is shareware. It is copyrighted by its author.'),
    h('p', { class: 'meta' }, 'These notices are from 1993–1994; the addresses and prices may no longer be current.'),
    h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'Close')),
  ]);
}

async function newGame(nav: HomeNav): Promise<void> {
  const name = await promptText('New game', 'Title (shown on the menu screen)', 'My Game');
  if (!name) return;
  const p = Project.create(name);
  await p.saveNow();
  nav.openProject(p.id);
}

async function filesFromList(list: File[]): Promise<GameFiles> {
  if (list.length === 1 && /\.zip$/i.test(list[0].name)) {
    const bytes = new Uint8Array(await list[0].arrayBuffer());
    if (isZip(bytes)) {
      const files = new GameFiles();
      for (const e of await readZip(bytes)) if (!IGNORED_FILE.test(e.name) && !e.name.endsWith('/')) files.set(e.name, e.data);
      return files;
    }
  }
  return loadFileList(list);
}

/** The CD shareware game these files are, if any (matched by the .gam file's CRC-32). */
export async function sharewareMatch(files: GameFiles): Promise<CatalogEntry | undefined> {
  const shareware = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter((g) => g.kind === 'shareware' && g.gamCrc !== undefined);
  if (!shareware.length) return undefined;
  const crcs = new Set(files.byExtension('gam').map((n) => crc32(files.get(n)!)));
  return shareware.find((g) => crcs.has(g.gamCrc!));
}

async function importFiles(nav: HomeNav, files: GameFiles): Promise<void> {
  if (!files.size) return;
  const shareware = await sharewareMatch(files);
  if (shareware) {
    // Shareware is copyrighted by its author: play it as released, but don't open it for editing.
    await modal(`${shareware.title} is shareware`, (close) => [
      h('p', null, `These files are the shareware game “${shareware.title}”. Shareware games can be played here exactly as their authors released them, but not edited or exported.`),
      h(
        'div',
        { class: 'buttons' },
        h('button', { onclick: () => (close(undefined), void showNotice(shareware)) }, 'Shareware notice'),
        h('button', { onclick: () => close(undefined) }, 'Cancel'),
        h('a', { href: `./play.html?game=${encodeURIComponent(shareware.id)}` }, h('button', { class: 'primary' }, '▶ Play it')),
      ),
    ]);
    return;
  }
  if (!files.mainGame()) toast('No .gam file found — a new one was created for these files.');
  const p = Project.fromFiles(files);
  await p.saveNow();
  toast(`Opened ${p.name} (${files.size} files)`);
  nav.openProject(p.id);
}

async function importPicked(nav: HomeNav, opts: { directory?: boolean }): Promise<void> {
  const list = await pickFiles({ multiple: true, directory: opts.directory });
  if (list.length) await importFiles(nav, await filesFromList(list));
}

async function importDropped(nav: HomeNav, dt: DataTransfer): Promise<void> {
  const collected: File[] = [];
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) collected.push(await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej)));
    else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        if (!batch.length) break;
        for (const e of batch) await walk(e);
      }
    }
  };
  const entries = [...dt.items].map((i) => i.webkitGetAsEntry?.()).filter((e): e is FileSystemEntry => !!e);
  if (entries.length) for (const e of entries) await walk(e);
  else collected.push(...dt.files);
  await importFiles(nav, await filesFromList(collected));
}

export async function downloadProject(id: string): Promise<void> {
  const p = await loadProject(id);
  if (!p) return;
  const zip = await createZip(p.files.entries().map(([name, data]) => ({ name: name.toUpperCase(), data })));
  download(`${p.record.gam.replace(/\.gam$/i, '')}.zip`, zip, 'application/zip');
}

export async function exportProject(id: string): Promise<void> {
  const p = await loadProject(id);
  if (!p) return;
  try {
    toast('Building web app…');
    const title = parseGame(p.files.get(p.record.gam)!).scenes[0]?.desc || p.record.name;
    const { name, zip } = await exportWebApp(p.files, { title, gam: p.record.gam });
    download(name, zip, 'application/zip');
    toast(`Saved ${name}. Unzip it onto any static web host.`);
  } catch (e) {
    toast((e as Error).message, 'error');
  }
}

export async function exportProjectForDos(id: string): Promise<void> {
  const p = await loadProject(id);
  if (!p) return;
  try {
    const title = parseGame(p.files.get(p.record.gam)!).scenes[0]?.desc || p.record.name;
    const { name, zip, exe } = await exportDos(p.files, { title, gam: p.record.gam });
    download(name, zip, 'application/zip');
    toast(`Saved ${name}. In DOSBox, run ${exe} from the unzipped folder.`);
  } catch (e) {
    toast((e as Error).message, 'error');
  }
}
