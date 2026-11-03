// A game's look-up code sheet (types.ts CodeSheetItem): a card printed black on dark red (or light cyan), the
// colors an office photocopier turns to mud, with grids of squares read by row and column. Drawn once as HTML
// for both uses: printed (codeSheetSheets), the card on a letter sheet with its color kept; on screen
// (codeSheetLive), a click or Enter on a square lights its row and column to read along, and each puzzle has a
// "Tell me the answer" that lights its square and says it. The 1994 desk lays the same card beside its monitor
// on a puzzle's scenes (desk/pc/codeWheelSpot.ts).
import './codeWheel.css'; // the side panel: help, puzzles, Tell me the answer
import './codeSheet.css';
import { h } from '../../editor/core/ui';
import { sheet, type Sheet } from './kit';
import type { CodeSheetItem } from './types';

const NS = 'http://www.w3.org/2000/svg';

/** A heading or square: its picture from `glyphs` (named for screen readers), or its text. */
function mark(it: CodeSheetItem, name: string): Node {
  const rows = it.glyphs?.[name];
  if (!rows?.length) return document.createTextNode(name);
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${rows[0].length} ${rows.length}`);
  svg.setAttribute('class', 'cs-glyph');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', name);
  let d = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') d += `M${x},${y}h1v1h-1z`;
  });
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
}

/** One grid as a table: column headings across the top, row headings down the side. */
function table(it: CodeSheetItem, gi: number): HTMLTableElement {
  const g = it.grids[gi];
  return h(
    'table',
    { class: 'cs-grid', dataset: { grid: String(gi) } },
    h('caption', null, g.title),
    h(
      'thead',
      null,
      h(
        'tr',
        null,
        h('th', { class: 'cs-corner', scope: 'col' }, g.rowHead ?? ''),
        ...g.cols.map((c, ci) => h('th', { scope: 'col', dataset: { col: String(ci) } }, mark(it, c))),
      ),
    ),
    h(
      'tbody',
      null,
      ...g.rows.map((r, ri) =>
        h(
          'tr',
          null,
          h('th', { scope: 'row', dataset: { row: String(ri) } }, mark(it, r)),
          ...g.cols.map((_, ci) => h('td', { dataset: { row: String(ri), col: String(ci) } }, mark(it, g.cells[ri]?.[ci] ?? ''))),
        ),
      ),
    ),
  );
}

/** The card: heading, how to read it, its grids, and its foot line. */
function card(it: CodeSheetItem): HTMLElement {
  return h(
    'div',
    { class: `cs-card cs-${it.paper ?? 'red'}` },
    h('h3', { class: 'cs-heading' }, it.heading),
    it.howto?.length ? h('div', { class: 'cs-howto' }, ...it.howto.map((l) => h('p', null, l))) : null,
    h('div', { class: 'cs-grids' }, ...it.grids.map((_, gi) => table(it, gi))),
    it.foot ? h('p', { class: 'cs-foot' }, it.foot) : null,
  );
}

/** The card on a letter sheet, its color printed (black on dark red photocopies as a black page). */
export function codeSheetSheets(it: CodeSheetItem): Promise<Sheet[]> {
  return Promise.resolve([sheet(8.5, 11, 'cs-sheet', card(it))]);
}

/** The card as it lies, as a small picture (the desk's view of it). */
export function codeSheetPicture(it: CodeSheetItem): HTMLElement {
  const c = card(it);
  c.classList.add('cs-thumb');
  c.setAttribute('aria-hidden', 'true');
  return c;
}

/** Lights square (`row`, `col`) of grid `gi` with its row and column, or clears the lights (gi -1). */
function light(root: HTMLElement, gi: number, row = -1, col = -1): void {
  for (const e of root.querySelectorAll('.cs-on, .cs-line')) e.classList.remove('cs-on', 'cs-line');
  const t = root.querySelector(`.cs-grid[data-grid="${gi}"]`);
  if (!t) return;
  for (const e of t.querySelectorAll<HTMLElement>('th, td')) {
    const r = Number(e.dataset.row ?? -1);
    const c = Number(e.dataset.col ?? -1);
    if (e.tagName === 'TD' && r === row && c === col) e.classList.add('cs-on');
    else if ((r === row && e.dataset.row !== undefined) || (c === col && e.dataset.col !== undefined)) e.classList.add('cs-line');
  }
}

/** The card to read on screen; with `only`, just the puzzles on that scene. */
export function codeSheetLive(it: CodeSheetItem, only?: number): HTMLElement {
  const c = card(it);
  const answer = h('p', { class: 'cw-answer', 'aria-live': 'polite' });
  // a square clicked (or Enter on it) lights its row and column, a ruler to read along
  for (const td of c.querySelectorAll<HTMLElement>('td')) {
    td.tabIndex = 0;
    const pick = () => {
      const gi = Number(td.closest<HTMLElement>('.cs-grid')!.dataset.grid);
      light(c, gi, Number(td.dataset.row), Number(td.dataset.col));
      answer.textContent = '';
    };
    td.addEventListener('click', pick);
    td.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopPropagation(); // the card's key, not the page's or the PC's underneath
      pick();
    });
  }
  const puzzles = (it.puzzles ?? []).filter((p) => only === undefined || p.scenes.includes(only));
  const asks = puzzles.map((p) =>
    h(
      'li',
      null,
      h('span', null, p.ask),
      h(
        'button',
        {
          type: 'button',
          class: 'cw-tell',
          onclick: () => {
            const g = it.grids[p.grid];
            const [ri, ci] = [g.rows.indexOf(p.row), g.cols.indexOf(p.col)];
            light(c, p.grid, ri, ci);
            c.querySelector(`.cs-grid[data-grid="${p.grid}"] td.cs-on`)?.scrollIntoView({ block: 'nearest' });
            const cell = g.cells[ri]?.[ci] ?? '';
            answer.replaceChildren(h('span', null, `${g.title}: ${p.row}, ${p.col}: `), mark(it, cell), p.answer ? h('span', null, ` ${p.answer}`) : '');
          },
        },
        'Tell me the answer',
      ),
    ),
  );
  return h(
    'div',
    { class: 'cw-live cs-live' },
    c,
    h(
      'div',
      { class: 'cw-side' },
      h(
        'p',
        { class: 'cw-help' },
        'Find the row and the column, and read the square where they cross. Click a square (or Tab to it and press Enter) to light its row and column.',
      ),
      asks.length ? h('ol', { class: 'cw-asks' }, ...asks) : null,
      answer,
    ),
  );
}
