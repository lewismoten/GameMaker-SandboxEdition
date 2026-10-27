// One achievement's details, opened from its badge on #/achievements (page.ts): the icon large,
// the title and the whole line, whether and when it was unlocked, how far along a counted one
// is, where it is earned (where.ts), and its part of the site. A hidden one not yet found shows
// only its hint. A modal <dialog>: Esc or Close shuts it, ← and → (or Previous and Next) step
// through the badges in page order, and focus goes back to the badge last shown.
import './details.css';
import { h, clear } from '../editor/core/ui';
import { CATEGORIES, progressOf, shownText, type Achievement } from './catalog';
import type { AchievementRecord } from './store';
import { placesOf } from './where';

const longDate = (t: number) => new Date(t).toLocaleDateString('en-US', { dateStyle: 'long' } as Intl.DateTimeFormatOptions);

function body(a: Achievement, r: AchievementRecord, close: () => void): (HTMLElement | null)[] {
  const when = r.unlocked[a.id];
  const secret = !!a.hidden && !when;
  const shown = shownText(a, !!when);
  const p = progressOf(a, r);
  const places = placesOf(a, !!when);
  const category = CATEGORIES.find((c) => c.id === a.category);
  const pct = p && p.of ? Math.round((p.n / p.of) * 100) : 0;
  const count = p ? `${p.n} of ${p.of}${a.unit ? ` ${a.unit}` : ''}` : '';
  return [
    h(
      'div',
      { class: 'ach-dlg-top' },
      h('span', { class: `ach-dlg-icon${when ? '' : ' is-locked'}`, 'aria-hidden': 'true' }, shown.icon),
      h(
        'div',
        null,
        h('h2', { id: 'ach-dlg-title', 'aria-label': secret ? 'Hidden achievement' : undefined }, shown.title),
        h(
          'p',
          { class: 'ach-dlg-status' },
          when
            ? ['Unlocked ', h('time', { datetime: new Date(when).toISOString() }, longDate(when))]
            : secret
              ? 'Hidden until you find it'
              : 'Not yet unlocked',
        ),
      ),
    ),
    secret ? h('p', { class: 'ach-dlg-desc' }, h('strong', null, 'Hint: '), shown.desc) : h('p', { class: 'ach-dlg-desc' }, shown.desc),
    p
      ? h(
          'div',
          { class: 'ach-dlg-progress' },
          h(
            'div',
            {
              class: 'ach-bar',
              role: 'progressbar',
              'aria-label': `${shown.title}: progress`,
              'aria-valuemin': '0',
              'aria-valuemax': String(p.of),
              'aria-valuenow': String(p.n),
              'aria-valuetext': count,
            },
            h('span', { style: `width:${pct}%` }),
          ),
          h('span', null, count),
        )
      : null,
    h(
      'dl',
      { class: 'ach-dlg-facts' },
      places.length
        ? [h('dt', null, 'Where'), h('dd', null, ...places.flatMap((pl, i) => [i ? ', ' : '', h('a', { href: pl.href, onclick: close }, pl.label)]))]
        : null,
      category ? [h('dt', null, 'Part'), h('dd', null, category.title)] : null,
    ),
  ];
}

/**
 * Opens the details of `list[index]`. `record` gives the record as it is now (it may change
 * while the dialog is open); `badge` finds an achievement's badge, to focus when it closes.
 */
export function openDetails(list: readonly Achievement[], index: number, record: () => AchievementRecord, badge: (id: string) => HTMLElement | null): void {
  let at = index;
  const content = h('div', { class: 'ach-dlg-body' });
  const prev = h('button', { type: 'button', 'aria-label': 'Previous achievement', title: 'Previous (←)', onclick: () => step(-1) }, '‹ Previous');
  const next = h('button', { type: 'button', 'aria-label': 'Next achievement', title: 'Next (→)', onclick: () => step(1) }, 'Next ›');
  const dlg = h('dialog', { class: 'modal ach-dlg', 'aria-labelledby': 'ach-dlg-title' });
  const done = (refocus: boolean) => {
    removeEventListener('hashchange', onHash);
    dlg.close();
    dlg.remove();
    if (refocus) badge(list[at].id)?.focus();
  };
  const onHash = () => done(false);
  const show = () => {
    clear(content, ...body(list[at], record(), () => done(false)));
    prev.disabled = at === 0;
    next.disabled = at === list.length - 1;
  };
  const step = (d: number) => {
    const to = Math.min(list.length - 1, Math.max(0, at + d));
    if (to === at) return;
    at = to;
    show();
  };
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    done(true);
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      if ((e.target as HTMLElement).closest('a')) return;
      e.preventDefault();
      step(e.key === 'ArrowLeft' ? -1 : 1);
      // a disabled button loses focus: keep it in the dialog
      if (!dlg.contains(document.activeElement) || (document.activeElement as HTMLButtonElement).disabled) closeBtn.focus();
    } else if (e.key === 'Tab') {
      // keep Tab inside the dialog (showModal makes the page inert; this also skips the browser's own bar)
      const stops = [...dlg.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')];
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  const closeBtn = h('button', { type: 'button', class: 'modal-close', 'aria-label': 'Close', title: 'Close (Esc)', onclick: () => done(true) }, '×');
  dlg.append(h('div', { class: 'ach-dlg-close' }, closeBtn), content, h('div', { class: 'ach-dlg-nav' }, prev, next));
  show();
  addEventListener('hashchange', onHash);
  document.body.append(dlg);
  dlg.showModal();
  closeBtn.focus();
}
