// The printed label on a Sandbox Software disk, as a shareware publisher had them made in the
// 90s: the company band, the title in the box's colors over a picture from the game, its
// hero standing in front, and the small print. Pictures come from the game's own files.
import './diskLabel.css';
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { splitTitle } from '../../project/gameTitle';
import { mapShot } from '../../gfx/gameShots';
import { portrait } from '../../manual/printables/kit';

interface LabelArt {
  shot?: string;
  hero?: string;
}

const cache = new Map<string, Promise<LabelArt>>();

/** A strip of the box's first screenshot and the hero from the game's sticker list, cached per game. */
function labelArt(g: CatalogEntry): Promise<LabelArt> {
  let hit = cache.get(g.id);
  if (!hit) {
    hit = (async () => {
      const shot = g.original?.box?.shots?.[0];
      const hero =
        g.original?.printables?.stickers?.find((s) => s.hero)?.hero ??
        g.original?.printables?.items?.flatMap((i) => (i.kind === 'idcard' && i.portrait ? [i.portrait] : []))[0];
      const [pic, face] = await Promise.all([
        shot ? mapShot(g, shot[0], shot[1] + 2, shot[2] + 3, 12, 4).catch(() => undefined) : undefined,
        hero ? portrait(g, hero).catch(() => undefined) : undefined,
      ]);
      return { shot: pic?.toDataURL(), hero: face };
    })();
    cache.set(g.id, hit);
  }
  return hit;
}

/** The company band: just the first word ("SANDBOX"), so it fits one line on a small disk. */
/** White on a dark band; on a bright one (orange, green) the company name prints in black so it reads. */
function bandInk(band: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(band);
  if (!m) return '#fff';
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (lum + 0.05) >= 4.5 ? '#fff' : '#111';
}

function logoText(g: CatalogEntry): string {
  const name = (g.original?.label?.logo ?? g.company ?? 'Sandbox Software').toUpperCase();
  return name.replace(/\s+SOFTWARE$/, '');
}

/** The label. `foot` is the disk's small print ("© 1995"); `disk` is "Disk 1" for a set of disks. */
export function printedDiskLabel(g: CatalogEntry, foot: string, note?: string, disk = ''): HTMLElement {
  const l = g.original?.label;
  const box = g.original?.box;
  const [main, sub] = splitTitle(g.title);
  const art = h('div', { class: 'p-art' });
  const label = h(
    'div',
    {
      class: 'label printed graphic',
      style:
        `--lbg:${l?.background ?? '#fff'};--lband:${l?.band ?? '#c62828'};--lbandink:${bandInk(l?.band ?? '#c62828')};--link:${l?.ink ?? '#111'};` +
        `--bbg:${box?.background ?? l?.band ?? '#222'};--bacc:${box?.accent ?? '#ffd400'};--bink:${box?.ink ?? '#fff'}`,
    },
    h('span', { class: 'p-logo' }, logoText(g)),
    h(
      'div',
      { class: 'p-banner' },
      art,
      h('span', { class: `p-title ${main.length > 14 ? 'long' : ''}` }, main),
      disk ? h('span', { class: 'p-disk' }, disk) : null,
      sub ? h('span', { class: 'p-sub' }, sub) : null,
    ),
    h('span', { class: 'p-line' }, `Shareware${g.price ? ` · ${g.price}\u00a0Registration` : ''}`),
    h('span', { class: 'p-foot' }, foot),
    note ? h('span', { class: 'marker-note' }, note) : null,
  );
  void labelArt(g).then(({ shot, hero }) => {
    if (shot) art.style.backgroundImage = `url(${shot})`;
    if (hero) art.append(h('img', { class: 'p-hero', src: hero, alt: '' }));
  });
  return label;
}
