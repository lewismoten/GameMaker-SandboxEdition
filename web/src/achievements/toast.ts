// The note that says an achievement was just unlocked. A polite live region, so a screen
// reader hears it without losing its place; each note can be closed, and goes on its own after
// a while (not while it is pointed at or focused). On today's web it is a small card under the
// header, at the right; on the 1994 desk a sticky note stuck to the front of the desk, left of
// the keyboard tray, off the screen and the wall. It goes in the top layer (a manual popover)
// so an open dialog (Saves & scores) doesn't hide it.
import './toast.css';
import { achievementById } from './catalog';

const SHOW_MS = 7000;
let host: HTMLElement | undefined;

const isDesk = () => document.documentElement.dataset.ui === 'desk';

/** A page that places the notes itself (the DOS page: clear of its screen and the copy check's panels). */
let placer: ((host: HTMLElement) => void) | undefined;

/** Hands where the notes go to the page (placeNotes(undefined) gives it back). */
export function placeNotes(f: ((host: HTMLElement) => void) | undefined): void {
  placer = f;
  if (host?.isConnected) place(host);
}

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
 * On the desk: stuck to the front panel of the desk, left of the keyboard tray (stage x 64,
 * y 736: the room is scaled and centered), well clear of the monitor's picture, the posters,
 * the clipping and every prop. They stack there, the newest on top; pointing at or tabbing
 * into the stack fans the older one out (toast.css). A narrow window, where the room is a
 * column, has them at the bottom of the window.
 */
function place(el: HTMLElement): void {
  el.classList.toggle('ach-placed', !!placer);
  if (placer) return placer(el);
  const desk = isDesk();
  el.classList.toggle('ach-desk', desk);
  el.style.removeProperty('top');
  el.style.removeProperty('left');
  if (!desk) return;
  const width = Math.min(200, innerWidth - 32);
  const scene = document.querySelector<HTMLElement>('.desk[data-zoom="false"] .desk-scene');
  const s = scene?.getBoundingClientRect();
  if (!s?.width || innerWidth < 961) {
    el.style.left = '16px';
    el.style.top = `${Math.max(8, innerHeight - 150)}px`;
    return;
  }
  const k = s.width / 1440;
  el.style.left = `${Math.max(16, Math.min(s.left + 64 * k, innerWidth - width - 16))}px`;
  el.style.top = `${Math.max(8, Math.min(s.top + 736 * k, innerHeight - 150))}px`;
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
    link.href = placer ? './#/achievements' : '#/achievements'; // from a page of its own, the site's
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
