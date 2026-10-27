// The Owner's Guide beside the monitor while GM's copy check asks (regSide.ts): opened to the
// page asked for, the paragraph and word marked, with page turns and, for a phone, a box whose
// answer is typed into GM as if on the screen. The guide's pages load when GM first asks.
import { h, clear } from '../../editor/core/ui';
import type { RegAsk, RegDesk } from './regDesk';
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
export const keepFocus = { onmousedown: (e: MouseEvent) => e.preventDefault() };

/** What the guide needs from the side panels (regSide.ts). */
interface GuideHost {
  ask(): RegAsk | null;
  desk(): RegDesk | null;
  say(text: string): void;
  close(): void;
  /** To the registration card (on a narrow window, one panel at a time). */
  toCard(): void;
}

export function guidePanel(host: GuideHost) {
  let pageNo = 0;
  let mark = true; // the asked paragraph and word are marked until the user hides the marks
  let guide: Guide | undefined;

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
        const desk = host.desk();
        if (!word || !desk?.type) return;
        desk.type(`${word}\n`);
        answerIn.value = '';
      },
    },
    h('label', { for: 'rs-answer' }, 'Word found'),
    answerIn,
    h('button', { type: 'submit', class: 'rs-btn' }, 'Type it'),
  );
  const toCard = h('button', { type: 'button', class: 'rs-btn rs-swap', ...keepFocus, onclick: () => host.toCard() }, 'Register instead');
  const el = h(
    'section',
    { class: 'rs-panel rs-manual', 'aria-labelledby': 'rs-manual-h', hidden: true, onkeydown: (e: KeyboardEvent) => e.key === 'Escape' && host.close() },
    h(
      'header',
      { class: 'rs-head' },
      h('h2', { id: 'rs-manual-h' }, 'Owner’s Guide ', pageTitle),
      toCard,
      h('button', { type: 'button', class: 'rs-x', 'aria-label': 'Close the Owner’s Guide', ...keepFocus, onclick: () => host.close() }, '×'),
    ),
    askLine,
    pageView,
    h('div', { class: 'rs-nav' }, prevBtn, markBtn, nextBtn),
    answer,
  );

  const question = () => {
    const ask = host.ask();
    return ask?.kind === 'question' ? ask : undefined;
  };

  function drawPage(): void {
    if (!guide) {
      clear(pageView, h('p', { class: 'rs-loading' }, 'Opening the guide…'));
      return;
    }
    const last = guide.pages.length - 1;
    pageNo = Math.max(1, Math.min(last, pageNo));
    const page = guide.draw(guide.pages[pageNo], pageNo);
    page.setAttribute('aria-label', `Page ${pageNo}`);
    // the page's own headings, numbered on from this panel's, without skipping a level
    const levels = [...new Set([...page.querySelectorAll('h1, h2, h3, h4')].map((x) => Number(x.tagName[1])))].sort();
    page.querySelectorAll('h1, h2, h3, h4').forEach((x) => x.setAttribute('aria-level', String(3 + levels.indexOf(Number(x.tagName[1])))));
    const q = question();
    const para = q && mark && pageNo === q.page ? page.querySelectorAll<HTMLElement>('.mp-flow p')[q.paragraph - 1] : undefined;
    if (para && q) {
      para.classList.add('rs-mark');
      markWord(para, q.word);
    }
    clear(pageView, page);
    // bring the marked word into view in the scrolled page
    const word = page.querySelector<HTMLElement>('.rs-word');
    pageView.scrollTop = word ? Math.max(0, word.offsetTop - pageView.clientHeight / 3) : 0;
    pageTitle.textContent = `· page ${pageNo}`;
    prevBtn.disabled = pageNo <= 1;
    nextBtn.disabled = pageNo >= last;
    markBtn.setAttribute('aria-pressed', String(mark && !!q && pageNo === q.page));
    markBtn.textContent = mark && q && pageNo === q.page ? 'Hide the marks' : 'Mark the word';
  }

  function turn(d: number): void {
    pageNo += d;
    drawPage();
  }

  function toggleMark(): void {
    const q = question();
    if (!q) return;
    mark = !(mark && pageNo === q.page);
    pageNo = q.page;
    drawPage();
    if (mark) host.say(`Paragraph ${q.paragraph} of page ${q.page} is marked, and word ${q.word} in it.`);
  }

  return {
    el,
    askLine,
    answer,
    toCard,
    markBtn,
    draw: drawPage,
    /** GM asks anew: the marks back on. */
    markAgain: () => (mark = true),
    /** Opens the guide at `page` (loading it the first time). */
    openAt(page: number): void {
      pageNo = page;
      void loadGuide().then((g) => {
        guide = g;
        drawPage();
      });
    },
  };
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
