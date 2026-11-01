// The Shareware Shelf: every Game-Maker game the Game-Maker Archive at the Internet Archive
// lists (data/gameMakerArchive.json, written by scripts/gameMakerArchive.ts), titles only, set
// small in columns over several pages like a shareware catalog's back pages. A check marks the
// ones on the Game-Maker CD, which play on this site (when the magazine's games list them).
// The list is its own download, fetched while the issue is put together.
// The issue is dated January 1995, so a title the data dates 1995 or later (it has years only)
// can't be on a shelf yet: those follow the A-Z list in their own section, "Coming Soon to a BBS
// Near You", still A to Z and still checked if on the CD (none are: the CD's games are 1994 or older).
import { head, note, p, shelf } from '../blocks';
import type { Block, MagContext, MagPage, MagSection, ShelfItem } from '../types';

/** Titles on the section's first page (under its headline and introduction), and at most on each page after. */
const FIRST = 84;
const PER_PAGE = 130;
/** Room the future section's heading and line take on a page, in titles. */
const HEADING = 20;

/** The issue's year: titles dated this year or later are not out yet (it is January, so the whole year is ahead). */
const ISSUE_YEAR = 1995;

const MARK = 'on the Game-Maker CD: plays here';

const archive = () => import('../data/gameMakerArchive.json').then((m) => m.default);

/** The shelf's titles, alphabetical as the data file has them; marked when the CD game is listed. */
export async function shelfItems(ctx: MagContext): Promise<ShelfItem[]> {
  return (await archive()).games.map((g) => ({ title: g.title, by: g.by, year: g.year, mark: !!(g.cd && ctx.game(g.cd)) }));
}

async function pages(ctx: MagContext): Promise<MagPage[]> {
  const items = await shelfItems(ctx);
  const now = items.filter((i) => !i.year || i.year < ISSUE_YEAR);
  const soon = items.filter((i) => i.year && i.year >= ISSUE_YEAR);
  const makers = new Set((await archive()).games.flatMap((g) => (g.by ? g.by.split(', ') : []))).size;
  const marked = items.filter((i) => i.mark).length;
  const out: MagPage[] = [
    {
      kind: 'dept',
      tone: 'news',
      blocks: [
        head('The Shareware Shelf', {
          kicker: 'Every Game-Maker game we know of',
          deck: `${items.length} games by ${makers} makers, ${now.length} out so far and ${soon.length} still to come: a few of RSD’s own samples, and all the rest made by Game-Maker’s users at kitchen tables and in bedrooms, then passed around on BBSes and floppy disks.`,
          size: 'l',
          level: 2,
        }),
        p(
          'Uploaded to a board near you, swapped at school, mailed for a couple of dollars: here are the ${now.length} titles out so far, A to Z, with who made each and when. A ✓ means it’s one of the ' +
            `${marked} on the Game-Maker CD, and plays on this site: look it up in [The Game Directory](go:mag/directory).`,
        ),
        shelf(now.slice(0, FIRST), MARK),
      ],
    },
  ];
  // The rest of the A-Z list goes on the next page, then the future section begins right under it
  // (its heading costs about HEADING items of room) and runs on over as few pages as hold it.
  const rest = now.slice(FIRST);
  const futureTop = (): Block[] => [
    head('Coming Soon to a BBS Near You', {
      kicker: 'From our time-travel desk',
      deck: `${soon.length} more games, A to Z, that nobody has uploaded yet.`,
      size: 's',
      level: 2,
    }),
    p(
      `Our time-travel desk (a beige box under the stairs) picked up the titles of ${soon.length} games dated 1995 and later. They’re not on any board yet, so don’t go dialing around for them: check back in a year or two.`,
    ),
  ];
  const room = Math.max(0, PER_PAGE - rest.length - HEADING);
  const first: Block[] = [head('The Shareware Shelf, continued', { size: 's', level: 2 })];
  if (rest.length) first.push(shelf(rest, MARK));
  first.push(...futureTop(), shelf(soon.slice(0, room), MARK));
  out.push({ kind: 'dept', tone: 'news', blocks: first });
  const more = soon.slice(room);
  const n = Math.ceil(more.length / PER_PAGE);
  for (let i = 0; i < n; i++) {
    const part = more.slice(Math.round((i * more.length) / n), Math.round(((i + 1) * more.length) / n));
    out.push({ kind: 'dept', tone: 'news', blocks: [head('Coming Soon to a BBS Near You, continued', { size: 's', level: 2 }), shelf(part, MARK)] });
  }
  out
    .at(-1)!
    .blocks.push(
      note(
        'Titles, years and makers from the Game-Maker Archive’s collection at the Internet Archive (archive.org). Titles only: the checked games are on the Game-Maker CD, and none of the others’ files are in this issue or on this site.',
      ),
    );
  return out;
}

export const SHAREWARE_SHELF: MagSection = {
  id: 'shelf',
  title: 'The Shareware Shelf',
  blurb: 'Every Game-Maker game we know of, the tricks their makers used, and what players hate',
  dept: 'THE SHAREWARE SHELF',
  pages,
};
