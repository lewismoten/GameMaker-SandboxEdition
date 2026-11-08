// Every word SPEND IT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|WORTH THE COINS

A key is not free here. It is on sale.

A small explorer in a pink beanie gathers coins and takes them to a stall. The key costs three. Two will not do, and the stall just waits. Pay in full, and it takes the coins, gives the key, and leaves you the change.

Then open this game in Game-Maker and change a price.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            your Money

Touch a coin and your Money goes up by one.

Walk into a stall with enough coins and it takes its price and gives you the item. With too few, nothing happens.

Money stays with you when a level ends.

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

A price is a rule on a block: an Effect counter, and an Effect amount below zero. The block only works when the counter holds more than the price, and it takes the price when it does.

The coin and the stall use the same counter, number 3. It is the one counter the DOS status page prints as a number: press F2 to see your Money.

Open the game in Game-Maker and change a price.
`);

export const LOST = wrap(`
|OOPS!

That hurt, and a hurt hero cannot shop.

Try again: take the coins, pay the stall, and carry the key to the door.
`);
