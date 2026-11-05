// Every word BOOTS AND JET PACK shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|BOOTS AND JET PACK

A small explorer in a teal beanie has two short levels, and both are about going up.

In the first, a tap of Space in the air lifts him again, so he can tap his way up a tall cliff and fly across a gap, as if he wore a jet pack. In the second, his boots hold only two jumps, and blue bubbles fill them up.

Read the signs. Then open this game in Game-Maker and change how many jumps the boots hold.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Tap Space again in the air and Kit rises again. In the second level the boots hold two jumps. A blue bubble adds one.

Nothing can hurt you here. If you fall into the pit, climb the ladder.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|BOOTS AND JET PACK  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|UP AND AWAY!

Two levels, and now you know how a jump can be counted.

Kit's jump is a push upward that adds to his speed. In the first level it has no limit, so every tap in the air lifts him again. In the second it has two uses: each tap spends one, and Space does nothing when none are left. A blue bubble adds one back.

Open the game in Game-Maker and find the jump on the Character tab. Change its uses, and the pickups' amount on the Blocks tab.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. That is not meant to happen here.

Try again: tap Space in the air, and keep tapping.
`);
