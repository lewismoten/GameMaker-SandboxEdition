// The issue's cover-mounted CD-ROM (types.ts 'disc' block): a silver disc with a rainbow sheen,
// a printed TURBO BUTTON label and the hole in the middle, turning slowly (still under
// prefers-reduced-motion). The whole disc is one link, to the original Game-Maker source. On the
// cover it sits in a corner with a FREE CD-ROM starburst. Drawn the way the desk's Game-Maker
// CD is (desk/boxes/gmBox.css .holo-cd), with its own label and styles (disc.css).
import './disc.css';
import { h } from '../../editor/core/ui';
import type { Go } from './go';
import { MAG } from './masthead';
import type { Block, Inline } from './types';

type DiscBlock = Extract<Block, { t: 'disc' }>;

/** Each label's arcs need ids of their own: the cover and a page can be on screen together. */
let made = 0;

/** The printed label: the magazine's name round the top, what is on it round the bottom. */
function label(): string {
  const id = `mag-disc-${++made}`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <defs>
      <path id="${id}-top" d="M 13 50 A 37 37 0 0 1 87 50"/>
      <path id="${id}-bottom" d="M 9 50 A 41 41 0 0 0 91 50"/>
    </defs>
    <circle cx="50" cy="50" r="46" class="disc-ring"/>
    <path d="M 4 50 A 46 46 0 0 1 96 50 L 79 50 A 29 29 0 0 0 21 50 Z" class="disc-band"/>
    <text class="disc-name"><textPath href="#${id}-top" startOffset="50%" text-anchor="middle">${MAG.name}</textPath></text>
    <text class="disc-small"><textPath href="#${id}-bottom" startOffset="50%" text-anchor="middle">SOURCE CODE · GAMES · SHAREWARE</textPath></text>
    <text x="50" y="31" class="disc-num">DISC 1</text>
    <text x="50" y="77" class="disc-cover">COVER DISC</text>
    <text x="50" y="83.5" class="disc-num">VOL. 1, NO. 1</text>
  </svg>`;
}

/** The disc: a figure with the turning disc as its link, and its caption. */
export function discFigure(b: DiscBlock, link: (go: Go, ...kids: (Node | string)[]) => HTMLAnchorElement, text: (t: Inline) => Node[]): HTMLElement {
  const spin = h('span', { class: 'mag-disc-spin' });
  spin.innerHTML = label();
  const disc = link(b.go, h('span', { class: 'sr-only' }, b.alt), h('span', { class: 'mag-disc-cd', 'aria-hidden': 'true' }, spin));
  disc.classList.add('mag-disc-link');
  disc.title = b.alt;
  const burst = b.cover ? link(b.cover.page, b.cover.burst) : null;
  burst?.classList.add('mag-disc-burst');
  return h('figure', { class: `mag-disc${b.cover ? ' on-cover' : ''}` }, disc, burst, b.caption ? h('figcaption', null, ...text(b.caption)) : null);
}
