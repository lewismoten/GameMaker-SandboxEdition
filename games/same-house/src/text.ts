// Every word THE SAME HOUSE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|THE SAME HOUSE

One house can be many houses.

A small explorer in a purple beanie has two short levels. In the first, a street of three houses that look alike: go in each door, and the inside is the same house with a different carpet, wallpaper and roof. In the second, a square with three doors to one tower room that is wood, ice or lava.

Notice what stays the same.

Then open this game in Game-Maker and paint a palette of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Read the signs and walk into each door. Doors that leave a room put you back outside, just past the door.

When you have seen them all, the last door in each level goes on.

Nothing here hurts you. Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|THE SAME HOUSE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|HOME AGAIN!

Two levels, seven palettes.

Game-Maker keeps colors in a palette file, not in the pictures. Each scene lists a palette, a map and a block file. Here three scenes list the very same house map and blocks, and a different palette file each, so one house is three. A palette is the whole look of a scene, so every block that uses a slot changes at once.

Open the game in Game-Maker, look at the scenes, and give one of the houses a palette of your own.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game hurts, so this one is hard to do!

Try again: walk in through any door.
`);
