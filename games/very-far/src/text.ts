// Every word WALKING VERY FAR shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|WALKING VERY FAR

How do you draw someone walking a long way off? Not by drawing them smaller everywhere: by drawing them tiny.

A small explorer in a teal beanie walks a road up close. Then the same walk, on a distant ridge, where he is only eight pixels tall.

Read the signs. Then open this game in Game-Maker and change how far a step goes.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk to the gate or door at the right of each level.

Up close, Lian is big. Far away he is a few pixels, with smaller steps and a smaller jump.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|WALKING VERY FAR  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|VERY FAR AWAY!

Three levels, three distances.

A far figure needs only a few pixels and the right colors: dark and orange against pale hills. His steps are drawn small and his character file moves him a few pixels a frame, so the walk looks slow. Big things drawn in front make the distance seem longer.

Open the game in Game-Maker, load a different character file in a far scene and change how far a step goes.
`);

export const LOST = wrap(`
|OOPS!

Try again: walk to the gate.
`);
