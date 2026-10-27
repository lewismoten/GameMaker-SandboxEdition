// The print shop's cards on the Library's shelf (shelf.ts): each listed game's disk labels and,
// when it has a box, its retail box laid out flat; the Game-Maker CD's label with the Game-Maker
// box's paper and TURBO BUTTON's cover disc with the site's reading. Built only from the games
// the shelf lists (shelfGames), so a secret game's are there only once it is revealed.
import type { CatalogEntry } from '../project/files';
import { GM_OWNER, SITE_OWNER, type ShelfItem } from './shelf';

/** A game's print-shop cards. */
export function gamePrintItems(entry: CatalogEntry): ShelfItem[] {
  const owner = { owner: entry.id, ownerTitle: entry.title };
  return [
    {
      key: `${entry.id}:disklabels`,
      title: 'Disk labels',
      note: '3½" disk stickers to print, with die lines',
      icon: '💾',
      type: 'labels',
      ...owner,
      open: { via: 'print', game: entry.id, start: 'disklabels' },
    },
    ...(entry.original?.box
      ? [
          {
            key: `${entry.id}:retailbox`,
            title: 'Retail box',
            note: 'The box laid out flat, with die lines',
            icon: '📦',
            type: 'retailbox' as const,
            ...owner,
            open: { via: 'print' as const, game: entry.id, start: 'retailbox' as const },
          },
        ]
      : []),
  ];
}

/** The two CD labels: the Game-Maker CD with the Game-Maker box, TURBO BUTTON's disc with the site's reading. */
export function cdPrintItems(gmTitle: string): ShelfItem[] {
  return [
    {
      key: `${GM_OWNER}:gmcd`,
      title: 'Game-Maker CD label',
      note: 'The bonus-games CD’s label to print, with die lines',
      icon: '💿',
      type: 'labels',
      owner: GM_OWNER,
      ownerTitle: gmTitle,
      open: { via: 'print', start: 'gmcd' },
    },
    {
      key: `${SITE_OWNER}:turbocd`,
      title: 'TURBO BUTTON CD label',
      note: 'The cover disc of source code, to print, with die lines',
      icon: '💿',
      type: 'labels',
      owner: SITE_OWNER,
      ownerTitle: 'This site',
      open: { via: 'print', start: 'turbocd' },
    },
  ];
}
