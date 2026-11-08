// The Starter hero's walk, jump and climb as a character file, for tests (the same frames as
// games/kit/starter/heroChar.ts). No DOM.
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';

const f = (x: number, y: number, pause = 1): Frame => ({ ...emptyFrame(), x, y, pic1: CHARBL, pic2: 1, pause });

export function starterHero(): Character {
  const ch = newCharacter();
  const set = (i: number, key: number, frames: Frame[], o: { momentum?: number } = {}) => {
    Object.assign(ch.sequences[i], { key, momentum: o.momentum ?? 0 });
    frames.forEach((fr, k) => (ch.sequences[i].frames[k] = fr));
  };
  set(5, 0x4d00, [f(4, 0), f(4, 0), f(4, 0), f(4, 0)]);
  set(6, 0x4b00, [f(-4, 0), f(-4, 0), f(-4, 0), f(-4, 0)]);
  set(7, 0x4800, [f(0, -4, 2), f(0, -4, 2)]);
  set(8, 0x5000, [f(0, 4, 2), f(0, 4, 2)]);
  set(9, 0x3920, [f(0, -12, 2), f(0, 0, 2), f(0, 0, 2)], { momentum: 1 });
  return ch;
}
