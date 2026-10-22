// Pictures for the gates quests open: shut, and open.
import { Canvas, mix } from '../art/rgb';
import { grass, cobble } from '../art/terrain';
import { shadow } from '../art/buildings';

const onGrass = () => new Canvas(20, 20).shade((x, y) => grass(x, y), 2);
const onCobble = () => new Canvas(20, 20).shade((x, y) => cobble(x, y), 2);

export const gateArt = {
  /** THE CHEZ's garage door: a sign with a lightning bolt until there's a charge to give her. */
  bolt(open: boolean): Canvas {
    const cv = onCobble();
    if (open) return cv;
    cv.rect(1, 6, 18, 2, [200, 170, 40]);
    cv.rect(1, 12, 18, 2, [200, 170, 40]);
    for (let x = 1; x < 19; x += 4) {
      cv.rect(x, 6, 2, 2, [30, 30, 30]);
      cv.rect(x + 2, 12, 2, 2, [30, 30, 30]);
    }
    cv.rect(1, 4, 1.5, 12, [90, 90, 96]).rect(17.5, 4, 1.5, 12, [90, 90, 96]);
    cv.poly(
      [
        [11, 1],
        [7, 10],
        [10, 10],
        [8, 19],
        [14, 8],
        [11, 8],
      ],
      [255, 230, 60],
    );
    return cv;
  },
  /** Doc Leo's tent flap: tied shut with a rubber-chicken knot. */
  chicken(open: boolean): Canvas {
    const cv = onGrass();
    if (open) return cv;
    shadow(cv, 2, 4, 16, 14);
    cv.poly(
      [
        [2, 18],
        [10, 2],
        [18, 18],
      ],
      (x) => (Math.floor(x / 3) % 2 ? [200, 50, 50] : [246, 230, 120]),
    );
    cv.disc(10, 12, 2.5, [250, 210, 60]);
    cv.disc(11.5, 10.5, 1, [250, 210, 60]);
    return cv;
  },
  /** The hermit's standing stone, by the nest. */
  stone(open: boolean): Canvas {
    const cv = onGrass();
    shadow(cv, 4, 4, 12, 15);
    cv.rrect(4, 2, 12, 16, 4, (x, y) => mix([170, 166, 160], [100, 96, 94], (x - 4) / 14 + (y - 2) / 60));
    for (let k = 0; k < 4; k++) cv.rect(6.5, 5 + k * 3, 7 - (k % 2) * 2, 0.8, open ? [216, 176, 74] : [80, 76, 74]);
    return cv;
  },
};
