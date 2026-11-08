// The words every graduation game shows on its text pages (30 columns, 16 lines a page): how to play, the
// credits and the lost page are the same in each; a game brings its own story and win pages.
import { withCreditPage } from '../license';
import { wrap } from './text';

export { wrap };

export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk

That is all. There is nothing to fight and nothing that hurts, and you cannot lose.

Your honors are rolled up on the lectern, on the stage. Walk into them.

|ESC for the menu.
`);

/** The credits page: `title` is "GRADUATION: FIRST STEPS", `note` the last line ("A graduation: it comes after The Basics."). */
export const creditsPage = (title: string, version: string, note: string): string =>
  withCreditPage(
    wrap(`
${title.length + version.length + 4 <= 30 ? `|${title}  v${version}` : `|${title.replace(': ', '\n|')}  v${version}`}
|(c) 1994 Sandbox Software

Design, pixels, beeps and levels by Claude Sonnet 5.5, an AI model made by Anthropic.
Music: OpenAI Codex.

Made with GAME-MAKER 3.0 from Recreational Software Designs.

${note}
`),
  );

export const LOST = wrap(`
|OOPS!

Nothing here can hurt you, so this page is only here in case.

Try again: walk up the carpet.
`);
