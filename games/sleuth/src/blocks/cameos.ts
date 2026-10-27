// Friends from other Sandbox games, hung about the Paragon's lobby:
//   - a playbill for Will, the bald bard of SHAKESPEARE IN SWEATPANTS, in his starched ruff,
//     velvet doublet, gray sweatpants and fuzzy slippers: ALAS, BARD (two blocks, on the lobby wall)
//   - a playbill for Doc Leo, the friendly hobo clown, with his rubber chicken on its leash
//   - a tin heart with a little clock face, glinting on a flagstone in a far corner of the
//     dark trap room (100 points; a glint crosses it now and then)
//   - a painted Easter egg, rolled into the side aisle of the stalls (50 points)
import { microC } from '../art/draw';
import { c } from '../art/pal';
import { drawTinHeart } from '../../../kit/tinHeart';
import { drawEasterEgg } from '../../../kit/easterEgg';
import { Add, S, carpet, flagstones, on, wallFace } from './painters';

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
      // the gray sweatpants and fuzzy pink slippers
      p.rect(7, 15, 7, 2, c('gray', 5)).set(10, 16, c('gray', 3));
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
  // a playbill for Doc Leo, the friendly hobo clown, and his rubber chicken on its leash
  add(
    'leo0',
    on(wallFace(), (p) => {
      p.rect(2, 2, 18, 17, c('black', 1)).rect(2, 2, 18, 1, c('gold', 3)).rect(2, 18, 18, 1, c('gold', 3)).rect(2, 2, 1, 17, c('gold', 3));
      // the chewed-up gray fedora
      p.rect(7, 3, 6, 2, c('gray', 4)).rect(5, 5, 10, 1, c('gray', 3)).set(8, 4, c('velvet', 5));
      // the face: stubble, white round the eyes, his own nose, sunburned cheeks, a white mouth patch, a grin
      p.rect(7, 6, 6, 4, c('skin', 4)).rect(7, 9, 6, 1, c('gray', 2));
      p.rect(7, 6, 2, 2, c('paper', 5)).rect(11, 6, 2, 2, c('paper', 5));
      p.set(8, 7, c('black', 0)).set(11, 7, c('black', 0)).rect(9, 7, 2, 2, c('skin', 2));
      p.set(7, 8, c('velvet', 7)).set(12, 8, c('velvet', 7));
      p.rect(8, 9, 4, 1, c('paper', 5)).set(9, 9, c('velvet', 2)).set(10, 9, c('velvet', 2));
      // navy corduroy over a purple shirt and a green tie
      p.rect(6, 10, 8, 5, c('navy', 2)).rect(8, 10, 4, 5, c('plum', 3)).rect(9, 10, 2, 4, c('green', 3));
      p.set(5, 14, c('skin', 4)).set(14, 13, c('skin', 4));
      // trousers and red sneakers
      p.rect(7, 15, 2, 2, c('navy', 1)).rect(11, 15, 2, 2, c('navy', 1));
      p.rect(6, 17, 3, 1, c('velvet', 4)).rect(11, 17, 3, 1, c('velvet', 4));
      // the leash, and Sir Reginald, the yellow rubber chicken, with his red comb
      p.line(14, 13, 15, 15, c('velvet', 3));
      p.rect(15, 15, 3, 2, c('blonde', 2)).set(18, 14, c('blonde', 2)).set(18, 13, c('velvet', 4)).set(19, 14, c('tan', 3));
      p.set(16, 17, c('tan', 3)).set(18, 15, c('blonde', 1));
    }),
    S,
  );
  add(
    'leo1',
    on(wallFace(1), (p) => {
      p.rect(0, 2, 18, 17, c('black', 1)).rect(0, 2, 18, 1, c('gold', 3)).rect(0, 18, 18, 1, c('gold', 3)).rect(17, 2, 1, 17, c('gold', 3));
      microC(p, 8, 4, 'DOC', c('gold', 5));
      microC(p, 8, 11, 'LEO', c('gold', 5));
    }),
    S,
  );
  const tin = { ink: c('black', 0), tin: [c('gray', 3), c('gray', 5), c('gray', 6)], white: c('gray', 7), dark: c('gray', 1) };
  // (two frames, plain and glinting: the block set has room for no more)
  add(
    'tinHeart',
    on(flagstones(5), (p) => drawTinHeart(p, tin, 0)),
    { next: 'tinHeart1', ntime: 50, touch: 'litfloor', score: 100 },
  );
  add(
    'tinHeart1',
    on(flagstones(5), (p) => drawTinHeart(p, tin, 2)),
    { next: 'tinHeart', ntime: 3, touch: 'litfloor', score: 100 },
  );
  // the painted Easter egg on the stalls' carpet (one frame: it takes the set's last free block)
  const egg = {
    ink: c('black', 0),
    shell: [c('teal', 1), c('teal', 2), c('teal', 3)],
    paint: [c('gold', 3), c('gold', 5)],
    accent: c('paper', 5),
    white: c('paper', 5),
  };
  add(
    'easterEgg',
    on(carpet(0), (p) => drawEasterEgg(p, egg, 'bands', 0)),
    { touch: 'carpet', score: 50 },
  );
}
