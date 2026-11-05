// Every word LIGHTS OUT shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|LIGHTS OUT

A dark cave, and only paint for light.

A small explorer in a teal beanie goes into a cave where nothing is lit. Game-Maker has no lights. A lamp is a few blocks drawn brighter than the blocks beside them.

Read the signs. Blocks come in five brightnesses, laid in rings round a lamp. A touch can light the block Mia walks through. A clock can light a whole hall in one tick.

Then open this game in Game-Maker and light a cave of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump

Walk along each level to the door at the end. It is dark, but the floor, the signs and Mia are always bright enough to see.

Level 1 has three lamps. Level 2 is a tunnel that lights where you walk. In level 3 the lights come on by themselves: wait for the six bulbs.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|LIGHTS OUT  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, music and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|LIGHTS ON

Three levels, three ways to light a cave.

Light here is only paint. A block is drawn in five brightnesses, and the cells near a lamp are laid with the brighter ones, ring by ring. The lamp cannot move, because the paint does not.

A touch turns the one block touched into another, so Mia leaves a lit trail. A block's clock turns every block of its kind at once, so a whole hall can light in a single tick.

Open the game in Game-Maker and light your own cave.
`);

export const LOST = wrap(`
|OOPS!

Everyone falls down sometimes.

Try again: read the signs, and take your time.
`);
