// Starting a game from the home page: a new game (from the starter, see starter.ts), or one
// imported from a folder, zip, single-page export or dropped files. Files from the CD's
// shareware games are recognized by the .gam file's CRC-32. Loaded when first used (home.ts
// picks the files, or reads the drop, first).
import { h, toast, modal } from '../core/ui';
import { Project } from '../core/project';
import { starterProject } from './starter';
import { beginFirstSteps } from './firstSteps';
import { GameFiles, IGNORED_FILE, loadCatalog, loadFileList, type CatalogEntry } from '../../project/files';
import type { HomeNav } from './home';
import { playLink, showNotice } from './homeCards';
import { setImported } from './homeOrigin';
import { takeCompanion } from '../../project/companion';
import { openingFields } from '../tools/opening/openingFields';
import type { OpeningStyle } from '../tools/opening/openingIntros';

export async function newGame(nav: HomeNav): Promise<void> {
  const opening = openingFields();
  const choice = await modal<{ name: string; starter: boolean; opening: { style: OpeningStyle; name: string } }>('New game', (close) => {
    const input = h('input', {
      type: 'text',
      value: 'My Game',
      required: true,
      autofocus: true,
      onfocus: (e: Event) => (e.target as HTMLInputElement).select(),
    });
    const go = (starter: boolean) => {
      const o = input.reportValidity() && opening.value();
      if (o) close({ name: input.value.trim(), starter, opening: o });
    };
    return h(
      'form',
      { class: 'stack', onsubmit: (e: Event) => (e.preventDefault(), go(true)) },
      h('label', null, 'Title (shown on the menu screen)', input),
      opening.el,
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
  const { style, name } = choice.opening;
  if (style !== 'none' || name) {
    // the cards are drawn with the Scene maker's renderer, loaded only now
    const { applyOpening } = await import('../tools/opening/openingCards');
    const game = p.game();
    // part of making the game, not one of the designer's changes: no "changed a file" achievement
    const told = p.files.onChange;
    p.files.onChange = undefined;
    let noSting = false;
    try {
      ({ noSting } = await applyOpening(p, game.scenes[0], game.scenes, style, name));
      p.saveGame(game);
    } finally {
      p.files.onChange = told;
    }
    // the First steps compare against the game as it starts, opening and all
    if (choice.starter) beginFirstSteps(p);
    if (noSting) toast('The opening could not be loaded (offline?). Add it later from the start scene’s 🎬 Opening sting….', 'error');
  }
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
  const { gameFromPageFiles } = await import('../../project/importPage'); // loaded with the first import, not the home page
  const page = await gameFromPageFiles(list).catch((e: Error) => (toast(e.message, 'error'), undefined));
  if (page) return { files: page.files, name: page.title, gam: page.gam };
  return { files: await filesOnly(list) };
}

async function filesOnly(list: File[]): Promise<GameFiles> {
  if (list.length === 1 && /\.zip$/i.test(list[0].name)) {
    const [bytes, { isZip, readZip }] = await Promise.all([list[0].arrayBuffer().then((b) => new Uint8Array(b)), import('../../project/zip')]);
    if (isZip(bytes)) {
      const files = new GameFiles();
      for (const e of await readZip(bytes)) if (!IGNORED_FILE.test(e.name) && !e.name.endsWith('/')) files.set(e.name, e.data);
      return files;
    }
  }
  return loadFileList(list);
}

/** The CD shareware game these files are, if any (matched by the .gam file's CRC-32). */
async function sharewareMatch(files: GameFiles): Promise<CatalogEntry | undefined> {
  const shareware = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter((g) => g.kind === 'shareware' && !g.original && g.gamCrc !== undefined);
  if (!shareware.length) return undefined;
  const { crc32 } = await import('../../project/zip');
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
        h('a', { href: playLink(shareware.id) }, h('button', { class: 'primary' }, '▶ Play it')),
      ),
    ]);
    return;
  }
  // a backup's editor-only extras (<game>.GMX) go back beside the files, not among them
  const companion = takeCompanion(files);
  if (!files.mainGame()) toast('No .gam file found — a new one was created for these files.');
  const p = Project.fromFiles(files, name, undefined, companion);
  if (gam && files.has(gam)) p.gam = gam;
  await p.saveNow();
  // listed under Imported, apart from the games made here (⋯ More can move it to My games)
  setImported(p.id, true);
  toast(`Opened ${p.name} (${files.size} files). It is listed under Imported.`);
  nav.openProject(p.id);
}

/** Opens the files picked on the home page. */
export async function importPicked(nav: HomeNav, list: File[]): Promise<void> {
  if (list.length) await importFiles(nav, await filesFromList(list));
}

/** Opens what was dropped: the drop's entries (folders walked), or its files when it has none. */
export async function importDropped(nav: HomeNav, entries: FileSystemEntry[], files: File[]): Promise<void> {
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
  if (entries.length) for (const e of entries) await walk(e);
  else collected.push(...files);
  await importFiles(nav, await filesFromList(collected));
}
