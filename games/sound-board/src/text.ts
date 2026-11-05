// Every word SOUND BOARD shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SOUND BOARD

Every sound in a game is a number.

A small explorer in a teal beanie finds a room of pads. Step on one and it plays a sound. Each has a sign, and a little picture of the notes.

The second room uses sounds to say what just happened: a key, a gate, a jump, a wrong turn.

Read the signs, and listen.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            your numbers

Step on a pad to hear it. A pad plays once. The door by the start puts them all back.

A spike takes 10 hit points, and only once.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SOUND BOARD  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL HEARD!

Two rooms, and now you know how a game gets its sounds.

A sound is a number. Game-Maker plays 0 to 8 by itself when a block changes a counter: hit points, a life, money, score or another counter. A character's moves can play any of the 30. Only one plays at a time, so a new sound cuts off the old one.

Open the game in Game-Maker and find them in the Sounds tab. Change a pad's block, or a sound's notes, then play it.
`);

export const LOST = wrap(`
|OOPS!

Out of lives.

Try again: the spike is the only thing that hurts.

`);
