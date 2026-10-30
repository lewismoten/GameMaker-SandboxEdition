// A character thumbnail uses its scene's CBL and the same per-half orientation as PLAYGAME.
import { ADVTYPE, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { CHARBL, MONBL, BLEN, TRANSPARENT, orientIndex, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { cdName, normalize, type GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';

type Source = Pick<GameFiles, 'get' | 'names'>;
const key = (name: string) => cdName(normalize(name));

function characterBlocks(files: Source, name: string): Uint8Array | undefined {
  for (const gam of files.names().filter((file) => /\.gam$/i.test(file))) {
    try {
      for (const scene of parseGame(files.get(gam)!).scenes) {
        if (scene.gametype !== ADVTYPE || key(scene.files[5]) !== key(name)) continue;
        const blocks = files.get(scene.files[6]);
        if (blocks) return blocks;
      }
    } catch {
      /* A damaged game file need not hide an otherwise usable character. */
    }
  }
  const paired = files.get(name.replace(/\.[^.]+$/, '.cbl'));
  if (paired) return paired;
  const candidates = files.names().filter((file) => /\.cbl$/i.test(file));
  return candidates.length === 1 ? files.get(candidates[0]) : undefined;
}

export function characterPicture(files: Source, name: string, characterBytes?: Uint8Array): { width: number; height: number; pixels: Uint8Array } | undefined {
  try {
    const bytes = characterBytes ?? files.get(name);
    const cbl = characterBlocks(files, name);
    if (!bytes || !cbl) return undefined;
    const character = parseCharacter(bytes);
    const blocks = parseBlocks(cbl, CHARBL);
    // Idle first, then movement; an unset idle must not make an otherwise visible hero an emoji.
    const sequences = [character.sequences[0], ...character.sequences.slice(5), ...character.sequences.slice(1, 5)];
    for (const sequence of sequences)
      for (const frame of sequence.frames) {
        if (frame.pic2 === CHARBL + 1) break;
        if (frame.pic2 === MONBL) continue; // monster-birth command, not an image
        const halves = [
          [frame.pic1, frame.orient & 15],
          [frame.pic2, frame.orient >> 4],
        ].filter(([index]) => index < CHARBL && blocks[index]?.pixels.some((pixel) => pixel !== TRANSPARENT));
        if (!halves.length) continue;
        const pixels = new Uint8Array(BLEN * BLEN * halves.length).fill(TRANSPARENT);
        halves.forEach(([index, orientation], half) => {
          for (let y = 0; y < BLEN; y++)
            for (let x = 0; x < BLEN; x++) pixels[(half * BLEN + y) * BLEN + x] = blocks[index].pixels[orientIndex(orientation, x, y)];
        });
        return { width: BLEN, height: BLEN * halves.length, pixels };
      }
  } catch {
    /* An unreadable character remains selectable with its ordinary fallback. */
  }
  return undefined;
}
