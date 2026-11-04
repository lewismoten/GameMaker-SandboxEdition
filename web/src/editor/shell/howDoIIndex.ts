// The "How do I…?" index: a searchable list of the questions the Starters answer, each with
// Play this level and See how it's made (howDoIGo.ts). It is on the Starters tab (compact) and
// in the Guide (full), and fills itself from the games' manuals (project/howDoI.ts), so a new
// Starter shows up by listing its questions. The Guide's Try it boxes (tryIt.ts) use the same buttons.
import './howDoI.css';
import { h, toast } from '../core/ui';
import type { CatalogEntry } from '../../project/files';
import { filterQuestions, levelTitle, loadQuestions, type Question } from '../../project/howDoI';
import { starterGroupOf } from '../../project/starter';
import { playHref, seeHref } from './howDoIGo';

/** The two buttons for one question, with names that say which question they are for. */
export function questionButtons(entry: CatalogEntry, q: Question): HTMLElement {
  const go = (label: string, href: (e: CatalogEntry, q: Question) => Promise<string | undefined>, primary = false) => {
    const b = h(
      'button',
      {
        type: 'button',
        class: primary ? 'primary' : '',
        'aria-label': `${label}: ${q.q}`,
        onclick: () => {
          b.disabled = true;
          b.textContent = 'Opening…';
          void href(entry, q)
            .then((to) => (to ? (location.hash = to) : toast('That level could not be opened.')))
            .catch(() => toast('That level could not be opened.'))
            .finally(() => {
              b.disabled = false;
              b.textContent = label;
            });
        },
      },
      label,
    );
    return b;
  };
  return h('span', { class: 'hdi-actions' }, go('Play this level', playHref, true), go('See how it’s made', seeHref));
}

/** How many questions the Starters tab shows before "Show all"; a search shows every match. */
const FIRST = 3;

/** Moves focus to the game grid's one Tab stop (the tile last used, else the first), skipping the questions. */
function focusGames(): void {
  const tiles = document.querySelectorAll<HTMLElement>('#lib-panel .game-tile:not([hidden]) .tile-select, #lib-panel .lib-drop-pick');
  (Array.from(tiles).find((el) => el.tabIndex === 0) ?? tiles[0])?.focus();
}

/** The index: `compact` keeps it to a search box and a few questions, a button for the rest, and a Skip link (the Starters tab). */
export function howDoIIndex(opts: { compact?: boolean } = {}): HTMLElement {
  const search = h('input', {
    type: 'search',
    id: `hdi-search-${opts.compact ? 'tab' : 'guide'}`,
    placeholder: 'Search, such as “key” or “ladder”',
    autocomplete: 'off',
  });
  const count = h('span', { class: 'hdi-count', role: 'status' });
  const list = h('ul', { class: 'hdi-list' });
  const more = h('button', { type: 'button', class: 'hdi-more', 'aria-expanded': 'false' });
  let all = !opts.compact;
  const skip = opts.compact ? h('button', { type: 'button', class: 'hdi-skip', onclick: focusGames }, 'Skip to the games') : undefined;
  const root = h(
    'div',
    { class: `hdi${opts.compact ? ' compact' : ''}`, role: 'region', 'aria-labelledby': `${search.id}-label` },
    skip,
    h('div', { class: 'hdi-head' }, h('label', { id: `${search.id}-label`, for: search.id }, 'How do I…?'), search, count),
    list,
    opts.compact ? more : undefined,
  );
  void loadQuestions().then(
    ({ entries, questions }) => {
      const show = () => {
        const found = filterQuestions(questions, search.value);
        const searching = !!search.value.trim();
        const shown = all || searching ? found : found.slice(0, FIRST);
        more.hidden = searching || found.length <= FIRST;
        more.textContent = all ? 'Show fewer questions' : `Show all ${found.length} questions`;
        more.setAttribute('aria-expanded', String(all));
        count.textContent = search.value.trim() ? `${found.length} of ${questions.length}` : `${questions.length} questions`;
        list.replaceChildren(
          ...shown.map((q) => {
            const entry = entries.get(q.game)!;
            const lv = levelTitle(entry, q.level);
            const group = starterGroupOf(q.game);
            return h(
              'li',
              null,
              h('span', { class: 'hdi-q' }, q.q),
              h('span', { class: 'hdi-where' }, `${group ? `${group}: ` : ''}${q.gameTitle}, level ${q.level}${lv ? `: ${lv}` : ''}`),
              questionButtons(entry, q),
            );
          }),
        );
        if (!found.length) list.append(h('li', { class: 'hdi-none' }, 'No question matches. Try one word, such as “door”.'));
      };
      more.addEventListener('click', () => {
        all = !all;
        show();
      });
      search.addEventListener('input', show);
      show();
    },
    () => root.replaceChildren(h('p', { class: 'hint' }, 'The questions could not be loaded.')),
  );
  return root;
}
