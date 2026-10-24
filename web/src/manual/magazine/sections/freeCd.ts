// ON YOUR FREE CD-ROM: the issue's cover disc and what is on it, which is what this repository
// holds: code/ (Game-Maker 3.0's source as released in 2014), cd/ (the original Game-Maker CD:
// the program, its gameware and shareware games, pictures, sounds, songs and animations),
// games/ (Sandbox Software's and The Bard of Bizarre's games) and runtime/ (an installed C:\GM).
// The games are named from the catalog as served, so a secret one is never among them. The
// disc links to the original repository. freeCd.test.ts checks the counts against cd/.
import { grid, head, list, note, p, side } from '../blocks';
import type { Go } from '../go';
import type { Block, MagContext, MagGame, MagSection } from '../types';

/** Andy Stone's 2014 source release, where the disc leads. */
export const ORIGINAL_REPO = 'https://github.com/gandrewstone/GameMaker';

/** The cover disc's link and accessible name. */
export const DISC_GO: Go = `go:url/${ORIGINAL_REPO}`;
export const DISC_NAME = 'The original Game-Maker source on GitHub (opens in a new tab)';

/** The original CD's libraries, counted from cd/ (freeCd.test.ts keeps them true). */
export const CD_LIBRARY = { pictures: 900, subjects: 14, sounds: 159, songs: 12, animations: 35 } as const;

/** The cover disc as a block: on its page, or on the cover with its starburst. */
export function disc(o: { caption?: string; cover?: boolean } = {}): Block {
  return {
    t: 'disc',
    go: DISC_GO,
    alt: DISC_NAME,
    caption: o.caption,
    cover: o.cover ? { burst: 'Free CD\u2011ROM inside!', page: 'go:mag/free-cd' } : undefined,
  };
}

/** Titles, each a link to play it, run together the way a disc's sleeve lists them. */
const titles = (games: MagGame[]): string =>
  games
    .slice()
    .sort((x, y) => x.title.localeCompare(y.title))
    .map((g) => `[${g.title.replace(/[[\]]/g, '')}](go:play/${g.id})`)
    .join(' · ');

const of = (ctx: MagContext, ...kinds: MagGame['kind'][]) => ctx.games.filter((g) => kinds.includes(g.kind));

export const FREE_CD: MagSection = {
  id: 'free-cd',
  title: 'On Your Free CD-ROM',
  blurb: 'Game-Maker’s source code, the original CD’s games and shareware, and every Sandbox Software game',
  dept: 'COVER DISC',
  pages: (ctx) => {
    const { pictures, subjects, sounds, songs, animations } = CD_LIBRARY;
    return [
      {
        kind: 'dept',
        tone: 'white',
        blocks: [
          head('ON YOUR FREE CD\u2011ROM', {
            kicker: 'Cover disc · Disc 1',
            size: 'l',
            level: 1,
            deck: 'Game-Maker™’s source, the original Game-Maker CD and the Sandbox games, on one silver disc.',
          }),
          grid(
            [
              [disc({ caption: 'Lost yours? Click this one for the original source.' })],
              [
                side(
                  'How to use the disc',
                  [
                    list(
                      [
                        'Put the disc in your CD-ROM drive, label side up, and type **D:** at the **C:\\>** prompt.',
                        'Game-Maker is in **\\CD\\GM**: type **CD \\CD** then **INSTALL**. Or copy **\\RUNTIME\\RUN\\GM**, Game-Maker already installed, to your hard disk.',
                        'No CD-ROM drive yet? Every game on the disc plays right here. [See the Directory](go:mag/directory)',
                      ],
                      true,
                    ),
                  ],
                  'cyan',
                  2,
                ),
              ],
            ],
            0.4,
          ),
          grid([
            [
              head('\\CODE: the source', { size: 's', level: 2 }),
              p(
                'Every C, C++ and assembly file of Game-Maker 3.0 (1991–1995), as Andy Stone released it: the designers, PLAYGAME, the file formats and the makefiles. **\\CODE\\README.MD** tells you what else you need to build it.',
              ),
              head('\\CD: the original CD', { size: 's', level: 2 }),
              p(`**Gameware**, free sample games to play, take apart and use in your own: ${titles(of(ctx, 'gameware'))}.`),
            ],
            [
              p(`**Shareware** from Game-Maker’s users, play only, in **\\CD\\SHARWARE**: ${titles(of(ctx, 'shareware'))}.`),
              p(
                `Plus a library for your own games: more than ${pictures} GIF pictures on ${subjects} subjects, ${sounds} sound effects and voices, ${songs} songs and ${animations} FLI animations, and the archive and picture tools the CD came with.`,
              ),
            ],
            [
              head('\\GAMES: Sandbox', { size: 's', level: 2 }),
              p(`Sandbox Software’s games and The Bard of Bizarre’s, each with its build code: ${titles(of(ctx, 'sandbox', 'bizarre'))}.`),
            ],
          ]),
          note(
            'Game-Maker’s source and program are © Recreational Software Designs (G. Andrew Stone, G. Oliver Stone, Oliver Stone Jr. and Joan Stone), released by Andy Stone under the MIT License in 2014. The gameware and shareware games stay their own authors’ work.',
          ),
        ],
      },
    ];
  },
};
