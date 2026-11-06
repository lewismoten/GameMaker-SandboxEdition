// Every word FLICKER AND FLOW shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|FLICKER AND FLOW

Things that flicker and flow without moving.

A block can turn into another block a few ticks later, and a loop of them is an animation: a torch's flame, a flag in the wind, a waterfall.

How a loop feels is in its times. Even times are steady: a flag, falling water. Uneven times, with frames that do not grow in order, flicker: a flame.

Read the signs. Then open this game in Game-Maker and make a fire of your own.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump

Walk along each level to the door at the end. Look around as you go: what moves is the lesson.

Level 1 is a castle hall with torches and flags. Level 2 is a cliff with a waterfall. Level 3 is a fire on a hill at night.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|FLICKER AND FLOW  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, music and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
Music arranged: OpenAI Codex.
`),
);

export const WON = wrap(`
|WARM NOW

Three levels, three kinds of loop.

A torch is a ring of four flames with uneven times, so it flickers. A flag is a wave moved along its cloth, on even times, so it waves. A waterfall is a pattern of streaks slid down a quarter of a block each frame, so it never shows a seam.

The engine keeps one clock for each kind of block, not for each place on the map, so one block moves everywhere at once. To keep neighbors apart, use a second loop.

Open the game in Game-Maker and change a time.
`);

export const LOST = wrap(`
|OOPS!

Everyone falls down sometimes.

Try again: read the signs, and take your time.
`);
