// Rain on the Path's DOS pages, wrapped to PLAYGAME's 30-column text screen.
import { wrap } from '../../kit/starter/text';
import about from '../about.json';
export const STORY = wrap(`
|RAIN ON THE PATH

Rain falls on a little path. It is only pictures: four blocks turning into one another.

First the rain falls in rows. Different starts of that loop scatter it. Then watch drops splash on the ground, on a roof and into a rain barrel, and rings spread over puddles. Step in a puddle and it splashes.

Go through the door and see the same path in darker storm colors.

Read the signs, then edit a copy and make some weather.
`);
export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump

Nothing here hurts. Walk to the door to go on. You can stop anywhere to watch the rain.

1. Falling rain: rows, then scattered drops.
2. Splashes, a house and puddles to step in.
3. The same puddle map in a darker palette.

|ESC for the menu.
`);
export const CREDITS = wrap(`
|RAIN ON THE PATH v${about.version}
|(c) 1994 Sandbox Software

New design, rain pixels, text, code and original FM music: Hermes, OpenAI Codex GPT-6.1 Sol, by OpenAI.

Finer rain, the house and its rain barrel, stepping splashes and the splash sound: Claude Sonnet 5.5, by Anthropic.

Shared Starter art and tools by this project's earlier contributors (see NOTICE).

Built with GAME-MAKER 3.0 from Recreational Software Designs.

Made in 2026 by Lewis Moten with AI help. Free to share: see LICENSE.TXT on the disk.
`);
export const WON = wrap(`
|RAIN OR SHINE

Rain is a loop of pictures. Every copy of a block shares its clock. Starting neighboring cells at different pictures scatters the drops.

Splashes, the roof and the spout are more loops. A puddle's splash is touch blocks: each step swaps in the next picture, and its point plays the splash sound. The storm scene loads the same map and blocks with another palette.

For more, see Twinkle, Twinkle, Waves on the Shore, Day and Night, and Under the Surface.

Now edit a copy and try it.
`);
export const LOST = wrap(`
|TRY AGAIN

Nothing on this path hurts. Take your time, read the signs, and walk to the door.
`);
