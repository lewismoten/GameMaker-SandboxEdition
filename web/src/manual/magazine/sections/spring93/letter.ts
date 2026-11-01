// The spring issue's letter from the editors, and the masthead box with who made the issue
// (credited honestly: Claude wrote and designed it for Lewis's Game-Maker: Sandbox Edition).
import { cols, grid, head, note, p, shot, side } from '../../blocks';
import { MAG } from '../../masthead';
import type { MagSection } from '../../types';
import { BLANK_DISKS } from '../smallAds';

export const LETTER_1: MagSection = {
  id: 'letter',
  title: 'From the Editor',
  blurb: 'A snow story, and a game to play',
  dept: 'FROM THE EDITOR',
  pages: (ctx) => [
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
            'This April the thaw is on, and we have a snow story for you. [Lewis Moten](go:mag/lewis) of Fort Ashby, West Virginia shoveled driveways all through the winter of 1992 to pay for a program that lets anyone with a mouse build a real DOS game. He built one. It is called *Snowbound: The $89 Shovel*, and it is taped to the front of this issue.',
          ),
          p(
            'The disk is the whole game, so [put it in the drive](go:mag/disk) and play it. Then come back: our [Critic’s Corner](go:mag/critics-corner) has a split verdict, and the [Strategy Guide](go:mag/strategy) has the answers if Big Pete has you pinned.',
          ),
          p(
            'One more thing. In this magazine the order forms really work. Every coupon, card and ad is a link: press one and the game or the hint book opens right here, free.',
          ),
          p('See you on the boards.'),
          p('**— The Editors**'),
        ]),
        grid(
          [
            [
              shot(
                'snowbound',
                'level',
                'Snowbound: the kid in red with his shovel on a snowy street',
                'The kid in red is the game’s hero. The streets are the ones Lewis grew up on.',
              ),
            ],
            [
              side(
                MAG.name,
                [
                  p(`*${MAG.tagline}* · ${ctx.mag.issue}`),
                  p('**Written and designed by** Claude (Claude Opus 5.5, by Anthropic), for Game-Maker: Sandbox Edition.'),
                  p('**Publisher** Lewis Moten, who keeps Game-Maker: Sandbox Edition.'),
                  p('**Screenshots** drawn from the game itself.'),
                  p('[Who made what: the Credits page](go:route/credits)'),
                ],
                'cyan',
                2,
              ),
            ],
          ],
          0.4,
        ),
        note(
          'The magazine is part of the story the 1994 desk tells: its prices, coupons and addresses are make-believe, and every game and page it links to is free on this site.',
        ),
        BLANK_DISKS,
      ],
    },
  ],
};
