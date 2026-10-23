// The GIF Gallery file area on THE -= S A N D B O X =- BBS: the SysOp's snapshots as GIFs
// and JPEGs, made by web/scripts/bbsGifs.ts into web/public/bbs (sizes and formats in
// gallery.json), THE CHEZ's among them. The Sofa's GIF area (board "sofa" in gallery.json:
// what Doc Leo uploaded there, the hobo clown pictures and the Bard's logo) shares the
// list. Downloaded pictures from either board land in C:\IMAGES, where VPIC shows them again (retro/view/vpic.ts). The photos are
// Lewis's own, except CHEZTED.GIF and THECHEZ2.GIF (one shot), taken by Nicky Foster (NOTICE.md).
import list from './gallery.json';
import { decodePartialGif, partialPixels } from '../../formats/gifProgressive';
import { decodePartialJpeg, isJpeg, type PartialJpeg } from '../../formats/jpeg';
import { isGif } from '../../formats/gif';
import { nearestColor, placeIn, type PictureScreen } from '../view/picture';

export interface GalleryFile {
  /** 8.3 name, e.g. TEDDY.GIF */
  name: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  colors: number;
  gray: boolean;
  progressive: boolean;
  desc: string;
  /** Which board has it: the Sandbox BBS's GIF Gallery, or The Sofa's GIF area. */
  board?: 'sofa';
}

const DESC: Record<string, string> = {
  'TEDDY.GIF': 'Teddy the corgi, all ears and smiles.',
  'TEDDY16G.GIF': 'Teddy in 16 grays: a third the size!',
  'TEDDY.JPG': 'Teddy as a JPEG. Watch it sharpen!',
  'GWINN.JPG': 'Teddy and his pal Gwinn in the grass.',
  'GAZEBO.GIF': 'The SysOp and Teddy at the gazebo.',
  'COLONIAL.GIF': 'The SysOp in colonial dress with General Washington. Huzzah!',
  'DOGHOUSE.JPG': "The Dog House: the SysOp's little lending library.",
  'LIBRARY.GIF': 'The Dog House again, in 16 colors.',
  'CHEZ.JPG': "THE CHEZ: the SysOp's red CitiCar!",
  'CHEZXMAS.GIF': 'THE CHEZ, the 1976 1/2 CitiCar, strung with Christmas lights.',
  'CHEZTED.GIF': 'Doc Leo, Teddy and THE CHEZ. Photo: Nicky Foster.',
  'CHEZPLUG.GIF': 'THE CHEZ plugged in at a public charger. Electric since 1976!',
  'THECHEZ1.GIF': 'THE CHEZ - 1976 1/2 CitiCar, tomato red, electric. Dressed in Christmas lights and a big gold bow.',
  'THECHEZ2.GIF': 'THE CHEZ - 1976 1/2 CitiCar, tomato red, electric. Doc Leo and Teddy the corgi out for a spin. Photo: Nicky Foster.',
  'THECHEZ3.GIF': 'THE CHEZ - 1976 1/2 CitiCar, tomato red, electric. Plugged in at a public charger.',
  // The Sofa's GIF area: Doc Leo's uploads
  'BARDLOGO.GIF': "The Bard of Bizarre's logo: the rooster in glasses. Logo made with DeepAI.",
  'LEOCHICK.GIF': 'Doc Leo, hobo clown, walking his rubber chicken down the middle of a parade. It heels. Mostly.',
  'NEWNOSE.GIF': "Doc Leo's first day as a clown: he got to pick his own nose. (You can pick your nose, but you can't pick your friend's nose.)",
  'LEOWALK.GIF': 'Doc Leo walking his rubber chicken down the middle of a parade.',
  'LEONOSE.GIF': "Doc Leo's first day as a clown: he got to pick his own nose.",
  'HOBO1.GIF': 'First time out as a hobo clown!',
  'HOBO2.GIF': 'Hobo clown on a sunny Main Street.',
  'HOBO3.JPG': 'Hobo clown and a rubber chicken.',
};

/** Every picture on either board (what C:\IMAGES can hold). */
export const PICTURES: GalleryFile[] = list.map((f) => ({ ...f, board: f.board === 'sofa' ? 'sofa' : undefined, desc: DESC[f.name] ?? '' }));
/** The Sandbox BBS's GIF Gallery: the SysOp's snapshots. */
export const GALLERY: GalleryFile[] = PICTURES.filter((f) => !f.board);
/** The Sofa's GIF area. */
export const SOFA_GIFS: GalleryFile[] = PICTURES.filter((f) => f.board === 'sofa');

/** What the file listing says about a picture: "256 color", "16 gray", "JPEG prog"… */
export function formatLabel(f: GalleryFile): string {
  if (f.format === 'GIF') return `${f.colors} ${f.gray ? 'gray' : 'color'}`;
  return f.gray ? 'JPEG gray' : f.progressive ? 'JPEG prog' : 'JPEG';
}

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

/** A picture (as much as has arrived) in a 256-color screen's terms. */
export interface ScreenPicture {
  width: number;
  height: number;
  /** Palette indexes; parts not here yet are `blank`. */
  pixels: Uint8Array;
  /** 6-bit VGA colors. */
  palette: Uint8Array;
  blank: number;
  complete: boolean;
}

/** 4x4 ordered dither thresholds, 0..15. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** The color cube a JPEG viewer shows color JPEGs in on a 256-color card: 6 reds x 7 greens x 6 blues. */
const CUBE = [6, 7, 6];

/**
 * A JPEG on a 256-color screen, the way 1994 viewers showed one: grays as VGA's 64 shades,
 * color dithered (ordered, so it can be redrawn quickly as more arrives) to a color cube.
 */
function jpegToScreen(j: PartialJpeg): ScreenPicture {
  const { width, height } = j;
  const palette = new Uint8Array(768);
  const pixels = new Uint8Array(width * height);
  if (j.channels === 1) {
    for (let i = 0; i < 64; i++) palette.fill(i, i * 3, i * 3 + 3);
    for (let i = 0; i < pixels.length; i++) pixels[i] = j.shown[i] ? j.pixels[i] >> 2 : 0;
  } else {
    const [nr, ng, nb] = CUBE;
    for (let r = 0; r < nr; r++)
      for (let g = 0; g < ng; g++)
        for (let b = 0; b < nb; b++)
          palette.set([Math.round((r * 63) / (nr - 1)), Math.round((g * 63) / (ng - 1)), Math.round((b * 63) / (nb - 1))], (r * ng * nb + g * nb + b) * 3);
    const level = (v: number, n: number, t: number) => Math.min(n - 1, Math.floor((v * (n - 1)) / 255 + t));
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (!j.shown[i]) continue; // black (index 0)
        const t = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        pixels[i] = level(j.pixels[i * 3], nr, t) * ng * nb + level(j.pixels[i * 3 + 1], ng, t) * nb + level(j.pixels[i * 3 + 2], nb, t);
      }
  }
  return { width, height, pixels, palette, blank: 0, complete: j.complete };
}

/** A GIF or JPEG from as many of its bytes as have arrived; undefined until there's something to draw. */
export function decodePicture(bytes: Uint8Array): ScreenPicture | undefined {
  if (isJpeg(bytes)) {
    const j = decodePartialJpeg(bytes);
    return j && jpegToScreen(j);
  }
  if (!isGif(bytes)) return undefined;
  const g = decodePartialGif(bytes);
  if (!g) return undefined;
  // an unused entry is black already; a full table has its own darkest color
  const blank = g.colors < 256 ? 255 : nearestColor(g.palette, 0, 0, 0);
  return { width: g.width, height: g.height, pixels: partialPixels(g, blank), palette: g.palette, blank, complete: g.complete };
}

/** Draws a picture centered on a screen, with its colors in the DAC; around it is black. */
export function paintPicture(scr: PictureScreen, pic: ScreenPicture): void {
  scr.dac.set(pic.palette);
  scr.mem.fill(pic.blank);
  scr.blit(pic.pixels, pic.width, pic.height, placeIn(pic.width, pic.height, scr.width, scr.height));
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
