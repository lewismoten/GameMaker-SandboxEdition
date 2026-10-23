// "On this page" beside a reading page (the Mac, Windows and Linux pages, the cast) on a wide
// window: a list of its sections (h2 with an id), and optionally smaller entries under them,
// that stays in view as the page scrolls and marks the part being read. pageToc.css lays the
// page out in two columns from 1200px; narrower, the list is not shown.
import './pageToc.css';
import { h } from './editor/core/ui';

export interface PageTocOptions {
  /** More headings to list, indented under their section (e.g. '.cast-card h3[id]'). */
  sub?: string;
}

export function pageToc(main: HTMLElement, o: PageTocOptions = {}): void {
  const heads = [...main.querySelectorAll<HTMLElement>(o.sub ? `h2[id], ${o.sub}` : 'h2[id]')];
  if (heads.filter((e) => e.tagName === 'H2').length < 2) return;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = heads.map((head) => {
    const a = h('a', {
      // the address stays the page's own (#/mac…): the link only scrolls
      href: location.hash || '#/',
      onclick: (e: MouseEvent) => {
        e.preventDefault();
        head.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
        if (!head.hasAttribute('tabindex')) head.setAttribute('tabindex', '-1');
        head.focus({ preventScroll: true });
      },
    }, head.textContent?.trim() ?? '');
    return { head, a, li: h('li', { class: head.tagName === 'H2' ? '' : 'toc-sub' }, a) };
  });
  const nav = h(
    'nav',
    { class: 'page-toc', 'aria-labelledby': 'page-toc-h' },
    h('h2', { id: 'page-toc-h' }, 'On this page'),
    h('ul', null, ...items.map((i) => i.li)),
  );
  const body = h('div', { class: 'toc-body' }, ...main.childNodes);
  main.replaceChildren(body, nav);
  main.classList.add('with-toc');

  // entries for parts hidden now (a filter on the page) are hidden too
  const sync = () =>
    items.forEach((i) => {
      const gone = !!i.head.closest('[hidden]');
      if (i.li.hidden !== gone) i.li.hidden = gone;
    });
  sync();
  new MutationObserver(sync).observe(body, { subtree: true, attributes: true, attributeFilter: ['hidden'] });

  // the part being read: the last heading above the top third of the window
  const mark = () => {
    let current = items[0];
    for (const i of items) if (!i.li.hidden && i.head.getBoundingClientRect().top < innerHeight / 3) current = i;
    for (const i of items) {
      if (i === current) i.a.setAttribute('aria-current', 'location');
      else i.a.removeAttribute('aria-current');
    }
  };
  let queued = false;
  const onScroll = () => {
    if (!main.isConnected) return removeEventListener('scroll', onScroll);
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => ((queued = false), mark()));
  };
  addEventListener('scroll', onScroll, { passive: true });
  mark();
}
