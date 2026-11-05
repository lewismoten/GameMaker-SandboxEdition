// The folded note on the Library room's floor, half under the reading table (libraryRoom.ts):
// the only key to Sandscript, the Sandbox games' own secret alphabet (games/kit/sandscript.ts,
// the one source of its letters). Nothing points to it; pressing it opens the key, every letter
// laid out from that source (sandLayout.ts) in SVG, and a line to read with it. sandscript.test.ts keeps the key
// and the source in step.
import './sandNote.css';
import { h, modal } from '../editor/core/ui';
import { SANDSCRIPT_NAME } from '../../../games/kit/sandscript';
import { KEY_LETTERS, sandLayout } from './sandLayout';

const SVG = 'http://www.w3.org/2000/svg';
const PAD = 0.35;

/** The line to try the key on, and what it says. */
const SAMPLE = 'YOU FOUND THE KEY';

function el(name: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

/** A message in Sandscript as an SVG picture: the rim runs along each word, the letters hang from it. */
function sandSvg(text: string, label: string): SVGSVGElement {
  const { width, rims, lines, dots } = sandLayout(text);
  const svg = el('svg', { viewBox: `${-PAD} ${-PAD} ${width + 2 * PAD} ${2 + 2 * PAD}`, role: 'img', 'aria-label': label, class: 'sand-svg' }) as SVGSVGElement;
  svg.append(
    ...rims.map(([x1, x2]) => el('line', { x1, y1: 0, x2, y2: 0, class: 'sand-stroke' })),
    ...lines.map(([x1, y1, x2, y2]) => el('line', { x1, y1, x2, y2, class: 'sand-stroke' })),
    ...dots.map(([cx, cy]) => el('circle', { cx, cy, r: 0.2, class: 'sand-dot' })),
  );
  return svg;
}

/** The folded note's picture: a scrap of ruled paper folded once, lying on the floor. */
const NOTE_ART = `<svg viewBox="0 0 60 30" aria-hidden="true"><ellipse cx="30" cy="26" rx="27" ry="3" fill="rgba(0,0,0,.35)"/><path d="M5 24 L14 6 L33 9 L28 26Z" fill="#f4efdc" stroke="#6b5a3a" stroke-width="1.2" stroke-linejoin="round"/><path d="M28 26 L33 9 L54 13 L47 25Z" fill="#e3dcc2" stroke="#6b5a3a" stroke-width="1.2" stroke-linejoin="round"/><path d="M12 14l17 2.5M10 18l17 2.5M33 15l17 3M32 19l16 3" stroke="#7fa3c8" stroke-width="1"/><path d="M13 11l4 .6v3M21 12.2v3l3 .4" stroke="#2a2a33" stroke-width="1.2" fill="none"/></svg>`;

/** The key's dialog: every letter, how to read it, and a line to try. */
export async function showSandKey(): Promise<void> {
  await modal<void>(`A folded note: the ${SANDSCRIPT_NAME} key`, (close) => [
    h(
      'div',
      { class: 'sand-paper', dataset: { listArea: '' } },
      h('p', { class: 'sand-title' }, sandSvg(SANDSCRIPT_NAME, SANDSCRIPT_NAME), h('span', null, SANDSCRIPT_NAME)),
      h(
        'p',
        { class: 'sand-how' },
        'The secret alphabet of the Sandbox games. Every letter hangs from a line along the top, and the line breaks between words. Watch for it on signs, walls and floors.',
      ),
      h(
        'ul',
        { class: 'sand-key', 'aria-label': `The ${SANDSCRIPT_NAME} letters` },
        ...KEY_LETTERS.map((ch) => h('li', null, sandSvg(ch, `${SANDSCRIPT_NAME} ${ch}`), h('span', { 'aria-hidden': 'true' }, ch))),
      ),
      h(
        'div',
        { class: 'sand-try' },
        h('p', null, 'Try it:'),
        sandSvg(SAMPLE, `A line in ${SANDSCRIPT_NAME} to read with the key`),
        h('details', null, h('summary', null, 'Show what it says'), h('p', null, SAMPLE)),
      ),
    ),
    h('div', { class: 'buttons' }, h('button', { type: 'button', autofocus: true, onclick: () => close(undefined) }, 'Fold it up')),
  ]);
}

/** The note's picture for the room's button. */
export function noteArt(): Element {
  const t = document.createElement('template');
  t.innerHTML = NOTE_ART;
  return t.content.firstElementChild!;
}
