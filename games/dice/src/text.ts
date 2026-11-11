// Every word ROLL THE DICE shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|ROLL THE DICE

Leave a little to chance.

A small explorer in a green beanie finds a die rolling on the ground. Walk into it and it stops. Its face picks the door.

Watch it roll. Then touch it.

Then open this game in Game-Maker and change how long a face shows.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|UP, DOWN      climb a ladder
|SPACE         jump
|F2            lives, score

Walk into the die to stop it. An odd face gives a gold key and an even face gives a silver one.

The gold door is on the ground and the silver door is up the ladder. A door stays shut without its key.

Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|ROLL THE DICE  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THROUGH!

One die, two doors.

The die is a ring of six blocks. Face 1 is set to turn into face 2 after a few ticks (18.2 a second), face 2 into face 3, and so on round to 1 again. Each face block turns into a still copy of itself when touched, and gives a key (a gold one for 1, 3, 5 and a silver one for 2, 4, 6).

Game-Maker has no random number. The clock starts when the room loads, so the face you stop on depends only on the tick you touch it. Wait a little longer or a little less and the roll changes, but the same walk always rolls the same.

Open the game in Game-Maker, pick a face block in the Blocks tab and look at its Next block and its time. Change a number, then play your change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game can cost a life, so this one is hard to do!

Try again: walk into the die, then pick the door.
`);
