// Beside the monitor while Game-Maker's CHK.EXE asks (retro/gmReg/regDesk.ts): the Owner's
// Guide, opened to the page the copy check names, and the product registration card, whose
// Apply writes PLAYGAME.REG as GM REGISTER did. On a wide window they lie left and right of the
// monitor; on a narrow one (or with the screen enlarged) they open as a sheet over the bottom
// of the window, one at a time. Keyboard focus stays on the screen unless the user moves it, so
// typing the answer still goes to GM.
import './regSide.css';
import { h, clear } from '../../editor/core/ui';
import { onRegDesk, type RegAsk, type RegDesk } from '../../retro/gmReg/regDesk';
import { CARD_NAME_MAX, NUMBER_MAX, SERIAL, cardCheck, registrationNumber } from '../../retro/gmReg/registration';
import { PRODUCT } from '../../edition';
import type { BookPage } from '../../manual/printables/manualPages';

/** The guide's pages and how to draw one, loaded when GM first asks. */
interface Guide {
  pages: BookPage[];
  draw: (p: BookPage, index: number) => HTMLElement;
}

let guideLoad: Promise<Guide> | undefined;
const loadGuide = (): Promise<Guide> =>
  (guideLoad ??= Promise.all([import('../../manual/dosManual'), import('../../manual/printables/manualPages')]).then(async ([m, mp]) => ({
    pages: await m.dosManualPages(),
    draw: mp.pageElement,
  })));

/** Buttons that act without taking the keyboard from the screen (a click keeps GM typing). */
const keepFocus = { onmousedown: (e: MouseEvent) => e.preventDefault() };

export function regSide(monitor: () => HTMLElement | null, focusScreen: () => void): { dispose(): void } {
  let desk: RegDesk | null = null;
  let ask: RegAsk | null = null;
  let shown = { manual: false, card: false };
  let narrowTab: 'manual' | 'card' = 'manual';
  let pageNo = 0;
  let mark = true; // the asked paragraph and word are marked until the user hides the marks
  let cardClosed = false; // the user put the card away: GM's menu leaves it away
  let guide: Guide | undefined;

  const live = h('div', { class: 'rs-live', role: 'status', 'aria-live': 'polite' });
  const say = (text: string) => {
    live.textContent = '';
    requestAnimationFrame(() => (live.textContent = text));
  };

  // ---- the Owner's Guide -------------------------------------------------------------
  const pageTitle = h('span', { class: 'rs-sub' });
  const askLine = h('p', { class: 'rs-ask' });
  // focusable so a keyboard can scroll it when the page is taller than the sheet
  const pageView = h('div', { class: 'rs-page', tabIndex: 0, role: 'region', 'aria-label': 'Guide page' });
  const prevBtn = h('button', { type: 'button', class: 'rs-btn', ...keepFocus, onclick: () => turn(-1) }, '‹ Back');
  const nextBtn = h('button', { type: 'button', class: 'rs-btn', ...keepFocus, onclick: () => turn(1) }, 'Next ›');
  const markBtn = h('button', { type: 'button', class: 'rs-btn', 'aria-pressed': 'true', ...keepFocus, onclick: () => toggleMark() }, 'Mark the word');
  // for a phone (no keyboard): the answer typed here goes to GM as if typed on the screen
  const answerIn = h('input', { id: 'rs-answer', class: 'rs-answer-in', type: 'text', maxLength: 15, autocomplete: 'off', autocapitalize: 'characters', spellcheck: false });
  const answer = h(
    'form',
    {
      class: 'rs-answer',
      onsubmit: (e: Event) => {
        e.preventDefault();
        const word = answerIn.value.trim();
        if (!word || !desk?.type) return;
        desk.type(`${word}\n`);
        answerIn.value = '';
      },
    },
    h('label', { for: 'rs-answer' }, 'Word found'),
    answerIn,
    h('button', { type: 'submit', class: 'rs-btn' }, 'Type it'),
  );
  const toCard = h('button', { type: 'button', class: 'rs-btn rs-swap', ...keepFocus, onclick: () => swap('card') }, 'Register instead');
  const manual = h(
    'section',
    { class: 'rs-panel rs-manual', 'aria-labelledby': 'rs-manual-h', hidden: true, onkeydown: (e: KeyboardEvent) => e.key === 'Escape' && close('manual') },
    h(
      'header',
      { class: 'rs-head' },
      h('h2', { id: 'rs-manual-h' }, 'Owner’s Guide ', pageTitle),
      toCard,
      h('button', { type: 'button', class: 'rs-x', 'aria-label': 'Close the Owner’s Guide', ...keepFocus, onclick: () => close('manual') }, '×'),
    ),
    askLine,
    pageView,
    h('div', { class: 'rs-nav' }, prevBtn, markBtn, nextBtn),
    answer,
  );

  function drawPage(): void {
    if (!guide) {
      clear(pageView, h('p', { class: 'rs-loading' }, 'Opening the guide…'));
      return;
    }
    const last = guide.pages.length - 1;
    pageNo = Math.max(1, Math.min(last, pageNo));
    const el = guide.draw(guide.pages[pageNo], pageNo);
    el.setAttribute('aria-label', `Page ${pageNo}`);
    // the page's own headings, numbered on from this panel's, without skipping a level
    const levels = [...new Set([...el.querySelectorAll('h1, h2, h3, h4')].map((x) => Number(x.tagName[1])))].sort();
    el.querySelectorAll('h1, h2, h3, h4').forEach((x) => x.setAttribute('aria-level', String(3 + levels.indexOf(Number(x.tagName[1])))));
    const q = ask?.kind === 'question' ? ask : undefined;
    const para = q && mark && pageNo === q.page ? el.querySelectorAll<HTMLElement>('.mp-flow p')[q.paragraph - 1] : undefined;
    if (para && q) {
      para.classList.add('rs-mark');
      markWord(para, q.word);
    }
    clear(pageView, el);
    // bring the marked word into view in the scrolled page
    const word = el.querySelector<HTMLElement>('.rs-word');
    pageView.scrollTop = word ? Math.max(0, word.offsetTop - pageView.clientHeight / 3) : 0;
    pageTitle.textContent = `· page ${pageNo}`;
    prevBtn.disabled = pageNo <= 1;
    nextBtn.disabled = pageNo >= last;
    markBtn.setAttribute('aria-pressed', String(mark && !!q && pageNo === q.page));
    markBtn.textContent = mark && q && pageNo === q.page ? 'Hide the marks' : 'Mark the word';
  }

  /** Wraps the paragraph's nth word (words split at spaces, as the copy check counts them) in a mark. */
  function markWord(para: HTMLElement, n: number): void {
    const walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    while (walker.nextNode()) texts.push(walker.currentNode as Text);
    let count = 0;
    let inWord = false;
    const spans: [Text, number, number][] = [];
    for (const t of texts) {
      const v = t.data;
      let start = -1;
      for (let i = 0; i <= v.length; i++) {
        const space = i === v.length || /\s/.test(v[i]);
        if (i < v.length && !space && !inWord) {
          inWord = true;
          count++;
        }
        if (i < v.length && space) inWord = false;
        const mine = i < v.length && !space && count === n;
        if (mine && start < 0) start = i;
        if (!mine && start >= 0) {
          spans.push([t, start, i]);
          start = -1;
        }
      }
    }
    for (const [t, a, b] of spans) {
      const word = t.splitText(a);
      word.splitText(b - a);
      const m = h('mark', { class: 'rs-word' });
      word.replaceWith(m);
      m.append(word);
    }
  }

  function turn(d: number): void {
    pageNo += d;
    drawPage();
  }

  function toggleMark(): void {
    const q = ask?.kind === 'question' ? ask : undefined;
    if (!q) return;
    mark = !(mark && pageNo === q.page);
    pageNo = q.page;
    drawPage();
    if (mark) say(`Paragraph ${q.paragraph} of page ${q.page} is marked, and word ${q.word} in it.`);
  }

  // ---- the registration card ---------------------------------------------------------
  const cardTitle = h('h2', { id: 'rs-card-h' });
  const cardLead = h('p', { class: 'rs-lead' });
  const nameIn = h('input', { id: 'rs-name', class: 'rs-in', type: 'text', maxLength: CARD_NAME_MAX, autocomplete: 'name', spellcheck: false });
  const numIn = h('input', { id: 'rs-number', class: 'rs-in rs-num', type: 'text', inputMode: 'numeric', maxLength: NUMBER_MAX, autocomplete: 'off', spellcheck: false });
  const msg = h('p', { id: 'rs-msg', class: 'rs-msg' });
  const reply = h('div', { class: 'rs-reply', hidden: true });
  const toManual = h('button', { type: 'button', class: 'rs-btn rs-swap', onclick: () => swap('manual') }, 'Owner’s Guide');
  const form = h(
    'form',
    { class: 'rs-form', novalidate: true, onsubmit: (e: Event) => (e.preventDefault(), apply()) },
    h('label', { for: 'rs-name' }, 'Name ', h('small', null, '(exactly as on the reply)')),
    nameIn,
    h('label', { for: 'rs-number' }, 'Registration number'),
    numIn,
    msg,
    h(
      'div',
      { class: 'rs-actions' },
      h('button', { type: 'button', class: 'rs-btn', onclick: () => mail() }, 'Mail the card'),
      h('button', { type: 'submit', class: 'rs-btn rs-apply' }, 'Apply'),
    ),
  );
  const card = h(
    'section',
    { class: 'rs-panel rs-card', 'aria-labelledby': 'rs-card-h', hidden: true, onkeydown: (e: KeyboardEvent) => e.key === 'Escape' && close('card') },
    h(
      'header',
      { class: 'rs-head rs-card-head' },
      h('div', { class: 'rs-brand' }, h('b', null, 'PRODUCT REGISTRATION'), h('span', null, `${PRODUCT} 3.0`)),
      toManual,
      h('button', { type: 'button', class: 'rs-x', 'aria-label': 'Close the registration card', onclick: () => close('card') }, '×'),
    ),
    h('div', { class: 'rs-card-body' }, cardTitle, cardLead, h('p', { class: 'rs-serial' }, 'Serial no. ', h('b', null, String(SERIAL))), form, reply),
    h('p', { class: 'rs-note' }, 'In 1995 you mailed this card with your fee, and weeks later a reply came back with your registration number. Here the reply comes right back.'),
  );

  function problem(text: string | undefined, field?: HTMLInputElement): void {
    msg.textContent = text ?? '';
    msg.classList.toggle('error', !!text);
    msg.setAttribute('role', text ? 'alert' : 'status');
    for (const f of [nameIn, numIn]) {
      const bad = !!text && f === field;
      f.setAttribute('aria-invalid', String(bad));
      if (bad) f.setAttribute('aria-describedby', 'rs-msg');
      else f.removeAttribute('aria-describedby');
    }
    if (field) field.focus();
  }

  function mail(): void {
    const name = nameIn.value.trim();
    if (!name) return problem('Write your name on the card before you mail it.', nameIn);
    if (name.length > CARD_NAME_MAX) return problem(cardCheck(name, '1'), nameIn);
    const number = String(registrationNumber(name, SERIAL));
    clear(
      reply,
      h('div', { class: 'rs-reply-head' }, h('b', null, 'SANDBOX SOFTWARE'), h('span', null, 'Registration Dept.')),
      h('p', null, `Thank you for registering, ${name}! Your registration number is `, h('b', null, number), '.'),
    );
    reply.hidden = false;
    numIn.value = number;
    problem(undefined);
    say(`The reply came back: registration number ${number} is on the card. Choose Apply.`);
  }

  function apply(): void {
    if (!desk) return;
    const name = nameIn.value;
    const wrong = desk.apply(name, numIn.value);
    if (wrong) return problem(wrong, /number/.test(wrong) ? numIn : nameIn);
    problem(undefined);
    say(`Game-Maker is registered to ${name.trim()}.`);
    focusScreen();
  }

  // ---- showing and placing -----------------------------------------------------------
  const reopen = h('button', { type: 'button', class: 'rs-reopen', hidden: true, ...keepFocus, onclick: () => open() });
  const root = h('div', { class: 'rs' }, manual, card, reopen, live);
  document.body.append(root);

  function close(which: 'manual' | 'card'): void {
    shown = { ...shown, [which]: false };
    if (which === 'card' || root.classList.contains('rs-narrow')) cardClosed = true;
    // on a narrow window the sheet goes away whole
    if (root.classList.contains('rs-narrow')) shown = { manual: false, card: false };
    update();
    focusScreen();
  }

  function swap(to: 'manual' | 'card'): void {
    narrowTab = to;
    shown[to] = true;
    update();
    (to === 'card' ? nameIn : markBtn).focus();
  }

  function open(): void {
    shown = { manual: ask?.kind === 'question', card: true };
    cardClosed = false;
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
    for (const el of [manual, card]) el.removeAttribute('style');
    if (!wide || !m) return;
    const top = Math.max(12, m.top);
    const mw = Math.min(460, left - 28);
    const chrome = 128; // header, question and page buttons
    manual.style.cssText = `left:${left - 14 - mw}px;top:${top}px;width:${mw}px;height:${Math.min(vh - top - 12, chrome + (mw - 20) * (8.5 / 5.5))}px`;
    const cw = Math.min(360, right - 28);
    card.style.cssText = `left:${edge + 14}px;top:${top}px;width:${cw}px;max-height:${vh - top - 12}px`;
  }

  function update(): void {
    place();
    const narrow = root.classList.contains('rs-narrow');
    const isQ = ask?.kind === 'question';
    toCard.hidden = !narrow;
    toManual.hidden = !narrow || !isQ;
    if (narrow) {
      // one at a time: the one asked for, if it is open
      if (!isQ) narrowTab = 'card';
      const any = shown.manual || shown.card;
      manual.hidden = !any || narrowTab !== 'manual';
      card.hidden = !any || narrowTab !== 'card';
    } else {
      manual.hidden = !isQ || !shown.manual;
      card.hidden = !ask || !shown.card;
    }
    const closed = !!ask && manual.hidden && card.hidden;
    reopen.hidden = !closed;
    reopen.textContent = isQ ? 'Owner’s Guide and registration card' : 'Registration card';
    answer.hidden = !isQ || !desk?.type;
    if (ask?.kind === 'question') {
      // where to type: the screen, or on a narrow window (a phone) the Word found box
      const where = narrow ? 'Type the word in the Word found box below.' : 'Type the word on the screen.';
      askLine.textContent = `GM asks for page ${ask.page}, paragraph ${ask.paragraph}, word ${ask.word}. ${where}`;
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
    ask = d.ask;
    const same = before && JSON.stringify(before) === JSON.stringify(ask);
    if (!same) {
      if (ask.kind !== 'unregistered') cardClosed = false; // GM asks again: the card comes back
      shown = { manual: ask.kind === 'question', card: !cardClosed };
      narrowTab = ask.kind === 'question' ? 'manual' : 'card';
      mark = true;
      if (before?.kind !== 'question' || ask.kind !== 'unregistered') problem(undefined);
    }
    if (ask.kind === 'question') {
      cardTitle.textContent = 'Register instead?';
      cardLead.textContent = 'Register this copy and GM stops asking for words from the guide.';
      if (!same) {
        pageNo = ask.page;
        say(`Game-Maker asks for a word from the Owner’s Guide: page ${ask.page}, paragraph ${ask.paragraph}, word ${ask.word}. The guide is open at that page beside the monitor, with the registration card.`);
        void loadGuide().then((g) => {
          guide = g;
          drawPage();
        });
      }
      drawPage();
    } else if (ask.kind === 'unregistered') {
      cardTitle.textContent = 'Register Game-Maker';
      cardLead.textContent = 'GM is running unregistered, so it asks for a word from the guide every time it starts. Fill in the card and it won’t.';
      if (!same && before?.kind === 'question') say('That’s the word. Game-Maker is running unregistered; the registration card stays beside the monitor.');
    } else {
      cardTitle.textContent = 'GM REGISTER';
      cardLead.textContent = 'Game-Maker asks for the name and number from this card. Fill them in here, or type them on the screen.';
      if (!same) say('Game-Maker asks for the name and number from the registration card. The card is beside the monitor.');
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
      root.remove();
    },
  };
}
