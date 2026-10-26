// The Library's videos: Lewis's own tours of the site, on his YouTube channel (@LewisMoten), as
// plain data (a new video is one more entry). Each card's picture, public/videos/<id>.webp, is
// that video's hqdefault.jpg from YouTube (i.ytimg.com/vi/<id>/hqdefault.jpg), downloaded once,
// cropped to 16:9 and saved as a webp, so showing the Library asks YouTube for nothing. A video
// plays only when asked (videoDialog.ts).
import { SITE_OWNER, type ShelfItem } from './shelf';

interface Video {
  /** Its YouTube id. */
  id: string;
  title: string;
  by: string;
  /** When it was published, YYYY-MM-DD. */
  date: string;
  seconds: number;
}

const VIDEOS: readonly Video[] = [
  { id: '0riemzdF8gc', title: 'RSD Game Maker - Sandbox Edition', by: 'Lewis Moten', date: '2026-10-22', seconds: 1900 },
  { id: 'gNEya63wDmo', title: '25 RSD Game-Maker SE - More Features', by: 'Lewis Moten', date: '2026-10-25', seconds: 3363 },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A YYYY-MM-DD date as "Oct 22, 2026" (read as written, never shifted by a time zone). */
export function dateText(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** The videos as the Library's cards: the site's own, each opening in its player. */
export function videoShelf(): ShelfItem[] {
  return VIDEOS.map((v) => ({
    key: `${SITE_OWNER}:video-${v.id}`,
    title: v.title,
    note: `${v.by} · ${dateText(v.date)}`,
    icon: '📺',
    type: 'video',
    owner: SITE_OWNER,
    ownerTitle: 'This site',
    open: { via: 'video', id: v.id },
    seconds: v.seconds,
    picture: `./videos/${v.id}.webp`,
  }));
}
