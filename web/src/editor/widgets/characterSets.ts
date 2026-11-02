// Character definitions belonging to one CBL, with scene monster resources retained for auditions.
import { ADVTYPE, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { BLEN, CHARBL, TRANSPARENT, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { cdName, normalize, type GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { characterPicture } from './characterPicture';

type Source = Pick<GameFiles, 'get' | 'names'>;
const key = (name: string) => cdName(normalize(name));
export interface CharacterSet {
  file: string;
  bytes: Uint8Array;
  monsters?: string;
  monsterBlocks?: string;
}

export function charactersForBlocks(files: Source, cbl: string): CharacterSet[] {
  const out: CharacterSet[] = [];
  const add = (file: string, monsters?: string, monsterBlocks?: string) => {
    const bytes = files.get(file);
    if (bytes && !out.some((item) => key(item.file) === key(file))) out.push({ file: normalize(file), bytes, monsters, monsterBlocks });
  };
  let bound = false;
  for (const name of files.names().filter((file) => /\.gam$/i.test(file))) {
    try {
      for (const scene of parseGame(files.get(name)!).scenes) {
        if (scene.gametype !== ADVTYPE || key(scene.files[6]) !== key(cbl)) continue;
        bound = true;
        add(scene.files[5], scene.files[3], scene.files[4]);
      }
    } catch {
      /* A damaged integrator does not hide another game's valid bindings. */
    }
  }
  if (!bound) {
    const paired = cbl.replace(/\.[^.]+$/, '.chr');
    if (files.get(paired)) add(paired);
    else if (files.names().filter((file) => /\.cbl$/i.test(file)).length === 1)
      files
        .names()
        .filter((file) => /\.chr$/i.test(file))
        .forEach((file) => add(file));
  }
  return out;
}

/** One native pose, falling back to one visible block when no definition accompanies the set. */
export function characterBlockPicture(files: Source, name: string, bytes: Uint8Array) {
  for (const character of charactersForBlocks(files, name)) {
    const picture = characterPicture(files, character.file, character.bytes, bytes);
    if (picture) return picture;
  }
  const blocks = parseBlocks(bytes, CHARBL);
  const first = blocks.find((block) => block.pixels.some((pixel) => pixel !== TRANSPARENT)) ?? blocks[0];
  return { width: BLEN, height: BLEN, pixels: first.pixels.slice() };
}
