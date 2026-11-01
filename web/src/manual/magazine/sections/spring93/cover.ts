// The spring issue's front cover: the masthead, the interview as the big story, and the free
// disk (Snowbound) taped to a corner. Vol. 1, No. 4 (masthead.ts).
import { art, grid, head, list, p, shot } from '../../blocks';
import { MAG } from '../../masthead';
import type { Go } from '../../go';
import type { MagSection } from '../../types';

/** The cover disk's link: it plays the game on it. */
const DISK_GO: Go = 'go:play/snowbound';

export const COVER_1: MagSection = {
  id: 'cover',
  title: 'Cover',
  toc: false,
  pages: (ctx) => [
    {
      kind: 'cover',
      tone: 'black',
      blocks: [
        { t: 'masthead', ...MAG, issue: ctx.mag.issue },
        p('Spring 1993 · Free disk inside', { lead: true }),
        head('“I SHOVELED SNOW TO BUY IT.”', {
          kicker: 'The Interview',
          size: 'xl',
          level: 2,
          deck: 'Lewis Moten of Fort Ashby, W.Va. turned a December storm into a game. [Read how](go:mag/lewis)',
        }),
        grid(
          [
            [shot('snowbound', 'title', 'Snowbound: The $89 Shovel, its title screen', undefined, -3)],
            [shot('snowbound', 'level', 'Snowbound: the kid with his shovel on a snowy street', undefined, 2)],
            [shot('snowbound', 'map', 'Snowbound: a street of the neighborhood, drawn out whole', undefined, -1)],
          ],
          0.25,
        ),
        list([
          '**Snowbound: The $89 Shovel, free on this disk** [On your disk](go:mag/disk)',
          '**Critic’s Corner: is the story better than the game?** [The review](go:mag/critics-corner)',
          '**Stuck behind Big Pete?** [Strategy Guide](go:mag/strategy)',
          '**The ad that started it** [Reprinted](go:mag/ad-reprint)',
        ]),
        {
          t: 'floppy',
          game: 'snowbound',
          go: DISK_GO,
          alt: 'Snowbound: The $89 Shovel, the free disk on the cover (plays the game)',
          cover: { burst: 'Free disk inside!', page: 'go:mag/disk' },
        },
        art('barcode', 'A bar code with the issue number'),
      ],
    },
  ],
};
