// The stage: the set of THE RAVEN'S BRIDE, the spot where Victor Crane fell, the ghost light
// (at night something drifts out of it now and then), and the wings: fly rail ropes and the
// prop table.
import { Pixels } from '../../../kit/pixels';
import { blob, microC, pool } from '../art/draw';
import { c, ramp as r } from '../art/pal';
import { Add, S, on, wallFace } from './painters';

export function addStage(add: Add, { B, ST }: { B: Pixels; ST: Pixels }) {
  // The set of THE RAVEN'S BRIDE, and the spot where Victor Crane fell
  const bierBig = new Pixels(40, 20);
  bierBig.blit(ST, 0, 0).blit(ST, 20, 0);
  bierBig.rect(2, 3, 36, 14, c('gray', 2)).rect(2, 3, 36, 2, c('gray', 4)).rect(2, 15, 36, 2, c('gray', 0));
  bierBig.rect(5, 6, 30, 8, c('velvet', 1));
  for (let x = 6; x < 34; x += 4) bierBig.set(x, 9, c('gold', 2));
  add('bier0', bierBig.crop(0, 0, 20, 20), S);
  add('bier1', bierBig.crop(20, 0, 20, 20), S);
  const tapeBig = new Pixels(40, 20);
  tapeBig.blit(ST, 0, 0).blit(ST, 20, 0);
  const tape = c('paper', 5);
  tapeBig.ring(6, 6, 4, tape);
  tapeBig.line(10, 7, 28, 8, tape).line(10, 11, 28, 12, tape);
  tapeBig.line(14, 7, 18, 2, tape).line(14, 11, 18, 17, tape);
  tapeBig.line(28, 8, 37, 4, tape).line(28, 12, 37, 16, tape);
  add('tape0', tapeBig.crop(0, 0, 20, 20));
  add('tape1', tapeBig.crop(20, 0, 20, 20));
  add(
    'goblet',
    on(ST, (p) => {
      p.disc(10, 10, 7, c('wood', 1));
      p.disc(10, 10, 6, c('wood', 3));
      p.rect(8, 5, 4, 6, c('gold', 3)).rect(9, 11, 2, 3, c('gold', 2)).rect(7, 14, 6, 1, c('gold', 3));
      p.rect(9, 6, 2, 2, c('velvet', 3));
    }),
    S,
  );
  add(
    'throne',
    on(ST, (p) => {
      p.rect(3, 1, 14, 6, c('gold', 2)).rect(4, 2, 12, 4, c('velvet', 2));
      p.rect(3, 7, 14, 11, c('velvet', 3)).rect(1, 7, 3, 11, c('gold', 2)).rect(16, 7, 3, 11, c('gold', 2));
      p.set(6, 0, c('gold', 4)).set(10, 0, c('gold', 4)).set(14, 0, c('gold', 4));
    }),
    S,
  );
  add(
    'trapdoor',
    on(ST, (p) => {
      p.frame(1, 1, 18, 18, c('wood', 0));
      p.frame(2, 2, 16, 16, c('wood', 7));
      p.rect(9, 8, 2, 4, c('gray', 4));
    }),
  );
  const ghostPole = (lit: number) =>
    on(ST, (p) => {
      if (lit) pool(p, 10, 10, 9 + lit, 9 + lit, r('ghost'), 0, lit);
      p.disc(10, 16, 4, c('black', 1));
      p.rect(9, 6, 2, 10, c('gray', 3));
      p.rect(7, 3, 6, 4, c('black', 2));
      blob(p, 10, 6, 3, 3, lit ? r('ghost') : r('gray'), lit ? 2 : 3, lit ? 3 : 5);
    });
  add('ghostlight', ghostPole(0), S);
  // At night the ghost light burns, and something drifts out of it now and then.
  add('ghostlit', ghostPole(1), { ...S, next: 'ghostlit2', ntime: 5, birthMon: 3, birthTime: 220 });
  add('ghostlit2', ghostPole(2), { ...S, next: 'ghostlit', ntime: 3 });

  // Wings: fly rail ropes, prop table
  add(
    'ropes',
    on(wallFace(), (p) => {
      p.rect(0, 3, 20, 14, c('panel', 2));
      for (let x = 2; x < 20; x += 4) p.rect(x, 3, 1, 14, c('tan', 3));
      p.rect(0, 12, 20, 2, c('gray', 4));
    }),
    S,
  );
  const propTable = new Pixels(60, 20);
  for (let i = 0; i < 3; i++) propTable.blit(B, i * 20, 0);
  propTable.rect(1, 2, 58, 15, c('wood', 1)).rect(1, 2, 58, 1, c('wood', 4)).rect(2, 3, 56, 13, c('paper', 1));
  for (let i = 0; i < 6; i++) propTable.frame(3 + i * 9, 4, 8, 10, c('paper', 4));
  propTable.rect(5, 8, 5, 2, c('gold', 3)); // a crown
  propTable.line(13, 12, 19, 6, c('gray', 5)).rect(12, 11, 3, 2, c('gold', 2)); // a sword
  propTable.rect(31, 7, 4, 4, c('gold', 2)); // a goblet
  propTable.disc(40, 9, 2, c('velvet', 4)); // a rose
  microC(propTable, 50, 6, '?', c('velvet', 2)); // the dagger's empty outline
  propTable.frame(46, 8, 9, 3, c('black', 3));
  for (let i = 0; i < 3; i++) add(`proptable${i}`, propTable.crop(i * 20, 0, 20, 20), S);
  add(
    'crate',
    on(B, (p) => {
      p.rect(2, 2, 16, 16, c('wood', 3)).frame(2, 2, 16, 16, c('wood', 1));
      p.line(2, 2, 17, 17, c('wood', 1)).line(17, 2, 2, 17, c('wood', 1));
    }),
    S,
  );
}
