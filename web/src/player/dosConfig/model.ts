// PLAYGAME's Configure screen as data: its layout constants, strings, the starting values AskConfigData
// works out (PLAYGAME.C 4811-4859), the cursor moves of its arrow keys (4968-5008) and the way a
// choice maps onto the browser's hardware preferences. No drawing and no DOM here.
import type { GameHardware } from '../hardwarePrefs';

export const SNDCARDX = 35;
export const SNDCARDY = 20;
export const VGACARDX = 192;
export const VGACARDY = 25;
export const PORTX = 22;
export const PORTY = 75;
export const INTX = 110;
export const INTY = 75;
export const VGACARDSEP = 0x0e;

export const VGA_TYPES = [
  'Auto-Detect',
  'Standard VGA',
  'Paradise',
  'Trident 8800',
  'Trident 8900',
  'Tseng ET3000',
  'Tseng ET4000',
  'ATI',
  'ATI Wonder',
  'Simulate',
] as const;

/** The cursor stops, numbered as AskConfigData counts them: the palette entry of each is 50 + stop. */
export const PORT_C = 2; // two sound cards (None, Sound Blaster), then five ports
export const DRVR_C = 7; // driver name; the path is DRVR_C + 1
export const INT_C = 9; // five interrupts
export const VCARD_C = 14; // ten VGA chip types
export const BUT_C = 24; // Help; Done is BUT_C + 1
export const LAST_C = BUT_C + 1;

export interface ConfigState {
  /** 0 = None, 1 = Sound Blaster (SoundCards). */
  sound: 0 | 1;
  /** 0x220, 0x230 ... 0x260. */
  port: number;
  /** The interrupt as an odd count 1..9 while editing (the real 2 and 10 are 1 and 9 here). */
  irq: number;
  /** Index into VGA_TYPES. */
  vga: number;
  driverName: string;
  driverPath: string;
}

/** What DetectCard leaves for a PC without a BLASTER setting: the standard driver in the current directory. */
const DEFAULT_DRIVER = '.\\sndblast.drv';
const DEFAULT_PORT = 0x220;
const DEFAULT_IRQ = 7;

/** The part of a game's browser hardware preference the web dialog has no field for. */
export interface DosHardware {
  vga: number;
  port: number;
  irq: number;
  driver: string;
}

/** SndDrvr split at its last backslash into name and path, as AskConfigData does (path keeps its backslash). */
export function splitDriver(driver: string): { name: string; path: string } {
  const at = driver.lastIndexOf('\\');
  return at < 0 ? { name: driver, path: '' } : { name: driver.slice(at + 1), path: driver.slice(0, at + 1) };
}

/** Starting state from a saved preference: the translations PLAYGAME made on SndPort, SndInt and the driver. */
export function fromHardware(saved?: GameHardware): ConfigState {
  const dos = saved?.dos;
  let port = dos?.port ?? DEFAULT_PORT;
  if (port < 0x220 || port > 0x260) port = 0x220;
  let irq = dos?.irq ?? DEFAULT_IRQ;
  if (irq === 2) irq = 1; // interrupts become an even count from 1 to 9
  if (irq === 10) irq = 9;
  if (irq < 1 || irq > 9 || irq % 2 === 0) irq = 7;
  const auto = (saved?.video ?? 'auto') === 'auto';
  // a chip type picked on the DOS screen only counts while it still agrees with the web's auto/standard choice
  const vga = dos && Number.isInteger(dos.vga) && dos.vga >= 0 && dos.vga <= 9 && (dos.vga === 0) === auto ? dos.vga : auto ? 0 : 1;
  const { name, path } = splitDriver(dos?.driver ?? DEFAULT_DRIVER);
  return { sound: saved?.sound === 'speaker' ? 0 : 1, port, irq, vga, driverName: name, driverPath: path };
}

/** The finishing steps of AskConfigData (5015-5030): the driver path and the real interrupt values. */
export function toHardware(s: ConfigState): GameHardware {
  let path = s.driverPath === '' ? '.\\' : s.driverPath;
  if (!path.endsWith('\\')) path += '\\';
  let irq = s.irq;
  if (irq === 1) irq = 2;
  if (irq === 9) irq = 10;
  return {
    // None is no sound card: effects on the PC speaker. Sound Blaster is the web's "blaster".
    sound: s.sound === 1 ? 'blaster' : 'speaker',
    // every chip type displays the same 320 x 200 VGA in a browser: only Auto-Detect stays "auto"
    video: s.vga === 0 ? 'auto' : 'vga',
    dos: { vga: s.vga, port: s.port, irq, driver: path + s.driverName },
  };
}

export type Arrow = 'left' | 'right' | 'up' | 'down';

/** The Left/Right/Up/Down cases of AskConfigData, then the wrap that follows the switch. */
export function moveCursor(cursor: number, key: Arrow): number {
  let c = cursor;
  const butC = BUT_C;
  if (key === 'right') {
    if (c > butC) c = DRVR_C + 1;
    else if (c === butC) c = butC + 1;
    else if (c >= VCARD_C + 3) c = PORT_C - 3 + c - VCARD_C;
    else if (c >= VCARD_C) c = c - VCARD_C;
    else if (c >= INT_C) c = VCARD_C + 3 + (c - INT_C);
    else if (c >= DRVR_C + 1) c = butC;
    else if (c >= DRVR_C) c = VCARD_C + 9;
    else if (c >= PORT_C) c = INT_C + (c - PORT_C);
    else c = VCARD_C + c;
  } else if (key === 'left') {
    if (c > butC) c = butC;
    else if (c === butC) c = DRVR_C + 1;
    else if (c >= VCARD_C + 8) c = DRVR_C;
    else if (c >= VCARD_C + 3) c = INT_C - 3 + (c - VCARD_C);
    else if (c >= VCARD_C + 2) c = INT_C;
    else if (c >= VCARD_C) c = c - VCARD_C;
    else if (c >= INT_C) c = PORT_C + (c - INT_C);
    else if (c >= DRVR_C + 1) c = butC + 1;
    else if (c >= DRVR_C) c = VCARD_C + 9;
    else if (c >= PORT_C) c = VCARD_C + (c - PORT_C) + 3;
    else c = VCARD_C + c;
  } else if (key === 'down') c++;
  else c--;
  if (c > LAST_C) c = 0;
  if (c < 0) c = LAST_C;
  return c;
}

/** Enter on a choice (not the driver fields, Help or Done): the new state, as the Enter case sets it. */
export function choose(s: ConfigState, cursor: number): ConfigState {
  if (cursor === 0) return { ...s, sound: 0 };
  if (cursor === 1) return { ...s, sound: 1 };
  if (cursor >= VCARD_C) return { ...s, vga: cursor - VCARD_C };
  if (cursor >= INT_C) return { ...s, irq: (cursor - INT_C) * 2 + 1 };
  if (cursor >= PORT_C) return { ...s, port: (cursor - PORT_C) * 0x10 + 0x220 };
  return s;
}
