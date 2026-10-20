// Pictures for the Game Integrator: a level as the player first sees it (the map around
// the block the hero arrives on, with its monsters and the hero), and the between-scene
// graphics (.gif, .bkd, .fli, .lst, .txt) as a 320x200 screen.
import { paintIndexed } from './draw';
import type { GameFiles } from '../project/files';
import type { Point, Scene } from '../formats/game';
import { parseMap, MLEN, MWID } from '../formats/map';
import { BACKBL, BLEN, CHARBL, MONBL, TRANSPARENT, parseBlocks } from '../formats/blocks';
import { parseMonsters } from '../formats/monster';
import { parseCharacter } from '../formats/character';
import { defaultPalette, parsePalette } from '../formats/palette';
import { decodeGif, isGif } from '../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../formats/fli';
import { parseBackdrop, parseSlideList, textLines } from '../formats/graphicScripts';

/**
 * `cols` x `rows` blocks of a level's map centred on `at`, drawn the way the game draws
 * them: background blocks in the level's palette, placed monsters (first frame) and the
 * hero (first frame) standing on `at`. Undefined when the level has no map.
 */
export function levelShot(files: GameFiles, scene: Scene, at: Point, cols = 8, rows = 5): HTMLCanvasElement | undefined {
  const get = (i: number) => (scene.files[i] ? files.get(scene.files[i]) : undefined);
  const mapB = get(1);
  if (!mapB) return undefined;
  try {
    const palB = get(0);
    const pal = palB ? parsePalette(palB) : defaultPalette();
    const map = parseMap(mapB);
    const bblB = get(2);
    const blocks = bblB ? parseBlocks(bblB, BACKBL) : [];
    const monB = get(3);
    const mblB = get(4);
    const mons = monB ? parseMonsters(monB) : [];
    const mblocks = mblB ? parseBlocks(mblB, MONBL) : [];
    const W = cols * BLEN;
    const pixels = new Uint8Array(W * rows * BLEN);
    const paint = (px: Uint8Array | undefined, bx: number, by: number, transparent: boolean) => {
      if (!px || bx < 0 || by < 0 || bx >= cols || by >= rows) return;
      for (let yy = 0; yy < BLEN; yy++)
        for (let xx = 0; xx < BLEN; xx++) {
          const c = px[yy * BLEN + xx];
          if (!transparent || c !== TRANSPARENT) pixels[(by * BLEN + yy) * W + bx * BLEN + xx] = c;
        }
    };
    const x0 = at.x - Math.floor(cols / 2);
    const y0 = at.y - Math.floor((rows - 1) / 2);
    for (let by = 0; by < rows; by++)
      for (let bx = 0; bx < cols; bx++) {
        const mx = (((x0 + bx) % MLEN) + MLEN) % MLEN;
        const my = (((y0 + by) % MWID) + MWID) % MWID;
        const cell = my * MLEN + mx;
        paint((blocks[map.blocks[cell]] ?? blocks[0])?.pixels, bx, by, false);
        const placed = map.monsters[map.mons[cell]];
        const pic = placed && mons[placed.monnum]?.pic[0]?.[0];
        if (pic !== undefined && pic >= 0) paint(mblocks[pic]?.pixels, bx, by, true);
      }
    // the hero
    const chrB = get(5);
    const cblB = get(6);
    if (chrB && cblB) {
      const frame = parseCharacter(chrB).sequences[0]?.frames[0];
      const cbl = parseBlocks(cblB, CHARBL);
      if (frame) {
        paint(cbl[frame.pic1]?.pixels, at.x - x0, at.y - y0, true);
        paint(cbl[frame.pic2]?.pixels, at.x - x0, at.y - y0 + 1, true);
      }
    }
    const canvas = document.createElement('canvas');
    paintIndexed(canvas, pixels, W, rows * BLEN, pal);
    return canvas;
  } catch {
    return undefined;
  }
}

/** A 320x200 screen showing a between-scene graphic as the game would start it, or undefined. */
export function graphicShot(files: GameFiles, name: string, depth = 0): HTMLCanvasElement | undefined {
  const bytes = files.get(name);
  if (!bytes || depth > 3) return undefined;
  const ext = name.toLowerCase().split('.').pop();
  const screen = (w = 320, h = 200) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };
  try {
    switch (ext) {
      case 'gif': {
        if (!isGif(bytes)) return undefined;
        const g = decodeGif(bytes);
        const c = screen(g.width, g.height);
        paintIndexed(c, g.pixels, g.width, g.height, g.palette);
        return c;
      }
      case 'bkd': {
        const b = parseBackdrop(bytes);
        const whole = graphicShot(files, b.gif, depth + 1);
        if (!whole) return undefined;
        const c = screen();
        c.getContext('2d')!.drawImage(whole, -b.x, -b.y);
        return c;
      }
      case 'fli': {
        if (!isFli(bytes)) return undefined;
        const anim = parseFli(bytes);
        const fc = newFliCanvas(anim);
        // the first frame with something on it
        for (let f = 0; f < Math.min(anim.frames.length, 8); f++) {
          applyFliFrame(anim, f, fc);
          if (fc.pixels.some((p) => p !== 0)) break;
        }
        const c = screen(anim.width, anim.height);
        paintIndexed(c, fc.pixels, anim.width, anim.height, fc.palette);
        return c;
      }
      case 'lst': {
        for (const e of parseSlideList(bytes)) {
          const c = graphicShot(files, e.name, depth + 1);
          if (c) return c;
        }
        return undefined;
      }
      case 'txt': {
        // Display_File: 31-column lines on the game screen
        const c = screen();
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 320, 200);
        ctx.fillStyle = '#e0e0e0';
        ctx.font = '8px ui-monospace, Menlo, monospace';
        ctx.textBaseline = 'top';
        textLines(bytes)
          .slice(0, 24)
          .forEach((line, i) => ctx.fillText(line, 36, 4 + i * 8, 248));
        return c;
      }
    }
  } catch {
    /* unreadable: no picture */
  }
  return undefined;
}
