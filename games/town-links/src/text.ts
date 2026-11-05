// Every word MAPS WITHIN MAPS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|MAPS WITHIN MAPS

A world with a town on it, a town with a house in it.

Yana starts on a map of the whole country, where a town is one block. They step onto it and the town opens up: streets and houses, and Yana is bigger. A house door opens into a room.

Every way in has a way out, and each way out puts them back by the door they used.

Read the signs. Then open this game in Game-Maker and look at the links of a scene.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk any way
|SPACE         does nothing

Walk onto the town, through a gate or in at a door to go on. Pick up the keys, and the locked gate opens.

The door in the far wall of the house is the way out of the game.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|MAPS WITHIN MAPS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|OUT THE DOOR!

Three maps, three sizes.

Each scene has its own map file, its own blocks drawn to its own scale, and even its own picture of Yana. A link joins two scenes: the block that fires it, and the cell where you land.

Make the way back with a link of its own, and land the hero where they came in: beside the town block, outside the house door. Rooms on One Map and Overhead show other kinds of links.

Open the game in Game-Maker and look at the links of a scene.
`);

export const LOST = wrap(`
|BACK TO THE START

Nothing hurts in this game, so this page is only here for the menu.

Press ESC to go back.
`);
