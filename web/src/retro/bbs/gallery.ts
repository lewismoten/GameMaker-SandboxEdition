// The GIF Gallery file area on THE -= S A N D B O X =- BBS: the SysOp's snapshots, made by
// web/scripts/bbsGifs.ts into web/public/bbs (sizes in gallery.json). Downloaded GIFs land
// in C:\DOWNLOAD, where VPIC shows them again (retro/view/vpic.ts).
import list from './gallery.json';
import { partialPixels, type PartialGif } from '../../formats/gifProgressive';
import { nearestColor, placeIn, type PictureScreen } from '../view/picture';

export interface GalleryFile {
  /** 8.3 name, e.g. TEDDY.GIF */
  name: string;
  bytes: number;
  width: number;
  height: number;
  colors: number;
  desc: string;
}

const DESC: Record<string, string> = {
  'TEDDY.GIF': "Teddy the corgi, all ears and smiles. The SysOp's best buddy.",
  'GWINN.GIF': 'Teddy and his pal Gwinn in the grass. Two very good dogs.',
  'GAZEBO.GIF': 'The SysOp and Teddy at the town gazebo.',
  'HOBO1.GIF': 'First time out as a hobo clown!',
  'HOBO2.GIF': 'Hobo clown on a sunny Main Street.',
  'HOBO3.GIF': 'Hobo clown at clown club, with a rubber chicken.',
  'COLONIAL.GIF': 'The SysOp in colonial dress beside General Washington. Huzzah!',
  'DOGHOUSE.GIF': "The Dog House: the SysOp's Little Free Library. Take a book, leave a book.",
  'LIBRARY.GIF': 'The Dog House again, sized for 2400 baud.',
  'CHEZ.GIF': "THE CHEZ, the SysOp's red CitiCar. Electric before electric was cool!",
};

export const GALLERY: GalleryFile[] = list.map((f) => ({ ...f, desc: DESC[f.name] ?? '' }));

export const galleryFile = (name: string) => GALLERY.find((f) => f.name === name.toUpperCase());

const fetched = new Map<string, Promise<Uint8Array>>();

/** The GIF's bytes, from the board (web/public/bbs). */
export function galleryBytes(name: string): Promise<Uint8Array> {
  let p = fetched.get(name);
  if (!p) {
    p = fetch(`./bbs/${name}`).then(async (r) => {
      if (!r.ok) throw new Error(`${name}: ${r.status}`);
      return new Uint8Array(await r.arrayBuffer());
    });
    p.catch(() => fetched.delete(name));
    fetched.set(name, p);
  }
  return p;
}

/**
 * Draws a GIF (as much of it as has arrived) centered on a picture screen, with the GIF's
 * colors in the DAC. Outside the picture, and rows not here yet, are black.
 */
export function paintGif(scr: PictureScreen, g: PartialGif): void {
  scr.dac.fill(0);
  scr.dac.set(g.palette.subarray(0, g.colors * 3));
  // an unused entry is black already; a full table has its own darkest color
  const black = g.colors < 256 ? 255 : nearestColor(g.palette, 0, 0, 0);
  scr.mem.fill(black);
  scr.blit(partialPixels(g, black), g.width, g.height, placeIn(g.width, g.height, scr.width, scr.height));
}

/** A line of text across the bottom of the screen, in the picture's nearest white on its nearest black. */
export function caption(scr: PictureScreen, text: string): void {
  const white = nearestColor(scr.dac, 63, 63, 63);
  const black = nearestColor(scr.dac, 0, 0, 0);
  const cols = scr.width / 8;
  const t = text.slice(0, cols);
  const row = scr.height / scr.cellHeight - 1;
  scr.text(0, row, ' '.repeat(cols), white, black);
  scr.text((cols - t.length) >> 1, row, t, white, black);
}
