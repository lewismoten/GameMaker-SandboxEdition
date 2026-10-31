// "What you've done" (#/achievements): every achievement by part of the site, with how far
// along the counted ones are and when each was unlocked, as badges of one size. Hidden ones show
// "???" and a vague hint until they are. A badge opens its details (details.ts). The same record the desk's ACHIEVE.EXE shows (store.ts). A Reset at the
// bottom forgets them all, after asking.
import './page.css';
import { badgeIcon } from './badgeArt';
import { h, clear, confirmDialog } from '../editor/core/ui';
import { ACHIEVEMENTS, CATEGORIES, achievementById, progressOf, shownText, type Achievement } from './catalog';
import { openDetails } from './details';
import { refreshGoals } from './goals';
import { ACHIEVEMENTS_CHANGED, loadAchievements, resetAchievements, type AchievementRecord } from './store';

const TAB_KEY = 'gm-ach-tab';
/** The category last shown, kept for this tab so a redraw or a return to the page finds it again. */
function savedTab(): string {
  let id: string | null = null;
  try {
    id = sessionStorage.getItem(TAB_KEY);
  } catch {
    /* no storage */
  }
  return CATEGORIES.some((c) => c.id === id) ? id! : CATEGORIES[0].id;
}
function saveTab(id: string): void {
  try {
    sessionStorage.setItem(TAB_KEY, id);
  } catch {
    /* no storage */
  }
}

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
  const count = p ? `${p.n} of ${p.of}${a.unit ? ` ${a.unit}` : ''}` : '';
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
      h('span', { class: 'ach-icon', 'aria-hidden': 'true' }, badgeIcon(a, !!when)),
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
                // the unit ("kinds of file") is in the description; beside a bar of a useful width it is said, not shown
                h('span', { title: count }, `${p.n} of ${p.of}`, a.unit ? h('span', { class: 'sr-only' }, ` ${a.unit}`) : null),
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
  let tab = savedTab();
  // a badge may be in a tab that isn't shown (Previous and Next walk them all): show that tab first
  const badge = (id: string) => {
    const cat = achievementById(id)?.category;
    if (cat && cat !== tab && record) {
      tab = cat;
      saveTab(cat);
      draw(record);
    }
    return main.querySelector<HTMLElement>(`.ach-card[data-id="${id}"]`);
  };
  const open = (a: Achievement) => {
    const first = record;
    if (first) openDetails(ordered, ordered.indexOf(a), () => record ?? first, badge);
  };
  function draw(r: AchievementRecord): void {
    record = r;
    const total = ACHIEVEMENTS.length;
    const done = ACHIEVEMENTS.filter((a) => r.unlocked[a.id]).length;
    const cat = CATEGORIES.find((c) => c.id === tab) ?? CATEGORIES[0];
    const list = ACHIEVEMENTS.filter((a) => a.category === cat.id);
    const got = list.filter((a) => r.unlocked[a.id]).length;
    const tabId = (id: string) => `ach-tab-${id}`;
    const focused = main.querySelector('[role="tablist"]')?.contains(document.activeElement);
    const choose = (id: string, focus: boolean) => {
      tab = id;
      saveTab(id);
      draw(r);
      if (focus) main.querySelector<HTMLElement>(`#${tabId(id)}`)?.focus();
    };
    const tabs = h(
      'div',
      { class: 'ach-tabs', role: 'tablist', 'aria-label': 'Parts of the site' },
      ...CATEGORIES.map((c, i) => {
        const n = ACHIEVEMENTS.filter((a) => a.category === c.id);
        const selected = c.id === cat.id;
        return h(
          'button',
          {
            type: 'button',
            role: 'tab',
            id: tabId(c.id),
            class: 'ach-tab',
            'aria-selected': String(selected),
            'aria-controls': 'ach-panel',
            tabindex: selected ? '0' : '-1',
            onclick: () => choose(c.id, false),
            onkeydown: (e: KeyboardEvent) => {
              const last = CATEGORIES.length - 1;
              const to =
                e.key === 'ArrowRight' || e.key === 'ArrowDown'
                  ? (i + 1) % CATEGORIES.length
                  : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                    ? (i + last) % CATEGORIES.length
                    : e.key === 'Home'
                      ? 0
                      : e.key === 'End'
                        ? last
                        : -1;
              if (to < 0) return;
              e.preventDefault();
              choose(CATEGORIES[to].id, true);
            },
          },
          h('span', { class: 'ach-tab-title' }, c.title),
          h('span', { class: 'ach-tab-count' }, `${n.filter((a) => r.unlocked[a.id]).length} of ${n.length}`),
        );
      }),
    );
    const panel = h(
      'section',
      { id: 'ach-panel', role: 'tabpanel', 'aria-labelledby': tabId(cat.id), class: 'ach-section' },
      h('div', { class: 'ach-section-head' }, h('h2', null, cat.title), h('span', { class: 'ach-count' }, `${got} of ${list.length}`)),
      h('p', { class: 'ach-blurb' }, cat.blurb),
      bar(got, list.length, `${cat.title}: unlocked`),
      h('ul', { class: 'ach-grid' }, ...list.map((a) => card(a, r, () => open(a)))),
    );
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
      tabs,
      panel,
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
    if (focused) main.querySelector<HTMLElement>(`#${tabId(cat.id)}`)?.focus({ preventScroll: true });
  }
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
