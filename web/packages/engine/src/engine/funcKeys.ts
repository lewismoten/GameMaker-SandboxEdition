// Screens reached from function keys during play (code/GM/PLAYGAME.C: HelpFiles,
// Display_Invent, GMabout, DropBloc's picker, SelectGameToLoad/Save). playscene's
// DoFunKy clears the screen before calling these and restores play afterwards.
import type { Machine } from './machine';
import type { Screen } from '../gfx/screen';
import { gGet, gVertMenu } from './menus';
import { STOCK_LOOK, type PlayerLook } from './playerLook';
import { displayFile, match, RGB_BLUE, RGB_YELLOW, showGraphic } from './showGraphic';
import { BACKBL, BLEN, INF_REPEAT, type World } from './world';

// SavNames.dat: 10 save names of 21 bytes each (20 characters plus a NUL).
const SAVNAMES = 'savnames.dat';

/** The two Box frames of a screen (the CD's: 10,10,310,190 and 15,15,305,185); `key` names its border.<key>.* patches. */
function frame2(screen: Screen, col: number, look?: PlayerLook, key?: string): void {
  const [ox1, oy1, ox2, oy2] = look && key ? look.frame(`border.${key}.outer`) : [10, 10, 310, 190];
  const [ix1, iy1, ix2, iy2] = look && key ? look.frame(`border.${key}.inner`) : [15, 15, 305, 185];
  screen.box(ox1, oy1, ox2, oy2, col);
  screen.box(ix1, iy1, ix2, iy2, col);
}

/** What the status and drop screens read of a level: its palette, blocks, inventory and clock. */
export type InventoryWorld = Pick<World, 'palette' | 'bg' | 'clock'> & { ci: Pick<World['ci'], 'inv' | 'score' | 'meter' | 'hitpts' | 'lives'> };

// The 2 x 5 inventory grid shared by Display_Invent and DropBloc; cells are BLEN+5 apart.
function drawInventory(screen: Screen, w: InventoryWorld, col: number): void {
  screen.box(30, 30, 35 + 5 * (BLEN + 5), 35 + 2 * (BLEN + 5), col);
  for (let k = 0; k < 2; k++)
    for (let j = 0; j < 5; j++) {
      screen.box(34 + j * (BLEN + 5), 34 + k * (BLEN + 5), 35 + BLEN + j * (BLEN + 5), 35 + BLEN + k * (BLEN + 5), col);
      const item = w.ci.inv[5 * k + j];
      if (item !== BACKBL && w.bg[item]) screen.drawBlock(35 + j * (BLEN + 5), 35 + k * (BLEN + 5), w.bg[item].pixels);
    }
}

/**
 * F1: HelpFiles. XFERPLAY.EXE (PLAYGAME.C built with TRANSFER, the player of every transferred
 * game) shows the game's instructions, or one red line; it never reads GMHELP.TXT. PLAYGAME.EXE,
 * run from Game-Maker, first shows Game-Maker's own GMHELP.TXT (`gmHelp`) in a blue frame.
 */
export async function helpScreen(m: Machine, w: World, instructions: string | undefined, gmHelp?: Uint8Array, look = STOCK_LOOK): Promise<void> {
  if (gmHelp) {
    // PLAYGAME.EXE only (XFERPLAY never shows it), so the player's patches don't apply
    frame2(m.screen, match(w.palette, RGB_BLUE));
    await displayFile(m, 'gmhelp.txt', match(w.palette, RGB_YELLOW), 30, w.palette, gmHelp);
  }
  if (instructions) await showGraphic(m, instructions, { gamePalette: w.palette, look });
  else {
    m.screen.write(40, 80, look.color(w.palette, 'color.select.helpNone'), look.text('str.help.none'));
    await m.pauseTimeKey(look.seconds('timing.helpNone'));
  }
}

/** Display_Invent's page (F2). */
export function drawStatus(screen: Screen, w: InventoryWorld, look: PlayerLook): void {
  const blue = look.color(w.palette, 'color.select.status');
  const { ci } = w;
  frame2(screen, blue, look, 'invent');
  drawInventory(screen, w, blue);
  screen.write(40, 88, blue, look.format('str.invent.score', ci.score));
  if (ci.meter[3] !== INF_REPEAT) screen.write(40, 96, blue, look.format('str.invent.money', ci.meter[3] - 1));
  screen.write(40, 112, blue, look.format('str.invent.hitpoints', ci.hitpts));
  screen.write(40, 120, blue, look.format('str.invent.lives', ci.lives));
  // clock counts 18.2 Hz ticks. clock/18 - clock/1818 is the C's integer stand-in
  // for clock/18.2 (1/18 - 1/1818 = 1/18.18); the hundredths use the same trick.
  const clock = w.clock;
  const time = Math.trunc(clock / 18) - Math.trunc(clock / 1818);
  const hundredths = (Math.trunc((clock * 100) / 18) - Math.trunc((clock * 100) / 1818)) % 100;
  screen.write(40, 152, blue, look.format('str.invent.time', time / 3600, (time % 3600) / 60, time % 60, hundredths));
}

/** F2: Display_Invent */
export async function statusScreen(m: Machine, w: World, look = STOCK_LOOK): Promise<void> {
  drawStatus(m.screen, w, look);
  await m.pauseTimeKey();
}

const WEB_ABOUT: [number, string][][] = [
  [
    '      G A M E - M A K E R',
    '          Version 3.00   ',
    '',
    'Recreational Software Designs',
    'Box 1163,  Amherst, NH, 03031',
    '',
    'This game was made with GAME-',
    'MAKER.  No programming needed!',
    'Design your own worlds, mon-  ',
    'sters, characters, sounds...  ',
    '',
    'This web edition runs it with',
    'HTML canvas and Web Audio.',
    '',
    '                      MORE... ',
  ].map((t, i): [number, string] => [40 + i * 8, t]),
  ['Game-Maker software, documen-', 'tation, and data files are', 'COPYRIGHTED by Recreational', 'Software Designs.'].map((t, i): [number, string] => [
    40 + i * 8,
    t,
  ]),
];

/** A page of GMabout's text: an imported game's own player's (read-only), else this web edition's words; the last page ends with the build it was first made with. */
function aboutLines(look: PlayerLook, page: number): [number, string][] {
  const pages = look.about?.pages ?? WEB_ABOUT;
  const lines = [...(pages[page] ?? [])];
  const origin = look.about?.origin;
  if (origin && page === pages.length - 1) {
    const below = Math.max(...lines.map(([y]) => y), 32) + 16;
    origin.forEach((t, i) => lines.push([Math.min(below, 184 - 8 * origin.length) + i * 8, t]));
  }
  return lines;
}

/** How many pages GMabout shows (two, as the DOS player does). */
export const aboutPages = (look: PlayerLook) => (look.about?.pages ?? WEB_ABOUT).length;

/** One page of GMabout (0: the first, as F10 opens it), framed; returns the text color. */
export function drawAbout(screen: Screen, palette: Uint8Array, look: PlayerLook, page = 0): number {
  const blue = look.color(palette, 'color.select.aboutFrame');
  const yellow = look.color(palette, 'color.select.aboutText');
  frame2(screen, blue, look, 'about');
  for (const [y, t] of aboutLines(look, page)) screen.write(40, y, yellow, t);
  return yellow;
}

/** F10: GMabout */
export async function aboutScreen(m: Machine, w: World, look = STOCK_LOOK): Promise<void> {
  const yellow = drawAbout(m.screen, w.palette, look);
  m.flushKeys();
  await m.pauseTimeKey(look.seconds('timing.aboutPage1'));
  for (let page = 1; page < aboutPages(look); page++) {
    m.screen.boxFill(16, 16, 304, 184, 0);
    for (const [y, t] of aboutLines(look, page)) m.screen.write(40, y, yellow, t);
    await m.pauseTimeKey();
  }
}

/** DropBloc's picker screen, with the selection box on slot (j, k); returns the box's color. */
export function drawDropPicker(screen: Screen, w: InventoryWorld, look: PlayerLook, j = 0, k = 0): number {
  // Named after the C's `Yellow`, which DropBloc also set to RGBRed.Match(colors).
  const yellow = look.color(w.palette, 'color.select.dropCursor');
  const blue = look.color(w.palette, 'color.select.dropFrame');
  screen.clear();
  frame2(screen, blue, look, 'drop');
  drawInventory(screen, w, blue);
  screen.write(40, 104, blue, look.text('str.drop.title'));
  screen.write(40, 120, blue, look.text('str.drop.help1'));
  screen.write(40, 128, blue, look.text('str.drop.help2'));
  screen.write(40, 136, blue, look.text('str.drop.help3'));
  dropCursor(screen, j, k, yellow);
  return yellow;
}

const dropCursor = (screen: Screen, j: number, k: number, c: number) =>
  screen.box(33 + j * (BLEN + 5), 33 + k * (BLEN + 5), 36 + BLEN + j * (BLEN + 5), 36 + BLEN + k * (BLEN + 5), c);

/** DropBloc's picker: arrows choose a slot, Enter drops, Esc cancels (-1). */
export function pickDropSlot(m: Machine, w: World, look = STOCK_LOOK): Promise<number> {
  // A GetKey wait: during demo playback the recorded keys (Esc, Enter...) arrive through it.
  return m.waiting(() => pickDropSlotKeys(m, w, look));
}

async function pickDropSlotKeys(m: Machine, w: World, look: PlayerLook): Promise<number> {
  const yellow = drawDropPicker(m.screen, w, look);
  let j = 0;
  let k = 0;
  const cursor = (c: number) => dropCursor(m.screen, j, k, c);
  m.flushKeys();
  for (;;) {
    for (const k of m.keyPollOnce?.() ?? []) m.keyboard.feed(k);
    const key = m.keyboard.readKey();
    // Pointer picking is a port addition; the C took arrow keys only.
    if (m.takeClick()) {
      const cj = Math.floor((m.pointer.x - 34) / (BLEN + 5));
      const ck = Math.floor((m.pointer.y - 34) / (BLEN + 5));
      if (cj >= 0 && cj < 5 && ck >= 0 && ck < 2) {
        cursor(0);
        [j, k] = [cj, ck];
        cursor(yellow);
        if (w.ci.inv[k * 5 + j] !== BACKBL) return k * 5 + j;
      }
    }
    if (!key) {
      await m.frame();
      continue;
    }
    if (key.ascii === 27) return -1;
    if (key.ascii === 13) {
      if (w.ci.inv[k * 5 + j] !== BACKBL) return k * 5 + j;
      continue;
    }
    cursor(0);
    if (key.scan === 72 || key.scan === 80) k ^= 1;
    if (key.scan === 75) j = (j + 4) % 5;
    if (key.scan === 77) j = (j + 1) % 5;
    cursor(yellow);
  }
}

function readSaveNames(m: Machine): string[] {
  const bytes = m.files.get(SAVNAMES);
  const names: string[] = [];
  for (let i = 0; i < 10; i++) {
    let s = '';
    for (let c = 0; c < 21; c++) {
      const v = bytes?.[i * 21 + c] ?? 0;
      if (!v) break;
      s += String.fromCharCode(v);
    }
    names.push(s);
  }
  return names;
}

function writeSaveNames(m: Machine, names: string[]): void {
  const out = new Uint8Array(210);
  names.forEach((n, i) => {
    for (let c = 0; c < Math.min(20, n.length); c++) out[i * 21 + c] = n.charCodeAt(c) & 0xff;
  });
  m.files.set(SAVNAMES, out);
}

/** The load or save heading and slot marks, drawn when the game has no load or save picture. */
export function drawLoadHeading(screen: Screen, look: PlayerLook, cols: Uint8Array): void {
  screen.write(look.num('layout.load.title.x'), look.num('layout.load.title.y'), look.color(cols, 'color.select.loadText'), look.text('str.load.title'));
}

export function drawSaveHeading(screen: Screen, look: PlayerLook, cols: Uint8Array): void {
  const col = look.color(cols, 'color.select.saveText');
  screen.write(look.num('layout.save.title.x'), look.num('layout.save.title.y'), col, look.text('str.save.title'));
  for (let i = 0; i < 10; i++) screen.write(73, 40 + i * 14, col, look.text('str.save.marker'));
}

/** The ten slot names, in the load or save screen's color. */
export function drawSaveSlots(screen: Screen, look: PlayerLook, pal: Uint8Array, names: string[], saving: boolean): number {
  const col = look.color(pal, saving ? 'color.select.saveSlots' : 'color.select.loadSlots');
  names.forEach((n, i) => screen.write(80, 40 + i * 14, col, n));
  return col;
}

/** SelectGameToLoad / SelectGameToSave: returns the slot (0..9) or -1. */
export async function pickSaveSlot(m: Machine, pal: Uint8Array, saving: boolean, look = STOCK_LOOK): Promise<number> {
  const names = readSaveNames(m);
  const col = drawSaveSlots(m.screen, look, pal, names, saving);
  const col1 = look.color(pal, saving ? 'color.select.saveMarker' : 'color.select.loadMarker');
  // No idle timeout here, so 0 (Esc) is the only way out without a slot.
  const choice = await gVertMenu(m, 60, 35, 14, 10, col1, Infinity, 1, true, look.num('border.marker.width'));
  if (!choice || choice > 10) return -1;
  const slot = choice - 1;
  if (!saving) return slot;
  // The name is edited in place over the background picture, so its color at the
  // left of the row is used to erase.
  const back = m.screen.getCol(79, 40 + slot * 14);
  const name = await gGet(m, 80, 40 + slot * 14, col, back, names[slot], 20);
  if (name === null) return -1;
  names[slot] = name;
  writeSaveNames(m, names);
  return slot;
}
