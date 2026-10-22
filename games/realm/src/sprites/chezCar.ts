// THE CHEZ from above-and-in-front, for driving: a tomato-red 1976 1/2 CitiCar wedge, round
// lamps, a huge upright windshield, a grey roof, little whitewall tires. Facing right (left is
// the same picture mirrored), up and down, two frames each (wheels turning, a bounce).
import { Canvas, mix, clamp01, type RGB } from '../art/rgb';
import { C } from '../art/pal';

const RED = (): RGB => C('red', 2);

function side(bounce: number, spoke: number): Canvas {
  const cv = new Canvas(20, 20);
  const y = 4 + bounce;
  cv.ellipse(10, 17.5, 9, 1.8, C('ink'));
  // nose to the right this time: the wedge rises to the windshield, the cabin, the flat back
  cv.poly(
    [
      [19, y + 8],
      [15.5, y + 5.5],
      [11.5, y + 1],
      [3, y + 1],
      [1.5, y + 7],
      [1.5, y + 11],
      [19, y + 11],
    ],
    (px, py) => mix(C('red', 3), C('red', 1), clamp01((py - y) / 12 + (19 - px) / 60)),
  );
  cv.poly(
    [
      [14, y + 5.5],
      [10.5, y + 1.6],
      [8, y + 1.6],
      [8.5, y + 6],
    ],
    C('blue', 3),
  );
  cv.rect(3.5, y + 2, 4, 3.6, C('blue', 2));
  cv.rect(3, y + 0.2, 8.5, 1.3, C('steel', 2));
  cv.rect(1.5, y + 9.4, 17.5, 1, C('ink'));
  cv.disc(18, y + 7.6, 1, C('white', 1));
  cv.rect(17.6, y + 9, 1.4, 1, C('orange', 2));
  for (const wx of [5, 15]) {
    cv.disc(wx, y + 11.5, 2.4, C('ink'));
    cv.disc(wx, y + 11.5, 1.3, C('white', 0));
    cv.disc(wx + (spoke ? 0.5 : -0.5), y + 11.5, 0.5, C('steel', 1));
  }
  return cv;
}

function front(back: boolean, bounce: number): Canvas {
  const cv = new Canvas(20, 20);
  const y = 3 + bounce;
  cv.ellipse(10, 17.5, 8, 2, C('ink'));
  cv.rrect(3, y + 5, 14, 9, 1.5, (px, py) => mix(C('red', 3), C('red', 1), clamp01((py - y - 5) / 10 + Math.abs(px - 10) / 30)));
  cv.rrect(4, y, 12, 6, 1, back ? C('red', 2) : C('blue', 3));
  cv.rect(4, y - 0.4, 12, 1.2, C('steel', 2));
  if (back) {
    cv.rect(5, y + 1.5, 10, 3, C('blue', 2));
    cv.rect(4, y + 10, 3, 1.4, C('red', 0));
    cv.rect(13, y + 10, 3, 1.4, C('red', 0));
    // the charge port, rear passenger side
    cv.rect(14.5, y + 7, 1.5, 1.5, C('ink'));
  } else {
    cv.disc(6, y + 9, 1.4, C('white', 1));
    cv.disc(14, y + 9, 1.4, C('white', 1));
    cv.rect(8, y + 8, 4, 2, C('ink'));
  }
  cv.rect(3, y + 12, 14, 1.2, C('ink'));
  cv.rect(3, y + 13, 3, 2.5, C('ink'));
  cv.rect(14, y + 13, 3, 2.5, C('ink'));
  void RED;
  return cv;
}

/** The CHEZ's pictures by name: side0/1 (facing right), front0/1 (coming at you), rear0/1. */
export function chezPics(): Map<string, Canvas> {
  const m = new Map<string, Canvas>();
  m.set('carSide0', side(0, 0));
  m.set('carSide1', side(-0.6, 1));
  m.set('carFront0', front(false, 0));
  m.set('carFront1', front(false, -0.6));
  m.set('carRear0', front(true, 0));
  m.set('carRear1', front(true, -0.6));
  const hurt = side(0, 0).tint((c) => mix(c, [255, 255, 255], 0.5));
  m.set('carHurt', hurt);
  const dead = side(0, 0).tint((c) => mix(c, [40, 40, 50], 0.6));
  m.set('carFlat', dead);
  return m;
}
