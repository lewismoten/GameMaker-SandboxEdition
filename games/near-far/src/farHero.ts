// Kit in the far plane: the same character file, with every frame redrawn half the size. A far scene loads
// far.chr and far.cbl in place of hero.chr and hero.cbl. Each frame's head and body (two 20 x 20 blocks) are
// put together, shrunk to 10 x 20, and stood in one block on the ground line; the top block is left empty.
// He still moves, jumps and bumps exactly as the near Kit does (the keys, the speeds and the 2-block hitbox
// are the same), so only the picture is small.
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { half } from './scenery';

const CLEAR = 255;

/** The far character file and its blocks, made from the near ones (`blocks` is buildHeroBlocks, `chr` is buildHero). */
export function farHero(blocks: Book, chr: Character): { blocks: Book; character: Character } {
  const byNumber: Pixels[] = [];
  for (const [name, n] of blocks.index) byNumber[n] = blocks.pics.get(name)!;
  const far = new Book('cbl');
  const made = new Map<string, number>();
  const character: Character = structuredClone(chr);
  for (const seq of character.sequences)
    for (const f of seq.frames) {
      if (f.pic2 >= CHARBL) continue; // an empty frame or the end of a sequence
      const key = `${f.pic1},${f.pic2}`;
      let n = made.get(key);
      if (n === undefined) {
        const whole = new Pixels(20, 40, CLEAR);
        if (f.pic1 < CHARBL) whole.blit(byNumber[f.pic1], 0, 0, CLEAR);
        whole.blit(byNumber[f.pic2], 0, 20, CLEAR);
        const block = new Pixels(20, 20, CLEAR).blit(half(whole, CLEAR), 5, 0, CLEAR);
        n = far.add(`far.${made.size}`, block);
        made.set(key, n);
      }
      f.pic1 = CHARBL;
      f.pic2 = n;
    }
  return { blocks: far, character };
}
