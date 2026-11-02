// What the floppy picture is made from, read out of a game's files: the plastic is color 255 of
// the first palette that is not one solid color (the fade-to-black palettes are skipped), the
// label's picture is the title scene's first picture, and the hero is the player's character
// block (the same picture the character editor and Overview show).
import { ADVTYPE, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { isSolidPalette } from '../core/readablePalette';
import { characterPicture } from '../widgets/characterPicture';
import { pictureScreen } from '../widgets/mediaPictures';
import type { GameFiles } from '../../project/files';
import type { FloppyArt } from './floppy';

const SCREEN = { width: 320, height: 200 };

/** The first palette (in scene order) with more than one color, as raw .pal bytes. */
export function firstRealPalette(files: GameFiles, gam: string): Uint8Array | undefined {
  for (const s of parseGame(files.get(gam)!).scenes) {
    if (s.gametype !== ADVTYPE) continue;
    const bytes = files.get(s.files[0]);
    if (bytes && bytes.length >= 768 && !isSolidPalette(bytes)) return bytes;
  }
  return undefined;
}

/** The first picture the title scene shows: a picture file, or the first of a slide show's. */
function titlePicture(files: GameFiles, gam: string): FloppyArt['picture'] {
  const title = parseGame(files.get(gam)!).scenes[0];
  const names: string[] = [];
  for (const f of title.files) {
    const n = files.resolve(f);
    if (!n) continue;
    if (n.endsWith('.lst')) for (const e of parseSlideList(files.get(n)!)) names.push(e.name);
    else names.push(n);
  }
  // a still picture before an animation (a studio logo often plays first)
  for (const kind of [/\.(gif|bkd)$/, /\.fli$/])
    for (const n of names) {
      const pic = kind.test(n) ? pictureScreen(files, n) : undefined;
      if (pic) return { ...SCREEN, pixels: pic.pixels, palette: pic.palette };
    }
  return undefined;
}

export function floppyArt(files: GameFiles, gam: string, title: string): FloppyArt {
  const pal = firstRealPalette(files, gam);
  const plastic: FloppyArt['plastic'] = pal ? [vga8(pal[765]), vga8(pal[766]), vga8(pal[767])] : [200, 196, 184];
  const art: FloppyArt = { plastic, title: title.toUpperCase() };
  try {
    art.picture = titlePicture(files, gam);
  } catch {
    /* a title screen that can't be read leaves the label plain */
  }
  const scene = parseGame(files.get(gam)!).scenes.find((s) => s.gametype === ADVTYPE && files.has(s.files[5]));
  if (scene && pal) {
    const hero = characterPicture(files, scene.files[5], files.get(scene.files[5]), files.get(scene.files[6]));
    if (hero) art.hero = { ...hero, palette: files.get(scene.files[0]) && !isSolidPalette(files.get(scene.files[0])!) ? files.get(scene.files[0])! : pal };
  }
  return art;
}
