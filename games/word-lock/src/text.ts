// Every word SAY THE WORD shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SAY THE WORD

Some locks do not want a key. They want you to say the word, and a few of them.

A small explorer in a blue beanie finds speech bubbles lying about. Each bubble adds one word to a count you carry. A lock takes its price from that count, and only opens when you can pay all of it.

A tray beyond a lock can give the words back. Without one, they are gone.

Read the signs, then open this game in Game-Maker and change a price.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder

Walk into a bubble and the word is yours: your count goes up by one.

Walk into a lock. If your count can pay, the lock opens and takes its price. If not, it stays shut and you keep your words.

A gold tray gives words back when you touch it. Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SAY THE WORD  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|LOCKS OPENED!

Two levels, four locks.

A word only adds one to a count. A lock only asks whether the count can pay, and then takes it. A tray is another block that adds to the same count, so the words come back. Leave the tray out and what a lock took stays taken.

Open the game in Game-Maker and find the word, the lock and the tray in the blocks. Change a price, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Words will not pick themselves up.

Try again: collect them first, then try the lock.
`);
