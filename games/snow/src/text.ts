// Snow Trails's DOS text pages; shared Starter typography and credits.
import { withCreditPage } from '../../kit/license';
import { wrap } from '../../kit/starter/text';
import about from '../about.json';

export const STORY = wrap(`
|SNOW TRAILS

A quiet path after snowfall.

Watch the flakes sway. Walk through the fresh powder, then look behind you. Hop over some and compare the gap.

On the next walk, a low snow drift grows in three steps. The floor stays put: only the picture changes.

Read the signs. Then open the blocks and make your own snow.
`);
export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump

Walk into the door to go on. Nothing here hurts you.

Walking in powder stamps a pair of bootprints. Jumping can leave gaps. Walk back to see your trail.

The second drift grows in a few seconds. You need not wait to leave.

|ESC for the menu.
`);
export const CREDITS = withCreditPage(
  wrap(`
|SNOW TRAILS v${about.version}
|(c) 1994 Sandbox Software

New design, snow pixels, words and code: Hermes Agent, OpenAI GPT-6.1 Sol, directed by Lewis Moten.

Hero, signs, screens and sounds: the shared Starter kit, made with Claude (Anthropic).

Music: the public-domain French tune Ah! vous dirai-je, maman (1761), using Twinkle, Twinkle's arrangement by Claude Sonnet 5.5.

Made with GAME-MAKER 3.0 from Recreational Software Designs.
`),
);
export const WON = wrap(`
|A TRAIL IN THE SNOW

Falling flakes: a loop of pictures.
Growing drifts: timed pictures that stop at the last one.
Footprints: only the tile you touch changes.

The snow does not really pile up or remember each foot. The floor stays level and each touched tile gets the same pair of bootprints.

Start a new game for fresh snow. Open the game in Game-Maker and change one block at a time.
`);
export const LOST = wrap(`
|TRY AGAIN

Take your time. The path is safe.
`);
