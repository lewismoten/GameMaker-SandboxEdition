// What Players Hate (and How to Fix It): a one-page Design Workshop feature on the gripes that
// make players quit a Game-Maker game, each with its fix, and "The Ten-Minute Test". The gripes
// are the ones players voiced most while Game-Maker games were played in levelengine's RSD Game
// Maker Binge and judged in Pixelmusement's ADG Episode 250 (NOTICE.md), retold in the
// magazine's own words; every fix is PLAYGAME's (the scroll stop lines in engine/scroll.ts,
// hit points taken on every touch in engine/touch.ts, F2 for the status screen), and the
// Ultimate Owner's Guide chapters it points to say the same.
import { cols, head, list, note, p, side } from '../blocks';
import type { MagSection } from '../types';

export const GRIPES: MagSection = {
  id: 'gripes',
  title: 'What Players Hate (and How to Fix It)',
  // it follows Tricks of the Shareware Masters, and The Shareware Shelf's line on the contents
  // page names both
  toc: false,
  dept: 'DESIGN WORKSHOP',
  pages: () => [
    {
      kind: 'article',
      tone: 'white',
      blocks: [
        head('What Players Hate (and How to Fix It)', {
          kicker: 'Design workshop',
          deck: 'We hung around the swap meet’s demo table and listened. These are the gripes we heard over and over, and every one is a fix you can make tonight.',
          size: 'l',
          level: 2,
        }),
        cols(2, [
          p(
            '**“Where do I go?”** The number one reason a game gets switched off. Let the player glimpse the goal early, put an arrow at the crossroads, and make the way out glow: every copy of an animated block changes at once, so a waving flag catches the eye from across the screen.',
            { drop: true },
          ),
          p(
            '**“What do the keys do?”** Say the goal in one line on the instructions page, then list every key the hero has, and only those. Then teach each key again in the first room, with a sign right where it’s first needed.',
          ),
          p(
            '**“That came out of nowhere!”** The screen doesn’t scroll until the hero is about two blocks from the edge. Keep the first few blocks past every turn and every ledge free of anything that bites.',
          ),
          p(
            '**“I can’t get out!”** A strong monster takes hit points on every tick it touches the hero, Hurt or no Hurt. Give the Hurt move a step backward, and leave him room to take it.',
          ),
          p(
            '**“It looked like floor.”** Floors that drop away, walls you walk through, a door that never opens. Make solid look solid. A trick is fair only when something gives it away.',
          ),
          p(
            '**“How many lives have I got?”** Nothing is on the screen during play, so say it: tell players that F2 shows their lives and score, put “level 3 of 10” on each level’s title card, and draw on a door how many keys it wants.',
          ),
          p(
            '**“Ninety-nine lives?”** If dying costs nothing, nothing is exciting. Three to five lives, and short levels so a death costs a minute, not an evening.',
          ),
          p(
            '**“My ears!”** A loud beep on every step and every coin wears thin in a minute. Keep the sounds you hear constantly short and soft, and save the big ones for big moments.',
          ),
          p(
            '**“Did I win?”** A game that drops back to the title with no won screen leaves players guessing. End on a real scene with music and a thank-you, and make the game over screen funny enough to play again.',
          ),
        ]),
        side(
          'The Ten-Minute Test',
          [
            p('A new player decides about your game in its first level. Before you upload, hand it to a friend and check that within ten minutes they:'),
            list(
              [
                'can say what the goal is',
                'know every key they need',
                'got through the first screen alive',
                'saw a sign pointing the way',
                'laughed at least once',
              ],
              true,
            ),
            p('Every miss is your next fix. More in [The Ultimate Owner’s Guide](go:ultimate/levels).'),
          ],
          'yellow',
        ),
        note(
          'These gripes come from watching people play Game-Maker games in two videos, levelengine’s “RSD Game Maker Binge” (2020) and Pixelmusement’s “ADG Episode 250 - Game-Maker” (2018), retold in the magazine’s own words.',
        ),
      ],
    },
  ],
};
