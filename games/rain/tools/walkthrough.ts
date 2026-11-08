// Writes the playable regression fixture from the real headless engine, with one chapter per scene.
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';
const { sim } = await play(SEED);
await writeSimWalkthrough('rain', sim, SEED, {
  2: 'Falling Rain: rows, then scattered drops',
  3: 'Splashes and rippling puddles',
  4: 'The same map in storm colors',
});
