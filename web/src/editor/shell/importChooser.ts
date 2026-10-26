// The dialogs of an import that holds more than one game (homeImport.ts): looking through
// the zips, with a progress bar and Cancel; the games found, each with its title screen
// (importThumbs.ts), to tick the ones to import; importing them one at a time, again with
// Cancel; and what was found when no game was.
import { h, modal } from '../core/ui';
import { scanImport, scanSummary, type FoundGame, type GameReader, type ScanFile, type ScanReport } from '../../project/importScan';
import { importThumbs } from './importThumbs';
import './importChooser.css';

/** A dialog that runs `work` (told how far it got) and closes when it ends; Cancel or Esc stops it. */
export function working<T>(
  title: string,
  start: string,
  work: (signal: AbortSignal, tell: (done: number, total: number, what: string) => void) => Promise<T>,
): Promise<T | undefined> {
  const ctl = new AbortController();
  let ended = false;
  return modal<T>(title, (close) => {
    const bar = h('progress', { max: '1', value: '0', 'aria-label': title });
    const line = h('p', { class: 'ic-line', 'aria-live': 'polite' }, start);
    const end = (v: T | undefined) => {
      if (ended) return;
      ended = true;
      ctl.abort();
      close(v);
    };
    void work(ctl.signal, (done, total, what) => {
      bar.max = Math.max(1, total);
      bar.value = done;
      line.textContent = what;
    }).then(end, () => end(undefined));
    return h('div', { class: 'ic-work' }, line, bar, h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => end(undefined) }, 'Cancel')));
  }).finally(() => ((ended = true), ctl.abort()));
}

/** Looks through what was given for its games; undefined when canceled. */
export function scanWithProgress(given: ScanFile[]): Promise<ScanReport | undefined> {
  const zips = given.filter((f) => /\.zip$/i.test(f.path)).length;
  // a few files are looked through at once; only zips take long enough to show
  if (zips < 2) return scanImport(given);
  return working('Looking for games', `Opening ${zips} zips…`, (signal, tell) =>
    scanImport(given, {
      signal,
      onProgress: (done, total, path) => tell(done, total, path ? `Zip ${done + 1} of ${total}: ${path}` : 'Done.'),
    }),
  );
}

/** Zips with no game, and those that could not be read, folded away under the summary. */
function zipNotes(r: ScanReport): HTMLElement | undefined {
  const rows = [
    ...r.emptyZips.map((z) => h('li', null, z.path, h('small', null, ` · no .GAM file: ${z.held}`))),
    ...r.badZips.map((z) => h('li', null, z.path, h('small', null, ` · ${z.error}`))),
  ];
  if (!rows.length) return undefined;
  return h('details', { class: 'ic-notes' }, h('summary', null, `Zips with no game (${rows.length})`), h('ul', null, ...rows));
}

/** Says what was found when no game was; nothing is imported. */
export function showNothingFound(r: ScanReport): Promise<void> {
  const what = 'A game is a folder or zip with a .GAM file in it, so nothing was imported.';
  return modal<void>('No game found', (close) => [
    h('p', null, `${scanSummary(r)}. ${what}`),
    zipNotes(r),
    h('div', { class: 'buttons' }, h('button', { type: 'button', class: 'primary', onclick: () => close(undefined) }, 'OK')),
  ]).then(() => undefined);
}

/** Lists the games found to tick the ones to import. `noImport` says why a game can't be (a shareware game). */
export async function chooseGames(r: ScanReport, noImport: (g: FoundGame) => string | undefined, reader: GameReader): Promise<FoundGame[] | undefined> {
  const list = h('ul', { class: 'ic-list', 'aria-label': 'Games found', tabindex: '-1' });
  const thumbs = importThumbs(reader, list);
  const chosen = await modal<FoundGame[]>('Import games', (close) => {
    const boxes: [HTMLInputElement, FoundGame][] = [];
    const go = h('button', { type: 'submit', class: 'primary' });
    const count = () => {
      const n = boxes.filter(([b]) => b.checked).length;
      go.textContent = n === 1 ? 'Import 1 game' : `Import ${n} games`;
      go.disabled = !n;
    };
    const rows = r.games.map((g, i) => {
      const why = noImport(g);
      const box = h('input', { type: 'checkbox', checked: !why && !g.leftover, disabled: !!why, onchange: count, 'aria-describedby': `ic-from-${i}` });
      if (!why) boxes.push([box, g]);
      const thumb = thumbs.thumb(g);
      // the picture ticks its game too, as its words do
      thumb.addEventListener('click', () => box.disabled || box.click());
      return h(
        'li',
        null,
        thumb,
        h(
          'label',
          { class: 'ic-game' },
          box,
          h('span', { class: 'ic-name' }, g.name),
          h(
            'small',
            { class: 'ic-from', id: `ic-from-${i}` },
            [
              g.from || 'the files picked',
              `${g.fileCount} ${g.fileCount === 1 ? 'file' : 'files'}`,
              g.missing && !g.leftover && `${g.missing} ${g.missing === 1 ? 'file' : 'files'} missing`,
              g.leftover,
              g.alsoIn && `also in ${g.alsoIn.join(', ')}`,
              why,
            ]
              .filter(Boolean)
              .join(' · '),
          ),
        ),
      );
    });
    const all = (on: boolean) => () => {
      for (const [b] of boxes) b.checked = on;
      count();
    };
    count();
    const left = r.loose.length
      ? ` ${r.loose.length} other ${r.loose.length === 1 ? 'file is' : 'files are'} in no game and ${r.loose.length === 1 ? 'is' : 'are'} left out.`
      : '';
    return h(
      'form',
      {
        class: 'ic-choose',
        onsubmit: (e: Event) => {
          e.preventDefault();
          close(boxes.filter(([b]) => b.checked).map(([, g]) => g));
        },
      },
      h('p', { class: 'ic-summary' }, `${scanSummary(r)}.${left} Each one you tick becomes its own game under Imported.`),
      zipNotes(r),
      h(
        'div',
        { class: 'ic-all', role: 'group', 'aria-label': 'Select' },
        h('button', { type: 'button', onclick: all(true) }, 'Select all'),
        h('button', { type: 'button', onclick: all(false) }, 'Select none'),
      ),
      (list.append(...rows), list),
      h('div', { class: 'buttons' }, h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'), go),
    );
  });
  thumbs.close();
  return chosen;
}

/** Imports the games one at a time with `each`; how many were imported (Cancel stops after the one going). */
export async function importWithProgress(games: FoundGame[], each: (g: FoundGame) => Promise<void>): Promise<{ done: number; failed: string[] }> {
  let done = 0;
  const failed: string[] = [];
  let job: Promise<void> | undefined;
  await working(
    'Importing games',
    `Importing ${games.length} games…`,
    (signal, tell) =>
      (job = (async () => {
        for (const [i, g] of games.entries()) {
          if (signal.aborted) return;
          tell(i, games.length, `Game ${i + 1} of ${games.length}: ${g.name}`);
          try {
            await each(g);
            done++;
          } catch (e) {
            failed.push(`${g.name} (${(e as Error).message})`);
          }
        }
        tell(games.length, games.length, 'Done.');
      })()),
  );
  // Cancel closes the dialog at once; the game being saved then is finished first
  await job;
  return { done, failed };
}
