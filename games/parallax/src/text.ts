// Every word PARALLAX shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|PARALLAX

The world goes by, and the screen never moves.

A small explorer in a teal beanie walks a path in front of a countryside. Far hills creep, a town goes by faster, and a fence races past. Then the clouds drift at two speeds, and three suns light up one by one and open a door.

Read the signs. Then open this game in Game-Maker and change how fast a band goes.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Nothing in this game hurts you.

Walk to the door on the right. In the second room the door is barred until the third sun has filled.

Each room is one picture that never scrolls.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|PARALLAX  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL RUN!

Two rooms, and now you know how a big game makes layers go by at different speeds.

A band is one row of one block. That block is a ring of pictures of the same scenery, each moved a little to the left of the one before, and each shown for a few ticks. The ring comes round after 20 pixels, so the join never shows.

Far things use a long wait; near things use a short wait or a bigger step. Nothing here scrolls.

Open the game in Game-Maker and find the Blocks tab. Change a band's ticks and play again.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk. Nothing here hurts.
`);
