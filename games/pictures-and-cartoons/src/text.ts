// Every word PICTURES AND CARTOONS shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|PICTURES AND CARTOONS

A game can show a picture before a level, after a level, or both. It can play a little cartoon too.

A small explorer in a teal beanie crosses three short rooms. A picture comes up as each one begins, and as he leaves the first, and between the second and the third a cartoon plays.

Read the boards. They say which file each picture is, and where it goes.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ANY KEY       skip a picture
|F2            lives, score

Read the boards as you pass them. Take the coins if you like; they are worth ten points each.

A picture waits a few seconds, or until you press a key. A cartoon always plays to its last frame.

Nothing here hurts you. The door at the end of a room takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|PICTURES AND CARTOONS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|THAT'S A WRAP!

Three rooms, three pictures and one cartoon.

A picture is a GIF file, a cartoon an FLI file. A scene has a place for a picture before its level and another for one after. A list can hold several files and show them one after another.

Open the game in Game-Maker and look at the scenes editor, then swap in a picture of your own, 320 by 200.
`);

export const LOST = wrap(`
|OOPS!

Nothing here is meant to hurt you, so how did that happen?

Try again. The picture before the level will show once more.
`);
