// The printed label on Recreational Software Designs' own gameware disks, styled after the
// Game-Maker box: a black band with the slanted yellow GAME-MAKER logo, the title on the
// box's pink, a strip of the game's first level with its hero (drawn from the game's own
// files), and who made it.
import './rsdLabel.css';
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { renderShot } from '../boxes/boxArt';

const shots = new Map<string, Promise<string | undefined>>();

/** A 12x4-block strip of where the game starts, as a data URL (cached per game). */
function levelStrip(g: CatalogEntry): Promise<string | undefined> {
  let hit = shots.get(g.id);
  if (!hit) {
    hit = (async () => {
      const c = document.createElement('canvas');
      return (await renderShot(g, c, 12, 4).catch(() => false)) ? c.toDataURL() : undefined;
    })();
    shots.set(g.id, hit);
  }
  return hit;
}

/** `disk` is "Disk 2" for later disks of a set (empty for a single disk). */
export function rsdDiskLabel(g: CatalogEntry | undefined, title: string, disk: string, note?: string): HTMLElement {
  const strip = h('div', { class: 'r-strip' });
  const label = h(
    'div',
    { class: 'label printed rsd' },
    h('span', { class: 'r-band' }, h('span', { class: 'r-logo' }, 'GAME-MAKER'), h('span', { class: 'r-rsd' }, 'RSD')),
    h('span', { class: 'r-title' }, h('span', { class: 'r-name' }, title), disk ? h('span', { class: 'r-disk' }, disk) : null),
    strip,
    h(
      'span',
      { class: 'r-foot' },
      [g?.author ? `by ${g.author}` : '', 'Recreational Software Designs', g?.year ? `© ${g.year}` : ''].filter(Boolean).join(' · '),
    ),
    note ? h('span', { class: 'marker-note' }, note) : null,
  );
  if (g?.gam) void levelStrip(g).then((url) => url && (strip.style.backgroundImage = `url(${url})`));
  return label;
}
