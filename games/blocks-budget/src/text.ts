// Every word 150 BLOCKS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|150 BLOCKS

A game gets 150 blocks to draw with, and no more.

A small explorer in a red beanie walks past a tower that is one big picture, then past a village built from a few blocks used again and again.

Read the signs. Then open this game in Game-Maker and look at the Blocks tab.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Pictures are not walls. Lena walks through a tower that is only drawn, but a brick wall stops them, so jump over it.

Coins add to your score. The door at the end of a level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|150 BLOCKS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|BIG AND SMALL

Two levels, and the count is on the last sign.

A picture bigger than one block is cut into blocks like tiles. A piece that is all sky needs no block, and a block you draw once can be used in as many places as you like. But it acts the same everywhere: solid in one place means solid in all of them.

Open the game in Game-Maker, find the Blocks tab and count them. The editor stops at 150.
`);

export const LOST = wrap(`
|OOPS!

Try again: the tower is only a picture, so walk right in. The brick wall is the one to jump.
`);
