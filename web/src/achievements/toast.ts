// The note that says an achievement was just unlocked. A polite live region, so a screen
// reader hears it without losing its place; each note can be closed, and goes on its own after
// a while (not while it is pointed at or focused). On today's web it is a small card under the
// header, at the right; on the 1994 desk a sticky note stuck to the monitor's top left corner,
// off the screen itself. It goes in the top layer (a manual popover) so an open dialog (Saves &
// scores) doesn't hide it.
import './toast.css';
import { achievementById } from './catalog';

const SHOW_MS = 7000;
let host: HTMLElement | undefined;

const isDesk = () => document.documentElement.dataset.ui === 'desk';

function ensureHost(): HTMLElement {
  if (host?.isConnected) return host;
  host = document.createElement('div');
  host.className = 'ach-toasts';
  host.setAttribute('role', 'status');
  host.setAttribute('aria-live', 'polite');
  if ('showPopover' in host) host.setAttribute('popover', 'manual');
  document.body.append(host);
  return host;
}

/** Brings the notes to the front of the top layer (above a dialog opened since). */
function raise(el: HTMLElement): void {
  if (!el.hasAttribute('popover')) return;
  try {
    if (el.matches(':popover-open')) el.hidePopover();
    el.showPopover();
  } catch {
    /* not supported after all */
  }
}

/**
 * On the desk: stuck on the monitor's top left corner, over the plastic and the picture's
 * edge (the room is scaled and scrolled). Not the top right, where the "Too retro?" sticky
 * note would take a stray click off the desk, and not on the wall beside it, where the
 * clipping and the black-light poster hang; clicks go through the notes (toast.css).
 */
function place(el: HTMLElement): void {
  const desk = isDesk();
  el.classList.toggle('ach-desk', desk);
  el.style.removeProperty('top');
  el.style.removeProperty('left');
  if (!desk) return;
  const monitor = document.querySelector('.desk[data-zoom="false"] .monitor, .monitor');
  const r = monitor?.getBoundingClientRect();
  if (!r || !r.width || r.bottom < 0 || r.top > innerHeight) return;
  const width = Math.min(200, innerWidth - 32);
  el.style.left = `${Math.max(16, Math.min(r.left + Math.min(24, r.width * 0.04), innerWidth - width - 16))}px`;
  el.style.top = `${Math.max(8, r.top - 18)}px`;
}

export function showUnlock(id: string): void {
  const a = achievementById(id);
  if (!a || typeof document === 'undefined') return;
  const el = ensureHost();
  const note = document.createElement('div');
  note.className = 'ach-toast';
  const icon = document.createElement('span');
  icon.className = 'ach-toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = a.icon;
  const text = document.createElement('div');
  text.className = 'ach-toast-text';
  const kicker = document.createElement('span');
  kicker.className = 'ach-toast-kicker';
  kicker.textContent = isDesk() ? 'Done!' : 'Achievement unlocked';
  const title = document.createElement('strong');
  title.textContent = a.title;
  const desc = document.createElement('span');
  desc.className = 'ach-toast-desc';
  desc.textContent = a.doneDesc ?? a.desc;
  text.append(kicker, title, desc);
  if (!isDesk()) {
    const link = document.createElement('a');
    link.href = '#/achievements';
    link.className = 'ach-toast-link';
    link.textContent = 'See all';
    link.addEventListener('click', () => close());
    text.append(link);
  }
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'ach-toast-close';
  x.setAttribute('aria-label', `Dismiss: ${a.title}`);
  x.title = 'Dismiss';
  x.textContent = '×';
  note.append(icon, text, x);

  let timer: ReturnType<typeof setTimeout> | undefined;
  const close = () => {
    clearTimeout(timer);
    note.remove();
    if (!el.childElementCount && el.hasAttribute('popover')) {
      try {
        el.hidePopover();
      } catch {
        /* closed already */
      }
    }
  };
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(close, SHOW_MS);
  };
  x.addEventListener('click', close);
  note.addEventListener('pointerenter', () => clearTimeout(timer));
  note.addEventListener('pointerleave', later);
  note.addEventListener('focusin', () => clearTimeout(timer));
  note.addEventListener('focusout', later);
  // a few at once is plenty: the oldest goes
  while (el.childElementCount >= 3) el.firstElementChild?.remove();
  el.append(note);
  place(el);
  raise(el);
  later();
}
