// Every word WIRED ROOM shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|WIRED ROOM

A bridge that is not there yet, and a lever or two that might build it.

A small explorer in a teal beanie has two short levels to cross. In the first, two levers share one bridge. In the second there are three levers, and one of them is not for the bridge at all.

Read the signs. Nothing in a room is joined to anything else. Levers and planks and the hatch only share counters.

Then open this game in Game-Maker and rewire it.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|UP, DOWN      climb a ladder
|F2            lives, score

Walk into a lever to pull it.

A dotted plank is a plank that is not there yet. It turns solid under you when its counter has a plank to spend. A short bridge lets you drop into the pool, which is soft. It costs nothing: you just start the room again where you came in.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|WIRED ROOM  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL WIRED!

Two levels, and you have wired a room.

Two blue levers put three planks each on one counter, and six planks take them off again. There is no AND in Game-Maker: you add the counts, and the bridge needs the sum. A red lever puts one on a different counter, and only the hatch spends that.

Open the game in Game-Maker, find the levers and planks on the Blocks tab, and change how much a lever adds. Then see who needs whom.
`);

export const LOST = wrap(`
|NO MORE LIVES

That is all the lives. A room like this one never takes one, so something else did.

Try again from the menu.
`);
