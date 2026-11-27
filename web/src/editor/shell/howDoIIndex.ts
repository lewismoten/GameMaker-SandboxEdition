// The "How do I…?" index: a searchable list of the questions the Starters answer, each with
// Play this level and See how it's made (howDoIGo.ts). On the Starters tab it is one button that
// opens it in a dialog (compact); in the Guide it is the full list on the page. It fills itself from the games' manuals (project/howDoI.ts), so a new
// Starter shows up by listing its questions. The Guide's Try it boxes (tryIt.ts) use the same buttons.
import './howDoI.css';
import { h, modal, toast } from '../core/ui';
import type { CatalogEntry } from '../../project/files';
import { filterQuestions, levelTitle, loadQuestions, type Question } from '../../project/howDoI';
import { starterGroupOf } from '../../project/starter';
import { unlockAchievement } from '../../achievements';
import { playHref, seeHref } from './howDoIGo';

let latestAction = 0;

/** The two buttons for one question, with names that say which question they are for. */
export function questionButtons(entry: CatalogEntry, q: Question, onGo?: () => void): HTMLElement {
  const go = (label: string, href: (e: CatalogEntry, q: Question) => Promise<string | undefined>, primary = false) => {
    const b = h(
      'button',
      {
        type: 'button',
        class: primary ? 'primary' : '',
        'aria-label': `${label}: ${q.q}`,
        onclick: () => {
          const action = ++latestAction;
          const hash = location.hash;
          let left = false;
          const leave = () => {
            left = true;
          };
          window.addEventListener('hashchange', leave);
          const active = () => action === latestAction && !left && location.hash === hash && b.isConnected;
          b.disabled = true;
          b.textContent = 'Opening…';
          void href(entry, q)
            .then((to) => {
              if (!active()) return;
              if (!to) return toast('That level could not be opened.');
              location.hash = to;
              onGo?.();
              if (!primary) unlockAchievement('learn-lesson');
              toast(`${primary ? 'Starting' : 'Opened the map of'} ${entry.title}, level ${q.level}.`);
            })
            .catch(() => {
              if (active()) toast('That level could not be opened.');
            })
            .finally(() => {
              window.removeEventListener('hashchange', leave);
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

/** The index itself: a labelled search box, a live count and the list (every question, or the matches). */
function indexBody(id: string, dialog: boolean, onGo?: () => void): { root: HTMLElement; search: HTMLInputElement } {
  const search = h('input', {
    type: 'search',
    id: `hdi-search-${id}`,
    placeholder: 'Search, such as “key” or “ladder”',
    autocomplete: 'off',
  });
  const count = h('span', { class: 'hdi-count', role: 'status', 'aria-live': 'polite' });
  const list = h('ul', { class: 'hdi-list', ...(dialog ? { tabindex: '0', 'aria-label': 'Matching questions', 'data-list-area': 'questions' } : {}) });
  const root = h(
    'div',
    { class: `hdi${dialog ? ' hdi-dlg' : ''}`, ...(dialog ? {} : { role: 'region', 'aria-labelledby': `${search.id}-label` }) },
    h('div', { class: 'hdi-head' }, h('label', { id: `${search.id}-label`, for: search.id }, 'Search the questions'), search, count),
    list,
  );
  void loadQuestions().then(
    ({ entries, questions }) => {
      const show = () => {
        const found = filterQuestions(questions, search.value);
        const total = search.value.trim() ? `${found.length} of ${questions.length} questions` : `${questions.length} questions; scroll the list for more`;
        if (count.textContent !== total) count.textContent = total;
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
              questionButtons(entry, q, onGo),
            );
          }),
        );
        if (!found.length) list.append(h('li', { class: 'hdi-none' }, 'No question matches. Try one word, such as “door”.'));
      };
      search.addEventListener('input', show);
      show();
    },
    () => root.replaceChildren(h('p', { class: 'hint', role: 'alert' }, 'The questions could not be loaded.')),
  );
  return { root, search };
}

/** The index: `compact` is one button that opens it in a dialog (the Starters tab); otherwise the full list (the Guide). */
export function howDoIIndex(opts: { compact?: boolean } = {}): HTMLElement {
  if (!opts.compact) return indexBody('guide', false).root;
  const button = h('button', { type: 'button', class: 'hdi-open', 'aria-haspopup': 'dialog' }, 'How do I…?');
  button.addEventListener('click', () => {
    void modal<void>('How do I…?', (close) => {
      const { root, search } = indexBody('dialog', true, () => close(undefined));
      requestAnimationFrame(() => search.focus());
      return root;
    }).then(() => button.focus());
  });
  return button;
}
