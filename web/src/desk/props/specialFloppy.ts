// A lone floppy in the empty spot beside the Game-Maker box: a Special whose arrival is
// 'desk-floppy' (specials/registry.ts), lying there only during its window until it is picked
// up. Picking it up keeps the Special for good (specials/arrivals.ts) and puts it in the disk box
// (retro/dos/disks.ts lists a kept Special), where it can go in drive A. The room looks again when
// the desk's clock or the Specials change (SPECIALS.EXE). Drawn with CSS (specialFloppy.css).
import './specialFloppy.css';
import { h } from '../../editor/core/ui';
import { pressable, say, flash, stillMotion } from './propKit';
import { roomSound } from './propSound';
import { arrive, deskFloppy } from '../../specials/arrivals';
import { specialsNow } from '../../specials/clock';
import { SPECIALS_EVENT } from '../../specials/state';
import { loadGameList } from '../../project/files';

export function specialFloppyProp(spot: HTMLElement): () => void {
  let disk: HTMLElement | undefined;
  let off = () => {};
  let gone = false;

  const clear = () => {
    off();
    off = () => {};
    disk?.remove();
    disk = undefined;
  };

  async function look(): Promise<void> {
    const s = deskFloppy(specialsNow());
    if (!s) return clear();
    if (disk?.dataset.special === s.id) return;
    const entry = (await loadGameList().catch(() => [])).find((g) => g.id === s.id);
    if (gone || !entry) return;
    clear();
    const band = entry.original?.label?.band ?? '#2b66c8';
    const el = h(
      'div',
      { class: 'special-floppy', 'data-special': s.id },
      h('span', { class: 'sf-shutter' }),
      h('span', { class: 'sf-label', style: `--sf-band:${band}` }, h('span', { class: 'sf-band' }), h('span', { class: 'sf-title' }, entry.title)),
    );
    spot.append(el);
    disk = el;
    if (!stillMotion()) flash(el, 'sf-new', 1600);
    off = pressable(el, `A floppy disk nobody remembers leaving here: ${entry.title}. Pick it up`, () => {
      if (!arrive(s.id, 'desk-floppy', specialsNow())) return clear();
      roomSound.slide();
      const anchor = document.querySelector('.disk-box') ?? spot;
      clear();
      say(
        anchor,
        `${entry.title}! Somebody left it on the desk, just for today. It’s in the disk box now, ready for drive A, and in the Special games for good.`,
      );
    });
  }

  const again = () => void look();
  addEventListener(SPECIALS_EVENT, again);
  addEventListener('gm-desk-clock', again);
  void look();
  return () => {
    gone = true;
    removeEventListener(SPECIALS_EVENT, again);
    removeEventListener('gm-desk-clock', again);
    clear();
  };
}
