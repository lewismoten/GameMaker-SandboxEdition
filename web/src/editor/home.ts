// Home page: your projects, importing original game folders, and the CD's sample games.
import { h, clear, download, pickFiles, toast, promptText, confirmDialog, modal } from './ui';
import { Project } from './project';
import { starterProject } from './starter';
import { renderShot } from '../desk/boxArt';
import { openGameManual } from '../manual/gameManual';
import { GameFiles, IGNORED_FILE, loadCatalog, loadFileList, loadHostedGame, type CatalogEntry } from '../project/files';
import { deleteProject, listProjects, loadProject } from '../project/storage';
import { createZip, crc32, isZip, readZip } from '../project/zip';
import { exportWebApp } from '../export/exportWebApp';
import { exportSinglePage } from '../export/exportSinglePage';
import { exportDos } from '../export/exportDos';
import { parseGame } from '../formats/game';
import { gameFromPageFiles } from '../project/importPage';
import { showKeyMap } from './keyMapView';
import { FORK_NOTE, NOTICE_URL } from '../edition';

/** “⌨ Keys”: a keyboard map of what each key does in the game, worked out from its files. */
function keysButton(title: string, files: () => Promise<GameFiles>, gam?: string | null): HTMLElement {
  return h('button', { title: 'What each key does in this game', onclick: () => void showKeyMap(files(), gam ?? undefined, title) }, '⌨ Keys');
}

export interface HomeNav {
  openProject(id: string): void;
}

/** Draws a game's first level into a card's picture when the card scrolls into view. */
const shotObserver = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    shotObserver.unobserve(e.target);
    const el = e.target as HTMLCanvasElement & { game?: CatalogEntry };
    if (el.game) void renderShot(el.game, el, el.width / 20, el.height / 20).catch(() => undefined);
  }
});

function cardShot(g: CatalogEntry): HTMLCanvasElement {
  const c = h('canvas', { class: 'card-shot pixel', width: 160, height: 100 }) as HTMLCanvasElement & { game?: CatalogEntry };
  c.game = g;
  shotObserver.observe(c);
  return c;
}

export async function renderHome(root: HTMLElement, nav: HomeNav): Promise<void> {
  const heroShot = h('canvas', { class: 'pixel', width: 320, height: 200 });
  const projects = h('div', { class: 'cards' });
  const samples = h('div', { class: 'cards' }, h('p', { class: 'meta' }, 'Loading…'));
  const shareware = h('div', { class: 'cards' });
  const originals = h('div', { class: 'cards' });
  const drop = h('div', { class: 'dropzone' }, 'Drop a game folder, its files, a .zip, or a game exported as one web page (.html) here');

  clear(
    root,
    h(
      'main',
      { class: 'home' },
      h(
        'section',
        { class: 'hero' },
        h(
          'div',
          { class: 'hero-text' },
          h('em', null, 'Computer-aided design tools'),
          h('h1', { class: 'hero-logo' }, 'GAME-MAKER'),
          h('strong', { class: 'hero-edition' }, 'Sandbox Edition'),
          h(
            'p',
            null,
            'Make your own arcade and adventure games — blocks, monsters, heroes, maps, music and sound — in the original 1994 file formats. No programming.',
          ),
          h('p', { class: 'hero-fork' }, h('a', { href: NOTICE_URL, target: '_blank', rel: 'noopener' }, FORK_NOTE), '.'),
          h(
            'div',
            { class: 'hero-actions' },
            h('button', { class: 'primary big', onclick: () => void newGame(nav) }, '+ Make a new game'),
            h('button', { class: 'big', onclick: () => document.getElementById('samples')?.scrollIntoView({ behavior: 'smooth' }) }, '▶ Play a game'),
          ),
        ),
        h('div', { class: 'hero-screen', 'aria-hidden': 'true' }, heroShot),
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
          h('button', { onclick: () => void importPicked(nav, {}) }, 'Open files, .zip or .html…'),
        ),
        drop,
        h('div', { style: 'height:12px' }),
        projects,
      ),
      h(
        'section',
        { id: 'samples' },
        h('h2', null, 'Sample games from the Game-Maker CD'),
        h(
          'p',
          { class: 'lead' },
          'The free “gameware” that came with Game-Maker. Play them, or edit a copy to see how they were made and reuse their pictures, monsters and sounds in your own games.',
        ),
        samples,
      ),
      h(
        'section',
        { id: 'originals' },
        h('h2', null, 'New games from Sandbox Software'),
        h(
          'p',
          { class: 'lead' },
          'Our own games, made with Game-Maker in the original formats, so they also play in DOS. Play them, read their manuals, or edit a copy to see how they were made.',
        ),
        originals,
      ),
      h(
        'section',
        null,
        h('h2', null, 'Shareware games from the Game-Maker CD'),
        h(
          'p',
          { class: 'lead' },
          'Games other people made with Game-Maker, as distributed on the CD. They are copyrighted by their authors and can only be played here, exactly as released. If you enjoy one, read its notice to see how the author asked to be registered or thanked.',
        ),
        shareware,
      ),
      h(
        'section',
        null,
        h('h2', null, 'Keys while playing'),
        h(
          'p',
          { class: 'lead' },
          'Each game defines its own keys (usually the arrows plus a few others). F1 help · F2 status · F3 music · F4 sound · F5 save · F6 load · Esc leaves a level. Gamepads work as joysticks.',
        ),
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
    // the banner's screen: a level from one of RSD's own games
    const show = catalog.find((g) => g.id === ['pipemare', 'sample', 'houses'][Math.floor(Math.random() * 3)]);
    if (show) {
      (heroShot as HTMLCanvasElement & { game?: CatalogEntry }).game = show;
      shotObserver.observe(heroShot);
    }
    // Recreational Software Designs' own games first.
    const rsd = ['sample', 'pipemare', 'nebula'];
    const gameware = catalog
      .filter((g) => g.kind !== 'shareware')
      .sort((a, b) => (rsd.includes(b.id) ? 1 : 0) - (rsd.includes(a.id) ? 1 : 0) || rsd.indexOf(a.id) - rsd.indexOf(b.id));
    clear(samples, ...gameware.map((g) => sampleCard(g, nav)));
    clear(originals, ...catalog.filter((g) => g.original && g.gam).map((g) => originalCard(g, nav)));
    clear(shareware, ...catalog.filter((g) => g.kind === 'shareware' && !g.original && g.gam).map(sharewareCard));
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
          keysButton(p.name, async () => (await loadProject(p.id))!.files, p.gam),
          h('button', { onclick: () => void downloadProject(p.id) }, 'Download .zip'),
          h('button', { onclick: () => void exportProject(p.id) }, 'Export web app'),
          h('button', { onclick: () => void exportProjectPage(p.id), title: 'One .html file with the game and player inside' }, 'Export as one web page'),
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
    g.gam ? cardShot(g) : null,
    h('h3', null, g.gam ? g.title : `${g.id} (pictures, monsters and sounds)`),
    h(
      'div',
      { class: 'meta' },
      `${['sample', 'pipemare', 'nebula'].includes(g.id) ? 'By Recreational Software Designs · ' : ''}${g.id}/ · ${g.files.length} files`,
    ),
    h(
      'div',
      { class: 'actions' },
      g.gam && h('a', { href: `./play.html?game=${encodeURIComponent(g.id)}` }, h('button', { class: 'primary' }, '▶ Play')),
      g.gam && keysButton(g.title, () => loadHostedGame(g), g.gam),
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

/** One of our own games: playable and, unlike other shareware, open to edit. */
function originalCard(g: CatalogEntry, nav: HomeNav): HTMLElement {
  const copy = async () => {
    toast(`Copying ${g.title}…`);
    const p = Project.fromFiles(await loadHostedGame(g), g.title);
    if (g.gam) p.gam = g.gam;
    await p.saveNow();
    nav.openProject(p.id);
  };
  return h(
    'div',
    { class: 'card' },
    cardShot(g),
    h('h3', null, g.title),
    h('div', { class: 'meta' }, `${g.company ?? 'Sandbox Software'} · ${g.files.length} files`),
    h(
      'div',
      { class: 'actions' },
      h('a', { href: `./play.html?game=${encodeURIComponent(g.id)}` }, h('button', { class: 'primary' }, '▶ Play')),
      h('button', { onclick: () => void copy() }, 'Edit a copy'),
      keysButton(g.title, () => loadHostedGame(g), g.gam),
      g.original?.manual ? h('button', { onclick: () => void openGameManual(g) }, '📖 Manual') : null,
    ),
  );
}

function sharewareCard(g: CatalogEntry): HTMLElement {
  return h(
    'div',
    { class: 'card' },
    cardShot(g),
    h('h3', null, g.title),
    h('div', { class: 'meta' }, 'Shareware · play only'),
    h(
      'div',
      { class: 'actions' },
      h('a', { href: `./play.html?game=${encodeURIComponent(g.id)}` }, h('button', { class: 'primary' }, '▶ Play')),
      h('button', { onclick: () => void showNotice(g) }, 'Shareware notice'),
      keysButton(g.title, () => loadHostedGame(g), g.gam),
    ),
  );
}

export function showNotice(g: CatalogEntry): Promise<unknown> {
  return modal(`${g.title}: shareware notice`, (close) => [
    h(
      'pre',
      { style: 'white-space:pre-wrap;max-height:60vh;overflow:auto;font:13px/1.4 ui-monospace,monospace' },
      g.notice || 'This game is shareware. It is copyrighted by its author.',
    ),
    h('p', { class: 'meta' }, 'These notices are from 1993–1994; the addresses and prices may no longer be current.'),
    h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'Close')),
  ]);
}

async function newGame(nav: HomeNav): Promise<void> {
  const choice = await modal<{ name: string; starter: boolean }>('New game', (close) => {
    const input = h('input', {
      type: 'text',
      value: 'My Game',
      required: true,
      autofocus: true,
      onfocus: (e: Event) => (e.target as HTMLInputElement).select(),
    });
    const go = (starter: boolean) => input.reportValidity() && close({ name: input.value.trim(), starter });
    return h(
      'form',
      { class: 'stack', onsubmit: (e: Event) => (e.preventDefault(), go(true)) },
      h('label', null, 'Title (shown on the menu screen)', input),
      h(
        'div',
        { class: 'start-choices' },
        h(
          'button',
          { type: 'submit', class: 'start-choice primary' },
          h('strong', null, '▶ Ready to play'),
          h('small', null, 'A first level with scenery, monsters, a hero and sounds from the CD library, to change as you like.'),
        ),
        h(
          'button',
          { type: 'button', class: 'start-choice', onclick: () => go(false) },
          h('strong', null, '◻ Empty'),
          h('small', null, 'Just a title and an ending. Add every file yourself.'),
        ),
      ),
    );
  });
  if (!choice?.name) return;
  const p = choice.starter ? await starterProject(choice.name).catch(() => Project.create(choice.name)) : Project.create(choice.name);
  await p.saveNow();
  nav.openProject(p.id);
}

interface Imported {
  files: GameFiles;
  /** From an exported web page: its title and .gam file. */
  name?: string;
  gam?: string;
}

async function filesFromList(list: File[]): Promise<Imported> {
  // A page made by "Export as one web page" carries the whole game inside it.
  const page = await gameFromPageFiles(list).catch((e: Error) => (toast(e.message, 'error'), undefined));
  if (page) return { files: page.files, name: page.title, gam: page.gam };
  return { files: await filesOnly(list) };
}

async function filesOnly(list: File[]): Promise<GameFiles> {
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
  const shareware = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter((g) => g.kind === 'shareware' && !g.original && g.gamCrc !== undefined);
  if (!shareware.length) return undefined;
  const crcs = new Set(files.byExtension('gam').map((n) => crc32(files.get(n)!)));
  return shareware.find((g) => crcs.has(g.gamCrc!));
}

async function importFiles(nav: HomeNav, { files, name, gam }: Imported): Promise<void> {
  if (!files.size) return;
  const shareware = await sharewareMatch(files);
  if (shareware) {
    // Shareware is copyrighted by its author: play it as released, but don't open it for editing.
    await modal(`${shareware.title} is shareware`, (close) => [
      h(
        'p',
        null,
        `These files are the shareware game “${shareware.title}”. Shareware games can be played here exactly as their authors released them, but not edited or exported.`,
      ),
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
  const p = Project.fromFiles(files, name);
  if (gam && files.has(gam)) p.gam = gam;
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

export async function exportProjectPage(id: string): Promise<void> {
  const p = await loadProject(id);
  if (!p) return;
  try {
    toast('Building web page…');
    const title = parseGame(p.files.get(p.record.gam)!).scenes[0]?.desc || p.record.name;
    const { name, html } = await exportSinglePage(p.files, { title, gam: p.record.gam });
    download(name, html, 'text/html');
    toast(`Saved ${name}. Open it in any browser to play — no internet needed.`);
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
