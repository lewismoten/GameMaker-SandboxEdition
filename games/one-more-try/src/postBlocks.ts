// TRY AGAIN's own block, added to the Starter block set after the signs:
//   post   a wooden post with a board on top showing a loop of arrow. It is an ordinary block (not solid,
//          nothing happens when it is touched). What makes it a way to start over is a scene link in the
//          .GAM that starts at the post's square and leads back to this same scene (game.ts).
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { PULL, type Book } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

/** A post, 20 by 20: a board with a red loop of arrow on it, on a wooden stake. */
function post(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const w = pal.r('wood');
  const paper = pal.r('parch');
  const red = pal.c('red', 0);
  p.rect(8, 11, 4, 9, w[2]).rect(8, 11, 1, 9, w[3]).rect(11, 11, 1, 9, w[1]);
  p.rect(2, 1, 16, 11, paper[2]).rect(2, 1, 16, 1, paper[3]).rect(2, 11, 16, 1, paper[1]);
  // the loop: most of a ring around the middle of the board, open at the top right, with an arrowhead
  const cx = 9.5;
  const cy = 6.5;
  for (let a = 60; a <= 340; a += 6)
    for (const r of [3, 3.8]) p.set(Math.round(cx + r * Math.cos((a * Math.PI) / 180)), Math.round(cy + r * Math.sin((a * Math.PI) / 180)), red);
  // the arrowhead at the open end, pointing along the loop
  p.rect(12, 2, 4, 1, red).rect(13, 3, 3, 1, red).rect(14, 4, 2, 1, red);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** Adds the post to `book` (after addStarterBlocks and the signs). */
export function addPostBlocks(book: Book, pal: Pal): void {
  book.add('post', post(pal), { grav: PULL.down });
}
