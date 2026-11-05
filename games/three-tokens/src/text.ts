// Every word THREE TOKENS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THREE TOKENS

Some gates do not care about keys. They want a count.

A small explorer in a teal beanie finds purple tokens lying about. Each token adds one to a count you carry. A gate takes its price from that count, and only opens when you can pay all of it.

Read the signs, then open this game in Game-Maker and change a gate's price.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder

Touch a token and it is yours: your count goes up by one.

Walk into a gate. If your count can pay its price, the gate opens and the price comes off your count. If not, it stays shut and you keep your tokens.

Coins add to your score. In the second level the gate is the way out.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THREE TOKENS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|GATES OPENED!

Two levels, two gates, and every token spent.

A token only adds one to a count. A gate only asks whether the count can pay its price, and then takes it. A gate can even be the exit: its block is where the level ends.

Open the game in Game-Maker and find the token and the gates in the blocks. Change a price, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Tokens will not pick themselves up.

Try again: collect them first, then try the gate.
`);
