// Every word EVERYBODY TALKS shows on a text page (30 columns, 16 lines a page), and the words
// the three friends say.
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|EVERYBODY TALKS

Two people can talk at once, and so can four.

A small explorer in a teal beanie crosses two short rooms. In the first they talk with Pip. In the second they walk into a group of three friends, and they all talk at once.

Each talk is one picture of everyone, with a speech bubble for every turn, and one page of words that fits into the bubbles. Walk up and see.

Then open this game in Game-Maker and change who says what.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ANY KEY       turn a page
|F2            lives, score

Read the boards as you pass them. A friend with a speech bubble over their head will talk when you walk into them.

The talk comes up as a picture with everyone in it. The words turn by themselves, or press any key to hurry them. Then you are back in the room, a little further along.

Nothing here hurts you. Coins add to your score. The door at the end of the room takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|EVERYBODY TALKS  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL SAID!

Two rooms, four voices, and every one in turn.

A talk is a picture and a page of words shown together. The picture holds everyone and a bubble for each turn, with the names lettered in. The page holds only the words, with a blank row left for each name.

Open the game in Game-Maker and look at the .TXT and .GIF files of a talk. Change a line, keep it inside its bubble, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Nothing here is meant to hurt you, so how did that happen?

Try again, and take your time reading.
`);

/** Who can speak in a talk. Kit is the player; the others are the three friends. */
export type Speaker = 'kit' | 'pip' | 'moss' | 'dot';
/** One turn of a talk: who speaks, and the words (the picture letters the name; the .TXT holds only the words). */
export type Turn = [Speaker, string];
export type TalkId = 'hello' | 'crowd';

/**
 * The talks, each a list of cards (one picture and one .TXT apiece). A card holds 16 rows of 28
 * letters; each turn takes its words' rows, one row for its name and one blank row, so a long talk
 * runs to a second card.
 */
export const TALKS: Record<TalkId, Turn[][]> = {
  hello: [
    [
      ['kit', 'Hello, Pip!'],
      ['pip', 'Hello, Kit! Nice hat.'],
      ['kit', 'Thanks! Which way is the door?'],
      ['pip', 'Straight on, past the coins.'],
    ],
  ],
  crowd: [
    [
      ['pip', 'Moss! Dot! Look who it is.'],
      ['moss', 'Kit! Just in time. Dot has a riddle.'],
      ['dot', 'What has a lid and a spout, and never goes anywhere?'],
    ],
    [
      ['kit', 'A teapot?'],
      ['dot', 'Yes! Well done, Kit.'],
      ['moss', 'Told you it was a good one.'],
      ['pip', 'The door is on your right.'],
    ],
  ],
};
