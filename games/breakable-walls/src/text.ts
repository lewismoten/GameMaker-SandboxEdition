// Every word SMASH IT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SMASH IT

Crates in the way, and nothing to do but bump them.

A small explorer in a pink beanie has three short levels to cross. Walls of wooden crates stand on the path. Walk into one and it turns to rubble.

Read the signs. A block can turn into another block when it is touched, and that one idea makes crates, coins and spinning gems.

Then open this game in Game-Maker and change what a block becomes.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk into a crate to break it. Only the crates you touch break, and the rest stay.

Nothing here can hurt you. Take the coins and gems, break the walls and walk into the door at the end of each level.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SMASH IT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL SMASHED!

Three levels, and you know what a touch does.

A block can turn into another block when something touches it. A crate turns into rubble, a coin into air and a gem into air in every frame it spins through. A coin that turns into itself pays again and again.

The game cannot tell which side of a block was hit: a bump is just a touch.

Open the game in Game-Maker and find these on the Blocks tab. Change what a crate becomes, or what a coin pays, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Out of lives. That is not meant to happen here.

Try again: walk into a crate to break it.
`);
