// The Library's videos: Lewis's own tours of the site, on his YouTube channel (@LewisMoten), as
// plain data (a new video is one more entry): its title, description and chapters as YouTube has
// them. Each card's picture, public/videos/<id>.webp, is that video's thumbnail from YouTube
// (i.ytimg.com/vi/<id>/maxresdefault.jpg, or hqdefault.jpg with its letterbox cropped off),
// downloaded once and saved as a 480×270 webp, so showing the Library asks YouTube for nothing.
// A tour's transcript, public/videos/<id>.transcript.json, is written from YouTube's automatic
// captions by scripts/videoTranscript.ts. A video plays only when asked (videoDialog.ts). Each
// game's walkthrough video is in videosWalk.ts (a secret game's only once it is revealed) and is
// shelved under its game.
import type { CatalogEntry } from '../project/files';
import { idHash, isOldSecret } from '../project/secretGames';
import { SITE_OWNER, type ShelfItem } from './shelf';
import { WALK_VIDEOS } from './videosWalk';

export interface Video {
  /** Its YouTube id. */
  id: string;
  title: string;
  by: string;
  /** When it was published, YYYY-MM-DD. */
  date: string;
  seconds: number;
  /** Its description's paragraphs; a web address in one is shown as a link. */
  about: string[];
  /** Its chapters: where each starts (seconds) and its title. */
  chapters?: [number, string][];
  /** It has a transcript, public/videos/<id>.transcript.json. */
  transcript?: true;
}

const PLAY = 'https://lewismoten.github.io/GameMaker-SandboxEdition/';
const SOURCE = 'https://github.com/lewismoten/GameMaker-SandboxEdition';

const VIDEOS: readonly Video[] = [
  {
    id: '0riemzdF8gc',
    title: 'RSD Game Maker - Sandbox Edition',
    by: 'Lewis Moten',
    date: '2026-10-22',
    seconds: 1900,
    about: ['A quick demo of a Game Maker port running in your web browser.'],
    transcript: true,
  },
  {
    id: 'gNEya63wDmo',
    title: 'RSD Game-Maker SE - More Features',
    by: 'Lewis Moten',
    date: '2026-10-25',
    seconds: 3363,
    about: [
      'Over 2,500 commits later, Game-Maker: Sandbox Edition has grown into a whole corner of the 1990s... complete with new games, more virtual computer desk interactions, more BBS features, printable magazines, boxed-game goodies, and a few very familiar dogs.',
      "In this development walkthrough, I explore the expanded Sandbox collection, Teddy's adventure trilogy, and the stranger games inspired by my Bard of Bizarre songs and monologues. I also demonstrate automated level-testing bots and heat maps, game export options, PC speaker sound conversion, music composition with automatic accompaniment, and animation tools.",
      'Along the way: blacklight posters, hidden Easter eggs, red-film hint books, a rubber chicken clock, a simulated TTY conversation, and the nostalgic ritual of looking up a word in the manual to register your software.',
      'This is a work-in-progress tour, including a few surprises from the coding agents still working behind the scenes.',
      `Play and explore: ${PLAY}`,
      `Source code: ${SOURCE}`,
    ],
    chapters: [
      [0, 'Introduction: over 2,500 commits later'],
      [33, "New Sandbox games and Teddy's trilogy"],
      [118, 'Mysteries, adventures, puzzles, and experiments'],
      [293, 'Stories, Virus Blaster, and In the Year 2000'],
      [395, 'Easter eggs, blacklights, and the chicken clock'],
      [473, "TURBO BUTTON magazine and the owner's guide"],
      [619, 'The bizarre game collection and its musical origins'],
      [891, "Virus Blaster's Sound Boaster level"],
      [944, 'Maps, red-film hints, and boxed-game goodies'],
      [1022, 'The new library and finding the level checker'],
      [1180, 'Level-testing bots and reachability heat maps'],
      [1315, 'Testing a complex map in Maximus'],
      [1490, 'Game downloads and export options'],
      [1555, 'Desk upgrades: gamepad, lighting, and visiting dogs'],
      [1662, 'Printable hacker zine'],
      [1737, 'BBS connection sounds and a tic-tac-toe door game'],
      [1824, 'BBS downloads and save-game editing'],
      [2007, 'Achievements, recurring characters, and collectibles'],
      [2222, 'Offline play, themes, and sharing'],
      [2284, 'Sound Blaster to PC speaker conversion'],
      [2385, 'Drawing music and adding automatic accompaniment'],
      [2636, 'Animation scenes and character direction'],
      [2721, 'Credits, contributors, and development tools'],
      [2877, 'Retro advertisements, catalog items, and desk accessories'],
      [3058, 'TTY terminal demonstration'],
      [3172, 'Walkthrough bots and following paths'],
      [3231, 'Save tools and retro software registration'],
    ],
    transcript: true,
  },
];

const BY = 'Lewis Moten';

/** The games' walkthrough videos shown (not a stale one), and a revealed secret game's once fetched, by YouTube id. */
const walks = new Map<string, Video>(WALK_VIDEOS.filter((v) => !v.stale).map((v) => [v.id, { ...v, by: BY }]));

/** The video `id` (its YouTube id): a tour, or a game's walkthrough on the shelf. */
export function videoById(id: string): Video | undefined {
  return VIDEOS.find((v) => v.id === id) ?? walks.get(id);
}

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

/** A secret game's walkthrough video (public/videos/walk-<idHash>.json), asked for only once the game is listed; undefined offline or when it has none. */
async function secretVideo(game: string): Promise<Video | undefined> {
  try {
    const res = await fetch(`./videos/walk-${idHash(game).toString(16).padStart(8, '0')}.json`);
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return undefined;
    const v = (await res.json()) as Video;
    if (typeof v.id !== 'string' || typeof v.seconds !== 'number') return undefined;
    walks.set(v.id, v);
    return v;
  } catch {
    return undefined;
  }
}

/**
 * The listed games' walkthrough videos as the Library's cards, each under its game, in the
 * order `games` lists them. `games` names a secret game only once it is revealed (listing.ts),
 * and only then is its video fetched; a stale video (an older version of its game) is never shown.
 */
export async function gameVideoShelf(games: readonly CatalogEntry[]): Promise<ShelfItem[]> {
  const found = await Promise.all(
    games.map(async (g) => ({ g, v: isOldSecret(g.id) ? await secretVideo(g.id) : WALK_VIDEOS.find((v) => v.game === g.id && !v.stale) })),
  );
  return found.flatMap(({ g, v }) =>
    v
      ? [
          {
            key: `${g.id}:video-${v.id}`,
            title: 'Walkthrough video',
            note: `${BY} · ${dateText(v.date)}`,
            icon: '📺',
            type: 'video' as const,
            owner: g.id,
            ownerTitle: g.title,
            open: { via: 'video' as const, id: v.id },
            seconds: v.seconds,
            picture: `./videos/${v.id}.webp`,
          },
        ]
      : [],
  );
}
