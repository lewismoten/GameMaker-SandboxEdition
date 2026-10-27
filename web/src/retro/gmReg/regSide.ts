// Beside the monitor while Game-Maker's CHK.EXE asks (regDesk.ts): the Owner's Guide, opened to
// the page the copy check names, and the product registration card, whose Apply writes
// PLAYGAME.REG as GM REGISTER did. On a wide window they lie left and right of the monitor; on a
// narrow one (or with the screen enlarged) they open as a sheet over the bottom of the window,
// one at a time. Keyboard focus stays on the screen unless the user moves it, so typing the
// answer still goes to GM. The desk and the DOS page (dosPage/) both put it beside their screen.
// The guide is regGuidePanel.ts and the card regCardPanel.ts; this file shows and places them.
import './regSide.css';
import { h } from '../../editor/core/ui';
import { onRegDesk, type RegAsk, type RegDesk } from './regDesk';
import type { Reply } from './mailCard';
import { guidePanel, keepFocus } from './regGuidePanel';
import { cardPanel } from './regCardPanel';

/**
 * What the page around the PC adds: news of the card going in the mail (the desk's window shows
 * the mail truck) and of RSD's reply arriving (the desk's mail jeep brings a paper copy).
 */
export interface RegSideOptions {
  onMailed?: () => void;
  onReply?: (reply: Reply) => void;
}

/**
 * Shows the guide and the card while GM asks (onRegDesk), placed by the monitor's box.
 * `focusScreen` gives the keyboard back to the PC when a panel closes.
 */
export function regSide(monitor: () => HTMLElement | null, focusScreen: () => void, opts: RegSideOptions = {}): { dispose(): void } {
  let desk: RegDesk | null = null;
  let ask: RegAsk | null = null;
  let shown = { manual: false, card: false };
  let narrowTab: 'manual' | 'card' = 'manual';
  let cardClosed = false; // the user put the card away: while GM runs unregistered it stays a tab
  let sheetOpened = false; // on a narrow window the unregistered card opens only when asked for

  const live = h('div', { class: 'rs-live', role: 'status', 'aria-live': 'polite' });
  const say = (text: string) => {
    live.textContent = '';
    requestAnimationFrame(() => (live.textContent = text));
  };

  // ---- the Owner's Guide (regGuidePanel.ts) and the registration card (regCardPanel.ts) ----
  const guide = guidePanel({ ask: () => ask, desk: () => desk, say, close: () => close('manual'), toCard: () => swap('card') });
  const manual = guide.el;
  const card = cardPanel({
    desk: () => desk,
    say,
    close: () => close('card'),
    toManual: () => swap('manual'),
    focusScreen,
    onMailed: opts.onMailed && (() => opts.onMailed!()),
    onReply: opts.onReply && ((r) => opts.onReply!(r)),
  });

  // ---- showing and placing -----------------------------------------------------------
  const reopen = h('button', { type: 'button', class: 'rs-reopen', hidden: true, ...keepFocus, onclick: () => open() });
  const root = h('div', { class: 'rs' }, manual, card.el, reopen, live);
  document.body.append(root);

  function close(which: 'manual' | 'card'): void {
    shown = { ...shown, [which]: false };
    if (which === 'card' || root.classList.contains('rs-narrow')) cardClosed = true;
    sheetOpened = false;
    // on a narrow window the sheet goes away whole
    if (root.classList.contains('rs-narrow')) shown = { manual: false, card: false };
    update();
    focusScreen();
  }

  function swap(to: 'manual' | 'card'): void {
    narrowTab = to;
    shown[to] = true;
    update();
    if (to === 'card') card.focus();
    else guide.markBtn.focus();
  }

  function open(): void {
    shown = { manual: ask?.kind === 'question', card: true };
    cardClosed = false;
    sheetOpened = true;
    update();
  }

  function place(): void {
    const m = monitor()?.getBoundingClientRect();
    const vw = innerWidth;
    const vh = innerHeight;
    const left = m ? m.left : 0;
    // the card goes right of the monitor and of the "Too retro?" note stuck to its corner
    const note = monitor()?.querySelector('.sticky')?.getBoundingClientRect();
    const edge = m ? Math.max(m.right, note && note.width ? note.right : 0) : 0;
    const right = m ? vw - edge : 0;
    const wide = !!m && m.width > 200 && left >= 300 && right >= 260 && vh >= 560 && m.top < vh / 3;
    root.classList.toggle('rs-narrow', !wide);
    root.classList.toggle('rs-wide', wide);
    for (const el of [manual, card.el, reopen]) el.removeAttribute('style');
    if (!wide || !m) return;
    const top = Math.max(12, m.top);
    const mw = Math.min(460, left - 28);
    const chrome = 128; // header, question and page buttons
    manual.style.cssText = `left:${left - 14 - mw}px;top:${top}px;width:${mw}px;height:${Math.min(vh - top - 12, chrome + (mw - 20) * (8.5 / 5.5))}px`;
    const cw = Math.min(360, right - 28);
    card.el.style.cssText = `left:${edge + 14}px;top:${top}px;width:${cw}px;max-height:${vh - top - 12}px`;
    // put away, the card is a tab where it lay
    reopen.style.cssText = `left:${edge + 14}px;top:${top}px;right:auto;bottom:auto`;
  }

  function update(): void {
    place();
    const narrow = root.classList.contains('rs-narrow');
    const isQ = ask?.kind === 'question';
    guide.toCard.hidden = !narrow;
    card.toManual.hidden = !narrow || !isQ;
    if (narrow) {
      // one at a time: the one asked for, if it is open
      if (!isQ) narrowTab = 'card';
      // GM running unregistered: a tab, not a sheet over the screen, until the tab is pressed
      const any = (shown.manual || shown.card) && (ask?.kind !== 'unregistered' || sheetOpened);
      manual.hidden = !any || narrowTab !== 'manual';
      card.el.hidden = !any || narrowTab !== 'card';
    } else {
      manual.hidden = !isQ || !shown.manual;
      card.el.hidden = !ask || !shown.card;
    }
    const closed = !!ask && manual.hidden && card.el.hidden;
    reopen.hidden = !closed;
    const unreg = ask?.kind === 'unregistered';
    reopen.textContent = isQ ? 'Owner’s Guide and registration card' : unreg ? 'UNREGISTERED — Register' : 'Registration card';
    reopen.classList.toggle('rs-unreg', unreg);
    guide.answer.hidden = !isQ || !desk?.type;
    if (ask?.kind === 'question') {
      // where to type: the screen, or on a narrow window (a phone) the Word found box
      const where = narrow ? 'Type the word in the Word found box below.' : 'Type the word on the screen.';
      guide.askLine.textContent = `GM asks for page ${ask.page}, paragraph ${ask.paragraph}, word ${ask.word}. ${where}`;
    }
    root.classList.toggle('rs-on', !!ask);
  }

  // GM goes from one step to the next (the copy check, then its menu) with a moment between:
  // the panels wait that moment before they go, so they don't blink
  let hiding: ReturnType<typeof setTimeout> | undefined;
  function setAsk(d: RegDesk | null): void {
    clearTimeout(hiding);
    if (!d) {
      desk = null;
      hiding = setTimeout(() => {
        ask = null;
        shown = { manual: false, card: false };
        update();
      }, 250);
      return;
    }
    const before = ask;
    desk = d;
    card.setSerial(d.serial);
    ask = d.ask;
    const same = before && JSON.stringify(before) === JSON.stringify(ask);
    if (!same) {
      if (ask.kind !== 'unregistered') cardClosed = false; // GM asks again: the card comes back
      sheetOpened = false;
      shown = { manual: ask.kind === 'question', card: !cardClosed };
      narrowTab = ask.kind === 'question' ? 'manual' : 'card';
      guide.markAgain();
      if (before?.kind !== 'question' || ask.kind !== 'unregistered') card.noProblems();
    }
    if (ask.kind === 'question') {
      card.setLead('Register instead?', 'Mail the card: RSD’s reply brings a registration number, and GM stops asking for words from the guide.');
      if (!same) {
        say(
          `Game-Maker asks for a word from the Owner’s Guide: page ${ask.page}, paragraph ${ask.paragraph}, word ${ask.word}. The guide is open at that page beside the monitor, with the registration card.`,
        );
        guide.openAt(ask.page);
      }
      guide.draw();
    } else if (ask.kind === 'unregistered') {
      card.setLead(
        'Register Game-Maker',
        'GM is running unregistered, so it asks for a word from the guide every time it starts. Mail the card for a registration number and it won’t.',
      );
      if (!same && before?.kind === 'question') say('That’s the word. Game-Maker is running unregistered; the registration card stays beside the monitor.');
    } else {
      card.setLead(
        'GM REGISTER',
        'Game-Maker asks for the name and number from RSD’s reply. Mail the card for one, then choose Register now or type them on the screen.',
      );
      if (!same) say('Game-Maker asks for the name and registration number from RSD’s reply. The registration card is beside the monitor.');
    }
    update();
  }

  const stop = onRegDesk(setAsk);
  const onResize = () => ask && update();
  addEventListener('resize', onResize);
  const ro = new ResizeObserver(onResize);
  const m = monitor();
  if (m) ro.observe(m);

  return {
    dispose() {
      stop();
      removeEventListener('resize', onResize);
      ro.disconnect();
      card.dispose();
      root.remove();
    },
  };
}
