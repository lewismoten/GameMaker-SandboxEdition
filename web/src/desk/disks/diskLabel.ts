// The printed label on a Sandbox Software disk, as a shareware publisher had them made in the
// 90s: the company band, the title in the box's colors over a picture from the game, its
// hero standing in front, and the small print. Pictures come from the game's own files.
import './diskLabel.css';
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { mapShot } from '../boxArt';
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

/** The label. `foot` is the disk's small print ("Disk 1 of 2 · 3½" HD · © 1995"). */
export function printedDiskLabel(g: CatalogEntry, foot: string, note?: string): HTMLElement {
  const l = g.original?.label;
  const box = g.original?.box;
  const [main, sub] = (() => {
    const i = g.title.indexOf(':');
    return i < 0 ? [g.title, ''] : [g.title.slice(0, i), g.title.slice(i + 1).trim()];
  })();
  const art = h('div', { class: 'p-art' });
  const label = h(
    'div',
    {
      class: 'label printed graphic',
      style:
        `--lbg:${l?.background ?? '#fff'};--lband:${l?.band ?? '#c62828'};--link:${l?.ink ?? '#111'};` +
        `--bbg:${box?.background ?? l?.band ?? '#222'};--bacc:${box?.accent ?? '#ffd400'};--bink:${box?.ink ?? '#fff'}`,
    },
    h('span', { class: 'p-logo' }, l?.logo ?? (g.company ?? 'SANDBOX SOFTWARE').toUpperCase()),
    h(
      'div',
      { class: 'p-banner' },
      art,
      h('span', { class: `p-title ${main.length > 14 ? 'long' : ''}` }, main),
      sub ? h('span', { class: 'p-sub' }, sub) : null,
    ),
    h('span', { class: 'p-line' }, `Shareware${g.price ? ` · Register for ${g.price}` : ''}`),
    h('span', { class: 'p-foot' }, foot),
    note ? h('span', { class: 'marker-note' }, note) : null,
  );
  void labelArt(g).then(({ shot, hero }) => {
    if (shot) art.style.backgroundImage = `url(${shot})`;
    if (hero) art.append(h('img', { class: 'p-hero', src: hero, alt: '' }));
  });
  return label;
}
