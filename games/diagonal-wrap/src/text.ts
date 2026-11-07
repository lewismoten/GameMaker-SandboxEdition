// Every word DIAGONAL WRAP shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|DIAGONAL WRAP

One map, one road, laid two ways.

The map wraps. Walk off the bottom and you come in at the top. Walk off the right edge and you come in on the left.

Lay the road straight and it wraps once. Tilt it a little and it keeps wrapping, three times as far, on the very same map.

Read the signs. Then open this game in Game-Maker and tilt a road of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk

Walk down the road to the doors at the end. Hedges close it in. The dashed white line is the edge of the map.

Level 1 runs straight down and wraps once. Level 2 is tilted and wraps three times.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|DIAGONAL WRAP  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|THE LONG WAY ROUND

Two levels, one map, one tilt.

The engine wraps the map by itself. Nothing else was needed to make level 2 three times as long: the road is laid one block to the right every three rows, and it runs off the bottom and back in at the top, over and over.

Open the game in Game-Maker and draw a road of your own. Lay it a little crooked and see how far it goes.
`);

export const LOST = wrap(`
|BACK TO THE START

Nothing hurts in this game, so this page is only here for the menu.

Press ESC to go back.
`);
