// Every word SOUNDS AND MUSIC shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SOUNDS AND MUSIC

A game you can hear is a game that feels alive.

A small explorer in a gold beanie has three short rooms to cross. The first plays one song, the second plays another, and the third is quiet. Coins, bags, hearts and spikes each make a sound of their own.

Read the signs, and listen.

Then open this game in Game-Maker and change a song or a beep.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            your numbers

Listen as you go. A room's song starts when the room loads. A pickup, a hurt and a jump each make a sound.

A spike takes 10 hit points, and only once. A heart gives 10 back.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|SOUNDS AND MUSIC  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps, songs and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|WELL HEARD!

Three rooms, and now you know what each one sounds like.

A scene names one song, and it plays from the start whenever the scene loads. Leave the song blank and the room is quiet. Sounds come from a sound set: a pickup plays the one for its counter, and a character's moves can play any of 30. Only one plays at a time.

Open the game in Game-Maker and find them in the Scenes and Sounds tabs. Change a song, then play your change.
`);

export const LOST = wrap(`
|OOPS!

Out of lives.

Try again: listen for the spike's sound, take the hearts, and keep an eye on F2.

`);
