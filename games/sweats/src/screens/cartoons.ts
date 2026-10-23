// The cartoons (placeholder).
import { Pixels } from '../../../kit/pixels';
import { Reel } from '../../../kit/reel';
import { centered } from '../../../snowbound/src/art/font';
import { H, W } from '../../../snowbound/src/screens/scenery';
import type { CardView } from './art';
import { buildScreenPalette } from './palette';

export interface Cast {
  poet: Map<string, Pixels>;
  mons: Map<string, Pixels>;
}

export const SPEED = 6;

function plain(words: string, pal = buildScreenPalette()): Uint8Array {
  const p = new Pixels(W, H, pal.c('dark', 0));
  centered(p, 92, words, pal.c('gold', 3), 2);
  return new Reel(pal.pal).fadeIn(p, 3).add(p, 6).fli(SPEED);
}

export function coverFli(cast: Cast): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const pal = buildScreenPalette();
  const p = new Pixels(W, H, pal.c('dark', 0));
  centered(p, 80, 'SHAKESPEARE', pal.c('gold', 3), 2);
  centered(p, 104, 'IN SWEATPANTS', pal.c('gold', 3), 2);
  void cast;
  return { fli: new Reel(pal.pal).fadeIn(p, 3).fli(SPEED), title: p, pal: pal.pal };
}
export const storyFli = (cast: Cast) => (void cast, plain('OPEN MIC NIGHT'));
export const howtoFli = (cast: Cast) => (void cast, plain('HOW TO PLAY'));
export const interFli = (k: number, cast: Cast) => (void cast, plain(`INTERMISSION ${k}`));
export const bravoFli = (cast: Cast) => (void cast, plain('BRAVO!'));
export const lostFli = (cast: Cast) => (void cast, plain('CURTAIN'));
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  void cast;
  return { 'won1.fli': plain('THE END') };
}
export function cardFli(card: CardView, cast: Cast): Uint8Array {
  void cast;
  const pal = card.pal;
  const p = new Pixels(W, H, pal.c('ink', 0));
  p.blit(card.map, 0, 54);
  centered(p, 20, card.def.monologue!.title.toUpperCase().slice(0, 38), pal.c('gold', 3));
  return new Reel(pal.pal).fadeIn(p, 3).add(p, 6).fli(SPEED);
}
