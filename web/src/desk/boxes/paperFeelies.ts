// The box's feelies that are paper (a code wheel, the fingerprint card, the spyglass…) as tiles in the Feelies strip
// (trinketShelf.ts), beside the 3D ones. Each tile is a real render of the piece's first sheet, shrunk to fit; choosing one
// opens the box's contents at that piece (boxList.ts showInBox), where it can be turned, read or printed.
import { h } from '../../editor/core/ui';
import type { BoxItem } from '../../manual/printables/viewer';
import { whenQuiet } from '../../manual/printables/yieldNow';
import { showInBox } from './boxList';

const TILE = 70; // the picture's box, in pixels
const LAYOUT = 432; // the sheet is laid out this wide, then shrunk

/** One tile for each piece; the pictures come in one at a time as they are drawn. */
export function paperFeelieTiles(items: BoxItem[], open: () => void, fold: (item: BoxItem, tile: HTMLElement) => void = () => {}): HTMLElement[] {
  let shown = false;
  return items.map((item, i) => {
    const pic = h('span', { class: 'fl-paper', 'aria-hidden': 'true' });
    // the name is what a screen reader hears; it is shown only until the picture is drawn
    const name = h('span', { class: 'fl-name' }, item.title);
    const button = h(
      'button',
      {
        class: 'feelie paper',
        type: 'button',
        title: item.fold ? `${item.title}: watch it fold in 3D` : `${item.title}: look at it in the box`,
        onclick: (e: Event) => (item.fold ? fold(item, e.currentTarget as HTMLElement) : showInBox(open, item.id)),
      },
      pic,
      name,
    );
    void (async () => {
      await new Promise((r) => setTimeout(r, 300 * (i + 1))); // after the box's own list has begun
      if (!button.isConnected && shown) return;
      await whenQuiet(); // not while the person is pressing keys
      if (!button.isConnected && shown) return;
      const first = await (item.first ? item.first() : item.render().then((s) => s[0])).catch(() => undefined);
      if (!first) return;
      shown = true;
      first.el.style.width = `${LAYOUT}px`;
      first.el.inert = true;
      const tall = (LAYOUT * first.h) / first.w;
      const scale = Math.min(TILE / LAYOUT, TILE / tall);
      pic.append(h('span', { class: 'fl-shrunk', style: `transform: scale(${scale})` }, first.el));
      pic.style.width = `${LAYOUT * scale}px`;
      pic.style.height = `${tall * scale}px`;
      name.classList.add('sr-only');
    })();
    return button;
  });
}
