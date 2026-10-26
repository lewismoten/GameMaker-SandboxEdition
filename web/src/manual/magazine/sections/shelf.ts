// The Shareware Shelf: every Game-Maker game the Game-Maker Archive at the Internet Archive
// lists (data/gameMakerArchive.json, written by scripts/gameMakerArchive.ts), titles only, set
// small in columns over several pages like a shareware catalog's back pages. A check marks the
// ones on the Game-Maker CD, which play on this site (when the magazine's games list them).
// The list is its own download, fetched while the issue is put together.
import { head, note, p, shelf } from '../blocks';
import type { MagContext, MagPage, MagSection, ShelfItem } from '../types';

/** Titles on the section's first page (under its headline and introduction), and at most on each page after. */
const FIRST = 84;
const PER_PAGE = 130;

const MARK = 'on the Game-Maker CD: plays here';

const archive = () => import('../data/gameMakerArchive.json').then((m) => m.default);

/** The shelf's titles, alphabetical as the data file has them; marked when the CD game is listed. */
export async function shelfItems(ctx: MagContext): Promise<ShelfItem[]> {
  return (await archive()).games.map((g) => ({ title: g.title, by: g.by, year: g.year, mark: !!(g.cd && ctx.game(g.cd)) }));
}

async function pages(ctx: MagContext): Promise<MagPage[]> {
  const items = await shelfItems(ctx);
  const makers = new Set((await archive()).games.flatMap((g) => (g.by ? g.by.split(', ') : []))).size;
  const marked = items.filter((i) => i.mark).length;
  const out: MagPage[] = [
    {
      kind: 'dept',
      tone: 'news',
      blocks: [
        head('The Shareware Shelf', {
          kicker: 'Every Game-Maker game we know of',
          deck: `${items.length} games by ${makers} makers: a few of RSD’s own samples, and all the rest made by Game-Maker’s users at kitchen tables and in bedrooms, then passed around on BBSes and floppy disks.`,
          size: 'l',
          level: 2,
        }),
        p(
          'Uploaded to a board near you, swapped at school, mailed for a couple of dollars: here are the titles, A to Z, with who made each and when. A ✓ means it’s one of the ' +
            `${marked} on the Game-Maker CD, and plays on this site: look it up in [The Game Directory](go:mag/directory).`,
        ),
        shelf(items.slice(0, FIRST), MARK),
      ],
    },
  ];
  // the rest shared out evenly over as few pages as hold them
  const rest = items.slice(FIRST);
  const n = Math.ceil(rest.length / PER_PAGE);
  for (let i = 0; i < n; i++) {
    const part = rest.slice(Math.round((i * rest.length) / n), Math.round(((i + 1) * rest.length) / n));
    out.push({ kind: 'dept', tone: 'news', blocks: [head('The Shareware Shelf, continued', { size: 's', level: 2 }), shelf(part, MARK)] });
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
