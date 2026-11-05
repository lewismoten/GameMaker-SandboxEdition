// Every word CUTSCENES shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|CUTSCENES

Some scenes are only for watching.

A small explorer in a teal beanie has two short rooms. The first is a scene that shows a picture, some words, and then a stage that lets him go by itself. The second is a room of doors, and each door leads to a scene of its own.

Read, wait, and pick a door.

Then open this game in Game-Maker and put your own pictures and words in.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Level 1 starts with a picture and some words, which go by themselves (a key turns the page sooner). Then wait on the stage: the floor flashes and drops you on a mat, which takes you on.

Level 2 is a room with three doors. Walk into one to watch its tale, or into the last to end the game.

Nothing here hurts you.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|CUTSCENES  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

/** Tale one's words, shown over its picture before the stage. */
export const TALE_ONE = wrap(`
|THE PAPER BOAT

Mara folded a paper boat on the kitchen table and carried it to the garden pond.

It sailed once round the lily pad and came back to the bank, as if it knew the way.

Mara took a bow. The frogs did not clap, but they did not leave, either.
`);

/** Tale two's words. */
export const TALE_TWO = wrap(`
|THE LONG WAY ROUND

Mara set out to walk to the hill, and the path went left, and then right, and then left again.

By the time he got there the sun was up and the grass was warm.

It was the longest way round, and the best one.
`);

/** Level 1's opening words, shown over its picture. */
export const SCENE_ONE = wrap(`
|THE SCENE BEGINS

This is a scene. A picture came up first, and these are its words.

The words go by themselves, or a key turns the page. Then comes a stage. Nothing there needs a key: the floor drops away after a few seconds and the scene moves on by itself.
`);

export const WON = wrap(`
|THE END

Two rooms, three scenes.

A scene can show a picture and words before it, with a list in its intro slot. A room can end by itself with a floor that drops onto a link. And a room with doors is a menu: each door is a link to a scene.

Game-Maker has no skip key for a stage. A room is only left through a link, so to let a player skip, a key press would have to walk the hero onto one.

Open the game in Game-Maker, look at the Scenes tab, and send a door somewhere new.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game hurts, so this one is hard to do!

Try again: read, wait, and pick a door.
`);
