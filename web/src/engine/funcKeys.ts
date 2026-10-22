// Screens reached from function keys during play (code/GM/PLAYGAME.C: HelpFiles,
// Display_Invent, GMabout, DropBloc's picker, SelectGameToLoad/Save). playscene's
// DoFunKy clears the screen before calling these and restores play afterwards.
import type { Machine } from './machine';
import { gGet, gVertMenu } from './menus';
import { displayFile, match, RGB_BLUE, RGB_RED, RGB_YELLOW, showGraphic } from './showGraphic';
import { BACKBL, BLEN, INF_REPEAT, type World } from './world';

// SavNames.dat: 10 save names of 21 bytes each (20 characters plus a NUL).
const SAVNAMES = 'savnames.dat';

function frame2(m: Machine, col: number): void {
  m.screen.box(10, 10, 310, 190, col);
  m.screen.box(15, 15, 305, 185, col);
}

// The 2 x 5 inventory grid shared by Display_Invent and DropBloc; cells are BLEN+5 apart.
function drawInventory(m: Machine, w: World, col: number): void {
  m.screen.box(30, 30, 35 + 5 * (BLEN + 5), 35 + 2 * (BLEN + 5), col);
  for (let k = 0; k < 2; k++)
    for (let j = 0; j < 5; j++) {
      m.screen.box(34 + j * (BLEN + 5), 34 + k * (BLEN + 5), 35 + BLEN + j * (BLEN + 5), 35 + BLEN + k * (BLEN + 5), col);
      const item = w.ci.inv[5 * k + j];
      if (item !== BACKBL && w.bg[item]) m.screen.drawBlock(35 + j * (BLEN + 5), 35 + k * (BLEN + 5), w.bg[item].pixels);
    }
}

/** F1: HelpFiles */
export async function helpScreen(m: Machine, w: World, instructions: string | undefined): Promise<void> {
  const yellow = match(w.palette, RGB_YELLOW);
  const blue = match(w.palette, RGB_BLUE);
  // gmhelp.txt is Game-Maker's general help (left out of TRANSFER builds); the game's
  // own instructions follow.
  await m.need('gmhelp.txt');
  if (m.files.has('gmhelp.txt')) {
    frame2(m, blue);
    await displayFile(m, 'gmhelp.txt', yellow, 30, w.palette);
  }
  if (instructions) await showGraphic(m, instructions, { gamePalette: w.palette });
  else {
    m.screen.write(40, 80, match(w.palette, RGB_RED), 'No game-specific help included.');
    await m.pauseTimeKey(5);
  }
}

/** F2: Display_Invent */
export async function statusScreen(m: Machine, w: World): Promise<void> {
  const blue = match(w.palette, RGB_BLUE);
  const { ci } = w;
  frame2(m, blue);
  drawInventory(m, w, blue);
  m.screen.write(40, 88, blue, `Score:     ${ci.score}`);
  if (ci.meter[3] !== INF_REPEAT) m.screen.write(40, 96, blue, `Money:     ${ci.meter[3] - 1}`);
  m.screen.write(40, 112, blue, `Hitpoints: ${ci.hitpts}`);
  m.screen.write(40, 120, blue, `Lives:     ${ci.lives}`);
  // clock counts 18.2 Hz ticks. clock/18 - clock/1818 is the C's integer stand-in
  // for clock/18.2 (1/18 - 1/1818 = 1/18.18); the hundredths use the same trick.
  const clock = w.clock;
  const time = Math.trunc(clock / 18) - Math.trunc(clock / 1818);
  const two = (n: number) => String(Math.trunc(n)).padStart(2, '0');
  const hundredths = (Math.trunc((clock * 100) / 18) - Math.trunc((clock * 100) / 1818)) % 100;
  m.screen.write(40, 152, blue, `Elapsed Time: ${two(time / 3600)}:${two((time % 3600) / 60)}:${two(time % 60)}.${two(hundredths)}`);
  await m.pauseTimeKey();
}

/** F10: GMabout */
export async function aboutScreen(m: Machine, w: World): Promise<void> {
  const blue = match(w.palette, RGB_BLUE);
  const yellow = match(w.palette, RGB_YELLOW);
  frame2(m, blue);
  m.flushKeys();
  const page1 = [
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
  ];
  page1.forEach((line, i) => m.screen.write(40, 40 + i * 8, yellow, line));
  await m.pauseTimeKey(60);
  m.screen.boxFill(16, 16, 304, 184, 0);
  ['Game-Maker software, documen-', 'tation, and data files are', 'COPYRIGHTED by Recreational', 'Software Designs.'].forEach((line, i) =>
    m.screen.write(40, 40 + i * 8, yellow, line),
  );
  await m.pauseTimeKey();
}

/** DropBloc's picker: arrows choose a slot, Enter drops, Esc cancels (-1). */
export async function pickDropSlot(m: Machine, w: World): Promise<number> {
  // Named after the C's `Yellow`, which DropBloc also set to RGBRed.Match(colors).
  const yellow = match(w.palette, RGB_RED);
  const blue = match(w.palette, RGB_BLUE);
  m.screen.clear();
  frame2(m, blue);
  drawInventory(m, w, blue);
  m.screen.write(40, 104, blue, 'Choose object to drop');
  m.screen.write(40, 120, blue, 'Use arrow keys to select,');
  m.screen.write(40, 128, blue, '<Enter> to accept, <ESC> ');
  m.screen.write(40, 136, blue, 'to quit without dropping.');
  let j = 0;
  let k = 0;
  const cursor = (c: number) => m.screen.box(33 + j * (BLEN + 5), 33 + k * (BLEN + 5), 36 + BLEN + j * (BLEN + 5), 36 + BLEN + k * (BLEN + 5), c);
  cursor(yellow);
  m.flushKeys();
  for (;;) {
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

/** SelectGameToLoad / SelectGameToSave: returns the slot (0..9) or -1. */
export async function pickSaveSlot(m: Machine, pal: Uint8Array, saving: boolean): Promise<number> {
  const col = match(pal, RGB_YELLOW);
  const col1 = match(pal, RGB_RED);
  const names = readSaveNames(m);
  names.forEach((n, i) => m.screen.write(80, 40 + i * 14, col, n));
  // No idle timeout here, so 0 (Esc) is the only way out without a slot.
  const choice = await gVertMenu(m, 60, 35, 14, 10, col1);
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
