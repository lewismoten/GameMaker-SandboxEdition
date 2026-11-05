// Every word UNDER THE SURFACE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|UNDER THE SURFACE

What does water do?

A small explorer in a teal beanie has three pools to cross. In a creek the water pulls him to the left. In a deep pool it holds him up, so he floats. In a tall one it lifts him up and to the left, right up to a ledge.

Read the signs. Water is not a special thing. It is a block with a gravity setting, and the setting says which ways it pulls.

Then open this game in Game-Maker and change one.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk, swim
|SPACE         jump
|F2            lives, score

Walk to the door in each level. Take the coins on the way.

Water is friendly here, and nothing can hurt you. Fall in and see what the water does: some pulls you along, some holds you up, some lifts you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|UNDER THE SURFACE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|SPLASH!

Three levels, and now you know what water does.

Every block has a gravity setting: which ways it pulls. The creek pulls left and down. The deep pool pulls up. The tall pool pulls up and left. The top row of each pool has no pull at all, so Lami settles there and can walk out.

Open the game in Game-Maker and find them on the Blocks tab. Make the creek pull right, then play it.
`);

export const LOST = wrap(`
|SPLASH!

Out of lives. That is not meant to happen here.

Try again: step into the water and see which way it pulls.
`);
