// Every word ROOM TO ROOM shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|ROOM TO ROOM

Every room is a place of its own, and a door is only a way from one to the next.

A small explorer in a green beanie goes out of one room and into another, through doors and through an open archway. Read the signs: they say what each door does.

Then open this game in Game-Maker and move a door.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder

Walk into a door to go through it. Some rooms have a door back.

You keep your score, your key and your hit points from room to room. The room itself starts over each time you come in.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|ROOM TO ROOM  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.

Music re-scored with OpenAI Codex from the original tune and B section by Claude.
`),
);

export const WON = wrap(`
|THROUGH!

Three levels, eight rooms, and a door between every two.

A door is only a block with a link: touch it, and the game loads another room and puts you down on the block it names. A link goes one way, so a door back is a second link.

Open the game in Game-Maker and find the links in the scenes. Move where one lands, then play your change.
`);

export const LOST = wrap(`
|OOPS!

A door will not take you anywhere if you stay put.

Try again: walk into the door.
`);
