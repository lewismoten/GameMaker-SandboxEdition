// The game's title screen as a small indexed PNG data: URL, for the exported page to show
// where no script runs (a Files preview). Indexed color keeps a 320 x 200 picture to a few KB.
import { STARTTYPE, parseGame, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { base64, encodePng } from '@lewismoten/gamemaker-sandbox-tools/image/png';
import { titlePixels } from '../gfx/titlePicture';
import type { FileSource, LevelPicture } from '../gfx/levelPicture';

/**
 * The first picture of the title's animation (a starter's title is an FLI, which has no still): the first
 * frame that isn't blank within the opening second or so, at the animation's own size.
 */
function fliFirstFrame(files: FileSource, game: Game): LevelPicture | undefined {
  const start = game.scenes.find((s) => s.gametype === STARTTYPE);
  for (const name of start?.files.slice(0, 3) ?? []) {
    const bytes = name && /\.fli$/i.test(name) ? files.get(name) : undefined;
    if (!bytes || !isFli(bytes)) continue;
    const anim = parseFli(bytes);
    const c = newFliCanvas(anim);
    for (let f = 0; f < Math.min(anim.frameCount, 30); f++) {
      applyFliFrame(anim, f, c);
      if (new Set(c.pixels).size > 3 || f === Math.min(anim.frameCount, 30) - 1)
        return { width: anim.width, height: anim.height, pixels: c.pixels.slice(), palette: c.palette.slice() };
    }
  }
  return undefined;
}

/** Undefined when the game has no title or menu picture, or it can't be read. */
export async function titleImage(files: FileSource, gam: string): Promise<string | undefined> {
  try {
    const bytes = files.get(gam);
    const game = bytes && parseGame(bytes);
    const pic = game && (titlePixels(files, game) ?? fliFirstFrame(files, game));
    if (!pic) return undefined;
    const png = await encodePng(pic);
    return `data:image/png;base64,${base64(png)}`;
  } catch {
    // no picture should never stop an export
    return undefined;
  }
}
