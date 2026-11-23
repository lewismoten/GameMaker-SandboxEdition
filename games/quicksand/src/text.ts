// Every word QUICKSAND shows on a text page (30 columns, 16 lines a page).
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';
import { linksOf } from './levels';

export const STORY = wrap(`
|QUICKSAND

Some sand is soft.

A small explorer in a red beanie has two short rooms. In the first, a patch of sand ripples under her feet if she stands still, and then gives way. In the second, stepping stones cross a wide patch, and dark wet sand gives way sooner.

Keep your feet moving. Rest on a stone.

Then open this game in Game-Maker and change how fast the sand sinks.
`);

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump
|F2            lives, score

Keep walking and the sand holds. Stand still and it ripples, then gives way. Hold RIGHT, then hold SPACE until you clear the edge of the hole.

Gray stones never sink. Dark wet sand sinks faster than dry sand.

Coins add to your score.

|ESC for the menu.
`);

export const CREDITS = withCreditPage(
  wrap(`
|QUICKSAND  v${about.version}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.

Held-rise jump, bot timing and raised level openings by OpenAI Codex (GPT-6.1 Sol), directed by Lewis Moten.

Mapped micro plaques by Hermes Agent using OpenAI Codex GPT-6.1 Sol, directed by Lewis Moten.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

One of the Starters: small games that each show one idea.
`),
);

export const WON = wrap(`
|MADE IT!

Two rooms of sand that sinks.

Each block of sand is a chain of blocks. Touch one and it turns into the next. Standing on a block touches it about 18 times a second, so it runs down the chain and the last one is a hole. Walking past touches it only a few times.

Dry sand has ${linksOf('sand')} blocks in its chain. Wet sand has ${linksOf('wet')}, so it gives way sooner.

Open the game in Game-Maker, pick a sand block in the Blocks tab and look at what it turns into when touched. Make the chain shorter, then play your change.
`);

export const LOST = wrap(`
|OH NO!

Out of lives. Nothing in this game can cost a life, so this one is hard to do!

Try again: keep your feet moving.
`);
