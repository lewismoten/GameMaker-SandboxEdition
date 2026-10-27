// Starting a game from the home page: a new game (from the starter, see starter.ts), or one
// imported from a folder, zip, single-page export or dropped files. Files from the CD's
// shareware games are recognized by the .gam file's CRC-32. Loaded when first used (home.ts
// picks the files, or reads the drop, first).
import { h, toast, modal } from '../core/ui';
import { Project } from '../core/project';
import { starterProject } from './starter';
import { beginFirstSteps } from './firstSteps';
import { loadCatalog, type CatalogEntry, type GameFiles } from '../../project/files';
import { GameReader, gameFromFiles, scanFile, type FoundGame, type ReadGame, type ScanFile, type ScanReport } from '../../project/importScan';
import * as chooser from './importChooser';
import { markBatch, newBatch } from './importBatch';
import type { HomeNav } from './home';
import { playLink, showNotice } from './homeCards';
import { setImported } from './homeOrigin';
import { takeCompanion } from '../../project/companion';
import { openingFields } from '../tools/opening/openingFields';
import type { OpeningStyle } from '../tools/opening/openingIntros';
import { fingerprintOf, fingerprintOfFiles, type Fingerprint } from '../../imported/fingerprint';
import { noteImport } from '../../imported/noteMoves';
import { removedGames, removedMatch, type RemovedGame } from '../../imported/removedGames';
import { starsText } from '../../imported/ratings';

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

/** Files to import; an exported web page's (or one game of a folder holding several) bring their title and .gam file. */
type Imported = ReadGame;

/** The CD shareware game these files are, if any (matched by the .gam file's CRC-32). */
async function sharewareMatch(files: GameFiles): Promise<CatalogEntry | undefined> {
  const shareware = await sharewareByCrc();
  if (!shareware.size) return undefined;
  const { crc32 } = await import('../../project/zip');
  return files
    .byExtension('gam')
    .map((n) => shareware.get(crc32(files.get(n)!)))
    .find(Boolean);
}

/** The CD shareware games, by their .gam files' CRC-32s. */
async function sharewareByCrc(): Promise<Map<number, CatalogEntry>> {
  const shareware = (await loadCatalog().catch(() => [] as CatalogEntry[])).filter((g) => g.kind === 'shareware' && !g.original && g.gamCrc !== undefined);
  return new Map(shareware.map((g) => [g.gamCrc!, g]));
}

/** Saves imported files as a project listed under Imported; what its player's patches said, if anything. */
async function saveImported({ files, name, gam, players }: Imported): Promise<{ project: Project; note?: string; madeGam: boolean }> {
  // a hand-edited player (or one that renamed the files' extensions): read before the .gam is looked for
  const player = players.length ? (await import('../../project/importPlayer')).adoptPlayer(files, players) : undefined;
  // a backup's editor-only extras (<game>.GMX) go back beside the files, not among them
  const companion = takeCompanion(files);
  const madeGam = !files.mainGame();
  const p = Project.fromFiles(files, name, undefined, companion);
  if (gam && files.has(gam)) p.gam = gam;
  if (player) {
    const { playerRecord, PLAYER_SECTION } = await import('../../dosPlayer/playerRecord');
    if (Object.keys(player.patches).length) p.setExtras(p.gam, PLAYER_SECTION, playerRecord(player.patches));
  }
  await p.saveNow();
  // listed under Imported, apart from the games made here (⋯ More can move it to My games)
  setImported(p.id, true);
  return { project: p, note: player?.message, madeGam };
}

/** Where an imported game came from and its fingerprint, kept with its rating and note (imported/). */
interface Origin {
  source: string;
  fingerprint: Fingerprint;
}

const originOf = (g: FoundGame): Origin => ({ source: g.from || 'the files picked', fingerprint: fingerprintOf(g) });

/** "Previously removed (★★☆☆☆, your note: Too hard)" */
function removedBefore(r: RemovedGame): string {
  const note = r.note?.trim();
  const short = note && note.length > 80 ? `${note.slice(0, 79)}…` : note;
  const what = [r.rating ? starsText(r.rating) : 'unrated', short && `your note: ${short}`].filter(Boolean).join(', ');
  return `Previously removed (${what})`;
}

async function importFiles(nav: HomeNav, imported: Imported, origin: Origin): Promise<void> {
  const { files } = imported;
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
  const { project: p, note, madeGam } = await saveImported(imported);
  noteImport(p.id, origin.source, origin.fingerprint);
  if (madeGam) toast('No .gam file found — a new one was created for these files.');
  if (note) toast(note);
  toast(`Opened ${p.name} (${files.size} files). It is listed under Imported.`);
  nav.openProject(p.id);
}

/** Imports the games found that the visitor ticks, each as its own project. */
async function importChosen(report: ScanReport, given: ScanFile[], onAdded?: () => void): Promise<void> {
  const shareware = await sharewareByCrc();
  const sharewareOf = (g: FoundGame) => g.gamCrcs.map((c) => shareware.get(c)).find(Boolean);
  const { chooseGames, importWithProgress } = chooser;
  const records = removedGames();
  const chosen = await chooseGames(
    report,
    (g) => (sharewareOf(g) ? 'shareware: play it from the Shareware tab' : undefined),
    new GameReader(given),
    (g) => {
      const was = removedMatch(fingerprintOf(g), records);
      return was && removedBefore(was);
    },
  );
  if (!chosen?.length) return;
  const reader = new GameReader(given);
  const batch = newBatch();
  const { done, failed } = await importWithProgress(chosen, async (g) => {
    const { project } = await saveImported(await reader.read(g));
    markBatch([project.id], batch);
    // its source and fingerprint; one removed before takes back its rating and note
    const { source, fingerprint } = originOf(g);
    noteImport(project.id, source, fingerprint);
  });
  onAdded?.();
  if (!done && !failed.length) return;
  const games = (n: number) => `${n} ${n === 1 ? 'game' : 'games'}`;
  const canceled = done + failed.length < chosen.length;
  // what came in, with a way to take it all back out
  const again = await modal<boolean>(canceled ? 'Import canceled' : 'Imported', (close) => [
    h(
      'p',
      null,
      `${canceled ? 'Canceled: imported' : 'Imported'} ${done === chosen.length ? games(done) : `${done} of ${games(chosen.length)}`}. They are listed under Imported.`,
    ),
    failed.length
      ? h('details', { class: 'ic-notes' }, h('summary', null, `Not imported (${failed.length})`), h('ul', null, ...failed.map((f) => h('li', null, f))))
      : null,
    h(
      'div',
      { class: 'buttons' },
      done ? h('button', { type: 'button', onclick: () => close(true) }, 'Remove the ones from this import') : null,
      h('button', { type: 'button', class: 'primary', autofocus: true, onclick: () => close(false) }, 'OK'),
    ),
  ]);
  if (again) await (await import('./importRemove')).removeImported(() => onAdded?.(), batch);
}

/**
 * Imports what was given: a one-page export, else the games found in its folders and zips
 * (importScan.ts). One game opens as it always has; several are listed to pick from; files
 * with no game make a new one around them, and zips with no game say so.
 */
async function importGiven(nav: HomeNav, given: ScanFile[], list: File[], onAdded?: () => void): Promise<void> {
  if (!given.length) return;
  // A page made by "Export as one web page" carries the whole game inside it.
  if (list.some((f) => /\.html?$/i.test(f.name))) {
    const { gameFromPageFiles } = await import('../../project/importPage'); // loaded with the first import, not the home page
    const page = await gameFromPageFiles(list).catch((e: Error) => (toast(e.message, 'error'), undefined));
    if (page)
      return importFiles(
        nav,
        { files: page.files, players: [], name: page.title, gam: page.gam },
        { source: list.find((f) => /\.html?$/i.test(f.name))!.name, fingerprint: fingerprintOfFiles(Object.fromEntries(page.files.entries())) },
      );
  }
  const report = await chooser.scanWithProgress(given);
  if (!report) return;
  // one game opens as it always has, unless it was removed before: then it is listed, unticked, to say so
  const one = report.games.length === 1 && report.games[0];
  if (one && !removedMatch(fingerprintOf(one))) return importFiles(nav, await new GameReader(given).read(one), originOf(one));
  if (report.games.length) return importChosen(report, given, onAdded);
  // no .gam anywhere: loose files (no zips) still make a new game around them, as they always have
  const files = await gameFromFiles(report.loose);
  if (!report.zips && files.files.size)
    return importFiles(nav, files, { source: 'the files picked', fingerprint: fingerprintOfFiles(Object.fromEntries(files.files.entries())) });
  await chooser.showNothingFound(report);
}

/** Opens the files picked on the home page; `onAdded` is told when several games were imported at once. */
export async function importPicked(nav: HomeNav, list: File[], onAdded?: () => void): Promise<void> {
  await importGiven(
    nav,
    list.map((f) => scanFile(f)),
    list,
    onAdded,
  );
}

/** Opens what was dropped: the drop's entries (folders walked, keeping their paths), or its files when it has none. */
export async function importDropped(nav: HomeNav, entries: FileSystemEntry[], files: File[], onAdded?: () => void): Promise<void> {
  const collected: File[] = [];
  const given: ScanFile[] = [];
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      const f = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
      collected.push(f);
      given.push(scanFile(f, entry.fullPath));
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        if (!batch.length) break;
        for (const e of batch) await walk(e);
      }
    }
  };
  if (entries.length) for (const e of entries) await walk(e);
  else for (const f of files) (collected.push(f), given.push(scanFile(f)));
  await importGiven(nav, given, collected, onAdded);
}
