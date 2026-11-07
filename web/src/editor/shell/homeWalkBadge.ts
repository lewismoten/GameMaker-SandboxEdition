// The small icon on an imported game's card that says whether it has a walkthrough and how much
// of the game it covers (walkthrough/walkBadge.ts). Two shapes, so color is never the only
// difference: a filled circle with a check (complete), a circle with a wedge filled and the
// count beside it (partial). Nothing is drawn when there is none.
import { h } from '../core/ui';
import { walkLabel, type WalkBadge } from '../../walkthrough/walkBadge';

const NS = 'http://www.w3.org/2000/svg';
function svg(tag: string, attrs: Record<string, string>, ...kids: Element[]): SVGElement {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...kids);
  return el;
}

function icon(b: WalkBadge): SVGElement {
  const root = svg('svg', { viewBox: '0 0 16 16', width: '16', height: '16', 'aria-hidden': 'true', focusable: 'false' });
  if (b.complete) {
    root.append(
      svg('circle', { cx: '8', cy: '8', r: '7', fill: 'currentColor' }),
      svg('path', {
        d: 'M4.5 8.3 7 10.8 11.5 5.6',
        fill: 'none',
        stroke: 'var(--walk-badge-ink, #fff)',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
      }),
    );
  } else {
    const f = b.total ? Math.min(0.99, Math.max(0.08, b.won / b.total)) : 0.08;
    const a = f * Math.PI * 2 - Math.PI / 2;
    const x = 8 + 6 * Math.cos(a);
    const y = 8 + 6 * Math.sin(a);
    root.append(
      svg('circle', { cx: '8', cy: '8', r: '6.5', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-dasharray': '2.5 1.5' }),
      svg('path', { d: `M8 8 V2 A6 6 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`, fill: 'currentColor' }),
    );
  }
  return root;
}

/** Puts the walkthrough icon (and, for a partial one, its count) on an imported game's tile. */
export function walkTile(tile: HTMLElement, b: WalkBadge | undefined): void {
  if (!b) return;
  const label = walkLabel(b);
  // a pill in the picture's bottom-left corner, so the card gets no taller
  tile
    .querySelector('.tile-shot')
    ?.append(
      h(
        'span',
        { class: `tile-walk ${b.complete ? 'tile-walk-done' : 'tile-walk-part'}`, title: label, role: 'img', 'aria-label': label },
        icon(b),
        b.complete ? null : h('span', { class: 'tile-walk-n', 'aria-hidden': 'true' }, `${b.won}/${b.total}`),
      ),
    );
}
