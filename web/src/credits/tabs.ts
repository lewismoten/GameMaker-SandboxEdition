// The Credits page's tabs: one area shown at a time (the rest stay in the page, so print and a
// link to anything inside them still reach it), the open one kept in the address as
// #/credits?tab=ai. A link to any id on the page (gotoCredit) opens the tab that holds it.
import { h } from '../editor/core/ui';
import { viewState } from '../urlState';

export interface CreditsTab {
  /** The section's heading id (credits-ai). */
  id: string;
  /** What the address keeps (?tab=ai). */
  key: string;
  title: string;
  what: string;
}

const view = viewState(['credits']);
let opener: ((id: string) => void) | undefined;

/** Opens the tab holding the element `id` and scrolls to it. */
export function gotoCredit(id: string): void {
  opener?.(id);
}

/** The tab list, wired to the panels (each a section element holding its heading id). */
export function creditsTabs(tabs: CreditsTab[], panels: HTMLElement[], main: HTMLElement): HTMLElement {
  const buttons = tabs.map((t) =>
    h('button', { type: 'button', role: 'tab', id: `${t.id}-tab`, class: 'credits-tab', 'aria-controls': `${t.id}-panel`, title: t.what }, t.title),
  );
  panels.forEach((p, i) => {
    p.id = `${tabs[i].id}-panel`;
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', tabs[i].id);
    p.classList.add('credits-panel');
  });
  let current = -1;
  const show = (i: number, focus = false) => {
    current = i;
    buttons.forEach((b, j) => {
      b.setAttribute('aria-selected', String(i === j));
      b.tabIndex = i === j ? 0 : -1;
      panels[j].classList.toggle('on', i === j);
    });
    view.set({ tab: i === 0 ? undefined : tabs[i].key });
    if (focus) buttons[i].focus();
  };
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => show(i));
    b.addEventListener('keydown', (e) => {
      const k = e.key;
      const to =
        k === 'ArrowRight'
          ? (i + 1) % tabs.length
          : k === 'ArrowLeft'
            ? (i + tabs.length - 1) % tabs.length
            : k === 'Home'
              ? 0
              : k === 'End'
                ? tabs.length - 1
                : -1;
      if (to < 0) return;
      e.preventDefault();
      show(to, true);
    });
  });
  opener = (id) => {
    const i = tabs.findIndex((t) => t.id === id || t.key === id);
    const target = main.querySelector<HTMLElement>(`#${CSS.escape(id)}`) ?? (i >= 0 ? panels[i] : null);
    const at = i >= 0 ? i : panels.findIndex((p) => target && p.contains(target));
    if (at < 0 || !target) return;
    if (at !== current) show(at);
    target.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  };
  const want = view.get('tab');
  show(
    Math.max(
      0,
      tabs.findIndex((t) => t.key === want),
    ),
  );
  return h('div', { class: 'credits-tabs', role: 'tablist', 'aria-label': 'Credits sections' }, ...buttons);
}
