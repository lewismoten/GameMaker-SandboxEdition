// A small ⓘ button whose text shows in a bubble on hover, on focus and on tap (a toggletip), for
// the longer notes of the "Saves & scores" panel. The bubble is a popover, so it shows above the
// dialog and outside its scrolling; fields name it in aria-describedby, so screen readers read it
// with the field even while it is hidden.
import { h } from '../editor/core/ui';

type Child = Parameters<typeof h>[2];

let next = 0;

interface Tip {
  /** The ⓘ button and its bubble, to put beside a label. */
  el: HTMLElement;
  /** The bubble's id, for aria-describedby. */
  id: string;
}

/** `about` names what the tip is about ("Score"), for the button's accessible name. */
export function tip(about: string, ...text: Child[]): Tip {
  const id = `sv-tip-${++next}`;
  // spaces between the paragraphs, so they read apart in the field's description too
  const bubble = h('div', { class: 'sv-tip-bubble', id, role: 'tooltip', popover: 'manual' }, ...text.flatMap((t, i) => (i ? [' ', t] : [t])));
  let pinned = false;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  const isOpen = () => bubble.matches(':popover-open');
  const place = () => {
    const r = btn.getBoundingClientRect();
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - bw - 8, r.left + r.width / 2 - bw / 2));
    // below the button, or above it when there's no room below
    const below = r.bottom + 6;
    const top = below + bh > window.innerHeight - 8 && r.top - bh - 6 > 8 ? r.top - bh - 6 : below;
    bubble.style.left = `${Math.round(left)}px`;
    bubble.style.top = `${Math.round(top)}px`;
  };
  const show = () => {
    clearTimeout(hideTimer);
    if (!bubble.isConnected) return;
    // one bubble at a time
    for (const other of document.querySelectorAll<HTMLElement>('.sv-tip-bubble:popover-open')) if (other !== bubble) other.hidePopover();
    if (!isOpen()) bubble.showPopover();
    place();
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', outside, true);
  };
  const hide = () => {
    clearTimeout(hideTimer);
    pinned = false;
    if (isOpen()) bubble.hidePopover();
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside, true);
  };
  const hideSoon = () => {
    if (pinned) return;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, 180);
  };
  const outside = (e: Event) => {
    if (!btn.contains(e.target as Node) && !bubble.contains(e.target as Node)) hide();
  };
  const btn = h(
    'button',
    {
      type: 'button',
      class: 'sv-tip',
      'aria-label': `About ${about}`,
      'aria-describedby': id,
      'aria-expanded': 'false',
      onclick: () => {
        if (pinned) return hide();
        pinned = true;
        show();
      },
      onpointerenter: (e: PointerEvent) => e.pointerType === 'mouse' && show(),
      onpointerleave: (e: PointerEvent) => e.pointerType === 'mouse' && hideSoon(),
      onfocus: () => show(),
      onblur: () => hideSoon(),
      onkeydown: (e: KeyboardEvent) => {
        // Esc closes the bubble, not the dialog
        if (e.key === 'Escape' && isOpen()) {
          e.preventDefault();
          e.stopPropagation();
          hide();
        }
      },
    },
    h('span', { 'aria-hidden': 'true' }, 'i'),
  );
  // the bubble can be hovered (to read it or select its text) without it going away
  bubble.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  bubble.addEventListener('pointerleave', hideSoon);
  return { el: h('span', { class: 'sv-tip-wrap' }, btn, bubble), id };
}
