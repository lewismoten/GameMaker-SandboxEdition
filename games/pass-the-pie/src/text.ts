// Every word PASS THE PIE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|PASS THE PIE

It is Thanksgiving morning, and Grandma's oven has gone KA-CLUNK.

So the whole street is cooking the big dinner in its own kitchens, and somebody has to carry every dish to the long table at the town hall.

That somebody is Rory, in a striped scarf and a cap with ear flaps.

A pie. A gravy boat. A casserole. The cranberry sauce. The rolls. House to house, one dish at a time.

Mind the leaf piles, the vacuums, the footballs and one very hungry dog.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Pick up the dish at the start of each street. A neighbor's door opens only for a dish, and takes it.

Bumps spill the gravy (they take hit points). Hop over what rolls.

Leaf piles hide snacks. Touch a squirrel and it hops away.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|PASS THE PIE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, songs and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

A Special: a game that visits for a few days of the year.
`),
);

export const WON = wrap(`
|PASS THE PIE

Every dish is on the long table, and Grandma's oven is fixed just in time for dessert.

Nobody asked who ate the second pie. Mr. Plume the turkey is a guest, and guests get dessert.

Thank you for carrying dinner across town.

Next year, the oven is NOT allowed to go KA-CLUNK.
`);

export const LOST = wrap(`
|OH NO!

The gravy boat is empty and Rory is out of hit points.

Everybody on the street is still hungry. Try again: hop the vacuums, wait for gaps, and keep the dish in hand.
`);
