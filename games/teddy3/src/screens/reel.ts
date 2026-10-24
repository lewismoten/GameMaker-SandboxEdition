// What the finale's cartoons (FLIs) are built with: a reel of frames over a background, its
// captions in the Club's lettering, and the big pictures of the cast drawn from their sprites.
import { encodeFli } from '../../../../web/src/formats/fli';
import { Pixels } from '../../../kit/pixels';
import { centered, clubArt, scaleBlit } from '../art/draw';
import { POSES } from '../sprites/teddy';
import { GWINN } from '../sprites/gwinn';
import { LEO } from '../sprites/leo';
import { SP } from './screens';

export const W = 320;
export const H = 200;
export const c = (n: string, k: number) => SP.c(n, k);

export class Reel {
  frames: Uint8Array[] = [];
  constructor(private bg: Pixels) {}
  /** A new frame over the background; `draw` adds the actors. */
  frame(draw: (p: Pixels) => void, hold = 1): void {
    const p = new Pixels(W, H);
    p.px.set(this.bg.px);
    draw(p);
    for (let i = 0; i < hold; i++) this.frames.push(Uint8Array.from(p.px));
  }
  /** Changes the background for the frames after this. */
  scene(bg: Pixels): void {
    this.bg = bg;
  }
  fli(speed: number): Uint8Array {
    return encodeFli(this.frames, SP.pal, { speed });
  }
}

/** A line of words, white on a black edge, centered (two lines: y 10 and 22). */
export const caption = (p: Pixels, words: string, y = 10, col = c('paint', 3)) => {
  if (words.length > 38) throw new Error(`Caption over 38 columns: "${words}"`);
  centered(p, y, clubArt(words), col, 1, c('ink', 0));
};

export const teddyAt = (p: Pixels, pose: string, x: number, y: number, s = 3, flip = false) => scaleBlit(p, POSES[pose], x, y, s, flip);
export const gwinnAt = (p: Pixels, pose: string, x: number, y: number, s = 3, flip = false) => scaleBlit(p, GWINN[pose], x, y, s, flip);
/** The finale's Doc Leo (fedora, glasses, white patches, sunburned nose: no clown nose). */
export const leoAt = (p: Pixels, pose: string, x: number, y: number, s = 2, flip = false) => scaleBlit(p, LEO[pose], x, y, s, flip);
