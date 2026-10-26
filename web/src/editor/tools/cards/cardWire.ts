// Puts a card into the game as its own files: the text page, and with a plain backdrop a GIF
// and a slide list (backdrop, then the page) that the scene's slot plays. The instruction card
// takes the start scene's instructions slot, a level card the level's intro slot, which
// PLAYGAME shows each time the level starts, after a death too. Files the slot held before stay.
import type { Scene } from '../../../formats/game';
import { serializeSlideList } from '../../../formats/graphicScripts';
import type { GameFiles } from '../../../project/files';
import { cardBackdrop } from './cardBackdrop';
import { cardFile } from './cardText';

/** What wiring needs of the project (a Project fits). */
interface CardProject {
  files: GameFiles;
  freeName(base: string, ext: string): string;
}

/** The start scene's instructions slot and a level's intro slot. */
export const INSTRUCTIONS_SLOT = 6;
export const INTRO_SLOT = 9;

/**
 * Writes the card's files and puts the first in `slot`. `seconds`: how long a page stays
 * without a key (none: until a key). Returns the files written, the slot's first.
 */
export function addCard(p: CardProject, scene: Scene, slot: number, stem: string, lines: string[], plain: boolean, seconds?: number): string[] {
  const txt = p.freeName(stem, 'txt');
  p.files.set(txt, cardFile(lines));
  if (!plain) {
    scene.files[slot] = txt;
    return [txt];
  }
  const gif = p.freeName(txt.replace(/\.txt$/, ''), 'gif');
  p.files.set(gif, cardBackdrop());
  const lst = p.freeName(txt.replace(/\.txt$/, ''), 'lst');
  // the backdrop goes straight on to the page (a pause of 0), which waits as asked
  p.files.set(
    lst,
    serializeSlideList([
      { name: gif, pause: 0 },
      { name: txt, pause: seconds },
    ]),
  );
  scene.files[slot] = lst;
  return [lst, gif, txt];
}
