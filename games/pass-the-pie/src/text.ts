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

|ARROWS    walk, climb
|SPACE     jump
|ENTER     Rory: toss a roll
|          Mr. Plume: combo
|F2        lives, score

Pick up the dish; its door opens for it.

A vacuum that catches a roll stalls. Stand on it.

Bars run out. Grandma's oven door starts a street over.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|PASS THE PIE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, songs, words and levels by Claude Sonnet 5.5 and Claude Opus 5.5, AI models made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A Special: a game that visits for a few days of the year.
`),
);

export const WON = wrap(`
|PASS THE PIE

Grandma's oven was never broken. Rory followed the cord.

Big Gobble is folded in Uncle Dale's garage, next to his feelings.

Aunt Marjorie called the gravy "fine." Rory has a screenshot.

Mr. Plume leads the parade next year. Today he sits at the kids' table. They have the good rolls.
`);

export const LOST = wrap(`
|NOT LIKE THIS

Out of hit points.

The dinner is still out there. So is Big Gobble.

Rory: feed the vacuums, then stand on them. Mr. Plume: read the drones, then kick.
`);
