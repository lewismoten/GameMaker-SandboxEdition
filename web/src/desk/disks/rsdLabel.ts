// The printed label on Recreational Software Designs' own gameware disks, styled after the
// Game-Maker box: a black band with the slanted yellow GAME-MAKER logo, the title on the
// box's pink, a strip of the game's first level with its hero (drawn from the game's own
// files), and who made it.
import './rsdLabel.css';
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { renderShot } from '../../gfx/gameShots';

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

/**
 * `disk` is "Disk 2" for later disks of a set (empty for a single disk). RSD's own disks
 * carry the GAME-MAKER logo; other publishers' gameware gets their name on a band in
 * `band` (the disk's publisher color).
 */
export function rsdDiskLabel(g: CatalogEntry | undefined, title: string, disk: string, publisher?: { name: string; band: string }): HTMLElement {
  const strip = h('div', { class: 'r-strip' });
  const label = h(
    'div',
    { class: `label printed rsd${publisher ? ' gw' : ''}`, style: publisher ? `--gw-band:${publisher.band}` : undefined },
    publisher
      ? h('span', { class: 'r-band' }, h('span', { class: 'r-pub' }, publisher.name.toUpperCase()), h('span', { class: 'r-rsd' }, 'GAMEWARE'))
      : h('span', { class: 'r-band' }, h('span', { class: 'r-logo' }, 'GAME-MAKER'), h('span', { class: 'r-rsd' }, 'RSD')),
    // long titles (the two Woman Warrior games) wrap to two smaller lines instead of being cut off
    h(
      'span',
      { class: 'r-title' },
      h('span', { class: `r-name${title.length > 15 ? ' long' : ''}` }, title),
      disk ? h('span', { class: 'r-disk' }, disk) : null,
    ),
    strip,
    h(
      'span',
      { class: 'r-foot' },
      [g?.author ? `by ${g.author}` : '', publisher ? (g?.author ? '' : publisher.name) : 'Recreational Software Designs', g?.year ? `©\u00a0${g.year}` : '']
        .filter(Boolean)
        .join(' · '),
    ),
  );
  if (g?.gam) void levelStrip(g).then((url) => url && (strip.style.backgroundImage = `url(${url})`));
  else strip.classList.add('none');
  return label;
}
