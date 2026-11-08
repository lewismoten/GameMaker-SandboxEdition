// Every word HEAT WAVES shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|HEAT WAVES

A long road through the desert at noon. The air over it is so hot that the far hills wobble.

Kit walks the road under the signs. The hills sway, a puddle shines ahead and is gone before he gets there, and then the sun goes down and the hills hold still.

Read the signs. Then open this game in Game-Maker and make some heat of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Nothing in this game hurts you.

Walk to the door on the right of each road.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|HEAT WAVES  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Opus 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|COOL AT LAST

Three roads of heat, and not one hot pixel in the engine.

The wobble is a block that turns into the next one: the same hills, moved a pixel or two, and back. Start each row a little later than the row under it and the wobble climbs, like hot air.

The puddle was a monster that jumps out of sight when you come near. The evening was a palette.

Open the game in Game-Maker and look at the blocks.
`);

export const LOST = wrap(`
|BACK TO THE ROAD

Nothing hurts in this game, so this page is only here for the menu.

Press ESC to go back.
`);
