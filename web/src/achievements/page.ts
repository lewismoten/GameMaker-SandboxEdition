// "What you've done" (#/achievements): every achievement by part of the site, with how far
// along the counted ones are and when each was unlocked, as badges of one size. Hidden ones show
// "???" and a vague hint until they are. A badge opens its details (details.ts). The same record the desk's ACHIEVE.EXE shows (store.ts). A Reset at the
// bottom forgets them all, after asking.
import './page.css';
import { h, clear, confirmDialog } from '../editor/core/ui';
import { pageToc } from '../pageToc';
import { ACHIEVEMENTS, CATEGORIES, progressOf, shownText, type Achievement } from './catalog';
import { openDetails } from './details';
import { refreshGoals } from './goals';
import { ACHIEVEMENTS_CHANGED, loadAchievements, resetAchievements, type AchievementRecord } from './store';

const dateOf = (t: number) => new Date(t);
const longDate = (t: number) => dateOf(t).toLocaleDateString('en-US', { dateStyle: 'medium' } as Intl.DateTimeFormatOptions);

function bar(n: number, of: number, label: string): HTMLElement {
  const pct = of ? Math.round((n / of) * 100) : 0;
  return h(
    'div',
    {
      class: 'ach-bar',
      role: 'progressbar',
      'aria-label': label,
      'aria-valuemin': '0',
      'aria-valuemax': String(of),
      'aria-valuenow': String(n),
      'aria-valuetext': `${n} of ${of}`,
    },
    h('span', { style: `width:${pct}%` }),
  );
}

function card(a: Achievement, r: AchievementRecord, open: () => void): HTMLElement {
  const when = r.unlocked[a.id];
  const shown = shownText(a, !!when);
  const p = progressOf(a, r);
  const secret = a.hidden && !when;
  return h(
    'li',
    null,
    h(
      'button',
      {
        type: 'button',
        class: `ach-card${when ? ' is-done' : ''}${secret ? ' is-hidden' : ''}`,
        'data-id': a.id,
        'aria-haspopup': 'dialog',
        title: secret ? 'Hidden achievement: show its hint' : `${shown.title}: show the details`,
        onclick: open,
      },
      h('span', { class: 'ach-icon', 'aria-hidden': 'true' }, shown.icon),
      h(
        'span',
        { class: 'ach-body' },
        h(
          'span',
          { class: 'ach-title' },
          secret ? [h('span', { 'aria-hidden': 'true' }, shown.title), h('span', { class: 'sr-only' }, 'Hidden achievement')] : shown.title,
        ),
        h('span', { class: 'ach-desc' }, shown.desc),
        h(
          'span',
          { class: 'ach-progress' },
          p
            ? [
                h('span', { class: 'ach-bar', 'aria-hidden': 'true' }, h('span', { style: `width:${p.of ? Math.round((p.n / p.of) * 100) : 0}%` })),
                h('span', null, `${p.n} of ${p.of}${a.unit ? ` ${a.unit}` : ''}`),
              ]
            : null,
        ),
        h(
          'span',
          { class: 'ach-when' },
          when ? ['Unlocked ', h('time', { datetime: dateOf(when).toISOString() }, longDate(when))] : secret ? 'Hidden' : 'Not yet',
        ),
      ),
    ),
  );
}

export function renderAchievements(el: HTMLElement): void {
  const main = h('main', { class: 'ach-page' });
  clear(el, main);
  // every badge in page order, for the details' Previous and Next
  const ordered = CATEGORIES.flatMap((c) => ACHIEVEMENTS.filter((a) => a.category === c.id));
  let record: AchievementRecord | undefined;
  const badge = (id: string) => main.querySelector<HTMLElement>(`.ach-card[data-id="${id}"]`);
  const open = (a: Achievement) => {
    const first = record;
    if (first) openDetails(ordered, ordered.indexOf(a), () => record ?? first, badge);
  };
  const draw = (r: AchievementRecord) => {
    record = r;
    const total = ACHIEVEMENTS.length;
    const done = ACHIEVEMENTS.filter((a) => r.unlocked[a.id]).length;
    const sections = CATEGORIES.map((c) => {
      const list = ACHIEVEMENTS.filter((a) => a.category === c.id);
      const got = list.filter((a) => r.unlocked[a.id]).length;
      const id = `ach-${c.id}`;
      return h(
        'section',
        { 'aria-labelledby': id, class: 'ach-section' },
        h('div', { class: 'ach-section-head' }, h('h2', { id }, c.title), h('span', { class: 'ach-count' }, `${got} of ${list.length}`)),
        h('p', { class: 'ach-blurb' }, c.blurb),
        bar(got, list.length, `${c.title}: unlocked`),
        h('ul', { class: 'ach-grid' }, ...list.map((a) => card(a, r, () => open(a)))),
      );
    });
    clear(
      main,
      h('p', { class: 'ach-back' }, h('a', { href: '#/' }, '← All games')),
      h('h1', null, 'What you’ve done'),
      h(
        'p',
        { class: 'lead' },
        'Making games, playing them, watching walkthroughs and poking around the 1994 desk all count. They are kept in this browser, for the web pages and the desk alike. A few are hidden until you find them.',
      ),
      h(
        'div',
        { class: 'ach-summary' },
        h('strong', null, `${done} of ${total}`),
        h('span', null, ' unlocked'),
        bar(done, total, 'All achievements: unlocked'),
      ),
      ...sections,
      h(
        'section',
        { 'aria-labelledby': 'ach-reset', class: 'ach-section ach-reset' },
        h('h2', { id: 'ach-reset' }, 'Start over'),
        h('p', null, 'Forget every achievement in this browser. Your games, saves, tin hearts and felt eggs stay as they are.'),
        h(
          'button',
          {
            class: 'danger',
            onclick: async () => {
              if (
                !(await confirmDialog(
                  'Reset achievements?',
                  'Every achievement and its date will be forgotten in this browser. This cannot be undone.',
                  'Reset',
                ))
              )
                return;
              await resetAchievements();
              void refreshGoals();
            },
          },
          'Reset achievements…',
        ),
      ),
    );
    pageToc(main);
  };
  const update = () => {
    if (!main.isConnected) return window.removeEventListener(ACHIEVEMENTS_CHANGED, update);
    const y = scrollY;
    void loadAchievements().then((r) => {
      draw(r);
      scrollTo(0, y);
    });
  };
  window.addEventListener(ACHIEVEMENTS_CHANGED, update);
  void loadAchievements().then(draw);
  // the catalog's totals may have changed since they were last counted
  void refreshGoals();
}
