// PIP.CBL and PIP.CHR: Pip's pictures and his character file.
import { heroPics } from '../sprites/hero';
import { SpriteSheet } from '../sprites/sheet';
import { buildPip } from '../characters/pip';
import { chezPics } from '../sprites/chezCar';
import { buildChez } from '../characters/chez';

export function buildCast() {
  const cb = new SpriteSheet('cbl');
  for (const [name, pic] of heroPics()) cb.add(name, pic);
  for (const [name, pic] of chezPics()) cb.add(name, pic);
  const pip = buildPip(cb);
  const chez = buildChez(cb);
  return { cb, pip, chez };
}
export type Cast = ReturnType<typeof buildCast>;
