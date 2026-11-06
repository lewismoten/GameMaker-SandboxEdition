// Rain on the Path's DOS pages, wrapped to PLAYGAME's 30-column text screen.
import { wrap } from '../../kit/starter/text';
import about from '../about.json';
export const STORY = wrap(`
|RAIN ON THE PATH

Rain falls on a little path. It is only pictures: four blocks turning into one another.

First the rain falls in rows. Different starts of that loop scatter it. Then watch drops splash on the ground and rings spread over puddles.

Go through the door and see the same path in darker storm colors.

Read the signs, then edit a copy and make some weather.
`);
export const HOWTO = wrap(`
|HOW TO PLAY

|LEFT, RIGHT   walk
|SPACE         jump

Nothing here hurts. Walk to the door to go on. You can stop anywhere to watch the rain.

1. Falling rain: rows, then scattered drops.
2. Splashes and puddles.
3. The same puddle map in a darker palette.

|ESC for the menu.
`);
export const CREDITS = wrap(`
|RAIN ON THE PATH v${about.version}
|(c) 1994 Sandbox Software

New design, rain pixels, text, code and original FM music: Hermes, OpenAI Codex GPT-6.1 Sol, by OpenAI.

Shared Starter art and tools by this project's earlier contributors (see NOTICE).

Built with GAME-MAKER 3.0 from Recreational Software Designs.

Made in 2026 by Lewis Moten with AI help. Free to share: see LICENSE.TXT on the disk.
`);
export const WON = wrap(`
|RAIN OR SHINE

Rain is a loop of pictures. Every copy of a block shares its clock. Starting neighboring cells at different pictures scatters the drops.

Splashes and puddles are more loops. They do not detect drops or feet. The storm scene loads the same map and blocks with another palette.

For more, see Twinkle, Twinkle, Waves on the Shore, Day and Night, and Under the Surface.

Now edit a copy and try it.
`);
export const LOST = wrap(`
|TRY AGAIN

Nothing on this path hurts. Take your time, read the signs, and walk to the door.
`);
