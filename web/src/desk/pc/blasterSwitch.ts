// The Sound Blaster switch on the right speaker's front, under the volume knob,: it puts the desk PC's sound card in or
// takes it out (retro/computer/soundBlaster.ts). Without the card, games and Game-Maker's
// designers play their sounds on the PC speaker and there is no music. Programs look for the
// card as they start, as PLAYGAME did, so a game already playing keeps its sound until the next:
// flipping it mid-game shows a note over the speaker with a button to start the game again.
import './blasterSwitch.css';
import { h } from '../../editor/core/ui';
import { setSoundBlaster, soundBlaster } from '../../retro/computer/soundBlaster';

/** What the switch needs from the desk PC. */
export interface BlasterPc {
  /** A game is playing on the monitor. */
  gamePlaying(): boolean;
  /** Starts the playing game over; false if none is playing. */
  restartGame(): boolean;
}

/** How long the note stays up (ms) unless the pointer or focus is on it. */
export const NOTE_MS = 6000;

export function blasterSwitch(pc?: BlasterPc): HTMLElement {
  const el = h(
    'button',
    { class: 'sb-switch', type: 'button', role: 'switch', 'aria-label': 'Sound Blaster card' },
    h('span', { class: 'sb-print', 'aria-hidden': 'true' }, 'SOUND', h('br'), 'BLASTER'),
    h('span', { class: 'sb-track', 'aria-hidden': 'true' }, h('span', { class: 'sb-knob' })),
  );
  const show = () => {
    const on = soundBlaster();
    el.setAttribute('aria-checked', String(on));
    el.dataset.on = String(on);
    el.title = on ? 'Sound Blaster on: music and digital sound. Click to switch it off.' : 'Sound Blaster off: PC speaker only. Click to switch it on.';
  };
  const note = blasterNote(el);
  el.addEventListener('click', () => {
    const on = !soundBlaster();
    setSoundBlaster(on);
    show();
    const playing = pc ? pc.gamePlaying() : !!document.querySelector('.crt-game canvas');
    note.open(
      on ? 'Sound Blaster on: music and digital sound.' : 'Sound Blaster off: sounds play on the PC speaker, with no music.',
      playing && pc ? () => pc.restartGame() : undefined,
    );
  });
  // Tab from the switch goes to the note's buttons while it is up (it lives outside the scaled desk)
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && note.focusFirst()) e.preventDefault();
  });
  show();
  return el;
}

/**
 * The note over the speaker after flipping the switch: what changed and, while a game is
 * playing, a button to start it again so it finds out. It goes away by itself after NOTE_MS,
 * but waits while the pointer is over it or a key is on one of its buttons. It is announced
 * (aria-live) but never takes the focus: Tab from the switch reaches it, Esc closes it.
 */
function blasterNote(sw: HTMLElement): { open(text: string, restart?: () => boolean): void; focusFirst(): boolean } {
  const live = h('div', { class: 'sb-note-live', role: 'status', 'aria-live': 'polite' });
  const text = h('p', { class: 'sb-note-text' });
  const restartBtn = h('button', { type: 'button', class: 'sb-note-restart' }, 'Restart game');
  const closeBtn = h('button', { type: 'button', class: 'sb-note-close', 'aria-label': 'Close', title: 'Close (Esc)' }, '×');
  const panel = h(
    'div',
    { class: 'sb-note', role: 'group', 'aria-label': 'Sound Blaster', hidden: true },
    text,
    h('div', { class: 'sb-note-buttons' }, restartBtn, closeBtn),
  );
  let timer: number | undefined;
  let held = 0; // pointer over it (1) and/or focus inside it (2)
  let onRestart: (() => boolean) | undefined;

  const stopTimer = () => (clearTimeout(timer), (timer = undefined));
  const startTimer = () => {
    stopTimer();
    if (!panel.hidden && !held) timer = window.setTimeout(close, NOTE_MS);
  };
  function close(): void {
    stopTimer();
    const hadFocus = panel.contains(document.activeElement);
    panel.hidden = true;
    held = 0;
    live.textContent = '';
    if (hadFocus) sw.focus();
  }
  const place = () => {
    // above the switch, in the window's own pixels (the desk itself is scaled to fit)
    const r = sw.getBoundingClientRect();
    const w = panel.offsetWidth;
    const x = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    panel.style.left = `${x}px`;
    panel.style.bottom = `${Math.max(8, window.innerHeight - r.top + 10)}px`;
  };

  panel.addEventListener('pointerenter', () => ((held |= 1), stopTimer()));
  panel.addEventListener('pointerleave', () => ((held &= ~1), startTimer()));
  panel.addEventListener('focusin', () => ((held |= 2), stopTimer()));
  panel.addEventListener('focusout', (e) => {
    if (panel.contains(e.relatedTarget as Node | null)) return;
    held &= ~2;
    startTimer();
  });
  // Enter or Space on its buttons must not also reach the game as itself
  panel.addEventListener('keyup', (e) => e.stopPropagation());
  panel.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      sw.focus();
    } else if (e.key === 'Tab') {
      // back to the switch past either end, as if the note sat right after it
      const items = [...panel.querySelectorAll<HTMLButtonElement>('button:not([hidden])')];
      const out = e.shiftKey ? document.activeElement === items[0] : document.activeElement === items[items.length - 1];
      if (!out) return;
      e.preventDefault();
      if (e.shiftKey) sw.focus();
      else nextAfter(sw)?.focus();
    }
  });
  restartBtn.addEventListener('click', () => {
    const go = onRestart;
    close();
    if (go && !go()) live.textContent = 'No game is playing now.';
  });
  closeBtn.addEventListener('click', () => {
    close();
    sw.focus();
  });
  window.addEventListener('resize', () => panel.hidden || place());

  return {
    open(message, restart) {
      if (!panel.isConnected) document.body.append(panel, live);
      onRestart = restart;
      restartBtn.hidden = !restart;
      text.textContent = restart ? `${message} The game playing now finds out when it starts again.` : message;
      panel.hidden = false;
      place();
      // say it again even when the words haven't changed (flipped off and on)
      live.textContent = '';
      requestAnimationFrame(() => (live.textContent = restart ? `${text.textContent} Press Tab for Restart game.` : text.textContent));
      startTimer();
    },
    focusFirst() {
      if (panel.hidden) return false;
      panel.querySelector<HTMLButtonElement>('button:not([hidden])')?.focus();
      return true;
    },
  };
}

/** The next thing Tab reaches after el in the page, skipping the note. */
function nextAfter(el: HTMLElement): HTMLElement | undefined {
  const all = [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]')].filter(
    (x) => x.tabIndex >= 0 && !x.closest('.sb-note, [hidden], [inert]') && !(x as HTMLButtonElement).disabled && x.getClientRects().length > 0,
  );
  return all[all.indexOf(el) + 1];
}
