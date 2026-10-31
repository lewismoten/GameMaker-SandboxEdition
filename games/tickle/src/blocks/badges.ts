// Thirteen small scenery blocks for the site's achievement badges (art by Claude Sonnet 5.5): a toolbox, a wall
// clipboard, a mixing panel, a UV bulb, a blacklight, a CRT with color rings, a PC speaker and sound card, a hex
// keypad, a screwdriver and disk, a pirate hat over a DOS prompt, a surfer on a coil's arc, a fax and a waving
// hand beside a terminal. Plain scenery (air): the course's desks and the lab's walls hold them; nothing here is
// solid or hurts. Added last, so the earlier blocks keep their numbers.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { micro } from '../../../snowbound/src/art/font';
import type { BlockBook } from '../blocks/blocks';
import type { Pal } from '../art/pal';

/** The walls the scenery hangs on (the same ones the rest of the game draws). */
export interface Backdrops {
  course: () => Pixels;
  wains: () => Pixels;
  lab: () => Pixels;
  tower: () => Pixels;
}

export function addBadgeBlocks(book: BlockBook, pal: Pal, bg: Backdrops): void {
  const { c } = pal;
  const air = { grav: 4 };
  const add = (name: string, p: Pixels) => book.add(name, p, air);

  // an open toolbox on the floor, a pencil and a wrench standing up out of it
  {
    const p = bg.wains();
    p.rect(3, 3, 14, 7, c('red', 2)).rect(3, 3, 14, 1, c('red', 3)).rect(3, 9, 14, 1, c('red', 0)); // lid, tipped up behind
    p.rect(2, 11, 16, 8, c('red', 1)).rect(2, 11, 16, 1, c('red', 3)).rect(2, 18, 16, 1, c('red', 0)).rect(3, 12, 14, 1, c('ink', 0));
    p.rect(8, 14, 4, 3, c('gold', 2)).rect(9, 15, 2, 1, c('ink', 0));
    p.line(6, 11, 5, 2, c('cheese', 1)).line(7, 11, 6, 2, c('cheese', 2)).set(5, 1, c('ink', 0)).set(6, 1, c('skin', 3)).line(6, 12, 7, 12, c('pink', 1));
    p.rect(12, 5, 2, 6, c('steel', 3))
      .rect(13, 5, 1, 6, c('steel', 4))
      .rect(11, 2, 5, 3, c('steel', 3))
      .rect(13, 2, 1, 2, c('ink', 0))
      .rect(11, 2, 5, 1, c('steel', 4));
    add('toolbox', p);
  }

  // a clipboard on the wall, one big green check
  {
    const p = bg.course();
    p.rect(3, 2, 14, 17, c('wood', 2)).rect(3, 2, 14, 1, c('wood', 3)).rect(3, 18, 14, 1, c('wood', 0));
    p.rect(5, 4, 10, 13, c('paper', 2)).rect(7, 0, 6, 4, c('steel', 3)).rect(8, 0, 4, 1, c('steel', 4)).rect(9, 1, 2, 2, c('ink', 0));
    p.rect(6, 15, 6, 1, c('paper', 0));
    for (const [dx, dy, k] of [
      [1, 1, 1],
      [0, 0, 3],
    ] as const)
      p.line(6 + dx, 10 + dy, 8 + dx, 13 + dy, c('green', k))
        .line(7 + dx, 10 + dy, 9 + dx, 13 + dy, c('green', k))
        .line(8 + dx, 13 + dy, 13 + dx, 6 + dy, c('green', k))
        .line(9 + dx, 13 + dy, 14 + dx, 7 + dy, c('green', k));
    add('clipboardOk', p);
  }

  // a mixing panel, three chunky knobs
  {
    const p = bg.lab();
    p.rect(1, 3, 18, 14, c('steel', 1)).rect(1, 3, 18, 1, c('steel', 3)).rect(2, 4, 16, 12, c('ink', 0));
    for (const [x, a] of [
      [5, -2.3],
      [10, -1.57],
      [15, -0.8],
    ] as const) {
      p.disc(x, 10, 3, c('steel', 2))
        .disc(x, 10, 2.4, c('steel', 4))
        .set(x - 1, 9, c('paint', 1));
      p.line(x, 10, x + Math.cos(a) * 3, 10 + Math.sin(a) * 3, c('red', 2));
      p.set(x, 5, x === 10 ? c('potion', 3) : c('red', 3)).set(x, 14, c('steel', 3));
    }
    add('mixer', p);
  }

  // a UV bulb in the ceiling socket, glowing violet
  {
    const p = bg.lab();
    p.rect(7, 0, 6, 4, c('gray', 1)).rect(7, 1, 6, 1, c('gray', 2)).rect(7, 3, 6, 1, c('gray', 0)).rect(8, 4, 4, 2, c('glass', 0));
    p.disc(10, 10, 6, c('purple', 1)).disc(10, 10, 5, c('purple', 2)).disc(10, 10, 3, c('spark', 2)).disc(10, 10, 2, c('spark', 3));
    for (const [x, y] of [
      [1, 10],
      [2, 5],
      [18, 10],
      [17, 5],
      [3, 17],
      [16, 17],
      [10, 19],
      [6, 19],
      [14, 19],
    ] as const)
      p.set(x, y, c('purple', 2));
    add('uvBulb', p);
  }

  // a blacklight tube over a star that glows under it
  {
    const p = bg.lab();
    p.rect(1, 3, 18, 4, c('purple', 1))
      .rect(1, 4, 18, 2, c('purple', 2))
      .rect(2, 4, 16, 1, c('spark', 3))
      .rect(0, 2, 2, 6, c('gray', 1))
      .rect(18, 2, 2, 6, c('gray', 1))
      .rect(0, 2, 2, 1, c('gray', 2));
    for (const [x, y] of [
      [4, 8],
      [7, 9],
      [13, 9],
      [16, 8],
      [5, 10],
      [15, 10],
    ] as const)
      p.set(x, y, c('purple', 2));
    p.line(10, 9, 10, 18, c('pink', 1)).line(5, 13, 15, 13, c('pink', 1)).line(7, 10, 13, 16, c('pink', 0)).line(13, 10, 7, 16, c('pink', 0));
    p.disc(10, 13, 2, c('pink', 2)).set(10, 13, c('paint', 1)).set(10, 12, c('paint', 1));
    add('blacklight', p);
  }

  // a CRT whose screen shows the degauss rings
  {
    const p = bg.lab();
    p.rect(2, 2, 16, 14, c('paper', 1))
      .rect(2, 2, 16, 1, c('paper', 2))
      .rect(2, 15, 16, 1, c('paper', 0))
      .rect(17, 3, 1, 12, c('paper', 0))
      .rect(4, 4, 12, 10, c('ink', 0));
    p.rect(8, 16, 4, 2, c('paper', 0)).rect(4, 18, 12, 2, c('paper', 0)).rect(4, 18, 12, 1, c('paper', 1)).set(16, 14, c('potion', 3));
    const rings = [
      [1, 'red', 2],
      [2, 'gold', 3],
      [3, 'potion', 3],
      [4, 'blue', 3],
    ] as const;
    for (const [r, n, k] of rings) {
      p.ring(10, 9, r, c(n, k));
      p.ring(10, 9, r + 0.4, c(n, k));
    }
    for (let x = 4; x < 16; x++) {
      p.set(x, 4, c('ink', 0));
      p.set(x, 13, c('ink', 0));
    }
    add('crtRings', p);
  }

  // a beige PC speaker beside a sound card that makes no sound (the note is crossed out)
  {
    const p = bg.lab();
    p.rect(0, 7, 10, 12, c('paper', 1)).rect(0, 7, 10, 1, c('paper', 2)).rect(0, 18, 10, 1, c('paper', 0));
    p.disc(5, 13, 4, c('ink', 0)).ring(5, 13, 3, c('gray', 1)).disc(5, 13, 1, c('gray', 0));
    p.rect(11, 2, 8, 17, c('tie', 1)).rect(11, 2, 1, 17, c('steel', 3)).rect(12, 2, 7, 1, c('tie', 2)).rect(12, 16, 6, 3, c('gold', 2));
    for (let x = 13; x < 18; x += 2) p.set(x, 17, c('ink', 0)).set(x, 18, c('ink', 0));
    p.rect(13, 6, 4, 4, c('ink', 0)).set(13, 5, c('steel', 3)).set(15, 5, c('steel', 3)).set(17, 5, c('steel', 3)).rect(13, 11, 5, 1, c('tie', 3));
    p.line(3, 1, 3, 5, c('paint', 1)).disc(2, 5, 1, c('paint', 1)).set(4, 1, c('paint', 1)).set(5, 2, c('paint', 1));
    p.line(0, 0, 7, 6, c('red', 2)).line(1, 0, 8, 6, c('red', 2));
    add('soundCard', p);
  }

  // a hex keypad with the A and F keys lit
  {
    const p = bg.lab();
    p.rect(1, 1, 18, 18, c('steel', 1)).rect(1, 1, 18, 1, c('steel', 3)).rect(2, 2, 16, 6, c('ink', 0));
    micro(p, 6, 3, 'AF', c('potion', 3));
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 4; col++) {
        const lit = (row === 0 && col === 1) || (row === 2 && col === 3);
        p.rect(2 + col * 4, 10 + row * 3, 3, 2, lit ? c('cheese', 2) : c('steel', 3)).rect(
          2 + col * 4,
          10 + row * 3,
          3,
          1,
          lit ? c('cheese', 1) : c('steel', 4),
        );
      }
    add('hexPad', p);
  }

  // a screwdriver across a floppy disk
  {
    const p = bg.lab();
    p.rect(1, 6, 13, 13, c('gray', 0))
      .rect(1, 6, 13, 1, c('gray', 1))
      .rect(4, 6, 6, 5, c('steel', 4))
      .rect(7, 7, 2, 3, c('ink', 0))
      .rect(3, 13, 9, 5, c('paper', 2))
      .rect(4, 15, 7, 1, c('blue', 2))
      .rect(4, 17, 5, 1, c('paper', 0));
    p.line(19, 0, 16, 3, c('red', 1))
      .line(18, 0, 15, 3, c('red', 2))
      .line(19, 1, 16, 4, c('red', 1))
      .line(18, 1, 15, 4, c('red', 2))
      .rect(16, 0, 3, 1, c('red', 3));
    p.line(15, 4, 10, 9, c('steel', 4)).line(15, 5, 10, 10, c('steel', 2)).set(10, 10, c('ink', 0)).set(9, 10, c('steel', 3));
    add('screwdriverDisk', p);
  }

  // a pirate hat sitting on a little monitor that shows a DOS prompt
  {
    const p = bg.course();
    p.rect(1, 8, 18, 11, c('paper', 1)).rect(1, 8, 18, 1, c('paper', 2)).rect(1, 18, 18, 1, c('paper', 0)).rect(3, 10, 14, 7, c('ink', 0));
    micro(p, 4, 11, 'C', c('potion', 3));
    p.set(8, 11, c('potion', 3)).set(9, 12, c('potion', 3)).set(10, 13, c('potion', 3)).set(9, 14, c('potion', 3)).set(8, 15, c('potion', 3));
    p.rect(11, 14, 2, 2, c('potion', 3));
    p.rect(8, 1, 4, 1, c('ink', 0))
      .rect(6, 2, 8, 1, c('ink', 0))
      .rect(4, 3, 12, 2, c('ink', 0))
      .rect(2, 5, 16, 2, c('ink', 0))
      .rect(0, 6, 2, 1, c('ink', 0))
      .rect(18, 6, 2, 1, c('ink', 0));
    p.rect(2, 5, 16, 1, c('ink', 1)).rect(3, 6, 14, 1, c('gold', 2));
    p.rect(9, 2, 3, 2, c('paint', 1))
      .set(9, 3, c('ink', 0))
      .set(11, 3, c('ink', 0))
      .set(10, 4, c('paint', 1))
      .set(8, 4, c('paint', 1))
      .set(12, 4, c('paint', 1));
    add('pirateDos', p);
  }

  // a tiny surfer riding a Tesla coil's arc
  {
    const p = bg.tower();
    for (let x = 0; x < 20; x++) {
      const y = 15 + Math.sin(x * 0.7) * 2.2;
      p.set(x, y, c('spark', 2))
        .set(x, y + 1, c('spark', 1))
        .set(x, y - 1, c('spark', 3));
    }
    p.line(4, 13, 16, 11, c('gold', 2)).line(4, 14, 16, 12, c('gold', 1));
    p.line(8, 12, 9, 7, c('red', 2))
      .line(14, 11, 11, 7, c('red', 2))
      .rect(9, 5, 3, 3, c('red', 1))
      .disc(10, 3, 1.6, c('skin', 3))
      .set(10, 1, c('hat', 0))
      .set(11, 2, c('hat', 0))
      .set(9, 2, c('hat', 0));
    p.line(7, 6, 5, 5, c('skin', 3)).line(14, 5, 16, 4, c('skin', 3));
    p.set(2, 12, c('spark', 3)).set(18, 9, c('spark', 3)).set(1, 17, c('spark', 3));
    add('surfer', p);
  }

  // a fax machine with a tiny banner unrolling from it
  {
    const p = bg.course();
    p.rect(3, 0, 9, 6, c('paper', 2)).rect(3, 0, 9, 1, c('paper', 0)).line(4, 2, 10, 2, c('gray', 3)).line(4, 4, 8, 4, c('gray', 3));
    p.rect(1, 6, 18, 8, c('paper', 1)).rect(1, 6, 18, 1, c('paper', 2)).rect(1, 13, 18, 1, c('paper', 0));
    p.rect(3, 10, 10, 1, c('ink', 0)).rect(13, 8, 5, 3, c('ink', 0)).set(14, 9, c('potion', 3));
    for (let k = 0; k < 3; k++) p.set(14 + k * 2, 12, c('steel', 0));
    p.rect(3, 11, 10, 8, c('paper', 2)).rect(3, 11, 10, 1, c('paper', 0)).line(13, 12, 15, 19, c('paper', 1));
    micro(p, 4, 13, 'HI!', c('red', 1));
    p.rect(3, 19, 10, 1, c('paper', 0));
    add('fax', p);
  }

  // a waving hand beside a small terminal
  {
    const p = bg.lab();
    p.rect(1, 3, 11, 9, c('paper', 1))
      .rect(1, 3, 11, 1, c('paper', 2))
      .rect(2, 4, 9, 6, c('ink', 0))
      .rect(4, 12, 5, 2, c('paper', 0))
      .rect(2, 14, 9, 1, c('paper', 0));
    p.set(3, 5, c('potion', 3)).set(4, 6, c('potion', 3)).set(5, 7, c('potion', 3)).set(4, 8, c('potion', 3)).set(3, 9, c('potion', 3));
    p.rect(6, 8, 3, 1, c('potion', 3));
    p.rect(13, 9, 6, 6, c('skin', 2)).rect(13, 9, 6, 1, c('skin', 3));
    for (const [x, top] of [
      [13, 5],
      [15, 2],
      [17, 4],
    ] as const)
      p.rect(x, top, 2, 9 - top, c('skin', 2)).rect(x, top, 2, 1, c('skin', 3));
    p.rect(15, 6, 1, 4, c('skin', 0)).rect(17, 6, 1, 4, c('skin', 0)).line(12, 12, 12, 10, c('skin', 2)).set(12, 9, c('skin', 3));
    p.rect(14, 15, 5, 5, c('coat', 3)).rect(14, 15, 5, 1, c('coat', 1));
    p.line(11, 5, 11, 3, c('steel', 3));
    add('helloTerm', p);
  }
}
