// The laser kits in a game's box, under the plastic trinkets (trinketShelf.ts): for each kit its real previews, what
// it is, and labeled download links. Drawn from laserKits.ts, so any manifest-described kit lists the same way.
import { h } from '../../editor/core/ui';
import type { LaserKit } from './laserKits';

/** One kit as a labeled group. */
function kitCard(kit: LaserKit): HTMLElement {
  return h(
    'section',
    { class: 'lk-kit', 'aria-label': kit.title },
    h('h3', { class: 'lk-title' }, kit.title),
    h('p', { class: 'lk-summary' }, kit.summary),
    h(
      'span',
      { class: 'lk-previews' },
      ...kit.previews.map((p) => h('img', { class: 'lk-preview', src: `${kit.base}${p.file}`, alt: p.alt, width: '96', height: '96', loading: 'lazy' })),
    ),
    h(
      'ul',
      { class: 'lk-downloads', 'aria-label': `${kit.title} files` },
      ...kit.downloads.map((d) =>
        h('li', null, h('a', { class: 'trk-dl', href: `${kit.base}${d.file}`, download: d.file.split('/').pop() ?? d.file }, d.label)),
      ),
    ),
  );
}

/** The list of kits (an element, empty when there are none). */
export const laserKitList = (kits: LaserKit[]): HTMLElement => h('div', { class: 'lk-list' }, ...kits.map(kitCard));
