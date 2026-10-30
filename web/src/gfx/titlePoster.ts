// Click-to-play artwork for imported projects and bundles, drawn from their own title files.
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { titlePixels } from './titlePicture';
import { paintIndexed } from '../editor/core/draw';
import type { FileSource } from './levelPicture';

export function titlePoster(files: FileSource, gam: string): string | undefined {
  try {
    const bytes = files.get(gam);
    if (!bytes) return undefined;
    const picture = titlePixels(files, parseGame(bytes));
    if (!picture) return undefined;
    const canvas = document.createElement('canvas');
    paintIndexed(canvas, picture.pixels, picture.width, picture.height, picture.palette);
    return canvas.toDataURL('image/png');
  } catch {
    // Missing or damaged art should never prevent a game from reaching its Play button.
    return undefined;
  }
}
