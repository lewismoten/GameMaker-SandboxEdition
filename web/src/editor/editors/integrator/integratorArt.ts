// Pictures for the Game Integrator: a level as the player first sees it (the map around
// the block the hero arrives on, with its monsters and the hero), and the between-scene
// graphics (.gif, .bkd, .fli, .lst, .txt) as a 320x200 screen.
import { paintIndexed } from '../../core/draw';
import type { GameFiles } from '../../../project/files';
import type { Point, Scene } from '../../../formats/game';
import { levelPixels } from '../../../gfx/levelPicture';
import { decodeGif, isGif } from '../../../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../../../formats/fli';
import { parseBackdrop, parseSlideList, textLines } from '../../../formats/graphicScripts';

/**
 * `cols` x `rows` blocks of a level's map centered on `at`, drawn the way the game draws
 * them: background blocks in the level's palette, placed monsters (first frame) and the
 * hero (first frame) standing on `at`. Undefined when the level has no map.
 */
export function levelShot(files: GameFiles, scene: Scene, at: Point, cols = 8, rows = 5): HTMLCanvasElement | undefined {
  const pic = levelPixels(files, scene, at, cols, rows);
  if (!pic) return undefined;
  const canvas = document.createElement('canvas');
  paintIndexed(canvas, pic.pixels, pic.width, pic.height, pic.palette);
  return canvas;
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
