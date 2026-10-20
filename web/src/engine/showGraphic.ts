// Ports of ShowGraphic and Display_File from code/GM/PLAYGAME.C: the title screens,
// storylines, credits, level intros/exits and slide shows shown between scenes.
import type { Machine } from './machine';
import { decodeGif, isGif } from '../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../formats/fli';
import { parseBackdrop, parseSlideList, textLines } from '../formats/graphicScripts';
import { matchColor, PALETTE_SIZE } from '../formats/palette';

export const RGB_RED: [number, number, number] = [63, 10, 10];
export const RGB_BLUE: [number, number, number] = [10, 10, 63];
export const RGB_YELLOW: [number, number, number] = [63, 63, 0];
export const RGB_PURPLE: [number, number, number] = [50, 10, 50];

export const match = (pal: Uint8Array, c: [number, number, number]) => matchColor(pal, c[0], c[1], c[2]);

const ext = (name: string) => (/\.[^.]*$/.exec(name)?.[0] ?? '').toLowerCase();

export interface GraphicOptions {
  /** Receives the palette of the shown picture (the NewCols argument). */
  cols?: Uint8Array;
  /** Seconds to wait for a key; -1 = the default for the file type. */
  pause?: number;
  /** The game's current palette, used to pick text colors (`colors` global). */
  gamePalette: Uint8Array;
}

/** Returns false when the player pressed Esc (which aborts slide shows). */
export async function showGraphic(m: Machine, file: string, opts: GraphicOptions): Promise<boolean> {
  m.audio.stopVoc(); // FreeSoundSample
  const e = ext(file);
  let pause = opts.pause ?? -1;
  const cols = opts.cols ?? new Uint8Array(PALETTE_SIZE);
  let key: number | undefined;

  if (e === '.gif' || e === '.bkd') {
    if (pause === -1) pause = e === '.gif' ? 15 : 20;
    m.screen.setPaletteTo(0, 0, 0);
    if (drawGifFile(m, file, cols, e === '.bkd')) {
      await m.fadeTo(cols);
      key = (await m.pauseTimeKey(pause))?.ascii;
    } else m.screen.clear();
  } else if (e === '.fli') {
    if (pause === -1) pause = 0;
    if (await playFli(m, file)) {
      cols.set(m.screen.palette);
      key = (await m.pauseTimeKey(pause))?.ascii;
    }
  } else if (e === '.txt') {
    if (pause === -1) pause = 90;
    const pal = opts.cols ?? opts.gamePalette;
    return displayFile(m, file, match(pal, RGB_PURPLE), pause, opts.gamePalette);
  } else if (e === '.lst') {
    const bytes = m.files.get(file);
    if (!bytes) return true;
    for (const entry of parseSlideList(bytes)) {
      // An entry without a pause keeps 0xFFFF seconds: wait for a key.
      const ok = await showGraphic(m, entry.name, { cols, pause: entry.pause ?? 0xffff, gamePalette: opts.gamePalette });
      if (!ok) return false;
    }
  }
  return key !== 27;
}

/** DrawGif / drawbkd: draws into the screen and returns the GIF palette in `cols`. */
export function drawGifFile(m: Machine, file: string, cols: Uint8Array, backdrop = false): boolean {
  let x = 0;
  let y = 0;
  let name = file;
  if (backdrop) {
    const bkd = m.files.get(file);
    if (!bkd) return false;
    const b = parseBackdrop(bkd);
    x = b.x;
    y = b.y;
    name = b.gif;
  }
  const bytes = m.files.get(name);
  if (!bytes || !isGif(bytes)) return false;
  try {
    const img = decodeGif(bytes);
    m.screen.drawImage(img.pixels, img.width, img.height, x, y);
    cols.set(img.palette);
    return true;
  } catch {
    return false;
  }
}

/** FLI::View: every frame once, `speed` vertical retraces (1/70 s) apart. */
export async function playFli(m: Machine, file: string): Promise<boolean> {
  const bytes = m.files.get(file);
  if (!bytes || !isFli(bytes)) return false;
  const anim = parseFli(bytes);
  const canvas = newFliCanvas(anim);
  canvas.palette.set(m.screen.palette);
  canvas.pixels.set(m.screen.pixels.subarray(0, Math.min(canvas.pixels.length, m.screen.pixels.length)));
  let due = performance.now();
  for (let f = 0; f < anim.frameCount; f++) {
    if (applyFliFrame(anim, f, canvas)) m.screen.setPalette(canvas.palette);
    m.screen.drawImage(canvas.pixels, anim.width, anim.height);
    due += (Math.max(1, anim.speed) * 1000) / 70;
    do await m.frame();
    while (performance.now() < due);
  }
  return true;
}

/** Display_File: 32 column text pages over the current picture. */
export async function displayFile(m: Machine, file: string, col: number, pause: number, gamePalette: Uint8Array): Promise<boolean> {
  const saved = m.screen.snapshot();
  const red = match(gamePalette, RGB_RED);
  m.flushKeys();
  const bytes = m.files.get(file);
  let escaped = false;
  if (!bytes) {
    m.screen.write(40, 80, red, 'Missing File:');
    m.screen.write(40, 96, red, `The file ${file} is`);
    m.screen.write(40, 104, red, 'missing or cannot be opened.');
  } else {
    let vertpos = 5;
    for (const line of textLines(bytes)) {
      if (vertpos > 20) {
        m.screen.write(224, 168, red, 'MORE...');
        const k = await m.pauseTimeKey(pause);
        if (k?.ascii === 27) {
          escaped = true;
          break;
        }
        vertpos = 5;
        m.screen.restore(saved);
      }
      m.screen.write(5 * 8, vertpos * 8, col, line);
      vertpos++;
    }
  }
  if (!escaped) await m.pauseTimeKey(pause);
  m.screen.restore(saved);
  return !escaped;
}
