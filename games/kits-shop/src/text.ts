// Every word SPEND IT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|OPEN FOR BUSINESS

Kit gathers coins in the street, then walks into a shop with three things on its shelf: a gold key, a silver key and a heart. Each has a price on its roof.

Pay for one and it is yours, and its stall says SOLD. The exit is locked, and only both keys open it.

Then open this game in Game-Maker and set a price of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            your Money

Walk into a coin and your Money goes up by one.

Walk into a stall with enough coins and it takes its price and gives you the item. With too few, nothing happens. You can jump over a stall to reach the next.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SPEND IT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|PAID IN FULL!

Each stall is a block with a negative Effect amount on Money, counter 3. The gold key stall takes 3, the silver key stall 3 and the heart stall 2. Eight coins in the level pay for all of it.

Once bought, a stall turns into a SOLD counter and cannot be bought again. A block can only change itself, so every stall is its own block.

Open the game in Game-Maker and change a price.
`);

export const LOST = wrap(`
|OOPS!

That hurt, and a hurt hero cannot shop.

Try again: take the coins, pay at each stall, and carry both keys to the exit.
`);
