// Every word ROOMS ON ONE MAP shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|ROOMS ON ONE MAP

A big map can hold a lot of little rooms, and a door can drop you into any of them.

A small explorer in a teal beanie goes through four rooms that are really one map cut into cells, then through three more that always look the same when you come in.

Read the signs. Then open this game in Game-Maker and move where a door lands.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Walk into a door to go through it. The walls of a room are bricks in its own color, so you can tell where you are.

Coins add to your score. The door at the end of a level takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|ROOMS ON ONE MAP  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|SEEN IT ALL!

Two maps, seven rooms.

A map is 100 blocks by 100, and the screen shows 16 by 10 of them. Turn scrolling off and it stays where the hero lands, so a room is a cell of the map and a door is a link that lands in another cell. The cells need not be next door.

Open the game in Game-Maker, find a scene's links and change the cell one lands on.
`);

export const LOST = wrap(`
|OOPS!

A door only takes you somewhere when you walk into it.

Try again: head for the door.
`);
