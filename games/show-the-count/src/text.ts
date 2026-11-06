// Every word SHOW THE COUNT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SHOW THE COUNT

Game-Maker keeps a count for you, but it can never print it as a number.

A small explorer in a red beanie finds rows of dark bulbs. Each bulb adds one to their count, and lights up. The lit bulbs are the count, shown as pictures.

Read the signs, then open this game in Game-Maker and add a bulb.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder

Walk through a dark bulb. It lights up, and your count goes up by one. A lit bulb stays lit.

Walk into a gate. If your count can pay its price, the gate opens and the price comes off your count. If not, it stays shut.

Coins add to your score. In the second level the gate is the way out.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SHOW THE COUNT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|METER FULL!

Two levels, two gates, and every bulb lit.

A bulb only adds one to a count and swaps its own picture. The count itself is never printed: Game-Maker has no number to show. A meter is a row of pictures, one for each value, so a bigger meter needs a bigger row.

Open the game in Game-Maker and find the dark and lit bulbs in the blocks. Add one more bulb, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Bulbs light when you touch them.

Try again: light every bulb first, then try the gate.
`);
