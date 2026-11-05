// Every word OVERHEAD shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|OVERHEAD

A map seen from above.

First Kit walks around a room. The walls and the furniture you can see are the ones that stop him.

Then he sets out along four roads. Each road runs off the edge of the screen and into the next place, and one house has a door.

Read the signs. Then open this game in Game-Maker and look at how the places link.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|ARROWS        walk any way
|SPACE         does nothing

Nothing pulls you down in this game. The arrows walk you up, down, left and right, and you face the way you go.

Bump into things you can see. Walk off the edge of a road, or into a door, to go on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|OVERHEAD  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|OUT THE DOOR!

Two levels, from above.

A top-down map is an ordinary map: gravity off, a hero with a picture for each way he faces, and solid blocks drawn like what they are.

An overworld is several of those, joined. A link on the blocks at a map's edge lands you in the middle of the next area, and a door is the same kind of link.

Open the game in Game-Maker and look at the links of a scene.
`);

export const LOST = wrap(`
|BACK TO THE START

Nothing hurts in this game, so this page is only here for the menu.

Press ESC to go back.
`);
