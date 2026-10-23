// Foes of Procrastia in ASCII art: Procrastislimes (they'll attack you later), Snooze Bats,
// Dust Bunnies, Barrow Ghosts, Tide Crabs, Bog Eels, Rust Golems, Gloom Goblins, Clockwork
// Ticks... Each is drawn once; the hurt frame is the same drawing flashed pale.
import { art, baseKey, type Key } from '../art/sprite';
import { C } from '../art/pal';
import { Canvas, mix, type RGB } from '../art/rgb';

/** A pale, flashing copy of a sprite (a foe that just took a hit). */
export function flash(cv: Canvas, to: RGB = [255, 255, 255], k = 0.6): Canvas {
  const out = new Canvas(cv.w, cv.h);
  out.draw(cv, 0, 0);
  return out.tint((c) => mix(c, to, k));
}

const SLIME = [
  [
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '........KKKK........',
    '......KKlllLKK......',
    '.....KlllLLLLlK.....',
    '....KlLLLwLLLLlK....',
    '....KLLwLLLLwLLK....',
    '...KlLLkLLLLkLLlK...',
    '...KlLLLLLLLLLLlK...',
    '...KlLLLLKKLLLLlK...',
    '...KglLLLLLLLLlgK...',
    '...KgglllLLlllggK...',
    '....KggggggggggK....',
    '.....KKKKKKKKKK.....',
    '....................',
  ],
  [
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '.......KKKKKK.......',
    '.....KKlllLLlKK.....',
    '...KKlLLLwLLLLlKK...',
    '..KlLLwLLLLLLwLLlK..',
    '..KlLLkLLLLLLkLLlK..',
    '..KlLLLLLKKLLLLLlK..',
    '..KglLLLLLLLLLLLlgK.',
    '..KgglllLLLLlllggK..',
    '...KgggggggggggggK..',
    '....KKKKKKKKKKKKK...',
    '....................',
  ],
];

const BAT = [
  [
    '....................',
    '....................',
    '.K..............K...',
    '.KK....K....K..KK...',
    '.KbK...KK..KK.KbK...',
    '.KbbK..KbKKbK.KbbK..',
    '.KbBBK.KBBBBK.KBBbK.',
    '.KbBBBKKBwBwBKBBBbK.',
    '..KbBBBKBkBkBKBBbK..',
    '..KbBBBBBBBBBBBBbK..',
    '...KbKbBBoooBBbKbK..',
    '...KK.KbBBBBBBbK.KK.',
    '.......KbBBBbK......',
    '........KKKKK.......',
    '....................',
  ],
  [
    '....................',
    '....................',
    '....................',
    '.......K....K.......',
    '.......KK..KK.......',
    '.......KbKKbK.......',
    '......KBBBBBBK......',
    '.....KBBwBBwBBK.....',
    '..KKKBBBkBBkBBBKKK..',
    '.KbbbBBBBBBBBBBbbbK.',
    'KbBBBBBBoooBBBBBBBbK',
    'KbBKKbBBBBBBBbKKBbK.',
    'KK...KbBBBBBbK...KK.',
    '......KKKKKKK.......',
    '....................',
  ],
];

const SLIME_KEY = (body: RGB[]): Key => baseKey({ g: body[0], l: body[1], L: body[2] });
const BAT_KEY: Key = baseKey({ b: C('purple', 1), B: C('purple', 2), o: C('pink', 1) });

export function foePics(): Map<string, Canvas> {
  const m = new Map<string, Canvas>();
  const slime = SLIME_KEY([C('slime', 0), C('slime', 1), C('slime', 2)]);
  SLIME.forEach((rows, i) => m.set(`slime${i}`, art(rows, slime)));
  m.set('slimeHit', flash(m.get('slime0')!, [255, 220, 220]));
  BAT.forEach((rows, i) => m.set(`bat${i}`, art(rows, BAT_KEY, 20, 20, 0, 3)));
  m.set('batHit', flash(m.get('bat0')!, [255, 220, 220]));
  return m;
}
