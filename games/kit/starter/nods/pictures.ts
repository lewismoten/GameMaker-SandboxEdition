// Shared sky backgrounds, ink and outlines for arrival lesson art.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { skyOf } from '../palette';
import { skyBlock } from '../graduationArriveArt';
import type { NodCtx } from './types';

export const ink = (c: NodCtx) => c.pal.c('ink', 0);
export const sky = (c: NodCtx) => skyBlock(c.pal);
/** A picture with a dark outline on the sky. */
export const lined = (c: NodCtx, p: Pixels): Pixels => outline(p, ink(c), { transparent: skyOf(c.pal) });
