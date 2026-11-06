// Every word WARNING FIRST shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|WARNING FIRST

Some things warn you first.

A small explorer in a teal beanie has two short rooms. In the first, fog vents in the ground rumble before they puff. In the second, planks flicker before they vanish.

Watch for the warning. Then go.

Then open this game in Game-Maker and change how long a warning lasts.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

In level 1 each vent rumbles, then puffs fog that stings a little. Cross when the puff is over.

In level 2 a plank flickers, then is gone, then comes back. Cross while it is solid. If you fall you land on a soft mat. Hop out.

Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|WARNING FIRST  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.
Music: OpenAI Codex.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|MADE IT!

Two rooms, two warnings.

A warning is only a block that changes first. A vent has a rest block, a rumble block and a puff block, each set to turn into the next after a number of ticks (18.2 a second). A plank is solid, then cracked flicker blocks that blink gold and are still solid, then a gap.

Every clock starts when the room loads. The game cannot start one when you step on a plank, so a warning is for watching, not for setting off.

Open the game in Game-Maker, pick a vent block in the Blocks tab and look at its Next block and its time. Change a number, then play your change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game can cost a life, so this one is hard to do!

Try again: wait for the warning, then go.
`);
