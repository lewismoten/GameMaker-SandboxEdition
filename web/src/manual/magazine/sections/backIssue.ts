// Back issue: a page of No. 2 (January 1995) about No. 1 (April 1993), which readers can open
// from here (go:issue/1), and the follow-up to its Snowbound review that used to run beneath
// the review itself: Sandbox Software's fix for the sled (critic.ts says what the review found).
import { button, covers, grid, head, list, p, side } from '../blocks';
import type { MagSection } from '../types';

export const BACK_ISSUE: MagSection = {
  id: 'back-issue',
  title: 'Missed Our Spring Issue?',
  // not on the contents page: its rows already fill it (the letter links here)
  toc: false,
  dept: 'BACK ISSUES',
  pages: () => [
    {
      kind: 'dept',
      tone: 'cyan',
      blocks: [
        head('Missed Our Spring Issue?', {
          kicker: 'Back issues',
          size: 'l',
          level: 1,
          deck: 'Vol. 1, No. 4 (April 1993) is the one with the free disk. This issue’s letters and Readers’ Picks answer it.',
        }),
        grid(
          [
            [
              covers('TURBO BUTTON covers, the spring 1993 issue beside this one', [
                { issue: 'Vol. 1, No. 4 · Spring 1993', line: '“I shoveled snow to buy it.” Free disk: Snowbound', tone: 'black' },
                { issue: 'Vol. 3, No. 1 · This issue', line: 'Game-Maker’s source code set free!', tone: 'pink' },
              ]),
              button('go:issue/1', 'Read the spring 1993 issue'),
            ],
            [
              side(
                'What ran in it',
                [
                  list([
                    'Lewis Moten’s interview: Fort Ashby, the ad, the snow and the box arriving',
                    'The Critic’s Corner on Snowbound: The $89 Shovel',
                    'The Strategy Guide for Snowbound',
                    'The free disk: Snowbound, ready to run',
                  ]),
                ],
                'yellow',
                2,
              ),
              side(
                'Update: the sled',
                [
                  p(
                    'After the spring issue went to press, Sandbox Software mailed out a fix to [Snowbound](go:play/snowbound): the top of Jamie Street now glides, so one push of the down arrow sends the sled. The rest of the review stands.',
                  ),
                ],
                'pink',
                2,
              ),
            ],
          ],
          0.4,
        ),
      ],
    },
  ],
};
