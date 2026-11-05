// Every word OVERHEAD shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|ROAD TILES

A road is a row of blocks.

Each block is one little picture: a straight, a round corner, a bend, a piece cut on the diagonal. Put them side by side and they join into a road that goes any way you like.

Kit walks three roads, from above. Read the signs. Then open this game in Game-Maker and look at the blocks.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk any way
|SPACE         does nothing

Nothing pulls you down in this game. The arrows walk you up, down, left and right, and you face the way you go.

Follow the road to the finish line, the squares at its end. Water and trees stop you; the road never does.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|ROAD TILES  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|AT THE FINISH!

Three roads, one block set.

A round corner is a block with a curve drawn in it. A diagonal is a block with a slanted band, and a triangle in the blocks beside it. A bridge is a road block drawn on water.

Draw each shape once. The block editor can flip a block, or turn it a quarter, to make the others. A full set is a few dozen blocks.

Open the game in Game-Maker and look at the blocks.
`);

export const LOST = wrap(`
|BACK TO THE START

Nothing hurts in this game, so this page is only here for the menu.

Press ESC to go back.
`);
