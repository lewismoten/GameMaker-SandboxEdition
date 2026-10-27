// Ports of ShowGraphic and Display_File from code/GM/PLAYGAME.C: the title screens,
// storylines, credits, level intros/exits and slide shows shown between scenes.
// The file extension picks the kind: .gif picture, .bkd backdrop (a GIF placed at an
// offset), .fli animation (FLI::View, code/Image/FLI/FLI.CPP), .txt text pages and
// .lst slide lists. A pause of 0 returns at once; PauseTimeKey(0) did not wait either.
import type { Machine } from './machine';
import { decodeGif, isGif } from '../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../formats/fli';
import { parseBackdrop, parseSlideList, textLines } from '../formats/graphicScripts';
import { matchColor, PALETTE_SIZE } from '../formats/palette';
import { STOCK_LOOK, type PlayerLook } from './playerLook';

// The fixed RGBdata colors the C matches against whatever palette is up (RGBRed.Match…).
export const RGB_RED: [number, number, number] = [63, 10, 10];
export const RGB_BLUE: [number, number, number] = [10, 10, 63];
export const RGB_YELLOW: [number, number, number] = [63, 63, 0];
export const RGB_PURPLE: [number, number, number] = [50, 10, 50];

export const match = (pal: Uint8Array, c: [number, number, number]) => matchColor(pal, c[0], c[1], c[2]);

const ext = (name: string) => (/\.[^.]*$/.exec(name)?.[0] ?? '').toLowerCase();

interface GraphicOptions {
  /** Receives the palette of the shown picture (the NewCols argument). */
  cols?: Uint8Array;
  /** Seconds to wait for a key; -1 = the default for the file type. */
  pause?: number;
  /** The game's current palette, used to pick text colors (`colors` global). */
  gamePalette: Uint8Array;
  /** The player's look (RunOptions.player): text page colors, default times. */
  look?: PlayerLook;
}

/** Returns false when the player pressed Esc (which aborts slide shows). */
export async function showGraphic(m: Machine, file: string, opts: GraphicOptions): Promise<boolean> {
  await m.need(file);
  if (ext(file) === '.bkd') {
    const bkd = m.files.get(file);
    if (bkd) await m.need(parseBackdrop(bkd).gif);
  }
  // ShowGraphic's pictures, animations and text pages read keys through GetKey, which
  // kept a demo's recorder running (see Machine.keyPoll).
  return m.waiting(() => showGraphicNow(m, file, opts));
}

async function showGraphicNow(m: Machine, file: string, opts: GraphicOptions): Promise<boolean> {
  m.audio.stopVoc(); // FreeSoundSample
  const e = ext(file);
  let pause = opts.pause ?? -1;
  const look = opts.look ?? STOCK_LOOK;
  const cols = opts.cols ?? new Uint8Array(PALETTE_SIZE);
  let key: number | undefined;

  if (e === '.gif' || e === '.bkd') {
    if (pause === -1) pause = look.seconds(e === '.gif' ? 'timing.showGraphic.gif' : 'timing.showGraphic.bkd');
    m.screen.setPaletteTo(0, 0, 0);
    if (drawGifFile(m, file, cols, e === '.bkd')) {
      await m.fadeTo(cols);
      key = (await m.pauseTimeKey(pause))?.ascii;
    } else m.screen.clear();
  } else if (e === '.fli') {
    if (pause === -1) pause = look.seconds('timing.showGraphic.fli');
    if (await playFli(m, file)) {
      cols.set(m.screen.palette);
      key = (await m.pauseTimeKey(pause))?.ascii;
    }
  } else if (e === '.txt') {
    if (pause === -1) pause = look.seconds('timing.showGraphic.txt');
    const pal = opts.cols ?? opts.gamePalette;
    return displayFile(m, file, look.color(pal, 'color.select.textPages'), pause, opts.gamePalette, m.files.get(file), look);
  } else if (e === '.lst') {
    const bytes = m.files.get(file);
    if (!bytes) return true;
    for (const entry of parseSlideList(bytes)) {
      // An entry without a pause keeps 0xFFFF seconds: wait for a key. FileListClass
      // meant to give such entries the list's own pause, but after MaxFiles++ it tests
      // the next, still empty entry, so the 0xFFFF always stayed.
      const ok = await showGraphic(m, entry.name, { cols, pause: entry.pause ?? 0xffff, gamePalette: opts.gamePalette, look });
      if (!ok) return false;
    }
  }
  return key !== 27;
}

/** DrawGif / drawbkd: draws into the screen and returns the GIF palette in `cols`. */
function drawGifFile(m: Machine, file: string, cols: Uint8Array, backdrop = false): boolean {
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

/** Yields to the event loop without waiting for a frame (a MessageChannel task is not clamped like setTimeout). */
function yieldTask(): Promise<void> {
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => resolve();
    ch.port2.postMessage(0);
  });
}

/**
 * FLI::View: every frame once, `speed` vertical retraces (1/70 s) apart. The C drew
 * straight onto the VGA screen, so the animation starts over whatever is shown.
 *
 * A speed of 0 waits no retrace at all: the C's delay loop is
 *   for (uint Delay=0;Delay<Head.FrameSpd;Delay++) { wait out retrace; wait for retrace; }
 * so with FrameSpd 0 the next frame was decoded into video memory straight away, as fast
 * as the PC could read and draw it, and the monitor showed whatever was in video memory at
 * each refresh (frames in between were never seen). The port does the same: it draws the
 * next frame at once, only yielding to the event loop (no frame wait) so the page stays
 * responsive, and each browser repaint shows the frame that is current then. Speed 0 FLIs
 * on the CD (black.fli, menubkg.fli, textbkg.fli, ...) are one or two frame backgrounds.
 */
export async function playFli(m: Machine, file: string): Promise<boolean> {
  const bytes = m.files.get(file);
  if (!bytes || !isFli(bytes)) return false;
  const anim = parseFli(bytes);
  const canvas = newFliCanvas(anim);
  canvas.palette.set(m.screen.palette);
  canvas.pixels.set(m.screen.pixels.subarray(0, Math.min(canvas.pixels.length, m.screen.pixels.length)));
  let due = m.now();
  for (let f = 0; f < anim.frameCount; f++) {
    if (applyFliFrame(anim, f, canvas)) m.screen.setPalette(canvas.palette);
    m.screen.drawImage(canvas.pixels, anim.width, anim.height);
    if (anim.speed === 0) {
      await yieldTask();
      m.checkAbort();
      continue;
    }
    due += (anim.speed * 1000) / 70;
    do await m.frame();
    while (m.now() < due);
  }
  return true;
}

/**
 * Display_File: text pages over the current picture, 16 lines (rows 5..20 of 8 pixels)
 * per page. fgets(…, 32) read at most 31 characters at a time, so long lines wrap.
 */
export async function displayFile(
  m: Machine,
  file: string,
  col: number,
  pause: number,
  gamePalette: Uint8Array,
  bytes = m.files.get(file),
  look = STOCK_LOOK,
): Promise<boolean> {
  const saved = m.screen.snapshot();
  const red = look.color(gamePalette, 'color.select.textMissing');
  m.flushKeys();
  let escaped = false;
  if (!bytes) {
    m.screen.write(40, 80, red, look.text('str.text.missingTitle'));
    m.screen.write(40, 96, red, look.format('str.text.missingFile', file));
    m.screen.write(40, 104, red, look.text('str.text.missingTail'));
  } else {
    let vertpos = 5;
    for (const line of textLines(bytes)) {
      if (vertpos > 20) {
        m.screen.write(224, 168, red, look.text('str.text.more'));
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
