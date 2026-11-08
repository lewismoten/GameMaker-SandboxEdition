// The real engine's words over a picture: copies the picture onto the engine's Screen (with a
// stand-in canvas, as games/kit/cdDemos/headless.ts does) and calls the same drawing PLAYGAME's
// port uses for the menu, the high scores and the save and load lists. MAKE A TITLE's level 1
// shows its menu template with these words on it, and tools/templateCheck.ts checks every word
// pixel falls inside a template box.
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { STOCK_LOOK as look } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import { drawHighScores, drawMenu, drawNoFile, menuMarker } from '@lewismoten/gamemaker-sandbox-engine/engine/menus';
import { drawSaveSlots } from '@lewismoten/gamemaker-sandbox-engine/engine/funcKeys';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';

function canvas(): HTMLCanvasElement {
  const ctx = { createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }), putImageData() {} };
  return { width: 320, height: 200, getContext: () => ctx } as unknown as HTMLCanvasElement;
}

/** What to write: the menu (the game's name), the high scores (rows of score and name), or a save or load list (ten names). */
export type Words =
  | { kind: 'menu'; title: string; noFile?: 'noInstructions' | 'noStoryline' | 'noCredits'; marker?: number[] }
  | { kind: 'scores'; rows: { score: number; name: string }[]; latest: number }
  | { kind: 'slots'; saving: boolean; names: string[]; marker?: number[]; line?: [number, string][] };

/**
 * Draws `words` over `picture` (palette `pal`, 6-bit VGA levels as the engine keeps them) and returns the
 * result. Marker rows (1-based) are filled the way GVertMenu fills its marker; `line` writes the
 * messages under a save or load list at y 185 in the nearest blue, as SaveGame and LoadGame do.
 */
export function withEngineWords(picture: Pixels, pal: Uint8Array, words: Words): Pixels {
  const s = new Screen(canvas());
  s.pixels.set(picture.px);
  if (words.kind === 'menu') {
    const col = drawMenu(s, look, pal, words.title);
    if (words.noFile) drawNoFile(s, look, pal, words.noFile);
    const m = menuMarker(look);
    for (const c of words.marker ?? []) s.boxFill(m.x, m.y - 8 + c * m.dy, m.x + m.width, m.y - 8 + c * m.dy + 4, col);
  } else if (words.kind === 'scores') {
    drawHighScores(s, look, pal, words.rows, words.latest);
  } else {
    drawSaveSlots(s, look, pal, words.names, words.saving);
    const red = look.color(pal, words.saving ? 'color.select.saveMarker' : 'color.select.loadMarker');
    const w = look.num('border.marker.width');
    for (const c of words.marker ?? []) s.boxFill(60, 35 - 8 + c * 14, 60 + w, 35 - 8 + c * 14 + 4, red);
    const blue = look.color(pal, words.saving ? 'color.select.saveTextPic' : 'color.select.loadTextPic');
    for (const [x, t] of words.line ?? []) s.write(x, 185, blue, t);
  }
  const out = new Pixels(320, 200, 0);
  out.px.set(s.pixels);
  return out;
}
