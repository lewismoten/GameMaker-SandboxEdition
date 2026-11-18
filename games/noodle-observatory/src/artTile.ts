// Shared 20x20 tile canvas: copy the backdrop or start transparent.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

export const T = 255;

export const tile = (bg?: Pixels): Pixels => (bg ? new Pixels(20, 20).blit(bg, 0, 0) : new Pixels(20, 20, T));
