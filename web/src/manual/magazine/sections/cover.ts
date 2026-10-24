// The front cover: the masthead, the big news, the cover lines and a stack of screenshots.
import { art, grid, head, list, shot } from '../blocks';
import { MAG } from '../masthead';
import type { MagSection } from '../types';

export const COVER: MagSection = {
  id: 'cover',
  title: 'Cover',
  toc: false,
  pages: () => [
    {
      kind: 'cover',
      tone: 'black',
      blocks: [
        { t: 'masthead', ...MAG },
        head('GAME-MAKER’S SOURCE CODE SET FREE!', {
          kicker: 'Exclusive',
          size: 'xl',
          level: 2,
          deck: 'The game construction kit that needs no programming is open to everyone. [What it means for you](go:mag/news)',
        }),
        grid(
          [
            [shot('snowbound', 'title', 'Snowbound: The $89 Shovel, its title screen', undefined, -3)],
            [shot('teddy', 'level', 'Teddy the corgi in his backyard, the first level of Teddy’s Little Big Adventure', undefined, 2)],
            [shot('goat', 'title', 'Third Goat from the Left, its title screen', undefined, -1)],
          ],
          0.25,
        ),
        list([
          '**“I shoveled snow to buy it.”** [The interview](go:mag/lewis)',
          '**An AI ported it to the web.** [We ask how](go:mag/claude)',
          '**Hints for every game** [Strategy Guide](go:mag/strategy)',
          '**Every game, listed** [The Directory](go:mag/directory)',
          '**Shareware Game of the Month** [Reviews](go:mag/reviews)',
          '**Who’s calling?** [BBS Listings](go:mag/bbs)',
        ]),
        art('barcode', 'A bar code with the issue number'),
      ],
    },
  ],
};
