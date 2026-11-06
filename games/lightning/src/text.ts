// Every word LIGHTNING shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { titleCase } from '../../kit/starter/heroFor';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

const HERO = titleCase(about.hero);

export const STORY = wrap(`
|LIGHTNING

A storm at night, made of blocks.

Game-Maker has no flash and no lights. So the sky is a block that turns into a lighter sky for a moment, and back. The bolt is five blocks that look like sky until that same moment.

A block can't make a sound, so the thunder is in the song, a beat after each flash.

Walk with ${HERO} and read the signs. Then open the game in Game-Maker and look at the sky's blocks.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump

Walk to the door at the end of each level. Watch the sky: about every 7 seconds it flashes once.

Level 1 is a field in a storm. Level 2 has stones over a ditch; jump from stone to stone. If you fall in, nothing hurts: walk back up the step.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|LIGHTNING  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, music, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|STORM'S OVER

Two levels, one trick.

Every block that shows sky has a twin drawn on a lighter sky. Each turns into its twin, and back, on the same clock, so the whole sky flashes in one tick. The bolt is five more blocks on that clock.

The flash is kept gentle on purpose: once every 7 seconds, a sixth of a second long, and gray-blue, not white. Fast or bright flashing can make some players sick.

Open the game in Game-Maker and look at the sky's Next block.
`);

export const LOST = wrap(`
|OOPS!

Everyone falls down sometimes.

Try again: read the signs, and take your time.
`);
