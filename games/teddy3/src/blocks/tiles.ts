// Background block art shared by the levels: skies, ground, wood, brick, fences.
// The finale shares the sequel's file as it is (games/teddy2/src/blocks/tiles.ts), but its
// color lookups r() and c() read this game's palette, which adds the finale's new ramps.
import { P } from '../art/pal';

export * from '../../../teddy2/src/blocks/tiles';
export const r = (name: string) => P.r(name);
export const c = (name: string, k: number) => P.c(name, k);
