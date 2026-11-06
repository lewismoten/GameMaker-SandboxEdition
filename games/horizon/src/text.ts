// Every word TO THE HORIZON shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|TO THE HORIZON

The road climbs a hill and goes over the top.

A small explorer in a red beanie stands on a road that runs away to the horizon. Balls roll out of the hill and grow as they come. Then an arch comes closer, and a toll bar lifts to let you through.

Read the signs. Then open this game in Game-Maker and change when the balls come.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

The balls are soft. They do not hurt, and nothing in this game does.

Walk to the door on the right. In the second room the toll bar stops you until the arch has arrived.

Each room is one picture that never scrolls.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|TO THE HORIZON  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL DRIVEN!

Two rooms, and now you know how a game drives to the horizon.

The road is one picture in perspective, cut into blocks. A block that cannot be seen gives birth to a ball. The ball leaps onto the vanishing point, slides down its lane faster and faster, and shows four pictures of itself, small to big, so it seems to come near.

The arch is blocks that turn into bigger blocks after a time. Nothing here is real 3-D.

Open the game in Game-Maker and find the Blocks and Monsters tabs. Change the ticks on the arch, or make a longer timetable.
`);

export const LOST = wrap(`
|OOPS!

That was not meant to happen.

Try again: this time, just walk. The balls are soft and nothing here hurts.
`);
