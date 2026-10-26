// The site's own reading on the Library's shelf (shelf.ts): TURBO BUTTON, the Guide, the pages
// on playing the downloads, and NO CARRIER, the desk's zine, once its whistle has been found
// (it is a find on the desk, so the shelf doesn't give it away before then).
import { SITE_OWNER, type ShelfItem } from './shelf';

const site = (id: string, title: string, note: string, icon: string, type: ShelfItem['type'], open: ShelfItem['open']): ShelfItem => ({
  key: `${SITE_OWNER}:${id}`,
  title,
  note,
  icon,
  type,
  owner: SITE_OWNER,
  ownerTitle: 'This site',
  open,
});

export function siteShelf(zineFound: boolean): ShelfItem[] {
  return [
    site('magazine', 'TURBO BUTTON', 'The shareware gamer’s monthly: news, reviews, hints and every game', '📰', 'magazine', {
      via: 'href',
      href: '#/magazine',
    }),
    ...(zineFound ? [site('zine', 'NO CARRIER #3', 'A photocopied zine about the desk PC’s power tools', '📠', 'magazine', { via: 'zine' })] : []),
    site('guide', 'The Guide', 'How to play, make and share games here', '📖', 'guide', { via: 'href', href: '#/help' }),
    site('mac', 'Playing on a Mac', 'The downloaded games on macOS', '🍏', 'guide', { via: 'href', href: '#/mac' }),
    site('windows', 'Playing on Windows', 'The downloaded games on Windows', '🪟', 'guide', { via: 'href', href: '#/windows' }),
    site('linux', 'Playing on Linux', 'The downloaded games on Linux', '🐧', 'guide', { via: 'href', href: '#/linux' }),
  ];
}
