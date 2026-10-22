// The two egg cupboards. Each is a scene of its own, so its intro picture is the egg's own
// page (what it is, and its credits): the compost crock off the Larder, behind the counters
// nobody can reach (lean on the wall), and Ebenezer's display case off the Vault, behind the
// sign that says THIRTEEN OF SOMETHING. Pick the egg up (Enter) and keep it: it goes in the
// save, and the desk's egg display reads it from there.
import type { RoomSpec } from '../room';
import { EGG_SCENE } from '../../ids';

export const ROTTEN: RoomSpec = {
  file: 'crock',
  level: 2,
  cupboard: { scene: EGG_SCENE.rotten, back: [5, 14] },
  name: 'The Compost Crock',
  style: 'cellar',
  theme: 'larder',
  ingredient: 2,
  song: 'larder',
  card: [],
  rows: [
    '##########',
    '#B..H...B#',
    '#O.@...q.#',
    '#B......B#',
    '##########',
  ],
};

export const FABERGE: RoomSpec = {
  file: 'display',
  level: 13,
  cupboard: { scene: EGG_SCENE.faberge, back: [15, 3] },
  name: "Ebenezer's Display Case",
  style: 'works',
  theme: 'vault',
  ingredient: 13,
  song: 'hidey',
  card: [],
  rows: [
    '############',
    '#K....,,,.K#',
    '#O.@..,f,..#',
    '#K....,.,.K#',
    '############',
  ],
};
