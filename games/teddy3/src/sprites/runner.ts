// Teddy on the dream run: his side-view poses from the sequel (sprites/teddy.ts) put into a
// rabbit hop on the spot, facing right. Tuck (legs together, a pixel low), spring (stretched
// out, up off the ground), land (legs apart). The art is the sequel's, only moved up or down
// inside its block, so his face and ears stay exactly as they are everywhere else.
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from '../art/draw';
import { POSES } from './teddy';

/** A pose moved `dy` pixels down (negative: up) inside its block. */
function moved(src: Pixels, dy: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.blit(src, 0, dy, CLEAR);
  return p;
}

/** The hop on the spot, in the order it plays. */
export const BUNNY: Record<string, Pixels> = {
  bunnyTuck: moved(POSES.walk2, 1),
  bunnySpring: moved(POSES.hop, -1),
  bunnyLand: POSES.walk1,
};

/** The ticks each picture of the hop shows. */
export const HOP_CYCLE: [string, number][] = [
  ['bunnyTuck', 2],
  ['bunnySpring', 2],
  ['hop', 1],
  ['bunnyLand', 2],
];
