// Every word BIRDS OF A FEATHER shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|BIRDS OF A FEATHER

Birds fly together.

A small explorer in a teal beanie crosses two short rooms under a flock of five birds that fly in a V.

Read the signs. Watch the V as the birds fly right and back. In the second room, see what one faster bird does to it.

Then open this game in Game-Maker and change a bird's speed.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

The birds fly over you. They do not hurt, and nothing in this game does.

Every bird flies the same path at the same speed, so they keep the V.

Coins add to your score. The door at the end of the level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|BIRDS OF A FEATHER  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL FLOWN!

Two levels, and now you know how a flock holds its shape.

A monster can fly a path of up to ten corners at a speed written on each corner. Five monsters of one kind, put in a V on the map, all start their path when the level loads and keep that V for as long as they fly.

Game-Maker has no flock. The shape is only where you put them. Give one bird another speed and it leaves the others.

Open the game in Game-Maker and find the Path on the Monsters tab. Make a longer path, or a taller V.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk. The birds are friendly.
`);
