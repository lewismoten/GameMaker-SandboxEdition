// The note that says an achievement was just unlocked. A polite live region, so a screen
// reader hears it without losing its place; each note can be closed, and goes on its own after
// a while (not while it is pointed at or focused). On today's web it is a small card under the
// header, at the right; on the 1994 desk a sticky note stuck to the front of the desk, left of
// the keyboard tray, off the screen and the wall. It goes in the top layer (a manual popover)
// so an open dialog (Saves & scores) doesn't hide it. While a guided tour plays (tour/: the
// html element's tour-on class, and its 'gm-tour' events) the notes wait, and come when it ends:
// they would cover its title cards and bubbles. The achievement itself is kept at once.
import { badgeIcon } from './badgeArt';
import './toast.css';
import { notesPlacer, onPlacerChange } from './notesPlacer';
import { achievementById } from './catalog';

const SHOW_MS = 7000;
/** A phone (narrow or short window) has little to spare: the note goes sooner. */
const showMs = () => (matchMedia('(max-width: 600px), (max-height: 500px)').matches ? 4000 : SHOW_MS);
let host: HTMLElement | undefined;

const isDesk = () => document.documentElement.dataset.ui === 'desk';

onPlacerChange(() => {
  if (host?.isConnected) place(host);
});

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
/**
 * A phone held upright while a game plays: the notes sit in the gap above the touch pad, not
 * over the game's screen (they were covering its top right).
 */
function placeAbovePad(el: HTMLElement): boolean {
  const pad = document.querySelector<HTMLElement>('.gm-player:not(.gm-preview) .gm-touch');
  if (!pad || innerHeight <= innerWidth) return false;
  // the pad's layer fills the player; its controls are its children
  let top = innerHeight;
  for (const c of pad.children) {
    const r = c.getBoundingClientRect();
    if (r.height > 0) top = Math.min(top, r.top);
  }
  if (top >= innerHeight) return false;
  el.style.top = 'auto';
  el.style.bottom = `${Math.round(innerHeight - top + 8)}px`;
  return true;
}

type Box = { l: number; t: number; r: number; b: number };

/** The buttons, links and fields a person can press that show on the page right now. */
function pressables(host: HTMLElement): Box[] {
  const out: Box[] = [];
  const sel = 'a[href],button,input,select,textarea,summary,[role=tab],[role=button],[tabindex="0"]';
  for (const e of document.querySelectorAll<HTMLElement>(sel)) {
    if (host.contains(e)) continue;
    const b = e.getBoundingClientRect();
    if (b.width < 2 || b.height < 2 || b.bottom < 0 || b.top > innerHeight || b.right < 0 || b.left > innerWidth) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const top = document.elementsFromPoint(
      Math.min(Math.max(b.left + b.width / 2, 0), innerWidth - 1),
      Math.min(Math.max(b.top + b.height / 2, 0), innerHeight - 1),
    )[0];
    if (top && !host.contains(top) && !(top === e || e.contains(top) || top.contains(e))) continue; // hidden behind something
    out.push({ l: b.left, t: b.top, r: b.right, b: b.bottom });
  }
  return out;
}

/**
 * Anywhere else on today's web (the header, the editor's toolbar, a page's own buttons): a
 * corner or edge where the note covers no control. A phone held upright starts at the bottom
 * right (the toolbars are at the top); anywhere else at the top right under the header. The
 * spots are tried in turn and the first that covers nothing wins; if every spot covers
 * something, the one covering the fewest.
 */
function placeClear(el: HTMLElement): void {
  const w = el.getBoundingClientRect().width;
  const h = el.getBoundingClientRect().height;
  if (!w || !h) return;
  const boxes = pressables(el);
  const phone = innerWidth <= 600 && innerHeight > innerWidth;
  const spots: { side: 'right' | 'left'; top: number }[] = [];
  const maxTop = innerHeight - h - 16;
  const tops = [60];
  for (let y = 108; y < maxTop; y += 48) tops.push(y);
  tops.push(maxTop);
  const sides = ['right', 'left'] as const;
  for (const top of phone ? [...tops].reverse() : tops) for (const side of sides) spots.push({ side, top });
  if (!phone) spots.splice(2, 0, ...sides.map((side) => ({ side, top: maxTop })));
  let best = spots[0];
  let bestN = Infinity;
  for (const s of spots) {
    const l = s.side === 'right' ? innerWidth - 16 - w : 16;
    const n = boxes.filter((b) => b.l < l + w && b.r > l && b.t < s.top + h && b.b > s.top).length;
    if (n < bestN) {
      best = s;
      bestN = n;
    }
    if (!n) break;
  }
  el.style.top = `${Math.max(8, Math.round(best.top))}px`;
  el.style.bottom = 'auto';
  el.style.right = best.side === 'right' ? '16px' : 'auto';
  el.style.left = best.side === 'left' ? '16px' : 'auto';
}

function place(el: HTMLElement): void {
  const placer = notesPlacer();
  el.classList.toggle('ach-placed', !!placer);
  if (placer) return placer(el);
  const desk = isDesk();
  el.classList.toggle('ach-desk', desk);
  el.style.removeProperty('top');
  el.style.removeProperty('left');
  el.style.removeProperty('bottom');
  el.style.removeProperty('right');
  if (!desk) {
    if (!placeAbovePad(el)) placeClear(el);
    return;
  }
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

/** Notes held while a tour plays, shown when it ends. */
const held: string[] = [];
const touring = () => document.documentElement.classList.contains('tour-on');

function holdUntilTourEnds(id: string): void {
  if (!held.length)
    window.addEventListener('gm-tour', function after(e) {
      if ((e as CustomEvent<string>).detail !== 'end') return;
      window.removeEventListener('gm-tour', after);
      for (const x of held.splice(0)) showUnlock(x);
    });
  if (!held.includes(id)) held.push(id);
}

export function showUnlock(id: string): void {
  const a = achievementById(id);
  if (!a || typeof document === 'undefined') return;
  if (touring()) return holdUntilTourEnds(id);
  const el = ensureHost();
  const note = document.createElement('div');
  note.className = 'ach-toast';
  const icon = document.createElement('span');
  icon.className = 'ach-toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.append(badgeIcon(a, true));
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
    link.href = notesPlacer() ? './#/achievements' : '#/achievements'; // from a page of its own, the site's
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
  // it fades out in its last third of a second
  const later = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      note.classList.add('ach-leaving');
      timer = setTimeout(close, 300);
    }, showMs() - 300);
  };
  x.addEventListener('click', close);
  const hold = () => {
    clearTimeout(timer);
    note.classList.remove('ach-leaving');
  };
  note.addEventListener('pointerenter', hold);
  note.addEventListener('pointerleave', later);
  note.addEventListener('focusin', hold);
  note.addEventListener('focusout', later);
  // a few at once is plenty: the oldest goes
  while (el.childElementCount >= 3) el.firstElementChild?.remove();
  el.append(note);
  place(el);
  raise(el);
  later();
}
