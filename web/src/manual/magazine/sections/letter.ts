// The editor's letter, and the masthead box with who made the issue (credited honestly: Claude
// wrote and designed it for Lewis's Game-Maker: Sandbox Edition).
import { cols, head, note, p, side } from '../blocks';
import { MAG } from '../masthead';
import type { MagSection } from '../types';

export const LETTER: MagSection = {
  id: 'letter',
  title: 'From the Editor',
  blurb: 'Why the first issue had to be about Game-Maker',
  dept: 'FROM THE EDITOR',
  pages: () => [
    {
      kind: 'article',
      blocks: [
        head('Press the Turbo Button', { kicker: 'From the Editor', size: 'l', level: 1 }),
        cols(2, [
          p(
            'Every PC worth owning has a button on the front marked TURBO. Press it and the machine runs as fast as it can. That is the idea behind this magazine: the fastest way to find a good game, learn its secrets and get on with playing it.',
            { drop: true },
          ),
          p(
            'Our first issue could only lead with one story. The source code of Game-Maker, the kit that let anyone with a mouse build a real DOS game without writing a line of program, is free for anyone to read, change and share. [Our news team has the whole story](go:mag/news).',
          ),
          p(
            'Then we talk to two people at the heart of the new Sandbox Edition. One is [Lewis Moten](go:mag/lewis), who shoveled driveways through the winter of 1992 to buy his copy. The other is [Claude](go:mag/claude), who carried the program across to the web browser, where every game in these pages plays.',
          ),
          p(
            'After that, it is all games. The [Strategy Guide](go:mag/strategy) has hints for every one of them. The [Game Directory](go:mag/directory) lists them all. Our reviewers crown a [Shareware Game of the Month](go:mag/reviews), and the [BBS Listings](go:mag/bbs) tell you who to call tonight.',
          ),
          p(
            'One more thing. In this magazine the order forms really work. Every coupon, card and ad is a link: press one and the game, the hint book or the catalog opens right here, free.',
          ),
          p('See you on the boards.'),
          p('**— The Editors**'),
        ]),
        side(
          MAG.name,
          [
            p(`*${MAG.tagline}* · ${MAG.issue}`),
            p('**Written and designed by** Claude (Claude Opus 5.5, by Anthropic), for Game-Maker: Sandbox Edition.'),
            p('**Publisher** Lewis Moten, who keeps Game-Maker: Sandbox Edition.'),
            p('**Screenshots** drawn from the games themselves.'),
            p('[Who made what: the Credits page](go:route/credits)'),
          ],
          'cyan',
        ),
        note(
          'The magazine is part of the story the 1994 desk tells: its prices, coupons and addresses are make-believe, and every game and page it links to is free on this site.',
        ),
      ],
    },
  ],
};
