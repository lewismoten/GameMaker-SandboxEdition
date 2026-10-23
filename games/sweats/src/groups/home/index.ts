// HOME SWEET HOME: the third set, the monologues of the house. One block set (HOME.BBL) and one
// monster block set (HOME.MBL) for all of them; each monologue adds its own blocks and sprites
// in its turn (the order is part of the file format: a block's number is the order it was added).
import type { Group } from '../types';
import { blanket, blanketBlocks, blanketSprites } from './blanket';
import { socks, socksBlocks, socksSprites } from './socks';
import { pizza, pizzaBlocks, pizzaSprites } from './pizza';
import { itch, itchBlocks, itchSprites } from './itch';
import { dbltap, dbltapBlocks, dbltapSprites } from './dbltap';
import { HOME_RAMPS, buildHouse, houseSprites } from './house';

export const home: Group = {
  id: 'home',
  name: 'Home Sweet Home',
  ramps: HOME_RAMPS,
  blocks: (book, pal) => {
    buildHouse(book, pal);
    blanketBlocks(book, pal);
    socksBlocks(book, pal);
    pizzaBlocks(book, pal);
    itchBlocks(book, pal);
    dbltapBlocks(book, pal);
  },
  sprites: (book, pal) => {
    houseSprites(book, pal);
    blanketSprites(book, pal);
    socksSprites(book, pal);
    pizzaSprites(book, pal);
    itchSprites(book, pal);
    dbltapSprites(book, pal);
  },
  monologues: [blanket, socks, pizza, itch, dbltap],
};
