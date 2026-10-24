// Beside the monitor while Game-Maker's CHK.EXE asks (regDesk.ts): the Owner's Guide, opened to
// the page the copy check names, and the product registration card, whose Apply writes
// PLAYGAME.REG as GM REGISTER did. On a wide window they lie left and right of the monitor; on a
// narrow one (or with the screen enlarged) they open as a sheet over the bottom of the window,
// one at a time. Keyboard focus stays on the screen unless the user moves it, so typing the
// answer still goes to GM. The desk and the DOS page (dosPage/) both put it beside their screen.
import './regSide.css';
import { h, clear } from '../../editor/core/ui';
import { onRegDesk, type RegAsk, type RegDesk } from './regDesk';
import { CARD_NAME_MAX, NUMBER_MAX, SERIAL } from './registration';
import { BOUGHT, CD_NUMBER, COMPUTERS, MAIL_DAYS_MS, OWNER_ADDRESS, RSD_ADDRESS, mailCheck, replyTo, savedReply, saveReply, type Reply } from './mailCard';
import { PRODUCT } from '../../edition';
import type { BookPage } from '../../manual/printables/manualPages';

/** The name already on the card, so it can be mailed as it comes. */
const SAMPLE_NAME = 'John Smith';

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

/** What the page around the PC adds: news of the card going in the mail (the desk's window shows the mail truck). */
export interface RegSideOptions {
  onMailed?: () => void;
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
  let pageNo = 0;
  let mark = true; // the asked paragraph and word are marked until the user hides the marks
  let cardClosed = false; // the user put the card away: while GM runs unregistered it stays a tab
  let sheetOpened = false; // on a narrow window the unregistered card opens only when asked for
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
  const answerIn = h('input', {
    id: 'rs-answer',
    class: 'rs-answer-in',
    type: 'text',
    maxLength: 15,
    autocomplete: 'off',
    autocapitalize: 'characters',
    spellcheck: false,
  });
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
  // A 1995 mail-in card (retro/gmReg/mailCard.ts): printed with the product and this copy's
  // serial number, the owner's address already written in, so only a name is left to write.
  // Mailed, it goes off in the mail truck; a few days later RSD's reply comes back with the
  // registration number, and Register now writes PLAYGAME.REG as GM REGISTER would.
  const cardTitle = h('h2', { id: 'rs-card-h' });
  const cardLead = h('p', { class: 'rs-lead' });
  let reply: Reply | undefined = savedReply();
  let days: ReturnType<typeof setTimeout> | undefined;

  const printed = (label: string, value: string) => [h('dt', null, label), h('dd', null, value)];
  const pick = (legend: string, name: string, options: readonly string[]) =>
    h(
      'fieldset',
      { class: 'rs-pick' },
      h('legend', null, legend, ' ', h('small', null, '(optional)')),
      options.map((o) => h('label', null, h('input', { type: 'radio', name, value: o }), o)),
    );

  // the front: the owner writes a name and mails it
  // filled in with a stand-in name, ready to mail (or type your own over it)
  const nameIn = h('input', {
    id: 'rs-name',
    class: 'rs-in',
    type: 'text',
    maxLength: CARD_NAME_MAX,
    value: SAMPLE_NAME,
    autocomplete: 'off',
    spellcheck: false,
    'aria-required': 'true',
  });
  // focusing it selects the stand-in, so typing replaces it
  nameIn.addEventListener('focus', () => nameIn.select());
  const postMsg = h('p', { id: 'rs-post-msg', class: 'rs-msg' });
  const postcard = h(
    'form',
    { class: 'rs-postcard', novalidate: true, 'aria-label': 'Registration card', onsubmit: (e: Event) => (e.preventDefault(), mail()) },
    h('div', { class: 'rs-pc-band' }, h('b', null, 'REGISTRATION CARD'), h('span', null, 'Please print · Mail today')),
    h('dl', { class: 'rs-printed' }, printed('Product', PRODUCT), printed('Version', '3.0'), printed('Serial no.', String(SERIAL)), printed('CD #', CD_NUMBER)),
    h('label', { for: 'rs-name', class: 'rs-name-l' }, 'Your name ', h('small', null, '(please print)')),
    nameIn,
    h(
      'p',
      { class: 'rs-filled' },
      h('span', null, 'Address '),
      h('span', { class: 'rs-hand' }, OWNER_ADDRESS.join(', ')),
      h('small', null, ' (written in for you; make-believe)'),
    ),
    pick('Where did you buy it?', 'rs-bought', BOUGHT),
    pick('Your computer', 'rs-pc', COMPUTERS),
    postMsg,
    h('div', { class: 'rs-actions' }, h('button', { type: 'submit', class: 'rs-btn rs-apply' }, 'Mail the card')),
  );

  // for a number from an earlier reply: written in by hand, as GM REGISTER asks
  const keyName = h('input', { id: 'rs-key-name', class: 'rs-in', type: 'text', maxLength: CARD_NAME_MAX, autocomplete: 'name', spellcheck: false });
  const numIn = h('input', {
    id: 'rs-number',
    class: 'rs-in rs-num',
    type: 'text',
    inputMode: 'numeric',
    maxLength: NUMBER_MAX,
    autocomplete: 'off',
    spellcheck: false,
  });
  const keyMsg = h('p', { id: 'rs-key-msg', class: 'rs-msg' });
  const byHand = h(
    'details',
    { class: 'rs-byhand' },
    h('summary', null, 'Already have your reply? Enter the number'),
    h(
      'form',
      { class: 'rs-form', novalidate: true, onsubmit: (e: Event) => (e.preventDefault(), applyByHand()) },
      h('label', { for: 'rs-key-name' }, 'Name ', h('small', null, '(exactly as on the reply)')),
      keyName,
      h('label', { for: 'rs-number' }, 'Registration number'),
      numIn,
      keyMsg,
      h('div', { class: 'rs-actions' }, h('button', { type: 'submit', class: 'rs-btn' }, 'Apply')),
    ),
  );

  // the back, as it goes in the mail: Business Reply Mail to RSD, then a few days
  const fromLines = h('span', { class: 'rs-hand' });
  const skipBtn = h('button', { type: 'button', class: 'rs-btn', onclick: () => arrive() }, 'Skip ahead');
  const mailing = h(
    'div',
    { class: 'rs-mailing', hidden: true },
    h(
      'div',
      { class: 'rs-brm' },
      h('p', { class: 'rs-from' }, h('small', null, 'From: '), fromLines),
      h('p', { class: 'rs-nopost' }, 'NO POSTAGE NECESSARY IF MAILED IN THE UNITED STATES'),
      h(
        'div',
        { class: 'rs-bars', 'aria-hidden': 'true' },
        Array.from({ length: 7 }, () => h('i')),
      ),
      h(
        'p',
        { class: 'rs-brm-h' },
        h('b', null, 'BUSINESS REPLY MAIL'),
        h('span', null, 'FIRST-CLASS MAIL · PERMIT NO. 1995 · AMHERST, NH'),
        h('small', null, 'POSTAGE WILL BE PAID BY ADDRESSEE'),
      ),
      h(
        'p',
        { class: 'rs-to' },
        RSD_ADDRESS.map((l, i) => h('span', null, i ? l : l.toUpperCase())),
      ),
      h('span', { class: 'rs-postmark', 'aria-hidden': 'true' }, 'MAILED'),
    ),
    h('p', { class: 'rs-days' }, 'The mail truck has your card. ', h('b', null, 'A few days later…')),
    h('div', { class: 'rs-actions' }, skipBtn),
  );

  // RSD's reply: a letter off their dot-matrix printer with the registration number
  const replyMsg = h('p', { id: 'rs-reply-msg', class: 'rs-msg' });
  const registerBtn = h('button', { type: 'button', class: 'rs-btn rs-apply', onclick: () => registerNow() }, 'Register now');
  const letter = h('div', { class: 'rs-letter', hidden: true });

  function drawLetter(r: Reply): void {
    clear(
      letter,
      h('div', { class: 'rs-lh' }, h('b', null, 'RECREATIONAL SOFTWARE DESIGNS'), h('span', null, RSD_ADDRESS.slice(1).join(' · '))),
      h('h3', { id: 'rs-letter-h', tabIndex: -1 }, 'Your registration'),
      h('p', null, `Dear ${r.name},`),
      h('p', null, `Thank you for registering ${PRODUCT} 3.0! Here is your registration. Write it in exactly as it is here:`),
      h('dl', { class: 'rs-keyed' }, printed('Name', r.name), printed('Serial no.', String(r.serial)), printed('Registration no.', r.number)),
      h('p', null, 'Choose Register now, or type GM REGISTER at the C:\\GM> prompt. Game-Maker stops asking for words from the Owner’s Guide.'),
      h('p', { class: 'rs-sign' }, 'Happy game making!', h('br'), '— RSD Registration Dept.'),
      replyMsg,
      h('div', { class: 'rs-actions' }, h('button', { type: 'button', class: 'rs-btn', onclick: () => again() }, 'Mail another card'), registerBtn),
    );
  }

  const toManual = h('button', { type: 'button', class: 'rs-btn rs-swap', onclick: () => swap('manual') }, 'Owner’s Guide');
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
    h('div', { class: 'rs-card-body' }, cardTitle, cardLead, postcard, byHand, mailing, letter),
    h('p', { class: 'rs-note' }, 'In 1995 RSD’s reply took a few weeks; here it takes a few seconds. The addresses are make-believe.'),
  );

  function stage(s: 'card' | 'mailing' | 'reply'): void {
    postcard.hidden = byHand.hidden = s !== 'card';
    mailing.hidden = s !== 'mailing';
    letter.hidden = s !== 'reply';
    card.dataset.stage = s;
  }
  if (reply) drawLetter(reply);
  stage(reply ? 'reply' : 'card');

  /** Where the keyboard goes in the card: what to do next. */
  function cardFocus(): void {
    const s = card.dataset.stage;
    (s === 'mailing' ? skipBtn : s === 'reply' ? registerBtn : nameIn).focus();
  }

  function problem(where: HTMLElement, text?: string, field?: HTMLInputElement): void {
    where.textContent = text ?? '';
    where.classList.toggle('error', !!text);
    where.setAttribute('role', text ? 'alert' : 'status');
    for (const f of [nameIn, keyName, numIn]) {
      if (!where.parentElement?.contains(f)) continue;
      const bad = !!text && f === field;
      f.setAttribute('aria-invalid', String(bad));
      if (bad) f.setAttribute('aria-describedby', where.id);
      else f.removeAttribute('aria-describedby');
    }
    if (field) field.focus();
  }
  const noProblems = () => [postMsg, keyMsg, replyMsg].forEach((m) => problem(m));

  function mail(): void {
    const wrong = mailCheck(nameIn.value);
    if (wrong) return problem(postMsg, wrong, nameIn);
    problem(postMsg);
    const picked = (name: string) => postcard.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;
    reply = replyTo({ name: nameIn.value, bought: picked('rs-bought'), computer: picked('rs-pc') });
    saveReply(reply);
    drawLetter(reply);
    clear(
      fromLines,
      [reply.name, ...OWNER_ADDRESS].map((l) => h('span', null, l)),
    );
    stage('mailing');
    skipBtn.focus();
    opts.onMailed?.();
    say('Card mailed. The mail truck drives off with it. A few days later…');
    clearTimeout(days);
    days = setTimeout(arrive, MAIL_DAYS_MS);
  }

  function arrive(): void {
    clearTimeout(days);
    if (!reply || card.dataset.stage !== 'mailing') return;
    const here = card.contains(document.activeElement);
    stage('reply');
    if (here) registerBtn.focus();
    say(`Reply arrived from Recreational Software Designs: registration number ${reply.number} for ${reply.name}. Choose Register now.`);
  }

  function again(): void {
    reply = undefined;
    saveReply(undefined);
    nameIn.value = SAMPLE_NAME;
    noProblems();
    stage('card');
    nameIn.focus();
  }

  function registered(name: string): void {
    say(`Game-Maker is registered to ${name.trim()}.`);
    focusScreen();
  }

  function registerNow(): void {
    if (!desk || !reply) return;
    const wrong = desk.apply(reply.name, reply.number);
    if (wrong) return problem(replyMsg, wrong);
    problem(replyMsg);
    registered(reply.name);
  }

  function applyByHand(): void {
    if (!desk) return;
    const wrong = desk.apply(keyName.value, numIn.value);
    if (wrong) return problem(keyMsg, wrong, /number/.test(wrong) ? numIn : keyName);
    problem(keyMsg);
    registered(keyName.value);
  }

  // ---- showing and placing -----------------------------------------------------------
  const reopen = h('button', { type: 'button', class: 'rs-reopen', hidden: true, ...keepFocus, onclick: () => open() });
  const root = h('div', { class: 'rs' }, manual, card, reopen, live);
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
    if (to === 'card') cardFocus();
    else markBtn.focus();
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
    for (const el of [manual, card, reopen]) el.removeAttribute('style');
    if (!wide || !m) return;
    const top = Math.max(12, m.top);
    const mw = Math.min(460, left - 28);
    const chrome = 128; // header, question and page buttons
    manual.style.cssText = `left:${left - 14 - mw}px;top:${top}px;width:${mw}px;height:${Math.min(vh - top - 12, chrome + (mw - 20) * (8.5 / 5.5))}px`;
    const cw = Math.min(360, right - 28);
    card.style.cssText = `left:${edge + 14}px;top:${top}px;width:${cw}px;max-height:${vh - top - 12}px`;
    // put away, the card is a tab where it lay
    reopen.style.cssText = `left:${edge + 14}px;top:${top}px;right:auto;bottom:auto`;
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
      // GM running unregistered: a tab, not a sheet over the screen, until the tab is pressed
      const any = (shown.manual || shown.card) && (ask?.kind !== 'unregistered' || sheetOpened);
      manual.hidden = !any || narrowTab !== 'manual';
      card.hidden = !any || narrowTab !== 'card';
    } else {
      manual.hidden = !isQ || !shown.manual;
      card.hidden = !ask || !shown.card;
    }
    const closed = !!ask && manual.hidden && card.hidden;
    reopen.hidden = !closed;
    const unreg = ask?.kind === 'unregistered';
    reopen.textContent = isQ ? 'Owner’s Guide and registration card' : unreg ? 'UNREGISTERED — Register' : 'Registration card';
    reopen.classList.toggle('rs-unreg', unreg);
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
      sheetOpened = false;
      shown = { manual: ask.kind === 'question', card: !cardClosed };
      narrowTab = ask.kind === 'question' ? 'manual' : 'card';
      mark = true;
      if (before?.kind !== 'question' || ask.kind !== 'unregistered') noProblems();
    }
    if (ask.kind === 'question') {
      cardTitle.textContent = 'Register instead?';
      cardLead.textContent = 'Mail the card: RSD’s reply brings a registration number, and GM stops asking for words from the guide.';
      if (!same) {
        pageNo = ask.page;
        say(
          `Game-Maker asks for a word from the Owner’s Guide: page ${ask.page}, paragraph ${ask.paragraph}, word ${ask.word}. The guide is open at that page beside the monitor, with the registration card.`,
        );
        void loadGuide().then((g) => {
          guide = g;
          drawPage();
        });
      }
      drawPage();
    } else if (ask.kind === 'unregistered') {
      cardTitle.textContent = 'Register Game-Maker';
      cardLead.textContent =
        'GM is running unregistered, so it asks for a word from the guide every time it starts. Mail the card for a registration number and it won’t.';
      if (!same && before?.kind === 'question') say('That’s the word. Game-Maker is running unregistered; the registration card stays beside the monitor.');
    } else {
      cardTitle.textContent = 'GM REGISTER';
      cardLead.textContent =
        'Game-Maker asks for the name and number from RSD’s reply. Mail the card for one, then choose Register now or type them on the screen.';
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
      clearTimeout(days);
      root.remove();
    },
  };
}
