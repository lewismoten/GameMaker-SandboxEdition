// The shareware catalog and this month's TURBO BUTTON, lying flat on the desk one on the other,
// the magazine on top and turned a little so both show. Click the stack (or press Enter or
// the down arrow on it) for a small menu of the two: the arrow keys, Home, End or Tab move
// between them, Esc closes it and puts the keyboard back on the stack. Pointing at a choice
// lifts its paper off the stack.
import './paperStack.css';
import { h } from '../../editor/core/ui';

type Pick = 'catalog' | 'magazine';

/** The catalog's typed cover: plain, stapled, from a copier. */
const catalogSheet = (): HTMLElement =>
  h(
    'div',
    { class: 'ps-sheet ps-catalog' },
    h('b', null, 'SHAREWARE', h('br'), 'CATALOG'),
    h('em', null, 'Games made with Game-Maker · Fall 1994 · call our BBS!'),
  );

/** The magazine's cover small: the red masthead, the big news, cover lines and the free CD's burst. */
const magazineSheet = (): HTMLElement =>
  h(
    'div',
    { class: 'ps-sheet ps-magazine' },
    h('b', { class: 'ps-mast' }, 'TURBO BUTTON'),
    h('span', { class: 'ps-issue' }, 'Collector’s Issue'),
    h('strong', null, 'GAME-MAKER’S SOURCE CODE SET FREE!'),
    h('span', { class: 'ps-shots' }, h('i'), h('i'), h('i')),
    h('span', { class: 'ps-lines' }, h('i'), h('i'), h('i')),
    h('span', { class: 'ps-burst' }, 'FREE CD-ROM!'),
  );

export function paperStack(open: Record<Pick, () => void>): HTMLElement {
  const sheets = h('div', { class: 'ps-desk', 'aria-hidden': 'true' }, catalogSheet(), magazineSheet());
  const toggle = h(
    'button',
    {
      type: 'button',
      class: 'prop ps-toggle',
      'aria-expanded': 'false',
      'aria-controls': 'paper-stack-menu',
    },
    sheets,
    // its name, read out with whether its menu is open
    h('span', { class: 'caption' }, 'Catalog & magazine'),
  );
  const choice = (pick: Pick, label: string, more: string) =>
    h(
      'button',
      { type: 'button', class: `ps-choice ps-choice-${pick}`, 'data-pick': pick },
      h('span', { class: 'ps-icon', 'aria-hidden': 'true' }),
      h('span', { class: 'ps-label' }, label, h('small', null, more)),
    );
  const items = [
    choice('catalog', 'Shareware catalog', 'Games made with Game-Maker'),
    choice('magazine', 'TURBO BUTTON magazine', 'Hints, reviews and every game'),
  ];
  const menu = h('div', { class: 'ps-menu', id: 'paper-stack-menu', role: 'group', 'aria-label': 'Catalog or magazine', hidden: '' }, ...items);
  const stack = h('div', { class: 'paper-stack' }, toggle, menu);

  const isOpen = () => !menu.hidden;
  const hot = (pick?: Pick) => {
    if (pick) stack.dataset.hot = pick;
    else delete stack.dataset.hot;
  };
  const show = (first: number) => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    stack.classList.add('ps-open');
    items[first]?.focus();
  };
  const hide = (refocus: boolean) => {
    if (!isOpen()) return;
    if (refocus) toggle.focus();
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    stack.classList.remove('ps-open');
    hot();
  };

  toggle.addEventListener('click', () => (isOpen() ? hide(true) : show(0)));
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      show(e.key === 'ArrowUp' ? items.length - 1 : 0);
    } else if (e.key === 'Escape' && isOpen()) {
      e.stopPropagation();
      hide(true);
    }
  });
  for (const [i, item] of items.entries()) {
    const pick = item.dataset.pick as Pick;
    item.addEventListener('click', () => {
      hide(true); // the keyboard comes back to the stack when what opens is closed
      open[pick]();
    });
    item.addEventListener('pointerenter', () => hot(pick));
    // back to the one the keyboard is on, if any
    item.addEventListener('pointerleave', () => hot(items.find((x) => x === document.activeElement)?.dataset.pick as Pick | undefined));
    item.addEventListener('focus', () => hot(pick));
    item.addEventListener('keydown', (e) => {
      const to = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: items.length - 1 }[e.key];
      if (to !== undefined) {
        e.preventDefault();
        items[(to + items.length) % items.length]?.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        hide(true);
      }
    });
  }
  // Tab or a click away from the stack closes the menu, leaving the keyboard where it went
  stack.addEventListener('focusout', (e) => {
    if (!stack.contains(e.relatedTarget as Node | null) && e.relatedTarget) hide(false);
  });
  const away = (e: PointerEvent) => {
    if (!stack.isConnected) document.removeEventListener('pointerdown', away);
    else if (isOpen() && !stack.contains(e.target as Node)) hide(false);
  };
  document.addEventListener('pointerdown', away);
  return stack;
}
