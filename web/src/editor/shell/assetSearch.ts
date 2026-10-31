// Overview › Files search: one box above the file grid that looks through file names, the words
// inside files, the companion's names and notes and the DOS player's fields (searchIndex.ts).
// The index is built in the background the first time the box is used (and again after the game
// changes); typing is debounced; results replace the grid, grouped by kind with counts, as cards
// in the Files grid's style. Arrow keys move between cards, Enter opens one.
import './assetSearch.css';
import { h, clear } from '../core/ui';
import type { FileKind, Project } from '../core/project';
import { searchMove } from './searchNav';
import { queryWords } from './searchMatch';
import { GROUP_TITLES, type SearchEntry, type SearchGroup } from './searchIndex';

export interface SearchHost {
  project: Project;
  /** Where results go (the file grid, so thumbnails draw as they scroll into view). */
  grid: HTMLElement;
  preview: (file: string | undefined, kind: FileKind) => HTMLElement;
  open: (file: string) => void;
  openControls: () => void;
  openPlayerField: (patch: string) => void;
  /** Results are showing (true) or the file grid is back (false). */
  active: (on: boolean) => void;
}

const DEBOUNCE = 180;
const GROUPS: SearchGroup[] = ['files', 'text', 'controls', 'player'];

export function assetSearch(host: SearchHost): { el: HTMLElement; refresh(): void; dispose(): void } {
  const input = h('input', {
    type: 'search',
    id: 'asset-search',
    placeholder: 'Search names, text, counters, DOS player…',
    autocomplete: 'off',
    spellcheck: false,
  });
  const status = h('p', { class: 'meta sr-status', role: 'status', 'aria-live': 'polite' });
  const el = h('div', { class: 'asset-search', role: 'search' }, h('label', { for: 'asset-search' }, 'Search this game'), input, status);
  let index: SearchEntry[] | undefined;
  let building: Promise<SearchEntry[]> | undefined;
  let signal = { stale: false };
  let timer = 0;
  let run = 0;
  let disposed = false;

  const ensureIndex = (): Promise<SearchEntry[]> => {
    if (index) return Promise.resolve(index);
    building ??= (async () => {
      const mine = signal;
      const { buildIndex } = await import('./searchIndex');
      const built = await buildIndex(host.project, mine);
      if (!mine.stale) index = built;
      return built;
    })();
    return building;
  };
  const invalidate = () => {
    signal.stale = true;
    signal = { stale: false };
    index = undefined;
    building = undefined;
  };

  function reset(focus: boolean): void {
    clearTimeout(timer);
    run++;
    input.value = '';
    status.textContent = '';
    host.active(false);
    if (focus) input.focus();
  }

  async function go(): Promise<void> {
    const words = queryWords(input.value);
    const mine = ++run;
    if (!words.length) return reset(false);
    host.active(true);
    status.textContent = index ? '' : 'Reading the game’s files…';
    const { search } = await import('./searchIndex');
    const { resultCard } = await import('./searchCards');
    let entries = await ensureIndex();
    if (mine !== run || disposed) return;
    if (!index) {
      // the game changed while reading: read it again
      entries = await ensureIndex();
      if (mine !== run || disposed) return;
    }
    const found = search(entries, words);
    const total = GROUPS.reduce((n, g) => n + found[g].length, 0);
    status.textContent = total ? `${total.toLocaleString()} ${total === 1 ? 'match' : 'matches'}` : '';
    const open = (e: SearchEntry) => {
      if (e.patch) host.openPlayerField(e.patch);
      else if (e.controls) host.openControls();
      else if (e.file) host.open(e.file);
    };
    if (!total) {
      clear(host.grid, h('p', { class: 'sr-none', role: 'status' }, `No matches for “${input.value.trim()}”.`));
      return;
    }
    const nodes: Node[] = [];
    for (const g of GROUPS) {
      const list = found[g];
      if (!list.length) continue;
      const shown = list.slice(0, 300);
      nodes.push(
        h(
          'h2',
          { class: 'sr-group', id: `sr-${g}` },
          `${GROUP_TITLES[g]} `,
          h('span', { class: 'sr-count' }, `(${list.length.toLocaleString()}${shown.length < list.length ? `, first ${shown.length} shown` : ''})`),
        ),
        ...shown.map(({ entry, hits }) => resultCard(entry, hits, words, host.preview, () => open(entry))),
      );
    }
    clear(host.grid, ...nodes);
  }

  const cards = () => [...host.grid.querySelectorAll<HTMLElement>('button.sr-card')];
  const onGridKey = (e: KeyboardEvent) => {
    if (!(e.target instanceof HTMLElement) || !e.target.matches('button.sr-card')) return;
    const all = cards();
    const i = all.indexOf(e.target);
    const to = searchMove(
      e.key,
      all.map((c) => c.getBoundingClientRect()),
      i,
    );
    if (to < 0) return;
    e.preventDefault();
    all[to].focus();
  };
  host.grid.addEventListener('keydown', onGridKey);

  input.addEventListener('focus', () => void ensureIndex(), { once: true });
  input.addEventListener('input', () => {
    clearTimeout(timer);
    if (!input.value.trim()) return reset(false);
    timer = window.setTimeout(() => void go(), DEBOUNCE);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) {
      e.preventDefault();
      reset(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(timer);
      void go().then(() => cards()[0]?.focus());
    } else if (e.key === 'ArrowDown') {
      const first = cards()[0];
      if (first) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  return {
    el,
    refresh() {
      invalidate();
      if (input.value.trim()) {
        clearTimeout(timer);
        timer = window.setTimeout(() => void go(), DEBOUNCE);
      }
    },
    dispose() {
      disposed = true;
      invalidate();
      clearTimeout(timer);
      host.grid.removeEventListener('keydown', onGridKey);
    },
  };
}
