// PIP.CBL and PIP.CHR: Pip's pictures and his character file.
import { heroPics } from '../sprites/hero';
import { SpriteSheet } from '../sprites/sheet';
import { buildPip } from '../characters/pip';

export function buildCast() {
  const cb = new SpriteSheet('cbl');
  for (const [name, pic] of heroPics()) cb.add(name, pic);
  const pip = buildPip(cb);
  return { cb, pip };
}
export type Cast = ReturnType<typeof buildCast>;
