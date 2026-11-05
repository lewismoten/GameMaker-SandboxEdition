// Every word STRONGER KEYS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|STRONGER KEYS

Some doors want a strong key, and some keys are stronger than others.

A small explorer in a teal beanie finds bronze, silver and gold keys. A bronze key is worth 1, a silver key 2 and a gold key 3. A door has a price of its own, and it opens when you can pay it.

Read the signs, then open this game in Game-Maker and change a door's price.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder

Touch a key and it is yours: your count goes up by what the key is worth.

Walk into a door. If your count can pay its price, the door opens and the price comes off your count. You keep the rest. If not, it stays shut.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|STRONGER KEYS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|UP YOU GO!

Three levels, and a ladder of locks climbed.

A key is only a number added to a count. A door only asks that the count can pay its price, takes the price, and leaves the rest. So a gold key opens a silver door and still has some left.

It cannot do more than a count can hold: whole numbers, up to 32766. A key worth more stops there, and a door cannot take half a key.

Open the game in Game-Maker and find the keys and doors in the blocks. Change a price, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Keys will not open anything if you stay put.

Try again: find the keys first, then the doors.
`);
