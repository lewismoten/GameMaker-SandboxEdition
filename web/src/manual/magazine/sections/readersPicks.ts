// Readers' Picks: Polish Over Size, a one-page piece at the end of Reviews. Three make-believe
// reader games (too big, too small, just right) show that a finished, mid-length game beats a huge
// one and a tiny one, with a box of sizing tips. The lesson comes from watching people play
// Game-Maker games in levelengine's RSD Game Maker Binge (NOTICE.md), retold with invented games;
// the tips match The Ultimate Owner's Guide's "A length that fits" (F5 saves, as in PLAYGAME).
import { cols, head, list, note, p, pull, side } from '../blocks';
import type { MagSection } from '../types';

export const READERS_PICKS: MagSection = {
  id: 'readers-picks',
  title: 'Readers’ Picks: Polish Over Size',
  // it follows the Reviews, and their line on the contents page covers it
  toc: false,
  dept: 'REVIEWS',
  pages: () => [
    {
      kind: 'dept',
      tone: 'white',
      blocks: [
        head('Readers’ Picks: Polish Over Size', {
          kicker: 'You voted with your evenings',
          deck: 'We asked which disks you played to the very end this month. The winner wasn’t the biggest game in the pile, or the smallest. It was the most finished.',
          size: 'l',
          level: 2,
        }),
        cols(2, [
          head('Too big: Castle Gigantica', { size: 's', level: 3 }),
          p(
            'Forty floors, and every one a gray stone maze. You loved floor 1 and admired floor 2. By floor 6, most of your letters asked the same thing: “How many more?” Nothing on the screen said, and the help never mentioned F5, so one game over sent you back to the front gate. Nobody who wrote in saw floor 40. *“I wanted to like it. I just wanted to see the end more.”* (CHEESEWIZ)',
            { drop: true },
          ),
          head('Too small: Toaster Panic', { size: 's', level: 3 }),
          p(
            'A toaster on the run, a great title screen and a catchy tune. Then one room, about a minute of hopping, and the title screen again. No won picture, no thank-you, no “The End”. Half of you wrote to ask if your copy was broken. It wasn’t. That was the whole game. *“Did I win? I still don’t know.”* (DIPSWITCH)',
          ),
          head('Just right: Pickle Patrol', { size: 's', level: 3, kicker: '★ Readers’ pick ★' }),
          p(
            'Four levels. That’s it, and that’s plenty. Officer Dill chases the jar thieves through a deli, a farmers’ market, a cannery and the big brine works, and each level asks one thing more than the last. Every level card says where you are (“Level 2 of 4”) and that F5 saves. Five lives, so a fall still stings. And when the last thief is caught, a full-screen **YOU DID IT!** with fireworks and the whole squad waving says thanks for playing.',
          ),
          p(
            'Our test panel played it for forty minutes straight, and every one of them finished it. *“Short enough to beat, long enough to brag about.”* (BRINEDROP)',
          ),
        ]),
        pull('A long game hears “How many more?” A short one hears “Is that it?” A finished one hears “Again!”'),
        side(
          'Sizing up your game',
          [
            list([
              'Short is fine, if it ends on a won screen that says you won.',
              'Four or five levels, each a little harder, is a great size.',
              'Got twenty? Split them into chapters, each with a done screen of its own.',
              'Put “Level 3 of 10” on every level card.',
              'Say “F5 saves” on the first level card, not just in the help.',
              'Three to five lives, so a death counts.',
            ]),
            p('More in [The Ultimate Owner’s Guide](go:ultimate/craft), under “A length that fits”.'),
          ],
          'yellow',
        ),
        note(
          'Castle Gigantica, Toaster Panic and Pickle Patrol are made up. The lesson isn’t: it comes from watching people play Game-Maker games in levelengine’s “RSD Game Maker Binge” (2020), retold in the magazine’s own words. Send us the game you finished: TURBO BUTTON, P.O. Box 000.',
        ),
      ],
    },
  ],
};
