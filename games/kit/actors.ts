// Filling in the games' character and monster files: a character sequence's frames and settings,
// a monster with its picture sequence, a path corner, and pacing back and forth.
import { emptyFrame, type Frame, type Sequence } from '../../web/src/formats/character';
import { emptyMonster, type March, type Monster } from '../../web/src/formats/monster';

export function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  if (frames.length > 10) throw new Error('Too many frames');
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, { sound: 255, jstkBut: 4, jstkMov: 0, ...o });
}

export function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  path.forEach((c, i) => (m.march[0][i] = c));
  return m;
}

export const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

/** Back and forth `run` blocks (to the right first) at `speed`, facing the way it goes. */
export const pace = (run: number, speed: number, dy = 0): March[] => [corner(0, 0, speed), corner(run, dy, speed, 0), corner(0, 0, speed, 4)];
