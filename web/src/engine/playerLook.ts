// What XFERPLAY.EXE's own screens show, read from a project's DOS player patches (dosPlayer/):
// the words, the color each screen matches (RGBdata::Match against the palette that is up, as the
// player does), frames, positions, times and which F-keys work. With no patches every value is
// the CD player's, so a game plays exactly as before; with them, the web shows what the DOS
// export's patched .EXE shows. Passed in through RunOptions.player, never global.
import { matchColor } from '../formats/palette';
import { PATCHES, type ColorName, type PatchEntry } from '../dosPlayer/patchTable';
import { cleanPatches, type PatchValue, type PlayerPatches } from '../dosPlayer/patchRules';

type Rgb = [number, number, number];
type Frame = [number, number, number, number];

export interface PlayerLook {
  /** A word or line (str.*). */
  text(id: string): string;
  /** A printf format (str.*) filled in as sprintf would. */
  format(id: string, ...args: (number | string)[]): string;
  /** The palette index a screen's color selector (color.select.*) matches in `pal`. */
  color(pal: Uint8Array, select: string): number;
  /** A color's levels (color.rgb.*, color.missing.*). */
  rgb(id: string): Rgb;
  frame(id: string): Frame;
  /** A position or count (layout.*, border.marker.width). */
  num(id: string): number;
  /** A wait in seconds (timing.*); -1 is PauseTimeKey's unsigned 65535 (until a key). */
  seconds(id: string): number;
  /** False when the player's patches turned this F-key off. */
  fkeyOn(key: number): boolean;
}

const BY_ID = new Map<string, PatchEntry>(PATCHES.map((e) => [e.id, e]));

/** sprintf for the player's formats: %d, %ld, %s with a width and the 0 and - flags. */
export function sprintf(format: string, args: (number | string)[]): string {
  let i = 0;
  return format.replace(/%([-0]*)(\d*)l?([ds])/g, (_m, flags: string, width: string, conv: string) => {
    const a = args[i++];
    const s = conv === 'd' ? String(Math.trunc(Number(a))) : String(a);
    const w = Number(width || 0);
    if (flags.includes('-')) return s.padEnd(w);
    return flags.includes('0') && conv === 'd' ? s.padStart(w, '0') : s.padStart(w);
  });
}

export function playerLook(patches?: PlayerPatches): PlayerLook {
  const set = cleanPatches(patches);
  const value = (id: string): PatchValue => {
    const e = BY_ID.get(id);
    if (!e) throw new Error(`No player patch ${id}`);
    return set[id] ?? (e.kind === 'fkey' ? 'on' : e.stock);
  };
  const rgb = (id: string) => value(id) as Rgb;
  return {
    text: (id) => value(id) as string,
    format: (id, ...args) => sprintf(value(id) as string, args),
    color: (pal, select) => {
      const [r, g, b] = rgb(`color.rgb.${value(select) as ColorName}`);
      return matchColor(pal, r, g, b);
    },
    rgb,
    frame: (id) => value(id) as Frame,
    num: (id) => value(id) as number,
    seconds: (id) => {
      const v = value(id) as number;
      return v < 0 ? v & 0xffff : v;
    },
    fkeyOn: (key) => !BY_ID.has(`table.fkeys.F${key}`) || value(`table.fkeys.F${key}`) !== 'off',
  };
}

/** The CD player's own look. */
export const STOCK_LOOK = playerLook();
