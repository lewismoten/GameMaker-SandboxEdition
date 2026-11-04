// A game's postcard and grille (types.ts PostcardGrilleItem; the math is postcardMath.ts). Drawn once for both uses:
// printed (postcardGrilleSheets), the postcard's picture and message sides at true size (6 x 4 in) on one sheet and
// the grille card, both faces, on the next, to cut out; on screen (postcardGrilleLive), the grille lies over the
// message and is dragged, turned (R) and flipped (F), moved a word at a time with the arrow keys or the buttons, and
// each puzzle has a "Tell me the answer" that lays it where it reads the code. Sizes are in inches on a 6 x 4 card.
import './codeWheel.css'; // the side panel: help, puzzles, Tell me the answer
import './postcardGrille.css';
import { h } from '../../editor/core/ui';
import { sheet, type Sheet } from './kit';
import type { PostcardGrilleItem } from './types';
import { bare, holeCells, reading, turn, type Place } from './postcardMath';

const CELL = 0.55; // a word's square, in inches
const SIDE = 0.525; // the border beside the words (left, right)
const TOP = 0.625; // and above and below them
const MARGIN = 0.28; // the grille's margin, where its marks sit; it lies over the border's inner edge only

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const html = (svg: string): HTMLElement => {
  const el = h('span', { class: 'pg-svg' });
  el.innerHTML = svg;
  return el;
};

/** A picture of `name` from `glyphs` as SVG path markup at (x, y) in inches, size s. */
function glyph(it: PostcardGrilleItem, name: string, cx: number, cy: number, s: number, fill: string): string {
  const rows = it.glyphs[name] ?? [];
  const k = s / Math.max(rows.length, rows[0]?.length ?? 1);
  let d = '';
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '#') d += `M${x},${y}h1v1h-1z`;
    }),
  );
  const w = (rows[0]?.length ?? 0) * k;
  const ht = rows.length * k;
  return `<path aria-label="${esc(name)}" transform="translate(${cx - w / 2} ${cy - ht / 2}) scale(${k})" d="${d}" fill="${fill}"/>`;
}

const RED = '#8f2a22'; // the border's pictures
const CARD = '#2e3a4d'; // the grille's cardstock
const CARD_INK = '#f6ecd0';

/** The picture side: a Fair greeting over a field of corn with its maze, and the Ferris wheel above the hedge. */
function front(it: PostcardGrilleItem): HTMLElement {
  const rows: string[] = [];
  for (let i = 0; i < 9; i++) rows.push(`<rect x="0" y="${2.55 + i * 0.17}" width="6" height="0.1" fill="${i % 2 ? '#e0b43c' : '#c99a2a'}"/>`);
  const maze = ['M0.6 3.9V2.8H5.4V3.9', 'M1.2 3.9V3.2H2.6V2.8', 'M3.1 3.9V3.2H4.6', 'M1.9 3.2V3.6']
    .map((d) => `<path d="${d}" fill="none" stroke="#6d4a14" stroke-width="0.07" stroke-linecap="square"/>`)
    .join('');
  const spokes = Array.from({ length: 8 }, (_, k) => {
    const a = (k * Math.PI) / 4;
    return `<line x1="5.0" y1="1.85" x2="${5.0 + 0.62 * Math.cos(a)}" y2="${1.85 + 0.62 * Math.sin(a)}" stroke="#7a2e22" stroke-width="0.03"/>`;
  }).join('');
  const svg =
    `<svg viewBox="0 0 6 4" role="img" aria-label="${esc(it.heading)}: ${esc(it.caption)}, a postcard picture of a corn maze and the Ferris wheel" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="6" height="4" fill="#9fd4ea"/><rect y="1.6" width="6" height="1" fill="#c8e6ee"/>` +
    `<circle cx="1" cy="0.55" r="0.3" fill="#fff4b8"/>` +
    `<circle cx="5.0" cy="1.85" r="0.62" fill="none" stroke="#7a2e22" stroke-width="0.05"/>${spokes}` +
    `<path d="M5 1.85L4.65 2.7M5 1.85L5.35 2.7" stroke="#7a2e22" stroke-width="0.04"/>` +
    `<rect y="2.45" width="6" height="1.55" fill="#d8aa34"/>${rows.join('')}${maze}` +
    `<rect x="0.15" y="0.15" width="3.85" height="1.05" rx="0.08" fill="#fff8e0" stroke="#b3361f" stroke-width="0.05"/>` +
    `<text x="0.3" y="0.62" font-size="0.36" font-weight="900" fill="#b3361f" font-family="Georgia,serif">${esc(it.heading.split(' FROM ')[0]?.replace(/^./, (c) => c) ?? '')}</text>` +
    `<text x="0.3" y="0.98" font-size="0.22" font-weight="700" fill="#26325f" font-family="Georgia,serif">${esc(it.heading.includes(' FROM ') ? 'FROM ' + it.heading.split(' FROM ')[1] : '')}</text>` +
    `<rect x="3.2" y="3.45" width="2.6" height="0.4" rx="0.06" fill="#fff8e0"/><text x="4.5" y="3.72" font-size="0.2" fill="#26325f" font-family="Georgia,serif" text-anchor="middle" font-weight="700">${esc(it.caption)}</text></svg>`;
  return h('div', { class: 'pg-card pg-front' }, html(svg));
}

/** The message side: the border's pictures all round, the words in their squares. */
function message(it: PostcardGrilleItem): HTMLElement {
  const R = it.rows.length;
  const C = it.rows[0].length;
  const marks: string[] = [];
  it.border.top.forEach((n, c) => marks.push(glyph(it, n, SIDE + (c + 0.5) * CELL, 0.16, 0.24, RED)));
  it.border.bottom.forEach((n, c) => marks.push(glyph(it, n, SIDE + (c + 0.5) * CELL, 4 - 0.16, 0.24, RED)));
  it.border.left.forEach((n, r) => marks.push(glyph(it, n, 0.14, TOP + (r + 0.5) * CELL, 0.24, RED)));
  it.border.right.forEach((n, r) => marks.push(glyph(it, n, SIDE + C * CELL + 0.14, TOP + (r + 0.5) * CELL, 0.24, RED)));
  const frame = `<svg viewBox="0 0 6 4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><rect x="0.04" y="0.04" width="5.92" height="3.92" fill="none" stroke="${RED}" stroke-width="0.02"/>${marks.join('')}</svg>`;
  return h(
    'div',
    { class: 'pg-card pg-message' },
    html(frame),
    h(
      'div',
      { class: 'pg-words', style: `grid-template-columns: repeat(${C}, 1fr); grid-template-rows: repeat(${R}, 1fr)` },
      ...it.rows.flat().map((w, i) => h('span', { class: 'pg-word', dataset: { r: String(Math.floor(i / C)), c: String(i % C) } }, w)),
    ),
  );
}

/** Where a point of the grille's frame (-1..n) lies on the grille's own square, in inches. */
const at = (v: number, n: number) => (v < 0 ? MARGIN / 2 : v >= n ? MARGIN + n * CELL + MARGIN / 2 : MARGIN + (v + 0.5) * CELL);

/** The grille laid as `place` says (rot, flip), as SVG: with real holes (live) or hole squares to cut (print). */
function grilleSvg(it: PostcardGrilleItem, rot: number, flip: boolean, live: boolean): string {
  const g = it.grille;
  const n = g.n;
  const size = n * CELL + 2 * MARGIN;
  const cells = g.holes.map((hole, k) => {
    const [i, j] = turn(g, hole, rot, flip);
    return { x: MARGIN + j * CELL + 0.04, y: MARGIN + i * CELL + 0.04, k };
  });
  const s = CELL - 0.08;
  let body: string;
  if (live) {
    const holes = cells.map((c) => `M${c.x} ${c.y}h${s}v${s}h${-s}z`).join('');
    body = `<path fill-rule="evenodd" fill="${CARD}" stroke="#111" stroke-width="0.02" d="M0 0H${size}V${size}H0z${holes}"/>`;
  } else {
    body =
      `<rect width="${size}" height="${size}" fill="${CARD}" stroke="#111" stroke-width="0.02"/>` +
      cells
        .map((c) => `<rect x="${c.x}" y="${c.y}" width="${s}" height="${s}" fill="#fff" stroke="#d11" stroke-width="0.025" stroke-dasharray="0.07 0.05"/>`)
        .join('');
  }
  const nums = cells
    .map((c) => `<text x="${c.x + 0.07}" y="${c.y + 0.17}" font-size="0.15" font-weight="800" fill="#111" font-family="Arial,sans-serif">${c.k + 1}</text>`)
    .join('');
  const put = (p: [number, number], name: string) => {
    const [i, j] = turn(g, p, rot, flip);
    return glyph(it, name, at(j, n), at(i, n), 0.2, CARD_INK);
  };
  const arrows = `${put([g.a.row, -1], g.a.name)}${put([-1, g.b.col], g.b.name)}`;
  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}${nums}${arrows}</svg>`;
}

/** The printed card: its picture side and its message side, then the grille's two faces and how to use it. */
export function postcardGrilleSheets(it: PostcardGrilleItem): Promise<Sheet[]> {
  const cap = (t: string) => h('p', { class: 'pg-cap' }, t);
  const faces = h(
    'div',
    { class: 'pg-faces' },
    h('figure', null, h('div', { class: 'pg-grille-print' }, html(grilleSvg(it, 0, false, false))), h('figcaption', null, 'Front')),
    h('figure', null, h('div', { class: 'pg-grille-print' }, html(grilleSvg(it, 0, true, false))), h('figcaption', null, 'Back')),
  );
  return Promise.resolve([
    sheet(
      8.5,
      11,
      'pg-sheet',
      cap('Postcard, picture side (print on the front of a 4 x 6 inch card)'),
      front(it),
      cap('Postcard, message side (the back of the same card)'),
      message(it),
    ),
    sheet(
      8.5,
      11,
      'pg-sheet',
      h('h3', { class: 'pg-title' }, it.title),
      cap('The grille: cut along the dashed red squares, then glue the two faces back to back, holes over holes.'),
      faces,
      h('div', { class: 'pg-howto' }, ...(it.howto ?? []).map((l) => h('p', null, l))),
    ),
  ]);
}

/** The card as it lies, as a small picture (the desk's view of it). */
export function postcardGrillePicture(it: PostcardGrilleItem): HTMLElement {
  const c = message(it);
  c.classList.add('pg-thumb');
  c.setAttribute('aria-hidden', 'true');
  return c;
}

/** The card to play with on screen; with `only`, just the puzzles on that scene. */
export function postcardGrilleLive(it: PostcardGrilleItem, only?: number): HTMLElement {
  const g = it.grille;
  const R = it.rows.length;
  const C = it.rows[0].length;
  const place: Place = { r: Math.floor((R - g.n) / 2), c: Math.floor((C - g.n) / 2), rot: 0, flip: false };
  const card = message(it);
  const slot = h('div', {
    class: 'pg-grille',
    tabindex: '0',
    role: 'group',
    'aria-label': 'Grille card. Arrow keys move it a word, R turns it, F flips it over.',
  });
  const reads = h('p', { class: 'pg-reads', 'aria-live': 'polite' });
  const status = h('p', { class: 'pg-status visually-hidden', 'aria-live': 'polite' });
  card.append(slot);
  const apply = () => {
    const size = g.n * CELL + 2 * MARGIN;
    slot.style.left = `${((SIDE + place.c * CELL - MARGIN) / 6) * 100}%`;
    slot.style.top = `${((TOP + place.r * CELL - MARGIN) / 4) * 100}%`;
    slot.style.width = `${(size / 6) * 100}%`;
    slot.style.height = `${(size / 4) * 100}%`;
    slot.innerHTML = grilleSvg(it, place.rot, place.flip, true);
    const words = reading(g, it.rows, place).map(bare);
    reads.textContent = `The holes read: ${words.join(', ')}`;
    status.textContent = `Row ${place.r + 1}, column ${place.c + 1}, turned ${place.rot * 90} degrees, ${place.flip ? 'face down' : 'face up'}. Holes read ${words.join(', ')}.`;
    for (const [r, c] of holeCells(g, place)) card.querySelector(`.pg-word[data-r="${r}"][data-c="${c}"]`)?.classList.add('pg-seen');
    for (const e of card.querySelectorAll('.pg-seen')) {
      const r = Number((e as HTMLElement).dataset.r);
      const c = Number((e as HTMLElement).dataset.c);
      if (!holeCells(g, place).some(([hr, hc]) => hr === r && hc === c)) e.classList.remove('pg-seen');
    }
  };
  const move = (dr: number, dc: number) => {
    place.r = Math.min(R - g.n, Math.max(0, place.r + dr));
    place.c = Math.min(C - g.n, Math.max(0, place.c + dc));
    apply();
  };
  const spin = () => {
    place.rot = (place.rot + 1) % 4;
    apply();
  };
  const flip = () => {
    place.flip = !place.flip;
    apply();
  };
  slot.addEventListener('keydown', (e) => {
    const k = e.key;
    const arrow: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (arrow[k]) move(...arrow[k]);
    else if (k === 'r' || k === 'R') spin();
    else if (k === 'f' || k === 'F') flip();
    else return;
    e.preventDefault();
    e.stopPropagation(); // the grille's key, not the page's or the PC's underneath
  });
  // drag: the grille follows the pointer a word at a time
  let drag: { x: number; y: number; r: number; c: number } | undefined;
  slot.addEventListener('pointerdown', (e) => {
    slot.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, r: place.r, c: place.c };
    slot.focus();
  });
  slot.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const box = card.getBoundingClientRect();
    const inch = box.width / 6;
    const r = drag.r + Math.round((e.clientY - drag.y) / (inch * CELL));
    const c = drag.c + Math.round((e.clientX - drag.x) / (inch * CELL));
    move(r - place.r, c - place.c);
  });
  const end = () => (drag = undefined);
  slot.addEventListener('pointerup', end);
  slot.addEventListener('pointercancel', end);

  const btn = (label: string, text: string, fn: () => void) =>
    h('button', { type: 'button', class: 'pg-btn', 'aria-label': label, title: label, onclick: () => (fn(), slot.focus()) }, text);
  const pad = h(
    'div',
    { class: 'pg-pad', role: 'group', 'aria-label': 'Move the grille' },
    btn('Move up one word', '▲', () => move(-1, 0)),
    btn('Move left one word', '◀', () => move(0, -1)),
    btn('Move right one word', '▶', () => move(0, 1)),
    btn('Move down one word', '▼', () => move(1, 0)),
    btn('Turn a quarter clockwise (R)', 'Turn (R)', spin),
    btn('Flip face down or up (F)', 'Flip (F)', flip),
  );
  const answer = h('p', { class: 'cw-answer', 'aria-live': 'polite' });
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
            Object.assign(place, p.place);
            apply();
            answer.textContent = p.answer ?? '';
          },
        },
        'Tell me the answer',
      ),
    ),
  );
  apply();
  return h(
    'div',
    { class: 'cw-live pg-live' },
    h('div', { class: 'pg-stage' }, card, pad, reads, status),
    h(
      'div',
      { class: 'cw-side' },
      h(
        'p',
        { class: 'cw-help' },
        ...(it.howto?.length ? [it.howto.join(' ')] : ['Lay the grille over the postcard.']),
        ' Drag it, or use the arrow keys, R and F.',
      ),
      asks.length ? h('ol', { class: 'cw-asks' }, ...asks) : null,
      answer,
    ),
  );
}
