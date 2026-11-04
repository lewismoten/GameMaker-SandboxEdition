// The game's title screen as a small indexed PNG data: URL, for the exported page to show
// where no script runs (a Files preview). Indexed color keeps a 320 x 200 picture to a few KB.
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { base64, encodePng } from '@lewismoten/gamemaker-sandbox-tools/image/png';
import { titlePixels } from '../gfx/titlePicture';
import type { FileSource } from '../gfx/levelPicture';

/** Undefined when the game has no title or menu picture, or it can't be read. */
export async function titleImage(files: FileSource, gam: string): Promise<string | undefined> {
  try {
    const bytes = files.get(gam);
    const pic = bytes && titlePixels(files, parseGame(bytes));
    if (!pic) return undefined;
    const png = await encodePng(pic);
    return `data:image/png;base64,${base64(png)}`;
  } catch {
    // no picture should never stop an export
    return undefined;
  }
}
