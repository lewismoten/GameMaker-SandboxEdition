// Every word CORNER VIEW shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|CORNER VIEW

A room that looks as if it is seen from one corner.

The floor is drawn in diamonds. The cubes have a top and two sides. It looks like 3D.

But it is only pictures, cut into the same square blocks as every other game. Kit walks on the squares.

Read the signs. Then open this game in Game-Maker and look at the blocks.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS   walk any of the
|         four ways
|SPACE    does nothing

There are two rooms. In each, walk to the gold diamond to leave.

Cubes are walls. Walk round them.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|CORNER VIEW  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|ROUND THE CORNER!

Two rooms, drawn from a corner.

A corner view is a picture trick. The floor, the cubes and the stair are one painting, cut into blocks. Each block is a plain square, and Kit stays on the squares: he cannot walk the way the diamonds run.

It cannot sort by depth, either. Kit is always drawn on top, so he never walks behind a tower. A tall tower is solid in every block its picture covers.

Open the game in Game-Maker and look at the Blocks tab: every cube is made of a few blocks.
`);

export const LOST = wrap(`
|BACK TO THE START

Nothing hurts in this game, so this page is only here for the menu.

Press ESC to go back.
`);
