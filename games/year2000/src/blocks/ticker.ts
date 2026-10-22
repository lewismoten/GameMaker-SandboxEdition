// The Skyway News Feed: an LED news zipper over the Information Superhighway that scrolls
// its headlines forever, with no code at all.
//
// Game-Maker animates a block NUMBER: every square showing block "tick0" changes to
// "tick1" at the same moment, wherever it is on the map. So the headlines are cut into a
// ring of 20x20 frames, each frame 10 pixels further along the text than the one before,
// chained next -> next back to the start. Square i of the sign starts on frame 2i (20
// pixels on), so the squares show neighboring windows of the ring, and as the chain turns
// over, the whole sign slides left 10 pixels a step.
import { Pixels } from '../../../kit/pixels';
import { BlockSet, SOLID } from './book';
import { micro } from '../art/font';
import { C } from '../art/pal';

/** One trip round the ring; padded with spaces to TICKER_FRAMES * STEP pixels. */
export const HEADLINES = 'GOPHER STILL BEATS THE WEB * Y2K BUG: A NO-SHOW * AMERICA 250 IN 2026! * ';
const STEP = 10;
export const TICKER_FRAMES = 30;
const RING = TICKER_FRAMES * STEP;

/** The whole ring of text, drawn twice so any 20-pixel window can be cut from it. */
function ring(base: () => Pixels): Pixels {
  if (HEADLINES.length * 4 > RING) throw new Error(`Headlines are ${HEADLINES.length * 4}px, the ring ${RING}px`);
  const p = new Pixels(RING + 20, 20);
  for (let x = 0; x < p.w; x += 20) p.blit(base(), x, 0);
  // The sign's housing: chrome rails above and below a black LED panel with its dot grid.
  p.rect(0, 3, p.w, 2, C('chrome', 6)).rect(0, 15, p.w, 2, C('chrome', 2));
  p.rect(0, 5, p.w, 10, C('night', 0));
  for (let y = 6; y < 14; y += 2) for (let x = 0; x < p.w; x += 2) p.set(x, y, C('night', 2));
  for (const x0 of [0, RING]) micro(p, x0 + 1, 7, HEADLINES, C('orange', 4));
  return p;
}

/** Adds tick0..tick(N-1); square i of the sign is laid as tick(2i mod N). */
export function addTicker(s: BlockSet, base: () => Pixels, ntime = 4): void {
  const r = ring(base);
  for (let k = 0; k < TICKER_FRAMES; k++) s.add(`tick${k}`, r.crop(k * STEP, 0, 20, 20), { solid: SOLID, next: `tick${(k + 1) % TICKER_FRAMES}`, ntime });
}

/** The block for square i of a sign laid left to right. */
export const tickerSquare = (i: number) => `tick${(i * (20 / STEP)) % TICKER_FRAMES}`;
