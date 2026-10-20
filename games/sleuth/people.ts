// The people of the case, painted at any size from the same description: head-and-
// shoulders portraits for the interview rooms (40x40, four blocks), the answer screens
// (big), the box and the suspect cards; and little 20x20 figures for the green room.
import { Pixels } from '../kit/pixels';
import { CLEAR, blob, shadeAt } from './draw';
import { c, ramp as r } from './pal';

export type Who = 'lila' | 'edgar' | 'agatha' | 'felix' | 'pike' | 'dobbs' | 'ada';

interface Look {
  name: string;
  role: string;
  hair: string;
  hairLo: number;
  hairHi: number;
  style: 'wave' | 'slick' | 'bun' | 'fringe' | 'short' | 'cap' | 'cloche';
  coat: string;
  coatLo: number;
  coatHi: number;
  shirt: string;
  extras: ('glasses' | 'halfmoons' | 'mustache' | 'pearls' | 'carnation' | 'earrings' | 'badge' | 'pencil' | 'bowtie' | 'lipstick')[];
}

export const PEOPLE: Record<Who, Look> = {
  lila: {
    name: 'LILA FONTAINE',
    role: 'Leading lady',
    hair: 'blonde',
    hairLo: 0,
    hairHi: 2,
    style: 'wave',
    coat: 'green',
    coatLo: 1,
    coatHi: 3,
    shirt: 'green',
    extras: ['earrings', 'lipstick'],
  },
  edgar: {
    name: 'EDGAR BLISS',
    role: 'The understudy',
    hair: 'black',
    hairLo: 0,
    hairHi: 2,
    style: 'slick',
    coat: 'grey',
    coatLo: 2,
    coatHi: 4,
    shirt: 'paper',
    extras: ['mustache', 'bowtie'],
  },
  agatha: {
    name: 'AGATHA CRANE',
    role: 'The widow, co-owner',
    hair: 'grey',
    hairLo: 4,
    hairHi: 7,
    style: 'bun',
    coat: 'plum',
    coatLo: 0,
    coatHi: 2,
    shirt: 'plum',
    extras: ['pearls', 'lipstick'],
  },
  felix: {
    name: 'FELIX MORROW',
    role: 'Stage manager',
    hair: 'grey',
    hairLo: 5,
    hairHi: 7,
    style: 'fringe',
    coat: 'tan',
    coatLo: 1,
    coatHi: 3,
    shirt: 'paper',
    extras: ['halfmoons', 'pencil'],
  },
  pike: {
    name: 'OLIVER PIKE',
    role: 'Critic, the Courier',
    hair: 'black',
    hairLo: 0,
    hairHi: 1,
    style: 'short',
    coat: 'black',
    coatLo: 0,
    coatHi: 2,
    shirt: 'paper',
    extras: ['glasses', 'carnation', 'bowtie'],
  },
  dobbs: {
    name: 'SGT. WALTER DOBBS',
    role: 'Port Ellery Police',
    hair: 'navy',
    hairLo: 0,
    hairHi: 2,
    style: 'cap',
    coat: 'navy',
    coatLo: 0,
    coatHi: 2,
    shirt: 'navy',
    extras: ['mustache', 'badge'],
  },
  ada: {
    name: 'INSPECTOR ADA PENN',
    role: 'Homicide',
    hair: 'auburn',
    hairLo: 0,
    hairHi: 2,
    style: 'cloche',
    coat: 'tan',
    coatLo: 1,
    coatHi: 4,
    shirt: 'paper',
    extras: ['lipstick'],
  },
};

/** A head-and-shoulders portrait, s x s pixels, on a transparent background. */
export function portrait(who: Who, s: number): Pixels {
  const L = PEOPLE[who];
  const p = new Pixels(s, s, CLEAR);
  const X = (v: number) => v * s;
  const ell = (cx: number, cy: number, rx: number, ry: number, rampName: string, lo: number, hi: number, light = 1) =>
    blob(p, X(cx), X(cy), Math.max(1, X(rx)), Math.max(1, X(ry)), r(rampName), lo, hi, light);
  const rect = (x: number, y: number, w: number, h: number, col: number) =>
    p.rect(Math.round(X(x)), Math.round(X(y)), Math.max(1, Math.round(X(w))), Math.max(1, Math.round(X(h))), col);
  const dot = (x: number, y: number, rad: number, col: number) => {
    if (X(rad) < 1) p.set(X(x), X(y), col);
    else p.disc(X(x), X(y), X(rad), col);
  };

  // hair behind the head (long styles)
  if (L.style === 'wave') ell(0.5, 0.52, 0.29, 0.3, L.hair, L.hairLo, L.hairHi);
  if (L.style === 'bun') ell(0.5, 0.2, 0.12, 0.09, L.hair, L.hairLo, L.hairHi);
  if (L.style === 'cloche') ell(0.5, 0.52, 0.24, 0.17, 'auburn', 0, 2);
  // shoulders
  ell(0.5, 1.02, 0.46, 0.3, L.coat, L.coatLo, L.coatHi, 0.8);
  // neck and a shirt front / neckline
  rect(0.43, 0.6, 0.14, 0.16, c('skin', 2));
  if (L.shirt !== L.coat) {
    for (let y = Math.floor(X(0.74)); y < s; y++) {
      const half = (y - X(0.74)) * 0.55;
      p.rect(Math.round(X(0.5) - half), y, Math.max(1, Math.round(half * 2)), 1, c(L.shirt, L.shirt === 'paper' ? 4 : 3));
    }
  } else {
    // a neckline showing skin
    for (let y = Math.floor(X(0.72)); y < X(0.84); y++) {
      const half = (X(0.84) - y) * 0.6;
      p.rect(Math.round(X(0.5) - half), y, Math.max(1, Math.round(half * 2)), 1, c('skin', 3));
    }
  }
  // head
  ell(0.5, 0.43, 0.17, 0.21, 'skin', 2, 5);
  // ears
  dot(0.33, 0.45, 0.03, c('skin', 3));
  dot(0.67, 0.45, 0.03, c('skin', 3));
  // hair on top
  const hairCap = (top: number, depth: number) => {
    for (let y = Math.floor(X(top)); y < X(top + depth); y++)
      for (let x = Math.floor(X(0.3)); x < X(0.7); x++) {
        const nx = (x - X(0.5)) / X(0.19);
        const ny = (y - X(0.43)) / X(0.23);
        if (nx * nx + ny * ny <= 1.05) p.set(x, y, shadeAt(r(L.hair), L.hairLo, L.hairHi, 0.8 - (x - X(0.3)) / X(0.5) + 0.2, x, y));
      }
  };
  switch (L.style) {
    case 'wave':
      hairCap(0.2, 0.15);
      for (let i = 0; i < 4; i++) ell(0.36 + i * 0.09, 0.27 + (i % 2) * 0.02, 0.06, 0.05, L.hair, L.hairLo + 1, L.hairHi);
      ell(0.3, 0.6, 0.07, 0.12, L.hair, L.hairLo, L.hairHi);
      ell(0.7, 0.6, 0.07, 0.12, L.hair, L.hairLo, L.hairHi);
      break;
    case 'slick':
      hairCap(0.2, 0.13);
      rect(0.34, 0.3, 0.32, 0.02, c(L.hair, L.hairHi));
      break;
    case 'bun':
      hairCap(0.21, 0.13);
      break;
    case 'fringe':
      ell(0.33, 0.4, 0.04, 0.07, L.hair, L.hairLo, L.hairHi);
      ell(0.67, 0.4, 0.04, 0.07, L.hair, L.hairLo, L.hairHi);
      dot(0.45, 0.28, 0.02, c('skin', 5));
      break;
    case 'short':
      hairCap(0.2, 0.12);
      rect(0.33, 0.3, 0.05, 0.1, c(L.hair, L.hairLo));
      rect(0.62, 0.3, 0.05, 0.1, c(L.hair, L.hairLo));
      break;
    case 'cap':
      ell(0.5, 0.26, 0.21, 0.09, 'navy', 0, 2);
      rect(0.29, 0.3, 0.42, 0.04, c('black', 0));
      dot(0.5, 0.25, 0.03, c('gold', 4));
      break;
    case 'cloche':
      ell(0.5, 0.27, 0.22, 0.13, 'velvet', 1, 4);
      rect(0.27, 0.32, 0.46, 0.04, c('black', 1));
      rect(0.58, 0.31, 0.06, 0.04, c('velvet', 5));
      break;
  }
  // face
  const eyeY = 0.45;
  for (const ex of [0.43, 0.57]) {
    dot(ex, eyeY, 0.018, c('black', 0));
    rect(
      ex - 0.035,
      eyeY - 0.045,
      0.07,
      0.012,
      c(L.style === 'fringe' || L.style === 'bun' ? 'grey' : 'black', L.style === 'fringe' || L.style === 'bun' ? 5 : 1),
    );
  }
  rect(0.495, 0.47, 0.02, 0.06, c('skin', 2));
  const lips = L.extras.includes('lipstick');
  rect(0.45, 0.56, 0.1, 0.015, lips ? c('velvet', 4) : c('skin', 1));
  if (lips) rect(0.465, 0.575, 0.07, 0.012, c('velvet', 3));
  for (const e of L.extras) {
    if (e === 'glasses')
      for (const ex of [0.43, 0.57]) {
        p.ring(X(ex), X(eyeY), Math.max(1.5, X(0.045)), c('gold', 3));
      }
    if (e === 'halfmoons') {
      for (const ex of [0.43, 0.57]) rect(ex - 0.045, eyeY + 0.01, 0.09, 0.015, c('gold', 3));
    }
    if (e === 'mustache') rect(0.43, 0.535, 0.14, 0.02, c(L.hair === 'navy' ? 'grey' : L.hair, L.hair === 'navy' ? 5 : 1));
    if (e === 'pearls') for (let i = 0; i < 7; i++) dot(0.4 + i * 0.033, 0.75 + Math.sin((i / 6) * Math.PI) * 0.04, 0.012, c('paper', 5));
    if (e === 'carnation') {
      dot(0.68, 0.84, 0.035, c('velvet', 5));
      dot(0.67, 0.83, 0.015, c('velvet', 7));
    }
    if (e === 'earrings') {
      dot(0.33, 0.52, 0.015, c('gold', 4));
      dot(0.67, 0.52, 0.015, c('gold', 4));
    }
    if (e === 'badge') dot(0.36, 0.86, 0.03, c('gold', 4));
    if (e === 'pencil') rect(0.66, 0.36, 0.02, 0.1, c('gold', 3));
    if (e === 'bowtie') {
      rect(0.44, 0.74, 0.12, 0.04, c('black', 0));
      dot(0.5, 0.76, 0.015, c('black', 1));
    }
  }
  return p;
}

/** A small figure for the green room and the stage at dawn (20x20): the portrait, cropped. */
export function figure(who: Who, blink = false): Pixels {
  const big = portrait(who, 28);
  const p = big.crop(4, 2, 20, 20);
  if (blink) {
    const skin = c('skin', 3);
    for (const ex of [0.43, 0.57]) {
      const x = Math.round(ex * 28) - 4;
      const y = Math.round(0.45 * 28) - 2;
      for (let dx = -1; dx <= 1; dx++) if (p.get(x + dx, y) === c('black', 0)) p.set(x + dx, y, skin);
    }
  }
  return p;
}
