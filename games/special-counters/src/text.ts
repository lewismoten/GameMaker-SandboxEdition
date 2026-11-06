// Every word NOT THAT KEY shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|NOT THAT KEY

A key you do not use does not vanish when the level ends. It goes with you.

A small explorer in a gold beanie carries keys from one level to the next. A gold key opens a gold door, today or two levels later. But a green door is a different door. Read the signs: they say which key fits.

Then open this game in Game-Maker and give a door a counter of its own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder

Touch a key and it is yours. The counter it adds to goes up by one.

Walk into a locked door while you carry its key. The door opens and takes one.

Keys stay with you when you leave a level. A door only takes the key that adds to its own counter.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|NOT THAT KEY  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|RIGHT KEY!

A counter has a number and no name. Counter 20 is gold only because the key, the door and the sign all say so.

Counters carry from level to level. So a spare opens a later door, and a door of another number stays shut. To keep the doors of two levels apart, give them different counters.

Open the game in Game-Maker, copy a key and a door, and change both to a new counter.
`);

export const LOST = wrap(`
|OOPS!

The wrong key will not turn, and neither will standing still.

Try again: read the signs, find the green key, and keep the gold one.
`);
