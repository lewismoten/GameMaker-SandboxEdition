// THE -= S A N D B O X =- BBS, written the way the board always showed it (ansiArt.ts):
// every letter of SANDBOX its own color, the -= and =- yellow, on the black of a terminal
// screen so the colors read on any page, and never broken across two lines.
import './bbsName.css';
import { h } from '../../editor/core/ui';

/** The 16 text-mode colors (textScreen.ts's VGA16), as CSS. */
const CGA = ['#000', '#00a', '#0a0', '#0aa', '#a00', '#a0a', '#a50', '#aaa', '#555', '#55f', '#5f5', '#5ff', '#f55', '#f5f', '#ff5', '#fff'];

/** The colors of S, A, N, D, B, O, X (as on the logon screen). */
export const SANDBOX_COLORS = [12, 14, 10, 11, 9, 13, 6];
const hex = (c: number) => CGA[c];
const ENDS = 14; // yellow
const WORDS = 7; // light gray: THE and BBS

/** The name as a page shows it; `full` adds THE and BBS. */
export function bbsName(full = true): HTMLElement {
  return h(
    'span',
    { class: 'sbx-name', 'aria-label': full ? 'The Sandbox BBS' : 'Sandbox' },
    full ? h('span', { style: `color:${hex(WORDS)}` }, 'THE ') : null,
    h('span', { style: `color:${hex(ENDS)}` }, '-= '),
    ...[...'SANDBOX'].flatMap((c, i) => [h('b', { style: `color:${hex(SANDBOX_COLORS[i])}` }, c), i < 6 ? ' ' : null]),
    h('span', { style: `color:${hex(ENDS)}` }, ' =-'),
    full ? h('span', { style: `color:${hex(WORDS)}` }, ' BBS') : null,
  );
}

const NAME = /(THE\s+)?-=\s*S\s*A\s*N\s*D\s*B\s*O\s*X\s*=-(\s+BBS)?/gi;
const HAS_NAME = new RegExp(NAME.source, 'i'); // no g: test() keeps no state

/** Finds the name in a page's text and writes it in its colors. Returns how many it found. */
export function decorateBbsName(root: HTMLElement): number {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('.sbx-name, script, style, textarea') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const found: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (HAS_NAME.test(n.textContent ?? '')) found.push(n as Text);
  let count = 0;
  for (const node of found) {
    const text = node.textContent ?? '';
    const parts: (string | HTMLElement)[] = [];
    let last = 0;
    for (const m of text.matchAll(NAME)) {
      parts.push(text.slice(last, m.index));
      parts.push(bbsName(!!(m[1] || m[2])));
      last = (m.index ?? 0) + m[0].length;
      count++;
    }
    parts.push(text.slice(last));
    node.replaceWith(...parts.filter((p) => p !== ''));
  }
  return count;
}

/** How wide paintBbsName draws the name at a size, black strip included. */
export function bbsNameWidth(ctx: CanvasRenderingContext2D, size: number, full = true): number {
  ctx.save();
  ctx.font = `bold ${size}px "Courier New", ui-monospace, monospace`;
  const text = `${full ? 'THE ' : ''}-= S A N D B O X =-${full ? ' BBS' : ''}`;
  const w = ctx.measureText(text).width + size * 0.7;
  ctx.restore();
  return w;
}

/**
 * Paints the name on a canvas, on a black strip, its left (or center) at x and its
 * baseline at y. Returns the width it took.
 */
export function paintBbsName(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opts: { full?: boolean; align?: 'left' | 'center' } = {}): number {
  const full = opts.full ?? true;
  const runs: [string, number][] = [
    ...(full ? ([['THE ', WORDS]] as [string, number][]) : []),
    ['-= ', ENDS],
    ...[...'SANDBOX'].map((c, i): [string, number] => [i < 6 ? `${c} ` : c, SANDBOX_COLORS[i]]),
    [' =-', ENDS],
    ...(full ? ([[' BBS', WORDS]] as [string, number][]) : []),
  ];
  ctx.save();
  ctx.font = `bold ${size}px "Courier New", ui-monospace, monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const width = runs.reduce((w, [t]) => w + ctx.measureText(t).width, 0);
  let at = opts.align === 'center' ? x - width / 2 : x;
  const pad = size * 0.35;
  ctx.fillStyle = '#000';
  ctx.fillRect(at - pad, y - size * 0.9, width + pad * 2, size * 1.25);
  for (const [t, c] of runs) {
    ctx.fillStyle = hex(c);
    ctx.fillText(t, at, y);
    at += ctx.measureText(t).width;
  }
  ctx.restore();
  return width + pad * 2;
}
