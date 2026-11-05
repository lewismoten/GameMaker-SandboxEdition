// COLOR DOORS' views: the one palette the game is drawn with, and the same palette passed through the
// engine's color-vision matrices (gfx/colorVision, Machado, Oliveira and Alvarez 2009; credited in NOTICE.md)
// to make the others. A palette is 768 bytes, so a scene with its own look costs a file that small;
// the map and the blocks are shared by every scene.
import { MACHADO, linearToSrgb, simulateLinear, srgbToLinear, type Rgb, type Vision } from '@lewismoten/gamemaker-sandbox-engine/gfx/colorVision';

export interface View {
  /** The file name of the view's palette on the disk. */
  file: string;
  /** What the door's sign and the level card call it. */
  name: string;
  /** How its card explains it (a line, 30 letters at most). */
  line: string;
  /** The scene number the hall's door leads to. */
  scene: number;
  kind: Vision | 'gray' | 'normal';
}

/** The hall's doors, left to right. Scene 2 is the hall, so the galleries are scenes 3 to 7. */
export const VIEWS: View[] = [
  { file: 'as.pal', name: 'As you see it', line: 'The colors as drawn.', scene: 3, kind: 'normal' },
  { file: 'red1.pal', name: 'Red-green, one kind', line: 'Reds go dark; red, green blur.', scene: 4, kind: 'protan' },
  { file: 'red2.pal', name: 'Red-green, the other', line: 'Red and green blur together.', scene: 5, kind: 'deutan' },
  { file: 'blue.pal', name: 'Blue-yellow', line: 'Blue looks green. Yellow, pink.', scene: 6, kind: 'tritan' },
  { file: 'gray.pal', name: 'No color', line: 'Only light and dark.', scene: 7, kind: 'gray' },
];

const GRAY: number[] = [0, 1, 2].flatMap(() => [0.2126, 0.7152, 0.0722]);
const to8 = (v6: number): number => (v6 << 2) | (v6 >> 4);

/** One color (0-255 a channel) as `kind` might see it. */
export function seen(c: Rgb, kind: View['kind']): Rgb {
  if (kind === 'normal') return c;
  const lin = c.map((x) => srgbToLinear(x / 255)) as Rgb;
  return simulateLinear(lin, kind === 'gray' ? GRAY : MACHADO[kind]).map((l) => Math.round(255 * linearToSrgb(l))) as Rgb;
}

/** A whole VGA palette (768 bytes of 6 bit values) as `kind` might see it. The same size, so it drops into any scene. */
export function viewPalette(pal: Uint8Array, kind: View['kind']): Uint8Array {
  const out = new Uint8Array(pal.length);
  for (let i = 0; i < pal.length; i += 3) {
    const [r, g, b] = seen([0, 1, 2].map((k) => to8(pal[i + k])) as Rgb, kind);
    out.set([r >> 2, g >> 2, b >> 2], i);
  }
  return out;
}
