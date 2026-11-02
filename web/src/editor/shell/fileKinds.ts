// The workspace’s native asset categories, creation choices and short explanations.
import type { FileKind } from '../core/project';

export const FILE_ORDER: FileKind[] = [
  'gam',
  'pal',
  'bbl',
  'mbl',
  'cbl',
  'mon',
  'chr',
  'map',
  'snd',
  'gif',
  'fli',
  'bkd',
  'txt',
  'lst',
  'cmf',
  'voc',
  'rec',
  'his',
  'other',
];
/** The kinds always listed and offered in "Add a file" (4 x 4). */
export const ADD_KINDS: FileKind[] = ['pal', 'bbl', 'mbl', 'cbl', 'mon', 'chr', 'map', 'snd', 'gif', 'fli', 'cmf', 'voc', 'txt', 'lst', 'bkd', 'rec'];
export const FILE_KIND_HELP: Partial<Record<FileKind, string>> = {
  pal: '256 colors to paint with',
  bbl: 'the scenery, 150 blocks',
  mbl: 'monster pictures, 100 blocks',
  cbl: 'hero pictures, 50 blocks',
  mon: '64 monsters and how they move',
  chr: 'the hero: moves, keys, items',
  map: 'a 100x100 level',
  snd: '30 sound effects',
  gif: 'a 320x200 picture',
  fli: 'an animation',
  cmf: 'Sound Blaster music',
  voc: 'a Sound Blaster sound',
  txt: 'words on screen',
  lst: 'pictures one after another',
  bkd: 'part of a big picture',
  rec: 'a recorded demo',
};
