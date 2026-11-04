// Every word SAY SOMETHING shows on a text page (30 columns, 16 lines a page), and the words
// the three friends say.
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SAY SOMETHING

Words can live in a game in three places.

A small explorer in a teal beanie crosses two short rooms. On the way he reads boards, and he walks right into three friends who have something to say.

A board is a picture of words. A friend is a picture too, and a touch on a friend opens a page of words. Walk up and see.

Then open this game in Game-Maker and change what they say.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|ANY KEY       turn a page
|F2            lives, score

Read the boards as you pass them. A friend with a speech bubble over their head will talk when you walk into them.

Their words come up on a page of their own. They turn by themselves, or press any key to hurry them. Then you are back in the room, a little further along.

Nothing here hurts you. Coins add to your score. The door at the end of the room takes you on.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SAY SOMETHING  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL SAID!

Two rooms, three friends, and plenty to read.

A board is a few blocks with words drawn into their pictures. A friend is a block too; a link on it sends you to a scene whose only job is to show a picture and a page of words, and then sends you back.

Open the game in Game-Maker and look at the scenes editor, and at the .TXT files beside the map. Change a friend's words, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Nothing here is meant to hurt you, so how did that happen?

Try again, and take your time reading.
`);

/** What each friend says on the picture before their page: one short line, which must fit a speech bubble (18 letters wide). */
export const BUBBLE_LINES: Record<'pip' | 'moss' | 'dot', string[]> = {
  pip: ['HELLO, KIT!'],
  moss: ['AH, KIT!', 'SIT A WHILE.'],
  dot: ['PSST, KIT!'],
};

/** What each friend says: one text file (a page) each, in order. A friend's pages are separate .TXT files in the talk's slide list. */
export const SAYS: Record<'pip' | 'moss' | 'dot', string[]> = {
  pip: [
    wrap(`
|PIP SAYS

Hello, Kit! Nice hat.

This page is a plain text file. Whoever builds the game picks the words, and the game shows them on a page of their own.

It has 30 characters across and 16 lines down. Longer talks turn to a second page.

Now off you go. The door is just past the coins.
`),
  ],
  moss: [
    wrap(`
|MOSS SAYS

Ah, Kit. Come in, come in.

I have a longer story than most, so it runs on to a second page. A talk can be as long as you like: it is just a list of pages.

When I was a small hedge-trimmer, I once clipped a bush into the shape of a very large teapot.
`),
    wrap(`
|MOSS SAYS, PAGE 2

People came from three valleys to look at that teapot.

It rained that night, and the teapot grew a hat of moss. That is how I got my name.

Off you go, Kit. Dot is up ahead and has a word for you, too.
`),
  ],
  dot: [
    wrap(`
|DOT SAYS

Hi, Kit! Short and sweet: the door is on your right.
`),
  ],
};
