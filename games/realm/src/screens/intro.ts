// INTRO.FLI: night in the Garden Court. The Round Tuit glows on the Tuit Table; Lord Deadline
// glides in, a flash, and the Tuit breaks in three and flies off to the three corners of the
// kingdom; he bows and is gone. Painted in true color, one palette chosen for every frame
// (median cut), and dithered in a pattern fixed to the screen so still parts never change and
// the FLI stores only what moves.
import { encodeFli } from '../../../../web/src/formats/fli';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Canvas, mix, clamp01, tnoise } from '../art/rgb';
import { sky, stars, tuit, castle } from './scenery';
import { bigSprite } from './talk';
import { bossPicture } from '../sprites/dungeonFoes';
import { Screen } from './screen';

const FRAMES = 84;

function background(): Canvas {
  const cv = new Canvas(320, 200);
  sky(cv, [
    [0, [12, 10, 34]],
    [0.6, [40, 30, 80]],
    [1, [60, 44, 90]],
  ]);
  stars(cv, 140, 110, 21);
  castle(cv, 20, 120, 0.9, [26, 20, 44], [230, 190, 100]);
  castle(cv, 210, 124, 0.8, [26, 20, 44], [230, 190, 100]);
  cv.rect(0, 118, 320, 82, (x, y) => mix([40, 46, 50], [22, 26, 30], clamp01((y - 118) / 82 + tnoise(x, y, 10, 320, 5) * 0.15)));
  // the Tuit Table: a stone plinth
  cv.rect(130, 120, 60, 40, (x) => mix([150, 144, 150], [80, 76, 90], clamp01((x - 130) / 60)));
  cv.rect(124, 114, 72, 8, [176, 170, 170]);
  return cv;
}

export function introFli(): Uint8Array {
  const bg = background();
  const deadline = bigSprite(bossPicture('deadline'), 2);
  const frames: Canvas[] = [];
  for (let f = 0; f < FRAMES; f++) {
    const cv = new Canvas(320, 200);
    cv.draw(bg, 0, 0);
    const sc = new Screen();
    void sc;
    const t = f / FRAMES;
    const pulse = 0.8 + 0.25 * Math.sin(f * 0.5);
    // Deadline glides in from the right (frames 14-38), stands (38-54), then out to the left
    let dx = 340;
    if (f >= 14 && f < 38) dx = 340 - ((f - 14) / 24) * 120;
    else if (f >= 38 && f < 60) dx = 220;
    else if (f >= 60) dx = 220 + (f - 60) * 8;
    const flash = f >= 40 && f < 44 ? 1 - (f - 40) / 4 : 0;
    if (f < 42) tuit(cv, 160, 96, 18, pulse);
    else {
      // three wedges fly off, spinning out to the three corners of the kingdom
      const k = Math.min(1, (f - 42) / 26);
      for (let w = 0; w < 3; w++) {
        const a = -Math.PI / 2 + (w * Math.PI * 2) / 3 + Math.PI / 3;
        const x = 160 + Math.cos(a) * k * 190;
        const y = 96 + Math.sin(a) * k * 130 - Math.sin(k * Math.PI) * 30;
        if (x > -20 && x < 340 && y > -20 && y < 220) {
          cv.disc(x, y, 12 * (1 - k * 0.5), (px, py) => mix(cv.get(Math.max(0, Math.min(319, Math.floor(px))), Math.max(0, Math.min(199, Math.floor(py)))), [255, 220, 140], 0.6));
          cv.disc(x, y, 6 * (1 - k * 0.4), [200, 140, 70]);
        }
      }
    }
    if (dx < 330) cv.draw(deadline, Math.round(dx - deadline.w / 2), 158 - deadline.h);
    if (flash > 0) cv.tint((c) => mix(c, [255, 250, 230], flash * 0.8));
    // the words
    const words = new Screen();
    words.cv.draw(cv, 0, 0);
    if (f >= 2 && f < 14) words.centered(20, 'Procrastia. Late at night.', [230, 220, 250], 1, [0, 0, 0]);
    if (f >= 24 && f < 40) words.centered(20, 'Somebody who hates waiting...', [250, 200, 200], 1, [0, 0, 0]);
    if (f >= 48) words.centered(16, 'THE ROUND TUIT IS GONE!', (_x, y) => mix([255, 236, 150], [200, 120, 30], clamp01((y - 16) / 12)), 1.5, [0, 0, 0]);
    if (f >= 62) words.centered(40, '"Get around to THAT!" - Lord Deadline', [250, 210, 210], 1, [0, 0, 0]);
    frames.push(words.cv);
    void t;
  }
  const rgb = frames.map((cv) => {
    const out = new Uint8Array(320 * 200 * 3);
    for (let i = 0; i < 320 * 200 * 3; i++) out[i] = Math.max(0, Math.min(255, Math.round(cv.c[i])));
    return out;
  });
  const pal = medianCutPalette(rgb.filter((_, i) => i % 6 === 0), [[0, 0, 0]]);
  const q = new Quantizer(pal, 6);
  const indexed = rgb.map((f) => q.apply(f, 320, 200));
  return encodeFli(indexed, pal, { speed: 5 });
}
