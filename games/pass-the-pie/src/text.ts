// Every word PASS THE PIE shows on a text page (30 columns, 16 lines a page). The story page starts as the
// storybook and the how-to page admits there is more to it.
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|PASS THE PIE

It is Thanksgiving morning. Grandma's oven has gone KA-CLUNK, so every house on the street is cooking one dish, and Rory is carrying them all to the long table at the town hall.

Mr. Plume, Grandma's turkey, is a guest. He has been a guest for twelve years. He has led the town parade for twelve years.

He has not seen this year's parade flyer.

Somebody should probably tell him gently.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|ENTER         kick (Mr. Plume)
|F2            lives, score

Pick up the dish; the neighbor's door opens for it.

Rory hops what is in the way. Mr. Plume does not hop.

Steel keys open garden gates.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|PASS THE PIE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, songs, words and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A Special: a game that visits for a few days of the year.
`),
);

export const WON = wrap(`
|PASS THE PIE

Grandma's oven was never broken. It was unplugged, to run a thirty-foot turkey.

Big Gobble is folded in Uncle Dale's garage, next to his feelings.

Aunt Marjorie called the gravy "fine." Rory has a screenshot.

Mr. Plume leads the parade next year. Today he sits at the kids' table. They have the good rolls.
`);

export const LOST = wrap(`
|NOT LIKE THIS

Out of hit points.

The dinner is still out there. So is Big Gobble.

Rory: hop the vacuums, wait for a gap. Mr. Plume: kick first, ask later.
`);
