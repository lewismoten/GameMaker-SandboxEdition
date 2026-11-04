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

/** The index: `compact` keeps it to a search box and a short scrolling list (the Starters tab). */
export function howDoIIndex(opts: { compact?: boolean } = {}): HTMLElement {
  const search = h('input', {
    type: 'search',
    id: `hdi-search-${opts.compact ? 'tab' : 'guide'}`,
    placeholder: 'Search, such as “key” or “ladder”',
    autocomplete: 'off',
  });
  const count = h('span', { class: 'hdi-count', role: 'status' });
  const list = h('ul', { class: 'hdi-list' });
  const root = h(
    'div',
    { class: `hdi${opts.compact ? ' compact' : ''}`, role: 'region', 'aria-labelledby': `${search.id}-label` },
    h('div', { class: 'hdi-head' }, h('label', { id: `${search.id}-label`, for: search.id }, 'How do I…?'), search, count),
    list,
  );
  void loadQuestions().then(
    ({ entries, questions }) => {
      const show = () => {
        const found = filterQuestions(questions, search.value);
        count.textContent = search.value.trim() ? `${found.length} of ${questions.length}` : `${questions.length} questions`;
        list.replaceChildren(
          ...found.map((q) => {
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
      search.addEventListener('input', show);
      show();
    },
    () => root.replaceChildren(h('p', { class: 'hint' }, 'The questions could not be loaded.')),
  );
  return root;
}
