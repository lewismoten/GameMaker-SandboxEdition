// Every word LOOKS LIKE A WALL shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|LOOKS LIKE A WALL

Some walls are only pictures.

A small explorer in a teal beanie has three short levels to cross. Walls of brick stand on the path. One may be real. The next may be a picture, and Mia walks right through it.

Read the signs. Whether a block is solid is a setting, and a block can turn into another block when it is touched. That makes real walls, secret doors, and walls that crumble.

Then open this game in Game-Maker and change a block's setting.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk into a wall to see what it does. A real wall stops you, so jump over it. A picture of a wall lets you through.

Nothing here can hurt you. Take the coins and walk into the door at the end of each level.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|LOOKS LIKE A WALL  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL FOUND!

Three levels, and you know a wall from a picture of one.

Whether a block is solid is a setting of the block, and it has nothing to do with the picture. Two blocks can look exactly alike and act differently. A touch can turn a block into a second block, and that into a third.

Game-Maker's Level check lists blocks that look alike but act differently. It cannot tell a secret you meant from a mistake, so the list is only a suggestion.

Open the game in Game-Maker and find these on the Blocks tab. Make a wall of your own that is only a picture.
`);

export const LOST = wrap(`
|OOPS!

Out of lives. That is not meant to happen here.

Try again: walk into a wall to see what it does.
`);
