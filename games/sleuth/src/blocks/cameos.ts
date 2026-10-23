// Friends from other Sandbox games, hung about the Paragon's lobby:
//   - a playbill for Will, the bald bard of SHAKESPEARE IN SWEATPANTS, in his starched ruff,
//     velvet doublet, grey sweatpants and fuzzy slippers: ALAS, BARD (two blocks, on the lobby wall)
//   - a tin heart with a little clock face, dropped behind the bar (100 points; a glint
//     crosses it now and then)
import { microC } from '../art/draw';
import { c } from '../art/pal';
import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
import { Add, S, marble, on, wallFace } from './painters';

export function addCameos(add: Add) {
  add(
    'will0',
    on(wallFace(), (p) => {
      // one playbill across both blocks: its gold frame open on the right here
      p.rect(2, 2, 18, 17, c('black', 1)).rect(2, 2, 18, 1, c('gold', 3)).rect(2, 18, 18, 1, c('gold', 3)).rect(2, 2, 1, 17, c('gold', 3));
      // the bald dome and its shine, the fringe over the ears, a gold earring, the pointed beard
      p.disc(10, 6, 2.8, c('skin', 3));
      p.set(9, 4, c('skin', 5));
      p.rect(7, 6, 1, 2, c('auburn', 0)).rect(12, 6, 1, 2, c('auburn', 0)).set(7, 8, c('gold', 4));
      p.set(9, 6, c('black', 0)).set(11, 6, c('black', 0));
      p.rect(9, 8, 3, 1, c('auburn', 0)).set(10, 9, c('auburn', 0));
      // the starched white ruff
      for (let x = 6; x <= 14; x++) p.set(x, 10, c('paper', x % 2 ? 4 : 5)).set(x, 11, c('paper', x % 2 ? 5 : 3));
      // the velvet doublet and its gold buttons, sleeves and hands
      p.rect(7, 12, 7, 3, c('plum', 2)).set(10, 12, c('gold', 4)).set(10, 14, c('gold', 4));
      p.rect(6, 12, 1, 3, c('plum', 1)).rect(14, 12, 1, 3, c('plum', 1)).set(6, 15, c('skin', 3)).set(14, 15, c('skin', 3));
      // the grey sweatpants and fuzzy pink slippers
      p.rect(7, 15, 7, 2, c('grey', 5)).set(10, 16, c('grey', 3));
      p.rect(6, 17, 3, 1, c('velvet', 6)).rect(12, 17, 3, 1, c('velvet', 6));
    }),
    S,
  );
  add(
    'will1',
    on(wallFace(1), (p) => {
      p.rect(0, 2, 18, 17, c('black', 1)).rect(0, 2, 18, 1, c('gold', 3)).rect(0, 18, 18, 1, c('gold', 3)).rect(17, 2, 1, 17, c('gold', 3));
      microC(p, 8, 5, 'ALAS', c('gold', 5));
      microC(p, 8, 12, 'BARD', c('paper', 5));
    }),
    S,
  );
  const tin = { ink: c('black', 0), tin: [c('grey', 3), c('grey', 5), c('grey', 6)], white: c('grey', 7), dark: c('grey', 1) };
  for (let k = 0; k < SHINE_FRAMES; k++)
    add(
      `tinHeart${k || ''}`,
      on(marble(), (p) => drawTinHeart(p, tin, k)),
      { next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`, ntime: k ? 2 : 50, touch: 'marble', score: 100 },
    );
}
