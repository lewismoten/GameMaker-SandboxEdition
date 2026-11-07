// Every word WAVES ON THE SHORE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|WAVES ON THE SHORE

Water that moves, drawn with blocks.

A block can turn into another block by itself, a few ticks later. Turn a block into a loop of four and it moves, and a sea laid from it moves everywhere at once.

Start the loops at different frames and the ripples roll. Draw a shore as a loop of its own and the waves run up the sand and back.

Read the signs. Then open this game in Game-Maker and make some water of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk

Walk to the doors at the end. The water is deep: it stops you, so keep to the pier and the sand.

Level 1 crosses a sea on a pier. Level 2 walks round a beach.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|WAVES ON THE SHORE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|BY THE SEA

Two levels of water, and no animation in the engine at all.

A block can turn into another block after some ticks. That is the whole trick. Four blocks that turn into each other make a loop, and a map full of a loop's blocks moves. A loop that starts at a different frame in each cell makes the ripples roll.

The shore is the same: a wave is a loop on every sand block that touches the water, with its own shape for each corner.

Open the game in Game-Maker and look at the blocks. Make a loop of your own.
`);

export const LOST = wrap(`
|BACK TO THE PIER

Nothing hurts in this game, so this page is only here for the menu.

Press ESC to go back.
`);
