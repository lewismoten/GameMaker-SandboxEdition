// Makes the web Guide's "How do I…?" parts live (manual/guideSections.ts keeps them as plain
// HTML for the static pages): the searchable index where a .guide-how-do-i stands, and the
// Try it boxes (aside.try-it data-try="<game>/<question id> …"), which gain the question, its
// level and the Play this level and See how it's made buttons. A box whose questions are
// missing keeps its plain text.
import { h } from '../core/ui';
import { levelTitle, loadQuestions } from '../../project/howDoI';
import { howDoIIndex, questionButtons } from './howDoIIndex';

export function enhanceTryIt(article: HTMLElement): void {
  for (const mount of article.querySelectorAll('.guide-how-do-i')) mount.replaceChildren(howDoIIndex());
  const boxes = [...article.querySelectorAll<HTMLElement>('aside.try-it[data-try]')];
  if (!boxes.length) return;
  void loadQuestions().then(
    ({ entries, questions }) => {
      for (const box of boxes) {
        const wanted = (box.dataset.try ?? '').split(/\s+/).filter(Boolean);
        for (const key of wanted) {
          const q = questions.find((x) => `${x.game}/${x.id}` === key);
          const entry = q && entries.get(q.game);
          if (!q || !entry) continue;
          const lv = levelTitle(entry, q.level);
          box.append(
            h(
              'div',
              { class: 'try-it-line' },
              h('div', null, h('b', null, q.q), ` ${q.gameTitle}, level ${q.level}${lv ? `: ${lv}` : ''}`),
              questionButtons(entry, q),
            ),
          );
        }
      }
    },
    () => undefined,
  );
}
