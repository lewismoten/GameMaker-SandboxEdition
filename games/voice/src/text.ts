// Every word OUT LOUD shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|OUT LOUD

A voice is a file.

A small explorer in a red beanie has three short levels to cross. In the first, a press of Enter makes her say hello. In the second, two loudspeakers talk when she walks into them. In the third, one long line has to finish before the door.

Read the signs. A game can play a sound file when something happens, and that is how it talks. The clips here are hums made in code, and a copy of the game can swap in recordings of your own voice.

Then open this game in Game-Maker and look at its Sounds tab.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ENTER         say hello
|F2            lives, score

Walk into a loudspeaker to hear it. Voices need a Sound Blaster. Without one, the same moments play short beeps instead.

Nothing here can hurt you. Take the coins and walk into the door at the end of each level.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|OUT LOUD  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL SAID!

Three levels, and you have heard a game talk.

A voice is a sound file. A key's move can play it, and so can a counter going up or down. Only one voice plays at a time: a new one cuts the old one off, and so does a new scene. Put the door far enough from the speaker, or the end of the line is lost.

Text pages and the little movies between levels cannot play a voice. Only the level can.

Open the game in Game-Maker and find these on the Sounds tab. Record a line of your own.
`);

export const LOST = wrap(`
|OOPS!

Out of lives. That is not meant to happen here.

Try again: press Enter and listen.
`);
