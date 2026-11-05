// Every word DIG IT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|DIG IT

What happens when you touch the ground?

A small explorer in a gold beanie has two jobs. First, a hill is in the way: tunnel through it. Then a lane of spikes covers the surface: dig under it, and climb out the other side.

Read the signs. Digging is not a special move. Soil is a block that turns into a tunnel block when it is touched, and walking into it, or standing on it, is touching it.

Then open this game in Game-Maker and change one.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk, dig
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Walk to the door in each level. Dig the gold flecks on the way.

Soil digs when you touch it. Rock does not. Spikes hurt, so keep away from them.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|DIG IT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|DUG IT!

Two levels, and now you know how to dig.

Soil is a block with a touch setting: when it is touched it turns into the tunnel block. The engine changes the block first and checks what is solid afterward, so Neka walks straight on. Rock has no touch setting, so it stays.

Open the game in Game-Maker and find soil on the Blocks tab. Make rock into soil, then play it.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. That is not meant to happen here.

Try again: dig under the spikes, not over them.
`);
