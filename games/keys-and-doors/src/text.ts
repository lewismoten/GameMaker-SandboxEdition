// Every word KEYS AND DOORS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|KEYS AND DOORS

Some doors do not open just because you ask nicely.

A small explorer in a teal beanie has locked doors to get through. The first one is shut before you find a key, so look around. Read the signs: they say what a key does, and which door it fits.

Then open this game in Game-Maker and move a key, or lock a new door.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder

Touch a key and it is yours: the key counter goes up by one. The game does not draw the counter on the screen; F2 shows your score, and a key is worth 25.

Walk into a locked door while you carry its key. The door opens and the counter goes down by one. Some doors need two keys.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|KEYS AND DOORS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|UNLOCKED!

Three levels, four locked doors, and every key put to use.

A key is only a counter that goes up. A locked door only asks that the counter is high enough, and then takes one away.

Open the game in Game-Maker and find the key and the door in the blocks. Change what a door costs, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Keys will not open anything if you stay put.

Try again: look for the key first, then the door.
`);
